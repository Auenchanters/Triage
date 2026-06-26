"""Eval harness — the tuning loop.

  python -m eval.harness --config config/default.yaml

Runs the suite, prints accuracy + cost + route mix, sweeps the escalate_threshold to
find the cheapest operating point at/above the target accuracy, and writes traces to
results/ for the dashboard.
"""
from __future__ import annotations

import argparse
import dataclasses
import json
from pathlib import Path

from agent import runner
from core.build import build_router
from core.config import Config, load_config
from core.strategies.calibration import sweep
from tasks.suite import load_suite


def _run_at_threshold(cfg: Config, tasks) -> "tuple[float, float, runner.RunReport]":
    report = runner.run(build_router(cfg), tasks)
    return report.accuracy, report.total_cost, report


def calibrate(cfg: Config, tasks):
    cache = {}

    def run_at(t: float) -> tuple[float, float]:
        c = cfg.model_copy(deep=True)
        c.router.escalate_threshold = t
        c.cache.enabled = False  # isolate routing effect during the sweep
        acc, cost, _ = _run_at_threshold(c, tasks)
        cache[t] = (acc, cost)
        return acc, cost

    return sweep(run_at, cfg.calibration.sweep, cfg.calibration.target_accuracy)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=None)
    ap.add_argument("--no-calibrate", action="store_true")
    args = ap.parse_args()

    cfg = load_config(args.config)
    tasks = load_suite()

    report = runner.run(build_router(cfg), tasks)
    print(f"\n  tasks         {report.n_tasks}")
    print(f"  accuracy      {report.accuracy:.1%}  ({report.n_correct}/{report.n_tasks})")
    print(f"  total tokens  {report.total_tokens}   remote {report.remote_tokens}")
    print(f"  cost          {report.total_cost:.0f}  vs baseline {report.baseline_cost:.0f}"
          f"  -> saved {report.savings_pct:.1f}%")
    print(f"  compression   {cfg.compression.backend}: -{report.compression_saved_tokens} "
          f"prompt tokens on remote calls")
    print(f"  routes        {report.routes}")
    print(f"  avg latency   {report.avg_latency_ms:.0f} ms")

    calib = None
    if not args.no_calibrate:
        calib = calibrate(cfg, tasks)
        print("\n  threshold sweep (escalate_threshold -> accuracy, cost):")
        for p in calib.points:
            star = "  <= chosen" if calib.chosen and p.threshold == calib.chosen.threshold else ""
            print(f"    t={p.threshold:<5} acc={p.accuracy:.1%}  cost={p.cost:.0f}{star}")
        if calib.chosen:
            print(f"\n  >> operating point: escalate_threshold={calib.chosen.threshold} "
                  f"(acc {calib.chosen.accuracy:.1%} >= target {cfg.calibration.target_accuracy:.0%}, "
                  f"cost {calib.chosen.cost:.0f})")

    out_dir = Path(cfg.results_dir)
    out_dir.mkdir(exist_ok=True)
    payload = {
        "report": dataclasses.asdict(report),
        "calibration": _calib_json(calib) if calib else None,
        "config": cfg.model_dump(),
    }
    (out_dir / "latest.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\n  wrote {out_dir / 'latest.json'}\n")


def _calib_json(calib):
    return {
        "target_accuracy": calib.target_accuracy,
        "points": [dataclasses.asdict(p) for p in calib.points],
        "pareto": [dataclasses.asdict(p) for p in calib.pareto],
        "chosen": dataclasses.asdict(calib.chosen) if calib.chosen else None,
    }


if __name__ == "__main__":
    main()
