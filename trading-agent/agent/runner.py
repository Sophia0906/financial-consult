"""核心事件迴圈:回測與模擬盤/實盤共用同一條路徑。

每根 K 線:策略產生建議 -> 風控裁決 -> broker 執行 -> 回報策略 -> 寫日誌。
explain=True 時會把策略的判斷依據逐條印出來,看得見每個決定怎麼來的。
"""
from __future__ import annotations

import datetime as dt

from agent.brokers.base import Broker
from agent.data.feed import DataFeed
from agent.journal import Journal
from agent.metrics import Metrics, pair_round_trips
from agent.models import Bar, Fill, Signal
from agent.risk import RiskManager
from agent.strategy.base import Strategy


class Engine:
    def __init__(self, strategy: Strategy, risk: RiskManager,
                 broker: Broker, journal: Journal,
                 verbose: bool = True, explain: bool = False):
        self.strategy = strategy
        self.risk = risk
        self.broker = broker
        self.journal = journal
        self.verbose = verbose
        self.explain = explain
        self._last_prices: dict[str, float] = {}
        # 績效統計用
        self.equity_curve: list[tuple[float, float]] = []
        self.fills: list[Fill] = []
        self.rejections = 0
        self.initial_equity: float | None = None

    # ---------- 說明輸出 ----------

    @staticmethod
    def _fmt_time(ts: float) -> str:
        return dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%d %H:%M")

    def _print_evidence(self, bar: Bar, signal: Signal) -> None:
        print(f"\n[{self._fmt_time(bar.timestamp)}] {signal.side.value.upper():4} "
              f"{signal.symbol} — {signal.reason}")
        checks = signal.evidence.get("checks")
        if checks:
            for i, c in enumerate(checks):
                branch = "└" if i == len(checks) - 1 else "├"
                mark = "✓" if c["passed"] else "✗"
                print(f"   {branch} {mark} {c['name']}:{c['actual']} {c['threshold']}")
        for key, value in signal.evidence.items():
            if key != "checks":
                print(f"     · {key}:{value}")

    # ---------- 主流程 ----------

    def on_bar(self, bar: Bar) -> None:
        self._last_prices[bar.symbol] = bar.close
        portfolio = self.broker.portfolio()
        equity = portfolio.equity(self._last_prices)
        if self.initial_equity is None:
            self.initial_equity = equity

        signal = self.strategy.on_bar(bar)
        if signal is not None:
            if self.explain:
                self._print_evidence(bar, signal)
            equity = self._handle_signal(bar, signal, portfolio, equity)

        self.equity_curve.append((bar.timestamp, equity))

    def _handle_signal(self, bar: Bar, signal: Signal, portfolio, equity: float) -> float:
        order, verdict = self.risk.evaluate(
            signal, portfolio, price=bar.close, equity=equity, now=bar.timestamp,
        )
        if order is None:
            self.rejections += 1
            self.strategy.on_reject(signal, verdict)
            self.journal.log_rejection(
                signal.symbol, f"{signal.reason} => {verdict}", bar.timestamp,
                evidence=signal.evidence,
            )
            if self.explain or self.verbose:
                print(f"   → 風控:{verdict}")
            return equity

        fill = self.broker.submit(order, now=bar.timestamp)
        if fill is None:
            self.rejections += 1
            self.strategy.on_reject(signal, "下單失敗")
            self.journal.log_rejection(order.symbol, "下單失敗", bar.timestamp)
            if self.explain or self.verbose:
                print("   → 下單失敗")
            return equity

        self.strategy.on_fill(fill)
        self.fills.append(fill)
        self.journal.log_fill(fill, reason=signal.reason, evidence=signal.evidence)

        equity = self.broker.portfolio().equity(self._last_prices)
        self.journal.log_equity(equity, self.broker.portfolio().cash, bar.timestamp)
        if self.explain:
            print(f"   → 風控:{verdict} → 成交 {fill.order.qty:.6f} @ {fill.fill_price:.2f}"
                  f",權益 {equity:.2f}")
        elif self.verbose:
            print(
                f"  [成交] {fill.order.side.value:>4} {fill.order.qty:.6f} {fill.order.symbol}"
                f" @ {fill.fill_price:.2f}({signal.reason})權益 {equity:.2f}"
            )
        return equity

    def run(self, feed: DataFeed, symbol: str) -> float:
        """把 feed 的 K 線全部餵完(實盤 feed 不會停,直到 Ctrl+C)。回傳最終權益。"""
        for bar in feed.bars(symbol):
            self.on_bar(bar)
        return self.broker.portfolio().equity(self._last_prices)

    def metrics(self, label: str | None = None, bar_seconds: float = 3600.0) -> Metrics:
        final = self.equity_curve[-1][1] if self.equity_curve else (self.initial_equity or 0.0)
        return Metrics(
            label=label or self.strategy.name,
            initial_equity=self.initial_equity or 0.0,
            final_equity=final,
            n_fills=len(self.fills),
            n_rejections=self.rejections,
            total_fees=sum(f.fee for f in self.fills),
            round_trips=pair_round_trips(self.fills),
            equity_curve=self.equity_curve,
            bar_seconds=bar_seconds,
        )
