"""交易日誌:每筆成交與每次權益快照都寫入 JSONL,回測與實盤共用。"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from agent.models import Fill


class Journal:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _write(self, record: dict) -> None:
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    @staticmethod
    def _iso(ts: float) -> str:
        return dt.datetime.fromtimestamp(ts, dt.timezone.utc).isoformat()

    def log_fill(self, fill: Fill, reason: str, evidence: dict | None = None) -> None:
        self._write({
            "type": "fill",
            "time": self._iso(fill.timestamp),
            "symbol": fill.order.symbol,
            "side": fill.order.side.value,
            "qty": fill.order.qty,
            "price": fill.fill_price,
            "fee": fill.fee,
            "reason": reason,
            # 把判斷依據一起存下來,事後覆盤才知道當時憑什麼下這一單
            "evidence": evidence or {},
        })

    def log_rejection(self, symbol: str, reason: str, ts: float,
                      evidence: dict | None = None) -> None:
        self._write({
            "type": "reject",
            "time": self._iso(ts),
            "symbol": symbol,
            "reason": reason,
            "evidence": evidence or {},
        })

    def log_equity(self, equity: float, cash: float, ts: float) -> None:
        self._write({"type": "equity", "time": self._iso(ts), "equity": equity, "cash": cash})
