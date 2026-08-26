"""行情來源介面 + 離線可用的合成資料源。"""
from __future__ import annotations

import math
import random
import time
from abc import ABC, abstractmethod
from collections.abc import Iterator

from agent.models import Bar


class DataFeed(ABC):
    @abstractmethod
    def bars(self, symbol: str) -> Iterator[Bar]:
        """依時間序吐出 K 線。實盤 feed 會阻塞等待下一根;回測 feed 跑完即止。"""


class ListFeed(DataFeed):
    """重播一段已經備妥的 K 線。

    比較多個策略時用它:先把資料生成/下載一次,再讓每個策略跑「完全相同」的
    那一份,績效差異才確定來自策略本身。
    """

    def __init__(self, bars: list[Bar]):
        self._bars = bars

    def bars(self, symbol: str) -> Iterator[Bar]:
        return iter(self._bars)


class SyntheticFeed(DataFeed):
    """幾何隨機走勢 + 週期項的合成 K 線,讓骨架完全離線也能跑通。

    固定 seed 時結果可重現,方便驗證回測管線本身沒壞。
    """

    def __init__(self, n_bars: int = 500, start_price: float = 100.0,
                 seed: int | None = 42, bar_seconds: int = 3600):
        self.n_bars = n_bars
        self.start_price = start_price
        self.seed = seed
        self.bar_seconds = bar_seconds

    def bars(self, symbol: str) -> Iterator[Bar]:
        rng = random.Random(self.seed)
        price = self.start_price
        start_ts = time.time() - self.n_bars * self.bar_seconds
        for i in range(self.n_bars):
            drift = 0.0002 * math.sin(i / 40)  # 慢速週期,製造可被均線抓到的趨勢
            ret = rng.gauss(drift, 0.01)
            open_ = price
            close = price * math.exp(ret)
            high = max(open_, close) * (1 + abs(rng.gauss(0, 0.003)))
            low = min(open_, close) * (1 - abs(rng.gauss(0, 0.003)))
            yield Bar(
                symbol=symbol,
                timestamp=start_ts + i * self.bar_seconds,
                open=open_, high=high, low=low, close=close,
                volume=abs(rng.gauss(1000, 300)),
            )
            price = close
