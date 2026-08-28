"""回測績效指標:報酬、最大回撤、勝率、獲利因子、Sharpe。

勝率與獲利因子用 FIFO 配對買賣單算「來回交易」的已實現損益,
手續費計入,所以數字是扣完成本的真實結果。
"""
from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass, field

from agent.models import Fill, Side


@dataclass
class RoundTrip:
    """一次完整的來回交易(買進後賣出的那一段)。"""

    qty: float
    buy_price: float
    sell_price: float
    pnl: float


@dataclass
class Metrics:
    label: str
    initial_equity: float
    final_equity: float
    n_fills: int
    n_rejections: int
    total_fees: float
    round_trips: list[RoundTrip] = field(default_factory=list)
    equity_curve: list[tuple[float, float]] = field(default_factory=list)
    bar_seconds: float = 3600.0

    @property
    def total_return(self) -> float:
        if self.initial_equity == 0:
            return 0.0
        return self.final_equity / self.initial_equity - 1.0

    @property
    def max_drawdown(self) -> float:
        """權益曲線從歷史高點回落的最大幅度(正數,0.15 = 曾虧掉 15%)。"""
        peak = -math.inf
        worst = 0.0
        for _, equity in self.equity_curve:
            peak = max(peak, equity)
            if peak > 0:
                worst = max(worst, 1.0 - equity / peak)
        return worst

    @property
    def n_round_trips(self) -> int:
        return len(self.round_trips)

    @property
    def win_rate(self) -> float:
        if not self.round_trips:
            return 0.0
        wins = sum(1 for t in self.round_trips if t.pnl > 0)
        return wins / len(self.round_trips)

    @property
    def profit_factor(self) -> float:
        """總獲利 / 總虧損。>1 才是賺錢的策略;無虧損時回傳 inf。"""
        gross_win = sum(t.pnl for t in self.round_trips if t.pnl > 0)
        gross_loss = -sum(t.pnl for t in self.round_trips if t.pnl < 0)
        if gross_loss == 0:
            return math.inf if gross_win > 0 else 0.0
        return gross_win / gross_loss

    @property
    def sharpe(self) -> float:
        """年化 Sharpe(無風險利率當 0)。樣本太少或無波動時回傳 0。"""
        curve = [e for _, e in self.equity_curve]
        if len(curve) < 3:
            return 0.0
        returns = []
        for prev, cur in zip(curve, curve[1:]):
            if prev > 0:
                returns.append(cur / prev - 1.0)
        if len(returns) < 2:
            return 0.0
        mean = sum(returns) / len(returns)
        var = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
        std = math.sqrt(var)
        if std == 0:
            return 0.0
        periods_per_year = 365 * 24 * 3600 / self.bar_seconds
        return mean / std * math.sqrt(periods_per_year)


def pair_round_trips(fills: list[Fill]) -> list[RoundTrip]:
    """用 FIFO 把買單與賣單配成來回交易,損益已扣兩邊手續費。"""
    # 每筆買入存成一個 lot:[剩餘數量, 成交價, 每單位手續費]
    lots: deque[list[float]] = deque()
    trips: list[RoundTrip] = []

    for fill in fills:
        qty = fill.order.qty
        if qty <= 0:
            continue
        fee_per_unit = fill.fee / qty

        if fill.order.side == Side.BUY:
            lots.append([qty, fill.fill_price, fee_per_unit])
            continue

        remaining = qty
        while remaining > 1e-12 and lots:
            lot = lots[0]
            take = min(lot[0], remaining)
            pnl = take * (fill.fill_price - lot[1]) - take * (lot[2] + fee_per_unit)
            trips.append(RoundTrip(take, lot[1], fill.fill_price, pnl))
            lot[0] -= take
            remaining -= take
            if lot[0] <= 1e-12:
                lots.popleft()

    return trips
