"""串流式技術指標:每根 K 線餵一次,不需要重算整段歷史。

刻意不依賴 numpy/pandas,讓骨架保持零外部依賴。
未暖機完成時一律回傳 None,策略要自己判斷 ready。
"""
from __future__ import annotations

from collections import deque


class SMA:
    """簡單移動平均。"""

    def __init__(self, period: int):
        self.period = period
        self._buf: deque[float] = deque(maxlen=period)
        self.value: float | None = None

    def update(self, x: float) -> float | None:
        self._buf.append(x)
        if len(self._buf) == self.period:
            self.value = sum(self._buf) / self.period
        return self.value


class RSI:
    """相對強弱指標(Wilder 平滑)。0~100,越高代表近期漲勢越強。"""

    def __init__(self, period: int = 14):
        self.period = period
        self.value: float | None = None
        self._prev_close: float | None = None
        self._avg_gain: float | None = None
        self._avg_loss: float | None = None
        self._gains: list[float] = []
        self._losses: list[float] = []

    def update(self, close: float) -> float | None:
        if self._prev_close is None:
            self._prev_close = close
            return None

        change = close - self._prev_close
        self._prev_close = close
        gain, loss = max(change, 0.0), max(-change, 0.0)

        if self._avg_gain is None:
            self._gains.append(gain)
            self._losses.append(loss)
            if len(self._gains) < self.period:
                return None
            self._avg_gain = sum(self._gains) / self.period
            self._avg_loss = sum(self._losses) / self.period
        else:
            self._avg_gain = (self._avg_gain * (self.period - 1) + gain) / self.period
            self._avg_loss = (self._avg_loss * (self.period - 1) + loss) / self.period

        if self._avg_loss == 0:
            self.value = 100.0
        else:
            rs = self._avg_gain / self._avg_loss
            self.value = 100.0 - 100.0 / (1.0 + rs)
        return self.value


class ATR:
    """平均真實區間:衡量波動度,用來判斷「現在市場是不是太亂」。"""

    def __init__(self, period: int = 14):
        self.period = period
        self.value: float | None = None
        self._prev_close: float | None = None
        self._trs: list[float] = []

    def update(self, high: float, low: float, close: float) -> float | None:
        if self._prev_close is None:
            tr = high - low
        else:
            tr = max(high - low, abs(high - self._prev_close), abs(low - self._prev_close))
        self._prev_close = close

        if self.value is None:
            self._trs.append(tr)
            if len(self._trs) < self.period:
                return None
            self.value = sum(self._trs) / self.period
        else:
            self.value = (self.value * (self.period - 1) + tr) / self.period
        return self.value
