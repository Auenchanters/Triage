"""The winning lever: sweep the escalate_threshold and pick the operating point
that MINIMIZES cost subject to accuracy >= target. Also returns the Pareto frontier
(cost vs accuracy) for the dashboard.

`run_at(threshold) -> (accuracy, cost)` is injected by the harness so this stays
pure and unit-testable.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass
class SweepPoint:
    threshold: float
    accuracy: float
    cost: float


@dataclass
class CalibrationResult:
    points: list[SweepPoint]
    pareto: list[SweepPoint]
    chosen: SweepPoint | None
    target_accuracy: float


def sweep(run_at: Callable[[float], tuple[float, float]],
          thresholds: list[float], target_accuracy: float) -> CalibrationResult:
    points = [SweepPoint(t, *run_at(t)) for t in thresholds]

    feasible = [p for p in points if p.accuracy >= target_accuracy]
    chosen = min(feasible, key=lambda p: p.cost) if feasible else None
    # fall back to the most accurate point if nothing clears the bar
    if chosen is None and points:
        chosen = max(points, key=lambda p: p.accuracy)

    return CalibrationResult(
        points=points,
        pareto=_pareto(points),
        chosen=chosen,
        target_accuracy=target_accuracy,
    )


def _pareto(points: list[SweepPoint]) -> list[SweepPoint]:
    """Non-dominated set: no other point is both cheaper AND more accurate."""
    out = []
    for p in points:
        if not any(o is not p and o.cost <= p.cost and o.accuracy >= p.accuracy
                   and (o.cost < p.cost or o.accuracy > p.accuracy) for o in points):
            out.append(p)
    return sorted(out, key=lambda p: p.cost)
