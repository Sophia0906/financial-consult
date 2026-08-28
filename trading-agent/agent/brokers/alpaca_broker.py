"""美股下單 adapter(需 `pip install alpaca-py`)。

- mode=testnet:接 Alpaca paper trading(假錢、真 API)。
- mode=live:接真實帳戶,且必須另外設 TRADING_AGENT_ARM_LIVE=1。

key 從 ALPACA_API_KEY / ALPACA_SECRET 讀。注意:美股 symbol 格式為 "AAPL",
與加密貨幣的 "BTC/USDT" 不同,config.toml 的白名單要跟著換。
"""
from __future__ import annotations

import os

from agent.brokers.base import Broker
from agent.models import Fill, Order, Portfolio, Position, Side


class AlpacaBroker(Broker):
    def __init__(self, mode: str):
        from alpaca.trading.client import TradingClient
        from alpaca.trading.enums import OrderSide, TimeInForce
        from alpaca.trading.requests import MarketOrderRequest

        key = os.environ.get("ALPACA_API_KEY")
        secret = os.environ.get("ALPACA_SECRET")
        if not key or not secret:
            raise RuntimeError("缺少 ALPACA_API_KEY / ALPACA_SECRET(請見 .env.example)")
        if mode not in ("testnet", "live"):
            raise ValueError(f"AlpacaBroker 不支援 mode={mode!r}")

        self.client = TradingClient(key, secret, paper=(mode == "testnet"))
        self._OrderSide = OrderSide
        self._TimeInForce = TimeInForce
        self._MarketOrderRequest = MarketOrderRequest

    def submit(self, order: Order, now: float) -> Fill | None:
        req = self._MarketOrderRequest(
            symbol=order.symbol,
            qty=order.qty,
            side=self._OrderSide.BUY if order.side == Side.BUY else self._OrderSide.SELL,
            time_in_force=self._TimeInForce.DAY,
        )
        result = self.client.submit_order(req)
        price = float(result.filled_avg_price or order.ref_price)
        return Fill(order=order, fill_price=price, fee=0.0, timestamp=now)

    def portfolio(self) -> Portfolio:
        account = self.client.get_account()
        pf = Portfolio(cash=float(account.cash))
        for p in self.client.get_all_positions():
            pf.positions[p.symbol] = Position(
                symbol=p.symbol,
                qty=float(p.qty),
                avg_price=float(p.avg_entry_price),
            )
        return pf
