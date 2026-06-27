"""Self-consistency vote over several local samples (Wang et al., 2022).

When the first local answer is low-confidence, the router draws a few more local
samples and calls `vote`. Strong agreement means the small local model is stable
on this query -> accept it and skip the remote call (saves remote tokens). Weak
agreement means it's genuinely unsure -> escalate. The agreement ratio is what
stops us from accepting a confidently-wrong answer on a truly hard task: there,
independent wrong draws scatter across different distractors and never agree.
"""
from __future__ import annotations

import re
from collections import Counter

from core.types import ChatResult

_PUNCT = re.compile(r"[^\w\s]")


def _norm(s: str) -> str:
    return _PUNCT.sub("", (s or "").lower()).strip()


def vote(samples: list[ChatResult]) -> tuple[str, float, float]:
    """Return (majority_text, agreement_ratio, mean_confidence_of_majority).

    agreement_ratio = share of samples whose normalized text equals the majority.
    The returned text is the original (un-normalized) text of the majority bucket.
    """
    if not samples:
        return "", 0.0, 0.0
    keys = [_norm(s.text) for s in samples]
    top_key, top_n = Counter(keys).most_common(1)[0]
    agreement = top_n / len(samples)
    members = [s for s, k in zip(samples, keys) if k == top_key]
    text = members[0].text if members else samples[0].text
    confs = [s.confidence for s in members if s.confidence is not None]
    mean_conf = sum(confs) / len(confs) if confs else 0.0
    return text, agreement, mean_conf


if __name__ == "__main__":
    # ponytail: one self-check — agreement gate must separate stable from scattered.
    def R(t, c=0.5):
        return ChatResult(text=t, prompt_tokens=0, completion_tokens=0,
                          latency_ms=0.0, provider="mock", model="m", confidence=c)

    txt, agr, _ = vote([R("Paris"), R("Paris"), R("paris."), R("Lyon")])
    assert _norm(txt) == "paris" and abs(agr - 0.75) < 1e-9, (txt, agr)

    txt, agr, _ = vote([R("2"), R("5"), R("8"), R("13")])
    assert agr == 0.25, agr  # scattered -> low agreement -> would escalate

    assert vote([]) == ("", 0.0, 0.0)
    print("verify.py OK")
