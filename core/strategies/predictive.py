"""Pre-execution difficulty estimate. Cheap heuristics route the obvious cases
without wasting a local attempt on a clearly-hard task. A learned classifier can
drop in behind the same `estimate` signature on launch day if the sweep shows the
heuristic leaves tokens on the table.
"""
from __future__ import annotations

import re

_MATH = re.compile(r"[0-9]|[+\-*/=^%]|\b(sum|product|integral|derivative|prove|solve)\b", re.I)
_CODE = re.compile(r"```|def |class |function |import |SELECT |\bregex\b", re.I)
_MULTISTEP = re.compile(r"\b(step by step|reason|explain why|justify|derive|multi-?step|"
                        r"compare|trade-?off|analyze)\b", re.I)
_EASY = re.compile(r"\b(what is|who is|capital of|define|translate|spell|true or false)\b", re.I)


def estimate_difficulty(query: str) -> float:
    """Return difficulty in [0,1] from surface features."""
    q = query.strip()
    n_words = len(q.split())

    score = 0.0
    score += min(n_words / 80.0, 0.35)            # long prompts trend harder
    if _MATH.search(q):
        score += 0.20
    if _CODE.search(q):
        score += 0.25
    if _MULTISTEP.search(q):
        score += 0.30
    if q.count("?") > 1:
        score += 0.10
    if _EASY.search(q) and n_words < 16:
        score -= 0.30                              # short factual lookups are easy

    return max(0.0, min(1.0, score))
