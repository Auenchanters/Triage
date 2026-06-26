"""Runnable self-check — no network. `pytest` (or `python tests/test_router.py`).

Guards the logic that actually moves the leaderboard: difficulty heuristics,
evaluators, the cascade gate, calibration picking the cheapest feasible point, the
cache zeroing remote cost, and a full mock suite run that must save tokens while
staying accurate.
"""
from __future__ import annotations

from agent import runner
from core.build import build_router
from core.config import Config
from core.strategies import calibration, predictive
from core.strategies.cascade import Plan, accept_local, pre_plan
from core.types import Task
from tasks.evaluators import evaluate
from tasks.samples import load_tasks


def test_predictive_orders_difficulty():
    easy = predictive.estimate_difficulty("What is the capital of France?")
    hard = predictive.estimate_difficulty(
        "Prove step by step why the sum of the first n odd numbers is n squared and analyze the trade-offs.")
    assert easy < 0.3 < hard


def test_evaluators():
    assert evaluate("exact", "Paris", "paris")
    assert evaluate("numeric", "the answer is 42", 42)
    assert not evaluate("numeric", "no number here", 42)
    assert evaluate("boolean", "Yes", "true")
    assert evaluate("f1", "William Shakespeare wrote it", "William Shakespeare")


def test_cascade_gate():
    cfg = Config()
    assert pre_plan(0.95, cfg.router).try_local is False      # clearly hard -> remote
    assert pre_plan(0.05, cfg.router).try_local is True       # clearly easy -> local
    assert accept_local(0.9, cfg.router) is True
    assert accept_local(0.1, cfg.router) is False


def test_calibration_picks_cheapest_feasible():
    # synthetic: higher threshold -> more escalation -> higher accuracy AND higher cost
    def run_at(t):
        accuracy = 0.80 + 0.4 * t          # crosses 0.90 around t=0.25
        cost = 100 * t
        return min(accuracy, 1.0), cost

    res = calibration.sweep(run_at, [0.0, 0.1, 0.2, 0.3, 0.5, 0.9], target_accuracy=0.90)
    assert res.chosen is not None
    assert res.chosen.accuracy >= 0.90
    # cheapest feasible, not the most accurate
    assert res.chosen.cost == min(p.cost for p in res.points if p.accuracy >= 0.90)
    assert res.pareto, "pareto frontier should be non-empty"


def test_end_to_end_saves_tokens_and_stays_accurate():
    report = runner.run(build_router(Config()), load_tasks())
    assert report.n_tasks > 20
    assert report.accuracy >= 0.6                    # mock routing keeps quality up
    assert report.total_cost < report.baseline_cost  # ... while spending fewer remote tokens
    assert report.savings_pct > 0
    assert "local" in report.routes                  # the cheap path is actually used


def test_heuristic_compressor_shrinks_long_context_safely():
    from prompts.compressor import HeuristicCompressor, apply_compression
    from providers.base import approx_tokens
    from core.types import Message

    c = HeuristicCompressor(min_tokens=40)
    short = "What is 2 + 2?"
    assert c.compress(short) == short                       # below gate -> untouched

    verbose = ("Please make sure to read this very carefully in order to answer, "
               "due to the fact that it is important that you respond. " * 3) + "Capital of Italy is Rome."
    out = c.compress(verbose)
    assert approx_tokens(out) < approx_tokens(verbose)       # actually smaller
    assert "Rome" in out and "Italy" in out                  # content preserved

    msgs = [Message("system", verbose), Message("user", "What is the capital of Italy?")]
    new, saved = apply_compression(msgs, c)
    assert saved > 0
    assert new[-1].content == "What is the capital of Italy?"  # question never touched


def test_compression_cuts_remote_tokens_without_hurting_accuracy():
    from core.config import Config
    none_cfg = Config(); none_cfg.compression.backend = "none"
    comp_cfg = Config(); comp_cfg.compression.backend = "heuristic"
    a = runner.run(build_router(none_cfg), load_tasks())
    b = runner.run(build_router(comp_cfg), load_tasks())
    assert b.remote_tokens < a.remote_tokens                 # fewer billed tokens
    assert b.compression_saved_tokens > 0
    assert b.accuracy >= a.accuracy                          # no accuracy regression


def test_cache_zeroes_remote_cost_on_repeat():
    router = build_router(Config())
    t = Task(id="x", query="What is the capital of France?", gold="Paris", type="exact",
             difficulty=0.05)
    first = router.run(t)
    second = router.run(t)                            # identical query -> cache hit
    assert second.cache_hit is True
    assert second.cost == 0.0
    assert second.route == "cache"
    _ = first


if __name__ == "__main__":
    import sys
    import traceback

    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"  ok   {fn.__name__}")
        except Exception:
            failed += 1
            print(f"  FAIL {fn.__name__}")
            traceback.print_exc()
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    sys.exit(1 if failed else 0)
