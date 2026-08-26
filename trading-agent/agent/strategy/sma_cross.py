"""範例策略:雙均線交叉。

快線上穿慢線 => 買進建議;下穿 => 出場建議。
這是教學用的最簡策略,實盤前請換成你自己驗證過的邏輯。
"""
from __future__ import annotations

from collections import deque

from agent.models import Bar, Side, Signal
from agent.strategy.base import Strategy


class SmaCross(Strategy):
    def __init__(self, fast_period: int = 10, slow_period: int = 30):
        if fast_period >= slow_period:
            raise ValueError("fast_period 必須小於 slow_period")
        self.fast_period = fast_period
        self.slow_period = slow_period
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

        if prev <= 0 < diff:
            return Signal(
                symbol=bar.symbol,
                side=Side.BUY,
                target_notional_pct=0.10,
                reason=f"SMA{self.fast_period} 上穿 SMA{self.slow_period}",
            )
        if prev >= 0 > diff:
            return Signal(
                symbol=bar.symbol,
                side=Side.SELL,
                target_notional_pct=1.0,  # 出場:全數賣出,實際數量由風控/broker 依持倉決定
                reason=f"SMA{self.fast_period} 下穿 SMA{self.slow_period}",
            )
        return None


def build_strategy(name: str, params: dict) -> Strategy:
    if name == "sma_cross":
        return SmaCross(
            fast_period=int(params.get("fast_period", 10)),
            slow_period=int(params.get("slow_period", 30)),
        )
    raise ValueError(f"未知策略: {name!r}")
