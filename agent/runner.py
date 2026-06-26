"""Run a task suite through the router, score correctness, and aggregate the numbers
the leaderboard + dashboard care about. `iter_decisions` streams per-task results for
the live websocket; `run` returns the full report.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Iterator

from core.router import Router
from core.types import Decision, Task
from tasks.evaluators import evaluate


@dataclass
class RunReport:
    accuracy: float
    total_tokens: int
    remote_tokens: int
    total_cost: float
    baseline_cost: float
    savings_pct: float
    compression_saved_tokens: int
    avg_latency_ms: float
    routes: dict[str, int]
    n_correct: int
    n_tasks: int
    decisions: list[dict] = field(default_factory=list)


def iter_decisions(router: Router, tasks: list[Task]) -> Iterator[Decision]:
    for task in tasks:
        d = router.run(task)
        d.correct = evaluate(task.type, d.answer, task.gold)
        yield d


def run(router: Router, tasks: list[Task]) -> RunReport:
    decisions = list(iter_decisions(router, tasks))
    n = len(decisions)
    n_correct = sum(1 for d in decisions if d.correct)
    total_cost = sum(d.cost for d in decisions)
    baseline = sum(d.baseline_cost for d in decisions)
    return RunReport(
        accuracy=n_correct / n if n else 0.0,
        total_tokens=sum(d.total_tokens for d in decisions),
        remote_tokens=sum(d.remote_tokens for d in decisions),
        total_cost=total_cost,
        baseline_cost=baseline,
        savings_pct=(1 - total_cost / baseline) * 100 if baseline else 0.0,
        compression_saved_tokens=sum(d.compression_saved_tokens for d in decisions),
        avg_latency_ms=sum(d.latency_ms for d in decisions) / n if n else 0.0,
        routes=dict(Counter(d.route for d in decisions)),
        n_correct=n_correct,
        n_tasks=n,
        decisions=[d.as_dict() for d in decisions],
    )
