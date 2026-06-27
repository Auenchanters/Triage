"""Guards the two leaderboard-moving additions: the graded (easy/medium/hard)
suite with per-tier accuracy, and self-consistency that must cut remote tokens
WITHOUT letting accuracy fall. Run via `pytest` or `python -m tests.test_tiers`.
"""
from __future__ import annotations

import agent.runner as runner
from core.build import build_router
from core.config import Config
from core.strategies.verify import vote
from core.types import ChatResult
from tasks.suite import load_suite
from tasks.tiers import load_tiers


def _R(text, conf=0.5):
    return ChatResult(text=text, prompt_tokens=0, completion_tokens=0,
                      latency_ms=0.0, provider="mock", model="m", confidence=conf)


def test_tiers_populate_all_three_buckets():
    tiers = load_tiers()
    seen = {t.meta["tier"] for t in tiers}
    assert seen == {"easy", "medium", "hard"}
    assert len([t for t in tiers if t.meta["tier"] == "hard"]) >= 6


def test_report_has_per_tier_accuracy():
    report = runner.run(build_router(Config()), load_suite())
    for tier in ("easy", "medium", "hard"):
        st = report.tier_stats[tier]
        assert st["n"] > 0 and 0.0 <= st["accuracy"] <= 1.0
    # decisions are tagged with a tier so the dashboard can filter
    assert all("tier" in d for d in report.decisions)


def test_vote_separates_stable_from_scattered():
    _, agree_hi, _ = vote([_R("Paris"), _R("Paris"), _R("Paris")])
    _, agree_lo, _ = vote([_R("2"), _R("5"), _R("8")])
    assert agree_hi == 1.0 and agree_lo < 0.5


def test_self_consistency_saves_remote_without_dropping_accuracy():
    tasks = load_suite()
    base = runner.run(build_router(Config()), tasks)

    cfg = Config()
    cfg.router.self_consistency_samples = 3
    cfg.router.consistency_accept = 0.75  # unanimous at K=3
    sc = runner.run(build_router(cfg), tasks)

    assert sc.remote_tokens < base.remote_tokens          # cheaper
    assert sc.accuracy >= base.accuracy                   # accuracy held (the hard rule)
    assert sc.tier_stats["hard"]["accuracy"] >= base.tier_stats["hard"]["accuracy"]


if __name__ == "__main__":
    import sys
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"ok  {fn.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {fn.__name__}: {e}")
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    sys.exit(1 if failed else 0)
