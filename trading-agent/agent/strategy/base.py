"""Strategy 介面:吃 K 線、吐建議。策略不下單、不碰資金,那是風控與 broker 的事。"""
from __future__ import annotations

from abc import ABC, abstractmethod

from agent.models import Bar, Signal


class Strategy(ABC):
    @abstractmethod
    def on_bar(self, bar: Bar) -> Signal | None:
        """收到一根新 K 線;回傳 None 代表不動作。"""
