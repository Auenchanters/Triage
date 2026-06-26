"""Simulated provider so the whole pipeline + dashboard run offline before kickoff.

It reads task hints from `context` (gold + difficulty) to *simulate* a model of a
given competence: it returns the right answer with prob = competence(difficulty),
otherwise a distractor, and reports a confidence that correlates with correctness
(plus noise) so threshold calibration is meaningful. Deterministic per task id, so
a sweep over the same suite is stable.

ponytail: this is a dev/demo oracle by design — on launch day it's replaced by
fireworks.py / local.py via config, no core changes.
"""
from __future__ import annotations

import random
from typing import Any, Optional

from core.types import ChatResult, Message
from providers.base import ChatProvider, approx_tokens


class MockProvider(ChatProvider):
    def __init__(self, name: str, model: str, competence_easy: float,
                 competence_hard: float, base_latency_ms: float):
        self.name = name
        self.model = model
        self.competence_easy = competence_easy
        self.competence_hard = competence_hard
        self.base_latency_ms = base_latency_ms

    def _competence(self, difficulty: float) -> float:
        # linear interp easy(0.0) -> hard(1.0)
        return self.competence_easy + (self.competence_hard - self.competence_easy) * difficulty

    def chat(self, messages, *, max_tokens=256, stop=None, temperature=0.0,
             context: Optional[dict[str, Any]] = None) -> ChatResult:
        ctx = context or {}
        gold = str(ctx.get("gold", ""))
        difficulty = float(ctx.get("difficulty", 0.5))
        task_id = str(ctx.get("task_id", ""))

        rng = random.Random(f"{self.name}:{task_id}")
        p = self._competence(difficulty)
        correct = rng.random() < p
        text = gold if correct else _distractor(gold, rng)

        # confidence tracks competence with noise; informative but imperfect.
        conf = max(0.0, min(1.0, p + rng.gauss(0.0, 0.12)))

        prompt_tokens = sum(approx_tokens(m.content) for m in messages)
        completion_tokens = max(1, min(max_tokens, approx_tokens(text)))
        latency = self.base_latency_ms * (1.0 + 0.5 * difficulty)
        return ChatResult(
            text=text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency,
            provider=self.name,
            model=self.model,
            confidence=conf,
        )


def _distractor(gold: str, rng: random.Random) -> str:
    if gold.strip().lstrip("-").isdigit():
        return str(int(gold) + rng.choice([-2, -1, 1, 2, 10]))
    pool = ["I'm not sure.", "It depends.", gold[::-1] if gold else "unknown",
            "approximately " + gold, "none of these"]
    return rng.choice(pool)
