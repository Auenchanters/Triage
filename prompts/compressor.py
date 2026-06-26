"""Pluggable prompt compression — applied ONLY to the billed remote path, and only
to context (system + few-shot), never the question, so it can't corrupt the task.

Backends:
- none       passthrough
- heuristic  zero-dep filler/whitespace stripping. Works offline, small but real
             savings, fully deterministic. Tested.
- llmlingua  Microsoft LLMLingua-2 (task-agnostic, 2-5x). Lazy import; runs the small
             scorer locally (AMD GPU at kickoff). Off until the sweep shows it helps.
- headroom   headroom-ai reversible prefix/cache-stabilizing compression. Lazy import.

All gated by `min_tokens`: short prompts are returned untouched (compression can't
help there and risks accuracy).
"""
from __future__ import annotations

import re
from typing import Protocol

from core.types import Message
from providers.base import approx_tokens

_WS = re.compile(r"\s+")
# Conservative filler removal — safe on instructions, preserves meaning.
_DROP = re.compile(
    r"\b(please|kindly|just|really|very|basically|actually|simply|"
    r"that is to say|needless to say|it is important that|make sure to)\b", re.I)
_REPLACE = [
    (re.compile(r"\bin order to\b", re.I), "to"),
    (re.compile(r"\bas well as\b", re.I), "and"),
    (re.compile(r"\bdue to the fact that\b", re.I), "because"),
    (re.compile(r"\bat this point in time\b", re.I), "now"),
    (re.compile(r"\ba number of\b", re.I), "several"),
]


class Compressor(Protocol):
    name: str
    def compress(self, text: str) -> str: ...


class NoCompressor:
    name = "none"
    def compress(self, text: str) -> str:
        return text


class HeuristicCompressor:
    name = "heuristic"

    def __init__(self, min_tokens: int = 40):
        self.min_tokens = min_tokens

    def compress(self, text: str) -> str:
        if approx_tokens(text) < self.min_tokens:
            return text
        out = text
        for pat, rep in _REPLACE:
            out = pat.sub(rep, out)
        out = _DROP.sub("", out)
        out = _WS.sub(" ", out).strip()
        out = re.sub(r"\s+([,.;:!?])", r"\1", out)  # tidy punctuation spacing
        return out


class LLMLinguaCompressor:
    """Microsoft LLMLingua-2. Lazy import so offline dev needs no torch."""
    name = "llmlingua"

    def __init__(self, min_tokens: int = 40, rate: float = 0.5,
                 model: str = "microsoft/llmlingua-2-xlm-roberta-large-meetingbank"):
        from llmlingua import PromptCompressor  # heavy; only when selected
        self.min_tokens = min_tokens
        self.rate = rate
        self._pc = PromptCompressor(model_name=model, use_llmlingua2=True)

    def compress(self, text: str) -> str:
        if approx_tokens(text) < self.min_tokens:
            return text
        return self._pc.compress_prompt(text, rate=self.rate)["compressed_prompt"]


class HeadroomCompressor:
    """headroom-ai reversible, cache-stabilizing compression. Lazy import."""
    name = "headroom"

    def __init__(self, min_tokens: int = 40):
        from headroom import Headroom  # lazy
        self.min_tokens = min_tokens
        self._hr = Headroom()

    def compress(self, text: str) -> str:
        if approx_tokens(text) < self.min_tokens:
            return text
        return self._hr.compress(text).text


def build_compressor(backend: str, min_tokens: int = 40, rate: float = 0.5) -> Compressor:
    if backend == "none":
        return NoCompressor()
    if backend == "heuristic":
        return HeuristicCompressor(min_tokens)
    if backend == "llmlingua":
        return LLMLinguaCompressor(min_tokens, rate)
    if backend == "headroom":
        return HeadroomCompressor(min_tokens)
    raise ValueError(f"unknown compression backend: {backend!r}")


def apply_compression(messages: list[Message], compressor: Compressor) -> tuple[list[Message], int]:
    """Compress every message except the final user question. Returns the new
    messages and the number of prompt tokens saved."""
    if not messages or compressor.name == "none":
        return messages, 0
    out: list[Message] = []
    saved = 0
    for i, m in enumerate(messages):
        if i == len(messages) - 1:        # protect the actual question
            out.append(m)
            continue
        c = compressor.compress(m.content)
        saved += max(0, approx_tokens(m.content) - approx_tokens(c))
        out.append(Message(m.role, c))
    return out, saved
