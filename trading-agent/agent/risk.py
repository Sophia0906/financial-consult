"""風控層:策略只有建議權,這裡有否決權。

規則:
- 標的必須在白名單內
- 單筆訂單名目金額 <= 總權益 * max_order_pct
- 買進後單一標的持倉市值 <= 總權益 * max_position_pct
- 當日虧損達 max_daily_loss_pct => 熔斷,拒絕所有新開倉(仍允許賣出出場)
"""
from __future__ import annotations

import datetime as dt

from agent.config import RiskConfig
from agent.models import Order, Portfolio, Side, Signal


class RiskManager:
    def __init__(self, cfg: RiskConfig):
        self.cfg = cfg
        self._day: dt.date | None = None
        self._day_start_equity: float | None = None
        self.killed = False

    def _roll_day(self, now: float, equity: float) -> None:
        today = dt.datetime.fromtimestamp(now, dt.timezone.utc).date()
        if self._day != today:
            self._day = today
            self._day_start_equity = equity
            self.killed = False

    def evaluate(
        self,
        signal: Signal,
        portfolio: Portfolio,
        price: float,
        equity: float,
        now: float,
    ) -> tuple[Order | None, str]:
        """回傳 (訂單或 None, 說明)。"""
        self._roll_day(now, equity)

        assert self._day_start_equity is not None
        drawdown = 1.0 - equity / self._day_start_equity if self._day_start_equity > 0 else 0.0
        if drawdown >= self.cfg.max_daily_loss_pct:
            self.killed = True

        if signal.symbol not in self.cfg.symbol_whitelist:
            return None, f"拒絕:{signal.symbol} 不在白名單"

        pos = portfolio.position(signal.symbol)

        if signal.side == Side.SELL:
            if pos.qty <= 0:
                return None, "略過:無持倉可賣(骨架不做放空)"
            qty = pos.qty * min(signal.target_notional_pct, 1.0)
            return Order(signal.symbol, Side.SELL, qty, price), "通過:出場"

        # 以下為買進
        if self.killed:
            return None, f"拒絕:當日虧損 {drawdown:.2%} 已觸發熔斷,今日不再開倉"

        notional = min(
            equity * signal.target_notional_pct,
            equity * self.cfg.max_order_pct,
        )
        # 持倉上限:已持有市值 + 本單 <= 上限
        held_value = pos.qty * price
        room = equity * self.cfg.max_position_pct - held_value
        notional = min(notional, room)
        if notional <= 0:
            return None, f"拒絕:{signal.symbol} 持倉已達上限 {self.cfg.max_position_pct:.0%}"
        if notional > portfolio.cash:
            notional = portfolio.cash
        if notional <= 0:
            return None, "拒絕:現金不足"

        return Order(signal.symbol, Side.BUY, notional / price, price), "通過:開倉/加倉"
