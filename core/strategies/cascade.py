"""Turn (predicted difficulty, local confidence) into a routing plan.

Stage 1 (pre-execution): clearly-easy -> try local; clearly-hard -> remote now.
Stage 2 (post local attempt): accept local only if confidence clears the
escalate_threshold — the single knob the calibrator tunes.
"""
from __future__ import annotations

from dataclasses import dataclass

from core.config import RouterCfg


@dataclass
class Plan:
    try_local: bool       # attempt local first?
    reason: str


def pre_plan(predicted_difficulty: float, cfg: RouterCfg) -> Plan:
    if predicted_difficulty >= cfg.hard_threshold:
        return Plan(try_local=False, reason="predicted-hard")
    if predicted_difficulty <= cfg.easy_threshold:
        return Plan(try_local=True, reason="predicted-easy")
    return Plan(try_local=True, reason="uncertain-gate")


def accept_local(confidence: float, cfg: RouterCfg) -> bool:
    return confidence >= cfg.escalate_threshold
