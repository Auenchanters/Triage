"""Run a task suite through the router, score correctness, and aggregate the numbers
the leaderboard + dashboard care about. `run` returns the full report.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

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
    # per-tier accuracy: {"easy": {"n", "n_correct", "accuracy"}, ...}
    tier_stats: dict[str, dict] = field(default_factory=dict)


def tier_of(task: Task) -> str:
    """Difficulty bucket. Honors an explicit meta['tier'] (the graded suite),
    otherwise derives it from ground-truth difficulty."""
    t = task.meta.get("tier")
    if t in ("easy", "medium", "hard"):
        return t
    d = task.difficulty
    return "easy" if d < 0.34 else "medium" if d < 0.67 else "hard"


def decision_dict(task: Task, d: Decision) -> dict:
    """Decision as a dict, tagged with its difficulty tier for the dashboard filter."""
    dd = d.as_dict()
    dd["tier"] = tier_of(task)
    return dd


def _tier_stats(pairs: list[tuple[Task, Decision]]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for task, d in pairs:
        st = out.setdefault(tier_of(task), {"n": 0, "n_correct": 0, "accuracy": 0.0})
        st["n"] += 1
        st["n_correct"] += int(bool(d.correct))
    for st in out.values():
        st["accuracy"] = st["n_correct"] / st["n"] if st["n"] else 0.0
    return out


def run(router: Router, tasks: list[Task]) -> RunReport:
    pairs: list[tuple[Task, Decision]] = []
    for task in tasks:
        d = router.run(task)
        d.correct = evaluate(task.type, d.answer, task.gold)
        pairs.append((task, d))
    decisions = [d for _, d in pairs]
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
        decisions=[decision_dict(t, d) for t, d in pairs],
        tier_stats=_tier_stats(pairs),
    )
