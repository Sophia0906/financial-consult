"""範例策略:雙均線交叉。

快線上穿慢線 => 買進建議;下穿 => 出場建議。
最經典的入門策略,單一條件、無停損——放在比較表裡當「最陽春自建策略」的參照。
"""
from __future__ import annotations

from collections import deque

from agent.models import Bar, Side, Signal
from agent.strategy.base import Strategy


class SmaCross(Strategy):
    """雙均線交叉:快線穿越慢線就換邊,單一條件無停損。"""

    name = "sma_cross"

    def __init__(self, fast_period: int = 10, slow_period: int = 30,
                 order_pct: float = 1.0):
        if fast_period >= slow_period:
            raise ValueError("fast_period 必須小於 slow_period")
        self.fast_period = fast_period
        self.slow_period = slow_period
        # 策略只表達「想投入多少」,真正的部位大小由 RiskManager 依上限裁決
        self.order_pct = order_pct
        self._closes: dict[str, deque[float]] = {}
        self._prev_diff: dict[str, float] = {}

    def on_bar(self, bar: Bar) -> Signal | None:
        closes = self._closes.setdefault(bar.symbol, deque(maxlen=self.slow_period))
        closes.append(bar.close)
        if len(closes) < self.slow_period:
            return None

        fast = sum(list(closes)[-self.fast_period:]) / self.fast_period
        slow = sum(closes) / self.slow_period
        diff = fast - slow
        prev = self._prev_diff.get(bar.symbol)
        self._prev_diff[bar.symbol] = diff
        if prev is None:
            return None

        evidence = {
            "價格": round(bar.close, 4),
            f"SMA{self.fast_period}": round(fast, 4),
            f"SMA{self.slow_period}": round(slow, 4),
            "快慢線差": f"{prev:+.4f} → {diff:+.4f}",
        }

        if prev <= 0 < diff:
            return Signal(
                symbol=bar.symbol, side=Side.BUY, target_notional_pct=self.order_pct,
                reason=f"SMA{self.fast_period} 上穿 SMA{self.slow_period}",
                evidence=evidence,
            )
        if prev >= 0 > diff:
            return Signal(
                symbol=bar.symbol, side=Side.SELL, target_notional_pct=1.0,
                reason=f"SMA{self.fast_period} 下穿 SMA{self.slow_period}",
                evidence=evidence,
            )
        return None
