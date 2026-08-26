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
from agent.strategy.sma_cross import build_strategy


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", default="BTC/USDT")
    parser.add_argument("--bars", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = load_config()
    strategy = build_strategy(cfg.strategy_name, cfg.strategy_params)
    broker = PaperBroker(cfg.initial_cash, cfg.taker_fee_rate, cfg.slippage_rate)
    engine = Engine(
        strategy=strategy,
        risk=RiskManager(cfg.risk),
        broker=broker,
        journal=Journal("journal/backtest.jsonl"),
    )

    print(f"回測 {args.symbol}:{args.bars} 根合成 K 線,策略 {cfg.strategy_name},"
          f" 起始資金 {cfg.initial_cash:.2f}")
    feed = SyntheticFeed(n_bars=args.bars, seed=args.seed)
    final_equity = engine.run(feed, args.symbol)

    ret = final_equity / cfg.initial_cash - 1
    print(f"\n結束權益 {final_equity:.2f}(報酬 {ret:+.2%})")
    print("交易明細見 journal/backtest.jsonl")


if __name__ == "__main__":
    main()
