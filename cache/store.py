"""Exact + semantic answer cache. A hit returns a prior answer with zero remote
tokens — the cheapest possible route. In-memory; persistence isn't needed for a
single scored run.

ponytail: in-memory dict + linear semantic scan. Fine for a benchmark suite
(hundreds of tasks). Swap to sqlite/FAISS only if a run holds 10k+ entries.
"""
from __future__ import annotations

from typing import Optional

import numpy as np

from cache.embedder import cosine
from core.config import CacheCfg


class AnswerCache:
    def __init__(self, cfg: CacheCfg, embedder=None):
        self.cfg = cfg
        self.embedder = embedder
        self._exact: dict[str, str] = {}
        self._keys: list[str] = []
        self._vecs: list[np.ndarray] = []
        self._answers: list[str] = []

    def get(self, query: str) -> Optional[str]:
        if not self.cfg.enabled:
            return None
        if query in self._exact:
            return self._exact[query]
        if self.cfg.semantic and self.embedder and self._vecs:
            v = self.embedder.embed(query)
            sims = [cosine(v, w) for w in self._vecs]
            i = int(np.argmax(sims))
            if sims[i] >= self.cfg.threshold:
                return self._answers[i]
        return None

    def put(self, query: str, answer: str) -> None:
        if not self.cfg.enabled:
            return
        self._exact[query] = answer
        if self.cfg.semantic and self.embedder:
            self._keys.append(query)
            self._vecs.append(self.embedder.embed(query))
            self._answers.append(answer)
