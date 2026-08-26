"""核心事件迴圈:回測與模擬盤/實盤共用同一條路徑。

每根 K 線:策略產生建議 -> 風控裁決 -> broker 執行 -> 日誌記錄。
"""
from __future__ import annotations

from agent.brokers.base import Broker
from agent.data.feed import DataFeed
from agent.journal import Journal
from agent.models import Bar
from agent.risk import RiskManager
from agent.strategy.base import Strategy


class Engine:
    def __init__(self, strategy: Strategy, risk: RiskManager,
                 broker: Broker, journal: Journal, verbose: bool = True):
        self.strategy = strategy
        self.risk = risk
        self.broker = broker
        self.journal = journal
        self.verbose = verbose
        self._last_prices: dict[str, float] = {}

    def on_bar(self, bar: Bar) -> None:
        self._last_prices[bar.symbol] = bar.close
        portfolio = self.broker.portfolio()
        equity = portfolio.equity(self._last_prices)

        signal = self.strategy.on_bar(bar)
        if signal is None:
            return

        order, verdict = self.risk.evaluate(
            signal, portfolio, price=bar.close, equity=equity, now=bar.timestamp,
        )
        if order is None:
            self.journal.log_rejection(signal.symbol, f"{signal.reason} => {verdict}", bar.timestamp)
            if self.verbose:
                print(f"  [風控] {signal.symbol} {signal.side.value}: {verdict}")
            return

        fill = self.broker.submit(order, now=bar.timestamp)
        if fill is None:
            self.journal.log_rejection(order.symbol, "下單失敗", bar.timestamp)
            return

        self.journal.log_fill(fill, reason=signal.reason)
        equity = self.broker.portfolio().equity(self._last_prices)
        self.journal.log_equity(equity, self.broker.portfolio().cash, bar.timestamp)
        if self.verbose:
            print(
                f"  [成交] {fill.order.side.value:>4} {fill.order.qty:.6f} {fill.order.symbol}"
                f" @ {fill.fill_price:.2f}({signal.reason})權益 {equity:.2f}"
            )

    def run(self, feed: DataFeed, symbol: str) -> float:
        """把 feed 的 K 線全部餵完(實盤 feed 不會停,直到 Ctrl+C)。回傳最終權益。"""
        for bar in feed.bars(symbol):
            self.on_bar(bar)
        return self.broker.portfolio().equity(self._last_prices)
