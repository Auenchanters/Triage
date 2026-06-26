"""Prove each routing path on crafted edge cases. Deterministic (mock seeded by id)."""
from __future__ import annotations

from core.build import build_router
from core.config import Config
from tasks.edge_cases import load_edge_cases


def _routes():
    r = build_router(Config())
    return {t.id: r.run(t) for t in load_edge_cases()}  # one router -> cache persists


def test_short_but_hard_is_caught_by_confidence_gate():
    d = _routes()["e000"]
    assert d.escalated and d.route == "local->remote"      # looked easy, confidence saved us


def test_long_but_easy_is_not_over_escalated():
    d = _routes()["e001"]
    assert d.route == "local"                              # dressed-up trivial stays cheap
    assert d.remote_tokens == 0


def test_clearly_hard_skips_local_and_pre_routes_to_remote():
    d = _routes()["e002"]
    assert d.predicted_difficulty >= 0.80
    assert d.route == "remote" and not d.escalated         # no wasted local attempt
    assert d.local_prompt_tokens == 0


def test_repeat_query_is_a_cache_hit():
    d = _routes()["e006"]                                  # identical to e005
    assert d.cache_hit and d.route == "cache" and d.cost == 0.0


def test_compression_fires_on_verbose_remote_tasks():
    routes = _routes()
    assert sum(d.compression_saved_tokens for d in routes.values()) > 0
