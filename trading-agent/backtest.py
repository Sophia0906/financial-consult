#!/usr/bin/env python3
"""回測入口:離線可跑,不需網路與 API key。

用法:
    python3 backtest.py                       # 合成資料
    python3 backtest.py --bars 2000 --seed 7  # 換資料長度與亂數種子
"""
from __future__ import annotations

import argparse

from agent.brokers.paper import PaperBroker
from agent.config import load_config
from agent.data.feed import SyntheticFeed
from agent.journal import Journal
from agent.risk import RiskManager
from agent.runner import Engine
from agent.strategy.registry import build_strategy


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", default="BTC/USDT")
    parser.add_argument("--bars", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--explain", action="store_true",
                        help="逐筆印出策略的判斷依據")
    args = parser.parse_args()

    cfg = load_config()
    strategy = build_strategy(cfg.strategy_name, cfg.strategy_params)
    broker = PaperBroker(cfg.initial_cash, cfg.taker_fee_rate, cfg.slippage_rate)
    engine = Engine(
        strategy=strategy,
        risk=RiskManager(cfg.risk),
        broker=broker,
        journal=Journal("journal/backtest.jsonl"),
        verbose=not args.explain,
        explain=args.explain,
    )

    print(f"回測 {args.symbol}:{args.bars} 根合成 K 線,策略 {cfg.strategy_name},"
          f" 起始資金 {cfg.initial_cash:.2f}")
    feed = SyntheticFeed(n_bars=args.bars, seed=args.seed)
    engine.run(feed, args.symbol)

    m = engine.metrics()
    pf = "∞" if m.profit_factor == float("inf") else f"{m.profit_factor:.2f}"
    print(f"\n{'─' * 46}")
    print(f"  結束權益    {m.final_equity:>12.2f}(報酬 {m.total_return:+.2%})")
    print(f"  最大回撤    {m.max_drawdown:>12.2%}")
    print(f"  年化 Sharpe {m.sharpe:>12.2f}")
    print(f"  成交筆數    {m.n_fills:>12}(來回 {m.n_round_trips} 次,"
          f"勝率 {m.win_rate:.0%},獲利因子 {pf})")
    print(f"  手續費支出  {m.total_fees:>12.2f}")
    print(f"  風控否決    {m.n_rejections:>12} 次")
    print(f"{'─' * 46}")

    summary = strategy.explain_summary()
    if summary:
        print("策略自我說明:")
        for key, count in summary.items():
            print(f"  · {key}:{count} 次")
    print("\n交易明細(含判斷依據)見 journal/backtest.jsonl")
    print("想比較不同策略:python3 compare.py")


if __name__ == "__main__":
    main()
