"""Token -> cost. Configurable weights so we match whatever the leaderboard counts
(remote-only by default; flip local weights on at kickoff if it counts total tokens).
"""
from __future__ import annotations

from core.config import CostCfg


def cost(lp: int, lc: int, rp: int, rc: int, w: CostCfg) -> float:
    return (w.w_local_prompt * lp + w.w_local_completion * lc
            + w.w_remote_prompt * rp + w.w_remote_completion * rc)


def baseline_all_remote(prompt_tokens: int, completion_tokens: int, w: CostCfg) -> float:
    """Cost if we had sent this straight to remote — the 'saved vs naive' yardstick."""
    return w.w_remote_prompt * prompt_tokens + w.w_remote_completion * completion_tokens
