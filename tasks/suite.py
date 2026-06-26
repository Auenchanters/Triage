"""The demo/eval suite = sample tasks + edge cases. The harness and dashboard run
this; on launch day, swap in the adapter that loads the revealed tasks instead.
"""
from __future__ import annotations

from core.types import Task
from tasks.edge_cases import load_edge_cases
from tasks.samples import load_tasks


def load_suite() -> list[Task]:
    return load_tasks() + load_edge_cases()
