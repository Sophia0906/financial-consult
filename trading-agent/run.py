#!/usr/bin/env python3
"""模擬盤/實盤入口。

用法:
    python3 run.py --mode paper --feed synthetic                  # 離線試跑
    python3 run.py --mode paper --feed ccxt --symbol BTC/USDT     # 真行情 + 模擬成交
    python3 run.py --mode testnet --symbol BTC/USDT               # 交易所測試網(需 key)
    # live 模式需 config.toml mode="live" + 環境變數 TRADING_AGENT_ARM_LIVE=1

.env 檔若存在會自動載入(簡易解析,不需額外套件)。
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

from agent.brokers.paper import PaperBroker
from agent.config import load_config
from agent.data.feed import SyntheticFeed
from agent.journal import Journal
from agent.risk import RiskManager
from agent.runner import Engine
from agent.strategy.registry import build_strategy


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["paper", "testnet", "live"], default=None,
                        help="覆寫 config.toml 的 mode(僅能更保守,live 仍需雙開關)")
    parser.add_argument("--feed", choices=["synthetic", "ccxt"], default="ccxt")
    parser.add_argument("--symbol", default="BTC/USDT")
    parser.add_argument("--market", choices=["crypto", "us_stock"], default="crypto")
    args = parser.parse_args()

    load_dotenv(Path(__file__).parent / ".env")
    cfg = load_config()
    mode = args.mode or cfg.mode

    if args.feed == "synthetic":
        feed = SyntheticFeed(n_bars=200)
    else:
        from agent.data.ccxt_feed import CCXTFeed
        feed = CCXTFeed(poll_interval_sec=cfg.poll_interval_sec)

    if mode == "paper":
        broker = PaperBroker(cfg.initial_cash, cfg.taker_fee_rate, cfg.slippage_rate)
    elif args.market == "crypto":
        from agent.brokers.ccxt_broker import CCXTBroker
        broker = CCXTBroker(mode)
    else:
        from agent.brokers.alpaca_broker import AlpacaBroker
        broker = AlpacaBroker(mode)

    engine = Engine(
        strategy=build_strategy(cfg.strategy_name, cfg.strategy_params),
        risk=RiskManager(cfg.risk),
        broker=broker,
        journal=Journal(f"journal/{mode}.jsonl"),
    )

    print(f"啟動:mode={mode} feed={args.feed} symbol={args.symbol}(Ctrl+C 停止)")
    try:
        engine.run(feed, args.symbol)
    except KeyboardInterrupt:
        print("\n已停止。日誌見 journal/ 目錄。")


if __name__ == "__main__":
    main()
