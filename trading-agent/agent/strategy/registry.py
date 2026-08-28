"""策略註冊表:用名字建立策略實例。新增策略只要在這裡登記一行。"""
from __future__ import annotations

from agent.strategy.base import Strategy
from agent.strategy.grid import GridBot
from agent.strategy.mean_reversion import MeanReversion
from agent.strategy.rule_stack import RuleStack
from agent.strategy.sma_cross import SmaCross

STRATEGIES: dict[str, type[Strategy]] = {
    SmaCross.name: SmaCross,
    GridBot.name: GridBot,
    MeanReversion.name: MeanReversion,
    RuleStack.name: RuleStack,
}


def build_strategy(name: str, params: dict | None = None) -> Strategy:
    if name not in STRATEGIES:
        known = "、".join(STRATEGIES)
        raise ValueError(f"未知策略 {name!r};可用的有:{known}")
    return STRATEGIES[name](**(params or {}))
