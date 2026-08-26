"""Strategy 介面:吃 K 線、吐建議。策略不下單、不碰資金,那是風控與 broker 的事。

策略不能自己假設「我送出買單所以我有部位了」——訂單可能被風控否決或下單失敗。
真實部位狀態透過 on_fill / on_reject 回報,策略據此更新自己的內部狀態。
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from agent.models import Bar, Fill, Signal


class Strategy(ABC):
    #: 策略代號,顯示在比較表與日誌
    name: str = "strategy"

    def describe(self) -> str:
        """一句話說明這個策略在做什麼(顯示在比較表)。"""
        return self.__doc__.strip().splitlines()[0] if self.__doc__ else self.name

    @abstractmethod
    def on_bar(self, bar: Bar) -> Signal | None:
        """收到一根新 K 線;回傳 None 代表不動作。"""

    def on_fill(self, fill: Fill) -> None:
        """訂單成交後由 Engine 回報,策略在此更新部位狀態。"""

    def on_reject(self, signal: Signal, reason: str) -> None:
        """建議被風控否決或下單失敗時由 Engine 回報。"""

    def explain_summary(self) -> dict[str, int]:
        """跑完一輪後的自我說明,例如「哪個條件擋下最多次進場」。"""
        return {}
