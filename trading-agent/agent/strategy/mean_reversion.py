"""均值回歸:跌深了買、漲回來賣——也就是一般人直覺的「低買高賣」。

和 sma_cross / rule_stack(趨勢跟隨)是相反的信仰:

  趨勢跟隨:價格會延續 → 漲了追、跌了跑(承認自己錯,認賠出場)
  均值回歸:價格會回到平均 → 跌了買、漲了賣(相信自己對,等它彈回來)

兩邊都能賺錢,也都能虧錢,差別在**遇到什麼行情**:
  · 震盪盤:均值回歸穩定收租,趨勢跟隨被上下巴來巴去
  · 單邊上漲:趨勢跟隨吃到整段,均值回歸太早賣掉只賺一點
  · 單邊下跌:趨勢跟隨小虧就跑,均值回歸一路接刀越買越多——這是它的死法

stop_pct 就是為了防那個死法。把它設得很大(等於不停損)可以親眼看到
「越跌越買、攤平到破產」長什麼樣,compare.py 的 mean_rev_nostop 就是這樣設的。
"""
from __future__ import annotations

from dataclasses import dataclass, field

from agent.indicators import RSI
from agent.models import Bar, Fill, Side, Signal
from agent.strategy.base import Strategy


def _check(name: str, passed: bool, actual: str, threshold: str) -> dict:
    return {"name": name, "passed": passed, "actual": actual, "threshold": threshold}


@dataclass
class _State:
    rsi: RSI
    in_position: bool = False
    pending: bool = False
    entry_price: float = 0.0
    bars_since_exit: int = field(default=10**9)


class MeanReversion(Strategy):
    """低買高賣:RSI 跌到超賣就買,回升到目標就獲利了結,跌破停損就認賠。"""

    name = "mean_reversion"

    def __init__(self, rsi_period: int = 14, buy_below: float = 30.0,
                 sell_above: float = 55.0, stop_pct: float = 0.10,
                 cooldown_bars: int = 3, order_pct: float = 1.0):
        self.rsi_period = rsi_period
        self.buy_below = buy_below
        self.sell_above = sell_above
        self.stop_pct = stop_pct
        self.cooldown_bars = cooldown_bars
        self.order_pct = order_pct
        self._states: dict[str, _State] = {}
        self._blocked = 0

    def _state(self, symbol: str) -> _State:
        if symbol not in self._states:
            self._states[symbol] = _State(rsi=RSI(self.rsi_period))
        return self._states[symbol]

    def on_bar(self, bar: Bar) -> Signal | None:
        st = self._state(bar.symbol)
        rsi = st.rsi.update(bar.close)
        st.bars_since_exit += 1
        if rsi is None or st.pending:
            return None

        if st.in_position:
            stop_line = st.entry_price * (1 - self.stop_pct)
            checks = [
                _check("漲回目標,獲利了結", rsi > self.sell_above,
                       f"RSI{self.rsi_period} {rsi:.1f}", f"> {self.sell_above:.0f}"),
                _check("跌破停損,認賠", bar.close <= stop_line,
                       f"收盤 {bar.close:.2f}",
                       f"<= 進場 {st.entry_price:.2f} -{self.stop_pct:.0%} = {stop_line:.2f}"),
            ]
            hit = [c for c in checks if c["passed"]]
            if not hit:
                return None
            st.pending = True
            return Signal(bar.symbol, Side.SELL, 1.0,
                          f"出場:{hit[0]['name']}", {"checks": checks})

        checks = [
            _check("跌到超賣區", rsi < self.buy_below,
                   f"RSI{self.rsi_period} {rsi:.1f}", f"< {self.buy_below:.0f}"),
            _check("已過冷卻期", st.bars_since_exit >= self.cooldown_bars,
                   f"出場後 {min(st.bars_since_exit, 9999)} 根", f">= {self.cooldown_bars} 根"),
        ]
        if any(not c["passed"] for c in checks):
            self._blocked += 1
            return None

        st.pending = True
        return Signal(bar.symbol, Side.BUY, self.order_pct,
                      "跌到超賣區,低接", {"checks": checks})

    def on_fill(self, fill: Fill) -> None:
        st = self._state(fill.order.symbol)
        st.pending = False
        if fill.order.side == Side.BUY:
            st.in_position = True
            st.entry_price = fill.fill_price
        else:
            st.in_position = False
            st.bars_since_exit = 0

    def on_reject(self, signal: Signal, reason: str) -> None:
        self._state(signal.symbol).pending = False

    def explain_summary(self) -> dict[str, int]:
        return {"沒跌到超賣區(不夠便宜,不出手)": self._blocked}
