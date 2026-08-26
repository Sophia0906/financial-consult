"""真實加密貨幣行情(需 `pip install ccxt`)。

用交易所的公開 OHLCV 端點,**不需要 API key**——適合第一階段:
真實行情 + 本機模擬成交(paper 模式)。
"""
from __future__ import annotations

import time
from collections.abc import Iterator

from agent.data.feed import DataFeed
from agent.models import Bar


class CCXTFeed(DataFeed):
    def __init__(self, exchange_id: str = "binance", timeframe: str = "1m",
                 poll_interval_sec: float = 60.0, warmup_bars: int = 100):
        import ccxt

        self.exchange = getattr(ccxt, exchange_id)()
        self.timeframe = timeframe
        self.poll_interval_sec = poll_interval_sec
        self.warmup_bars = warmup_bars

    @staticmethod
    def _to_bar(symbol: str, row: list) -> Bar:
        ts_ms, o, h, l, c, v = row
        return Bar(symbol=symbol, timestamp=ts_ms / 1000,
                   open=o, high=h, low=l, close=c, volume=v)

    def bars(self, symbol: str) -> Iterator[Bar]:
        # 先補足歷史 K 線讓均線類策略暖機,之後輪詢最新收盤的那根
        history = self.exchange.fetch_ohlcv(symbol, self.timeframe, limit=self.warmup_bars)
        last_ts = 0.0
        for row in history[:-1]:  # 最後一根可能未收盤,不吐
            bar = self._to_bar(symbol, row)
            last_ts = bar.timestamp
            yield bar

        while True:
            rows = self.exchange.fetch_ohlcv(symbol, self.timeframe, limit=3)
            for row in rows[:-1]:
                bar = self._to_bar(symbol, row)
                if bar.timestamp > last_ts:
                    last_ts = bar.timestamp
                    yield bar
            time.sleep(self.poll_interval_sec)
