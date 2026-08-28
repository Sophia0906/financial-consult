"""終端機表格輸出:處理中日韓全形字的寬度對齊。

Python 的 str.ljust 算的是「字元數」,但中文字在終端機佔兩格寬,
直接用 ljust 排出來的表格會歪掉,所以這裡自己算顯示寬度。
"""
from __future__ import annotations

import unicodedata


def width(text: str) -> int:
    """字串在等寬終端機裡實際佔幾格。"""
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in text)


def pad(text: str, target: int, align: str = "left") -> str:
    gap = " " * max(0, target - width(text))
    return gap + text if align == "right" else text + gap


def table(headers: list[str], rows: list[list[str]],
          aligns: list[str] | None = None) -> str:
    """第一欄靠左、其餘靠右(數字對齊比較好讀),可用 aligns 覆寫。"""
    if aligns is None:
        aligns = ["left"] + ["right"] * (len(headers) - 1)
    widths = [
        max([width(h)] + [width(r[i]) for r in rows])
        for i, h in enumerate(headers)
    ]
    lines = ["  ".join(pad(h, widths[i], aligns[i]) for i, h in enumerate(headers))]
    lines.append("  ".join("─" * w for w in widths))
    for row in rows:
        lines.append("  ".join(pad(c, widths[i], aligns[i]) for i, c in enumerate(row)))
    return "\n".join(lines)
