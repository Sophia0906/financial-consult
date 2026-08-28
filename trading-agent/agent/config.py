"""讀取 config.toml 與環境變數。真錢模式採雙開關防呆。"""
from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path

ARM_LIVE_ENV = "TRADING_AGENT_ARM_LIVE"


@dataclass(frozen=True)
class RiskConfig:
    symbol_whitelist: tuple[str, ...]
    max_position_pct: float
    max_order_pct: float
    max_daily_loss_pct: float
    # 下單時替手續費與滑價預留的現金比例。沒有這個緩衝,一張用掉 100% 現金的
    # 買單在成交時會因為付不出手續費而被拒絕——實盤與模擬盤都一樣。
    cost_buffer_pct: float = 0.01


@dataclass(frozen=True)
class Config:
    mode: str  # paper / testnet / live
    initial_cash: float
    poll_interval_sec: float
    strategy_name: str
    strategy_params: dict
    risk: RiskConfig
    taker_fee_rate: float
    slippage_rate: float


def load_config(path: str | Path | None = None) -> Config:
    path = Path(path or Path(__file__).resolve().parent.parent / "config.toml")
    with open(path, "rb") as f:
        raw = tomllib.load(f)

    mode = raw["general"]["mode"]
    if mode not in ("paper", "testnet", "live"):
        raise ValueError(f"未知的 mode: {mode!r}(允許 paper/testnet/live)")
    if mode == "live" and os.environ.get(ARM_LIVE_ENV) != "1":
        raise RuntimeError(
            f"mode=live 但未設定環境變數 {ARM_LIVE_ENV}=1。"
            "真錢模式需要兩個開關同時打開,這是刻意的防呆設計。"
        )

    strat = dict(raw["strategy"])
    return Config(
        mode=mode,
        initial_cash=float(raw["general"]["initial_cash"]),
        poll_interval_sec=float(raw["general"]["poll_interval_sec"]),
        strategy_name=strat.pop("name"),
        strategy_params=strat,
        risk=RiskConfig(
            symbol_whitelist=tuple(raw["risk"]["symbol_whitelist"]),
            max_position_pct=float(raw["risk"]["max_position_pct"]),
            max_order_pct=float(raw["risk"]["max_order_pct"]),
            max_daily_loss_pct=float(raw["risk"]["max_daily_loss_pct"]),
            cost_buffer_pct=float(raw["risk"].get("cost_buffer_pct", 0.01)),
        ),
        taker_fee_rate=float(raw["fees"]["taker_fee_rate"]),
        slippage_rate=float(raw["fees"]["slippage_rate"]),
    )
