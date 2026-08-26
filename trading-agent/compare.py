#!/usr/bin/env python3
"""策略比較器:把「現成機器人」和「自建策略」放在同一份資料上 PK。

用法:
    python3 compare.py                          # 三個策略同場比較
    python3 compare.py --explain rule_stack     # 逐筆看某策略的判斷過程
    python3 compare.py --bars 3000 --seed 7     # 換資料長度/亂數種子做穩健性檢查
    python3 compare.py --seeds 5                # 跑 5 組不同資料,看誰是真的穩

比較的公平性:
  1. 所有策略跑「完全相同」的 K 線(先生成一次再重播)
  2. 所有策略用相同的手續費與滑價
  3. 所有策略用相同的風控參數(見下方 COMPARE_RISK,刻意放寬,
     讓差異來自策略本身而不是被風控卡住的程度)
"""
from __future__ import annotations

import argparse

from agent.config import RiskConfig, load_config
from agent.brokers.paper import PaperBroker
from agent.data.feed import ListFeed, SyntheticFeed
from agent.journal import Journal
from agent.metrics import Metrics
from agent.models import Bar
from agent.risk import RiskManager
from agent.runner import Engine
from agent.strategy.registry import build_strategy
from agent.textui import table

# 比較用的風控:比 config.toml 寬鬆,避免各策略被同一道上限削平而看不出差異
COMPARE_RISK = RiskConfig(
    symbol_whitelist=("BTC/USDT",),
    max_position_pct=0.60,
    max_order_pct=0.20,
    max_daily_loss_pct=0.50,
)

# 參賽者:名稱 -> (策略代號, 參數, 中文說明)
CONTENDERS: list[tuple[str, dict, str]] = [
    ("grid", {"grid_count": 10, "range_pct": 0.20, "order_pct": 0.05},
     "現成機器人代表"),
    ("sma_cross", {"fast_period": 10, "slow_period": 30},
     "最陽春的自建策略"),
    ("rule_stack", {}, "多條件過濾 + 停損停利"),
]

BAR_SECONDS = 3600.0


# ---------- 執行 ----------

def run_one(name: str, params: dict, bars: list[Bar], symbol: str,
            cfg, explain: bool) -> tuple[Metrics, dict[str, int]]:
    strategy = build_strategy(name, params)
    broker = PaperBroker(cfg.initial_cash, cfg.taker_fee_rate, cfg.slippage_rate)
    engine = Engine(
        strategy=strategy,
        risk=RiskManager(COMPARE_RISK),
        broker=broker,
        journal=Journal(f"journal/compare_{name}.jsonl"),
        verbose=False,
        explain=explain,
    )
    engine.run(ListFeed(bars), symbol)
    return engine.metrics(label=name, bar_seconds=BAR_SECONDS), strategy.explain_summary()


def buy_and_hold(bars: list[Bar], cfg) -> Metrics:
    """買進後抱著不動:任何策略都該先打贏這條基準線,不然何必交易。"""
    entry = bars[0].close * (1 + cfg.slippage_rate)
    qty = cfg.initial_cash / entry * (1 - cfg.taker_fee_rate)
    curve = [(b.timestamp, qty * b.close) for b in bars]
    return Metrics(
        label="buy_and_hold", initial_equity=cfg.initial_cash,
        final_equity=curve[-1][1], n_fills=1, n_rejections=0,
        total_fees=cfg.initial_cash * cfg.taker_fee_rate,
        equity_curve=curve, bar_seconds=BAR_SECONDS,
    )


def format_row(m: Metrics, note: str) -> list[str]:
    pf = "∞" if m.profit_factor == float("inf") else f"{m.profit_factor:.2f}"
    return [
        m.label,
        f"{m.total_return:+.2%}",
        f"{m.max_drawdown:.2%}",
        f"{m.sharpe:.2f}",
        str(m.n_fills),
        f"{m.win_rate:.0%}" if m.n_round_trips else "—",
        pf if m.n_round_trips else "—",
        f"{m.total_fees:.2f}",
        note,
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", default="BTC/USDT")
    parser.add_argument("--bars", type=int, default=2000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--seeds", type=int, default=1,
                        help="跑幾組不同亂數的資料(>1 時輸出平均,檢查策略穩不穩)")
    parser.add_argument("--explain", metavar="策略代號",
                        help="逐筆印出該策略的判斷依據,其他策略不跑")
    args = parser.parse_args()

    cfg = load_config()
    headers = ["策略", "報酬", "最大回撤", "Sharpe", "成交數", "勝率", "獲利因子", "手續費", "說明"]

    if args.explain:
        entry = next((c for c in CONTENDERS if c[0] == args.explain), None)
        if entry is None:
            raise SystemExit(f"找不到策略 {args.explain!r};可選:"
                             + "、".join(c[0] for c in CONTENDERS))
        name, params, note = entry
        bars = list(SyntheticFeed(n_bars=args.bars, seed=args.seed).bars(args.symbol))
        print(f"逐筆判斷過程:{name}({note}),{len(bars)} 根 K 線\n"
              f"{'=' * 60}")
        metrics, summary = run_one(name, params, bars, args.symbol, cfg, explain=True)
        print(f"\n{'=' * 60}")
        print(table(headers, [format_row(metrics, note)]))
        if summary:
            print("\n沒進場的原因統計(調參的第一線索):")
            for key, count in summary.items():
                print(f"  · {key}:{count} 次")
        return

    seeds = [args.seed + i for i in range(args.seeds)]
    print(f"資料:{args.bars} 根合成 K 線 × {len(seeds)} 組亂數,起始資金 {cfg.initial_cash:.0f}")
    print(f"成本:手續費 {cfg.taker_fee_rate:.2%}／筆,滑價 {cfg.slippage_rate:.2%}")
    print(f"風控(所有策略相同):單筆上限 {COMPARE_RISK.max_order_pct:.0%}、"
          f"持倉上限 {COMPARE_RISK.max_position_pct:.0%}\n")

    totals: dict[str, list[Metrics]] = {}
    summaries: dict[str, dict[str, int]] = {}
    hold_runs: list[Metrics] = []

    for seed in seeds:
        bars = list(SyntheticFeed(n_bars=args.bars, seed=seed).bars(args.symbol))
        hold_runs.append(buy_and_hold(bars, cfg))
        for name, params, _ in CONTENDERS:
            metrics, summary = run_one(name, params, bars, args.symbol, cfg, explain=False)
            totals.setdefault(name, []).append(metrics)
            if summary:
                summaries[name] = summary

    def averaged(runs: list[Metrics], label: str) -> Metrics:
        """多組資料時把指標平均起來,單組時直接回傳原值。

        注意:回撤與 Sharpe 取「各組算完再平均」,不能把不同組的權益曲線
        接在一起算——那會憑空產生跨組的假跳空。所以這裡的 equity_curve 留空,
        呼叫端自己對 runs 取平均。
        """
        if len(runs) == 1:
            return runs[0]
        return Metrics(
            label=label, initial_equity=runs[0].initial_equity,
            final_equity=sum(r.final_equity for r in runs) / len(runs),
            n_fills=round(sum(r.n_fills for r in runs) / len(runs)),
            n_rejections=round(sum(r.n_rejections for r in runs) / len(runs)),
            total_fees=sum(r.total_fees for r in runs) / len(runs),
            round_trips=[t for r in runs for t in r.round_trips],
            equity_curve=[], bar_seconds=BAR_SECONDS,
        )

    rows = []
    hold = averaged(hold_runs, "buy_and_hold")
    if len(seeds) == 1:
        rows.append(format_row(hold, "基準:買進後抱著"))
    else:
        rows.append([
            "buy_and_hold",
            f"{hold.total_return:+.2%}",
            f"{sum(r.max_drawdown for r in hold_runs) / len(hold_runs):.2%}",
            f"{sum(r.sharpe for r in hold_runs) / len(hold_runs):.2f}",
            "1", "—", "—", f"{hold.total_fees:.2f}", "基準:買進後抱著",
        ])

    for name, _, note in CONTENDERS:
        runs = totals[name]
        if len(seeds) == 1:
            rows.append(format_row(runs[0], note))
        else:
            avg = averaged(runs, name)
            pf = "∞" if avg.profit_factor == float("inf") else f"{avg.profit_factor:.2f}"
            rows.append([
                name,
                f"{avg.total_return:+.2%}",
                f"{sum(r.max_drawdown for r in runs) / len(runs):.2%}",
                f"{sum(r.sharpe for r in runs) / len(runs):.2f}",
                str(avg.n_fills),
                f"{avg.win_rate:.0%}" if avg.n_round_trips else "—",
                pf if avg.n_round_trips else "—",
                f"{avg.total_fees:.2f}",
                note,
            ])

    print(table(headers, rows))

    for name, summary in summaries.items():
        print(f"\n{name} 的自我說明:")
        for key, count in summary.items():
            print(f"  · {key}:{count} 次")

    print("\n提醒:這是合成資料,數字只證明「管線是通的」與「策略行為的差異」,"
          "\n不代表真實市場績效。換真實行情請用 --bars 搭配 ccxt 抓下來的資料重跑。")


if __name__ == "__main__":
    main()
