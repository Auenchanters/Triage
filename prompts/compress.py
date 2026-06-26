"""Token minimization on every remote call. Each remote token is scored, so:
- compress the system prompt,
- add few-shot examples only when difficulty warrants them,
- budget completion length by task type.
"""
from __future__ import annotations

import re

from core.types import Message, Task

# Terse default. Tasks may override with their own system prompt.
_DEFAULT_SYSTEM = "Answer concisely and exactly. No preamble. Output only the answer."

_WS = re.compile(r"\s+")


def compress_system(text: str | None) -> str:
    s = text or _DEFAULT_SYSTEM
    return _WS.sub(" ", s).strip()


def budget_max_tokens(task_type: str) -> int:
    return {
        "exact": 24,
        "numeric": 12,
        "boolean": 4,
        "json": 256,
        "f1": 96,
    }.get(task_type, 128)


def build_messages(task: Task, *, include_few_shot: bool) -> list[Message]:
    msgs: list[Message] = [Message("system", compress_system(task.system))]
    if include_few_shot and task.few_shot:
        for q, a in task.few_shot:
            msgs.append(Message("user", q))
            msgs.append(Message("assistant", a))
    msgs.append(Message("user", task.query))
    return msgs


def stop_for(task_type: str) -> list[str] | None:
    if task_type in ("exact", "numeric", "boolean"):
        return ["\n"]
    return None
