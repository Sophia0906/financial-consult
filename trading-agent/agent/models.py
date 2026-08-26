"""核心資料結構:回測、模擬盤、實盤共用。"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Side(str, Enum):
    BUY = "buy"
    SELL = "sell"


@dataclass(frozen=True)
class Bar:
    """一根 K 線。timestamp 為 epoch 秒(UTC)。"""

    symbol: str
    timestamp: float
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass(frozen=True)
class Signal:
    """策略輸出的「建議」,還要過風控才會變成訂單。"""

    symbol: str
    side: Side
    # 想動用的資金比例(佔目前總權益),風控可再往下砍
    target_notional_pct: float
    reason: str


@dataclass(frozen=True)
class Order:
    symbol: str
    side: Side
    qty: float
    # 市價單以送單當下的參考價記錄;骨架先只支援市價單
    ref_price: float


@dataclass(frozen=True)
class Fill:
    order: Order
    fill_price: float
    fee: float
    timestamp: float


@dataclass
class Position:
    symbol: str
    qty: float = 0.0
    avg_price: float = 0.0


@dataclass
class Portfolio:
    cash: float
    positions: dict[str, Position] = field(default_factory=dict)

    def position(self, symbol: str) -> Position:
        return self.positions.setdefault(symbol, Position(symbol))

    def equity(self, prices: dict[str, float]) -> float:
        total = self.cash
        for pos in self.positions.values():
            total += pos.qty * prices.get(pos.symbol, pos.avg_price)
        return total
