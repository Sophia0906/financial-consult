"""網格策略:模擬交易所內建機器人(Pionex／幣安網格)的典型做法。

這是「現成機器人」的代表,放進來當基準線用——你自建的策略至少要打得贏它,
不然不如直接開交易所的網格,省下開發與維運成本。

邏輯只有一句話:把價格區間切成 N 層,跌破一層買一份,漲破一層賣一份。
它不看趨勢、不看動能、不停損——這正是網格的優點(震盪盤穩定收租)
與致命傷(單邊下跌會一路接刀,漲破區間則整組失效)。
"""
from __future__ import annotations

from agent.models import Bar, Fill, Side, Signal
from agent.strategy.base import Strategy


class GridBot(Strategy):
    """網格機器人:區間內逐層低買高賣,不判斷方向。"""

    name = "grid"

    def __init__(self, grid_count: int = 10, range_pct: float = 0.20,
                 order_pct: float = 0.05):
        if grid_count < 2:
            raise ValueError("grid_count 至少要 2")
        self.grid_count = grid_count
        self.range_pct = range_pct
        self.order_pct = order_pct
        self._levels: list[float] | None = None
        self._last_idx: int | None = None
        self._open_units = 0
        self._out_of_range_bars = 0

    def _build_levels(self, price: float) -> None:
        low = price * (1 - self.range_pct)
        high = price * (1 + self.range_pct)
        ratio = (high / low) ** (1 / self.grid_count)  # 等比切割,對數價格等距
        self._levels = [low * ratio**i for i in range(self.grid_count + 1)]

    def _level_index(self, price: float) -> int:
        assert self._levels is not None
        idx = 0
        for i, level in enumerate(self._levels):
            if price >= level:
                idx = i
        return idx

    def on_bar(self, bar: Bar) -> Signal | None:
        if self._levels is None:
            # 以第一根 K 線的價格為中心建網格,之後不再重新錨定
            self._build_levels(bar.close)
            self._last_idx = self._level_index(bar.close)
            return None

        assert self._levels is not None and self._last_idx is not None
        if bar.close < self._levels[0] or bar.close > self._levels[-1]:
            self._out_of_range_bars += 1

        idx = self._level_index(bar.close)
        if idx == self._last_idx:
            return None

        prev_idx, self._last_idx = self._last_idx, idx
        evidence = {
            "價格": round(bar.close, 4),
            "網格層": f"第 {prev_idx} 層 → 第 {idx} 層(共 {self.grid_count} 層)",
            "網格區間": f"{self._levels[0]:.2f} ~ {self._levels[-1]:.2f}",
            "未平倉份數": self._open_units,
        }

        if idx < prev_idx:
            return Signal(
                symbol=bar.symbol, side=Side.BUY, target_notional_pct=self.order_pct,
                reason=f"跌破網格第 {prev_idx} 層,買進一份", evidence=evidence,
            )

        if self._open_units <= 0:
            return None  # 手上沒貨可賣,網格只做多不放空
        return Signal(
            symbol=bar.symbol, side=Side.SELL,
            target_notional_pct=1.0 / self._open_units,  # 賣掉其中一份
            reason=f"漲破網格第 {prev_idx} 層,賣出一份", evidence=evidence,
        )

    def on_fill(self, fill: Fill) -> None:
        if fill.order.side == Side.BUY:
            self._open_units += 1
        else:
            self._open_units = max(0, self._open_units - 1)

    def explain_summary(self) -> dict[str, int]:
        return {"價格跑到網格區間外的 K 線數": self._out_of_range_bars}
