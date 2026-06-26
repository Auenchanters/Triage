"""Correctness check per task type. Add a real-task evaluator here on launch day if
the revealed tasks need one; the router/harness don't change.
"""
from __future__ import annotations

import json
import re
from typing import Any, Callable

_PUNCT = re.compile(r"[^\w\s]")


def _norm(s: str) -> str:
    return _PUNCT.sub("", s.lower()).strip()


def exact(pred: str, gold: Any) -> bool:
    return _norm(pred) == _norm(str(gold))


def boolean(pred: str, gold: Any) -> bool:
    p = _norm(pred)
    g = _norm(str(gold))
    truthy = {"true", "yes", "1", "correct"}
    falsy = {"false", "no", "0", "incorrect"}
    pv = p in truthy if p in truthy | falsy else None
    gv = g in truthy
    return pv is not None and pv == gv


def numeric(pred: str, gold: Any) -> bool:
    m = re.search(r"-?\d+(\.\d+)?", pred)
    if not m:
        return False
    try:
        return abs(float(m.group()) - float(gold)) < 1e-6
    except ValueError:
        return False


def f1(pred: str, gold: Any) -> bool:
    """Token-F1 >= 0.6 counts as correct (SQuAD-style, thresholded to a bool)."""
    p, g = set(_norm(pred).split()), set(_norm(str(gold)).split())
    if not p or not g:
        return False
    inter = len(p & g)
    if inter == 0:
        return False
    prec, rec = inter / len(p), inter / len(g)
    return (2 * prec * rec / (prec + rec)) >= 0.6


def json_match(pred: str, gold: Any) -> bool:
    try:
        return json.loads(pred) == (gold if not isinstance(gold, str) else json.loads(gold))
    except (json.JSONDecodeError, TypeError):
        return False


EVALUATORS: dict[str, Callable[[str, Any], bool]] = {
    "exact": exact,
    "boolean": boolean,
    "numeric": numeric,
    "f1": f1,
    "json": json_match,
}


def evaluate(task_type: str, pred: str, gold: Any) -> bool:
    return EVALUATORS.get(task_type, exact)(pred, gold)
