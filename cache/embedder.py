"""Embeddings for the semantic cache + (optional) kNN difficulty. A deterministic
hashing embedder keeps offline dev network-free; swap to fireworks/local at kickoff.
"""
from __future__ import annotations

import hashlib
import re

import numpy as np

from core.config import EmbeddingsCfg

_DIM = 256
_TOK = re.compile(r"[a-z0-9]+")


class HashEmbedder:
    """Bag-of-words hashed into a fixed vector, L2-normalized. No deps, deterministic.
    Good enough to catch near-duplicate queries for the cache."""

    def embed(self, text: str) -> np.ndarray:
        v = np.zeros(_DIM, dtype=np.float32)
        for tok in _TOK.findall(text.lower()):
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            v[h % _DIM] += 1.0
        n = np.linalg.norm(v)
        return v / n if n else v


class OpenAIEmbedder:
    def __init__(self, model: str, base_url=None, api_key_env=None):
        import os
        from openai import OpenAI
        self.model = model
        self._client = OpenAI(base_url=base_url,
                              api_key=os.environ.get(api_key_env or "", "") or "not-needed")

    def embed(self, text: str) -> np.ndarray:
        r = self._client.embeddings.create(model=self.model, input=text)
        v = np.asarray(r.data[0].embedding, dtype=np.float32)
        n = np.linalg.norm(v)
        return v / n if n else v


def build_embedder(cfg: EmbeddingsCfg):
    if cfg.type == "mock":
        return HashEmbedder()
    return OpenAIEmbedder(getattr(cfg, "model", "nomic-embed-text"))


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))  # both already normalized
