"""規則堆疊策略:把「我為什麼買/賣」逐條寫清楚,每個決定都可以攤開來看。

這是自建 agent 相對現成機器人的核心價值——邏輯不是黑箱:

進場(四個條件必須「全部」成立):
  1. 趨勢向上:收盤價站上長期均線
  2. 動能有力:RSI 高於下限(不是在無人接手的下跌段)
  3. 動能未過熱:RSI 低於上限(不追高)
  4. 波動可控:ATR 佔價格比例低於上限(市場不是在亂噴)
  另外剛出場後有冷卻期,避免同一個位置反覆進出被手續費磨死。

出場(任一條件成立就走):
  跌破趨勢線 / 動能過熱 / 觸發停損 / 觸發移動停利

每次判斷都會產生 evidence,`compare.py --explain rule_stack` 可以逐筆看到
它當下看到什麼數字、對照什麼門檻、為什麼過或不過。沒進場時也會統計
「是被哪個條件擋下來的」,這是調參最有用的線索。
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from agent.indicators import ATR, RSI, SMA
from agent.models import Bar, Fill, Side, Signal
from agent.strategy.base import Strategy


def _check(name: str, passed: bool, actual: str, threshold: str) -> dict:
    return {"name": name, "passed": passed, "actual": actual, "threshold": threshold}


@dataclass
class _SymbolState:
    sma: SMA
    rsi: RSI
    atr: ATR
    in_position: bool = False
    pending: bool = False  # 已送出建議、還不知道成交與否
    entry_price: float = 0.0
    peak_price: float = 0.0
    bars_since_exit: int = field(default=10**9)


class RuleStack(Strategy):
    """規則堆疊:趨勢+動能+波動三重過濾,帶停損與移動停利。"""

    name = "rule_stack"

    def __init__(self, trend_period: int = 50, rsi_period: int = 14, atr_period: int = 14,
                 rsi_min: float = 45.0, rsi_max: float = 72.0, rsi_exit: float = 82.0,
                 max_atr_pct: float = 0.030, stop_pct: float = 0.05,
                 trail_pct: float = 0.07, cooldown_bars: int = 5,
                 exit_band_pct: float = 0.015, order_pct: float = 0.10):
        self.trend_period = trend_period
        self.rsi_period = rsi_period
        self.atr_period = atr_period
        self.rsi_min = rsi_min
        self.rsi_max = rsi_max
        self.rsi_exit = rsi_exit
        self.max_atr_pct = max_atr_pct
        self.stop_pct = stop_pct
        self.trail_pct = trail_pct
        self.cooldown_bars = cooldown_bars
        # 出場的趨勢線比進場低一個緩衝帶,避免價格貼著均線來回時被反覆洗出洗入。
        # 沒有這個帶寬時,進場條件(收盤 > SMA)與出場條件(收盤 < SMA)互為鏡像,
        # 震盪盤會每隔兩三根就進出一次,手續費把本金磨光。
        self.exit_band_pct = exit_band_pct
        self.order_pct = order_pct
        self._states: dict[str, _SymbolState] = {}
        self._blocked_by: Counter[str] = Counter()

    def _state(self, symbol: str) -> _SymbolState:
        if symbol not in self._states:
            self._states[symbol] = _SymbolState(
                sma=SMA(self.trend_period),
                rsi=RSI(self.rsi_period),
                atr=ATR(self.atr_period),
            )
        return self._states[symbol]

    def on_bar(self, bar: Bar) -> Signal | None:
        st = self._state(bar.symbol)
        sma = st.sma.update(bar.close)
        rsi = st.rsi.update(bar.close)
        atr = st.atr.update(bar.high, bar.low, bar.close)
        st.bars_since_exit += 1

        if sma is None or rsi is None or atr is None:
            return None  # 指標還在暖機
        if st.pending:
            return None  # 上一個建議還沒有結果,不重複下單

        atr_pct = atr / bar.close
        if st.in_position:
            return self._check_exit(bar, st, sma, rsi)
        return self._check_entry(bar, st, sma, rsi, atr_pct)

    def _check_entry(self, bar: Bar, st: _SymbolState,
                     sma: float, rsi: float, atr_pct: float) -> Signal | None:
        checks = [
            _check("趨勢向上", bar.close > sma,
                   f"收盤 {bar.close:.2f}", f"> SMA{self.trend_period} {sma:.2f}"),
            _check("動能有力", rsi > self.rsi_min,
                   f"RSI{self.rsi_period} {rsi:.1f}", f"> {self.rsi_min:.0f}"),
            _check("動能未過熱", rsi < self.rsi_max,
                   f"RSI{self.rsi_period} {rsi:.1f}", f"< {self.rsi_max:.0f}"),
            _check("波動可控", atr_pct < self.max_atr_pct,
                   f"ATR 佔價格 {atr_pct:.2%}", f"< {self.max_atr_pct:.2%}"),
            _check("已過冷卻期", st.bars_since_exit >= self.cooldown_bars,
                   f"出場後 {min(st.bars_since_exit, 9999)} 根", f">= {self.cooldown_bars} 根"),
        ]

        failed = [c for c in checks if not c["passed"]]
        if failed:
            # 只記第一個擋下來的條件,才看得出主要瓶頸在哪
            self._blocked_by[failed[0]["name"]] += 1
            return None

        st.pending = True
        return Signal(
            symbol=bar.symbol, side=Side.BUY, target_notional_pct=self.order_pct,
            reason="四項進場條件全數成立",
            evidence={"checks": checks},
        )

    def _check_exit(self, bar: Bar, st: _SymbolState,
                    sma: float, rsi: float) -> Signal | None:
        st.peak_price = max(st.peak_price, bar.close)
        stop_line = st.entry_price * (1 - self.stop_pct)
        trail_line = st.peak_price * (1 - self.trail_pct)
        trend_line = sma * (1 - self.exit_band_pct)

        checks = [
            _check("跌破趨勢線", bar.close < trend_line,
                   f"收盤 {bar.close:.2f}",
                   f"< SMA{self.trend_period} {sma:.2f} -{self.exit_band_pct:.1%} = {trend_line:.2f}"),
            _check("動能過熱", rsi > self.rsi_exit,
                   f"RSI{self.rsi_period} {rsi:.1f}", f"> {self.rsi_exit:.0f}"),
            _check("觸發停損", bar.close <= stop_line,
                   f"收盤 {bar.close:.2f}", f"<= 進場 {st.entry_price:.2f} -{self.stop_pct:.0%} = {stop_line:.2f}"),
            _check("觸發移動停利", bar.close <= trail_line,
                   f"收盤 {bar.close:.2f}", f"<= 高點 {st.peak_price:.2f} -{self.trail_pct:.0%} = {trail_line:.2f}"),
        ]

        triggered = [c for c in checks if c["passed"]]
        if not triggered:
            return None

        st.pending = True
        return Signal(
            symbol=bar.symbol, side=Side.SELL, target_notional_pct=1.0,
            reason=f"出場:{triggered[0]['name']}",
            evidence={"checks": checks},
        )

    def on_fill(self, fill: Fill) -> None:
        st = self._state(fill.order.symbol)
        st.pending = False
        if fill.order.side == Side.BUY:
            st.in_position = True
            st.entry_price = fill.fill_price
            st.peak_price = fill.fill_price
        else:
            st.in_position = False
            st.bars_since_exit = 0

    def on_reject(self, signal: Signal, reason: str) -> None:
        self._state(signal.symbol).pending = False

    def explain_summary(self) -> dict[str, int]:
        return {f"被「{k}」擋下": v for k, v in self._blocked_by.most_common()}
