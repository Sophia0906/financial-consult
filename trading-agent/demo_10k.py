#!/usr/bin/env python3
"""把 10,000 美金交給 agent,一筆一筆看它怎麼動用你的錢。

這支程式是給「還不確定 agent 到底在幹嘛」的人看的:
同一台 agent、同一筆錢、同一段行情,只換掉裡面的「策略腦袋」,
看兩種腦袋分別怎麼花這 10,000 美金、最後剩多少。

用法:
    python3 demo_10k.py                       # sma_cross vs rule_stack
    python3 demo_10k.py --capital 5000        # 換本金
    python3 demo_10k.py --strategies grid rule_stack
"""
from __future__ import annotations

import argparse
import datetime as dt

from agent.brokers.paper import PaperBroker
from agent.config import load_config
from agent.data.feed import ListFeed, SyntheticFeed
from agent.journal import Journal
from agent.models import Bar, Side
from agent.risk import RiskManager
from agent.runner import Engine
from agent.strategy.registry import build_strategy
from agent.textui import table

# 給每個策略一句人話說明,免得只看代號不知道它在想什麼
BLURB = {
    "sma_cross": "腦袋很簡單:短期均線穿過長期均線就換邊,不設停損",
    "grid": "交易所現成機器人:把價格切成 10 層,跌一層買、漲一層賣",
    "rule_stack": "四個條件全過才進場,進場後帶停損與移動停利",
}


def money(x: float) -> str:
    return f"{x:,.2f}"


def trace_one(name: str, bars: list[Bar], symbol: str, cfg,
              capital: float, max_rows: int) -> dict:
    """跑一次回測,並把每筆成交的資金流還原成表格。"""
    strategy = build_strategy(name, {})
    broker = PaperBroker(capital, cfg.taker_fee_rate, cfg.slippage_rate)
    engine = Engine(
        strategy=strategy,
        risk=RiskManager(cfg.risk),
        broker=broker,
        journal=Journal(f"journal/demo_{name}.jsonl"),
        verbose=False,
    )
    engine.run(ListFeed(bars), symbol)

    # 依成交紀錄重算現金與持倉的變化(算法與 PaperBroker 內部一致)
    cash, qty, rows = capital, 0.0, []
    max_exposure = 0.0
    for i, fill in enumerate(engine.fills, 1):
        notional = fill.order.qty * fill.fill_price
        if fill.order.side == Side.BUY:
            delta = -(notional + fill.fee)
            qty += fill.order.qty
        else:
            delta = notional - fill.fee
            qty -= fill.order.qty
        cash += delta
        equity = cash + qty * fill.fill_price
        if equity > 0:
            max_exposure = max(max_exposure, qty * fill.fill_price / equity)
        rows.append([
            str(i),
            dt.datetime.fromtimestamp(fill.timestamp, dt.timezone.utc).strftime("%m-%d %H:%M"),
            "買入" if fill.order.side == Side.BUY else "賣出",
            money(fill.fill_price),
            f"{fill.order.qty:.5f}",
            f"{delta:+,.2f}",
            money(cash),
            money(qty * fill.fill_price),
            money(equity),
        ])

    return {
        "name": name,
        "rows": rows,
        "peak_exposure": max_exposure,
        "metrics": engine.metrics(label=name),
        "blocked": strategy.explain_summary(),
        "max_rows": max_rows,
    }


def print_trace(result: dict, capital: float) -> None:
    name, rows, m = result["name"], result["rows"], result["metrics"]
    print(f"\n{'━' * 78}")
    print(f"腦袋:{name} — {BLURB.get(name, '')}")
    print("━" * 78)

    if not rows:
        print("這段行情裡它一次都沒出手(條件從未同時成立),10,000 全程留在現金。")
    else:
        headers = ["#", "時間", "動作", "成交價", "數量",
                   "現金變動", "剩餘現金", "持倉市值", "總資產"]
        shown = rows[:result["max_rows"]]
        print(table(headers, shown))
        if len(rows) > len(shown):
            print(f"（中間省略 {len(rows) - len(shown)} 筆，完整紀錄見 "
                  f"journal/demo_{name}.jsonl）")

    profit = m.final_equity - capital
    print(f"\n最後結算:{money(capital)} → {money(m.final_equity)} "
          f"({profit:+,.2f},{m.total_return:+.2%})")
    print(f"  期間最慘的時候從高點回落 {m.max_drawdown:.2%}｜"
          f"買賣 {m.n_fills} 筆｜手續費吃掉 {money(m.total_fees)}")
    if m.n_round_trips:
        print(f"  完整來回 {m.n_round_trips} 次,其中賺錢的佔 {m.win_rate:.0%}")
    if m.n_rejections:
        print(f"  風控攔下 {m.n_rejections} 次(策略想買但超過上限)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--capital", type=float, default=10000.0)
    parser.add_argument("--symbol", default="BTC/USDT")
    parser.add_argument("--bars", type=int, default=400)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--rows", type=int, default=10, help="每個策略最多列幾筆交易")
    parser.add_argument("--strategies", nargs="+", default=["sma_cross", "rule_stack"])
    args = parser.parse_args()

    cfg = load_config()
    # 起始價設成接近真實 BTC 的量級,數量看起來才有感覺
    bars = list(SyntheticFeed(n_bars=args.bars, start_price=100_000.0,
                              seed=args.seed).bars(args.symbol))

    print(f"本金 {money(args.capital)} USDT｜標的 {args.symbol}｜"
          f"{args.bars} 根 1 小時 K 線(合成資料)")
    print(f"這段行情:起價 {money(bars[0].close)} → 收價 {money(bars[-1].close)}"
          f"({bars[-1].close / bars[0].close - 1:+.2%})")
    print(f"成本設定:每筆手續費 {cfg.taker_fee_rate:.2%}、滑價 {cfg.slippage_rate:.2%}")
    print(f"風控上限:單筆最多動用本金的 {cfg.risk.max_order_pct:.0%}"
          f"({money(args.capital * cfg.risk.max_order_pct)})、"
          f"同一標的最多持有 {cfg.risk.max_position_pct:.0%}"
          f"({money(args.capital * cfg.risk.max_position_pct)})")

    results = [trace_one(n, bars, args.symbol, cfg, args.capital, args.rows)
               for n in args.strategies]
    for r in results:
        print_trace(r, args.capital)

    # 基準線:什麼都不做,一開始全押然後抱著
    hold_qty = args.capital / (bars[0].close * (1 + cfg.slippage_rate)) * (1 - cfg.taker_fee_rate)
    hold_final = hold_qty * bars[-1].close

    print(f"\n{'━' * 78}")
    print("同一筆錢,不同做法")
    print("━" * 78)
    rows = [[
        "全押然後抱著不動", money(hold_final),
        f"{hold_final - args.capital:+,.2f}",
        f"{hold_final / args.capital - 1:+.2%}", "1", money(args.capital * cfg.taker_fee_rate),
    ]]
    for r in results:
        m = r["metrics"]
        rows.append([
            m.label, money(m.final_equity),
            f"{m.final_equity - args.capital:+,.2f}",
            f"{m.total_return:+.2%}", str(m.n_fills), money(m.total_fees),
        ])
    print(table(["做法", "最後剩下", "賺賠", "報酬率", "交易筆數", "手續費"], rows))

    peak = max((r["peak_exposure"] for r in results), default=0.0)
    if peak > 0:
        print(f"\n為什麼 agent 賺不到「抱著不動」那 {hold_final / args.capital - 1:+.2%}?")
        print(f"  風控規定單一標的最多持有 {cfg.risk.max_position_pct:.0%},實際上這兩個腦袋")
        print(f"  最多只讓 {peak:.0%} 的錢在市場裡,其餘 {1 - peak:.0%} 全程是現金——")
        print(f"  行情漲 {bars[-1].close / bars[0].close - 1:+.2%},它只吃得到其中一小塊,")
        print("  卻要為每次進出付手續費。這是「保守風控」的代價,不是策略壞掉。")
        print("  想讓它吃到更多漲幅,改 config.toml 的 max_position_pct 與 max_order_pct,")
        print("  但同樣的放大也會作用在虧損上。")

    for r in results:
        if r["blocked"]:
            print(f"\n{r['name']} 沒出手的原因:")
            for key, count in r["blocked"].items():
                print(f"  · {key}:{count} 次")

    print("\n※ 這是合成的假行情,用來看懂 agent 的運作方式,不是績效預測。")


if __name__ == "__main__":
    main()
