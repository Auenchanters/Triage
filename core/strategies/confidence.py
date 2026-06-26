"""Adequacy of a local answer in [0,1]. Uses, in order of availability:
provider confidence (mock), mean-token-prob from logprobs (real), then a format
penalty for empty/hedging answers. Self-eval (a second cheap local call) is left as
a hook — it costs tokens, so only worth it if the sweep shows confidence is weak.
"""
from __future__ import annotations

import re

from core.types import ChatResult

_HEDGE = re.compile(r"\b(i('| a)m not sure|i don'?t know|it depends|unknown|cannot determine)\b", re.I)


def score(result: ChatResult) -> float:
    base = result.confidence
    if base is None and result.logprob is not None:
        # logprob already mapped to prob in real provider; clamp defensively
        base = max(0.0, min(1.0, pow(2.718281828, result.logprob)))
    if base is None:
        base = 0.5  # no signal -> neutral; cascade will lean on predicted difficulty

    text = (result.text or "").strip()
    if not text:
        return 0.0
    if _HEDGE.search(text):
        base *= 0.4
    return max(0.0, min(1.0, base))
