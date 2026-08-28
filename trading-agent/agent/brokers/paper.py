"""模擬券商:立即以參考價 ± 滑價成交,收模擬手續費,追蹤現金與持倉。"""
from __future__ import annotations

from agent.brokers.base import Broker
from agent.models import Fill, Order, Portfolio, Side


class PaperBroker(Broker):
    def __init__(self, initial_cash: float, taker_fee_rate: float, slippage_rate: float):
        self._portfolio = Portfolio(cash=initial_cash)
        self.taker_fee_rate = taker_fee_rate
        self.slippage_rate = slippage_rate

    def submit(self, order: Order, now: float) -> Fill | None:
        pf = self._portfolio
        pos = pf.position(order.symbol)
        # 買單吃到略高的價、賣單吃到略低的價,模擬市價單滑價
        slip = 1 + self.slippage_rate if order.side == Side.BUY else 1 - self.slippage_rate
        price = order.ref_price * slip
        notional = order.qty * price
        fee = notional * self.taker_fee_rate

        if order.side == Side.BUY:
            if notional + fee > pf.cash:
                return None
            pf.cash -= notional + fee
            new_qty = pos.qty + order.qty
            pos.avg_price = (pos.avg_price * pos.qty + notional) / new_qty
            pos.qty = new_qty
        else:
            if order.qty > pos.qty:
                return None
            pf.cash += notional - fee
            pos.qty -= order.qty
            if pos.qty == 0:
                pos.avg_price = 0.0

        return Fill(order=order, fill_price=price, fee=fee, timestamp=now)

    def portfolio(self) -> Portfolio:
        return self._portfolio
