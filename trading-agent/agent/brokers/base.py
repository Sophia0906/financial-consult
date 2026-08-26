"""Broker 介面:策略與風控唯一認識的下單窗口。

換 adapter(paper / testnet / 真實券商)不影響上層任何一行程式碼。
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from agent.models import Fill, Order, Portfolio


class Broker(ABC):
    @abstractmethod
    def submit(self, order: Order, now: float) -> Fill | None:
        """送出市價單;回傳成交結果,失敗回傳 None。"""

    @abstractmethod
    def portfolio(self) -> Portfolio:
        """目前的現金與持倉。"""
