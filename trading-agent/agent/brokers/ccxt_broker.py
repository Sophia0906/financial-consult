"""加密貨幣下單 adapter(需 `pip install ccxt`)。

- mode=testnet:接 Binance Spot Testnet(假錢、真 API),key 從
  BINANCE_TESTNET_API_KEY / BINANCE_TESTNET_SECRET 讀。
- mode=live:接真實 Binance,key 從 BINANCE_API_KEY / BINANCE_SECRET 讀,
  且必須另外設 TRADING_AGENT_ARM_LIVE=1(config.py 會擋)。

安全提醒:交易所 key 只開現貨交易權限、綁 IP 白名單、絕不開提幣。
"""
from __future__ import annotations

import os

from agent.brokers.base import Broker
from agent.models import Fill, Order, Portfolio, Position, Side


class CCXTBroker(Broker):
    def __init__(self, mode: str, quote_currency: str = "USDT"):
        import ccxt  # 延遲載入:沒裝 ccxt 也不影響 paper 模式

        if mode == "testnet":
            key = os.environ.get("BINANCE_TESTNET_API_KEY")
            secret = os.environ.get("BINANCE_TESTNET_SECRET")
        elif mode == "live":
            key = os.environ.get("BINANCE_API_KEY")
            secret = os.environ.get("BINANCE_SECRET")
        else:
            raise ValueError(f"CCXTBroker 不支援 mode={mode!r}")
        if not key or not secret:
            raise RuntimeError(f"缺少 {mode} 模式的 Binance API key(請見 .env.example)")

        self.exchange = ccxt.binance({"apiKey": key, "secret": secret})
        if mode == "testnet":
            self.exchange.set_sandbox_mode(True)
        self.quote_currency = quote_currency

    def submit(self, order: Order, now: float) -> Fill | None:
        side = "buy" if order.side == Side.BUY else "sell"
        result = self.exchange.create_market_order(order.symbol, side, order.qty)
        price = result.get("average") or result.get("price") or order.ref_price
        fee_info = result.get("fee") or {}
        return Fill(
            order=order,
            fill_price=float(price),
            fee=float(fee_info.get("cost") or 0.0),
            timestamp=now,
        )

    def portfolio(self) -> Portfolio:
        balance = self.exchange.fetch_balance()
        pf = Portfolio(cash=float(balance["free"].get(self.quote_currency, 0.0)))
        for currency, qty in balance["free"].items():
            if currency == self.quote_currency or not qty:
                continue
            symbol = f"{currency}/{self.quote_currency}"
            pf.positions[symbol] = Position(symbol=symbol, qty=float(qty))
        return pf
