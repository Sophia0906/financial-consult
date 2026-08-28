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


#: 可產生的行情型態。策略的好壞高度取決於遇到哪一種,所以要能分開測。
REGIMES = ("cycle", "sideways", "bull", "bear")

REGIME_LABELS = {
    "cycle": "多空交替",
    "sideways": "震盪盤",
    "bull": "單邊上漲",
    "bear": "單邊下跌",
}


class SyntheticFeed(DataFeed):
    """幾何隨機走勢的合成 K 線,讓骨架完全離線也能跑通。

    固定 seed 時結果可重現,方便驗證回測管線本身沒壞。
    regime 決定行情型態——趨勢跟隨與均值回歸這兩類策略的優劣完全由它決定,
    所以比較策略時務必四種都跑過,只在一種行情下贏不算贏。
    """

    def __init__(self, n_bars: int = 500, start_price: float = 100.0,
                 seed: int | None = 42, bar_seconds: int = 3600,
                 regime: str = "cycle", vol: float = 0.01):
        if regime not in REGIMES:
            raise ValueError(f"未知的 regime {regime!r};可選:{'、'.join(REGIMES)}")
        self.n_bars = n_bars
        self.start_price = start_price
        self.seed = seed
        self.bar_seconds = bar_seconds
        self.regime = regime
        self.vol = vol

    def _drift(self, i: int, price: float) -> float:
        """每根 K 線的期望報酬,決定這段行情往哪走。"""
        if self.regime == "bull":
            return 0.0008
        if self.regime == "bear":
            return -0.0008
        if self.regime == "sideways":
            # 往起始價回歸的拉力:偏離越遠,拉回的力道越強(震盪盤的本質)
            return 0.02 * math.log(self.start_price / price)
        return 0.0002 * math.sin(i / 40)  # cycle:慢速多空交替

    def bars(self, symbol: str) -> Iterator[Bar]:
        rng = random.Random(self.seed)
        price = self.start_price
        start_ts = time.time() - self.n_bars * self.bar_seconds
        for i in range(self.n_bars):
            ret = rng.gauss(self._drift(i, price), self.vol)
            open_ = price
            close = price * math.exp(ret)
            wick = self.vol * 0.3
            high = max(open_, close) * (1 + abs(rng.gauss(0, wick)))
            low = min(open_, close) * (1 - abs(rng.gauss(0, wick)))
            yield Bar(
                symbol=symbol,
                timestamp=start_ts + i * self.bar_seconds,
                open=open_, high=high, low=low, close=close,
                volume=abs(rng.gauss(1000, 300)),
            )
            price = close
