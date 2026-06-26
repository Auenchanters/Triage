"""Wire a Router from a Config. Shared by the harness and the API server."""
from __future__ import annotations

from cache.embedder import build_embedder
from cache.store import AnswerCache
from core.config import Config
from core.router import Router
from prompts.compressor import build_compressor
from providers.factory import build_provider


def build_router(cfg: Config) -> Router:
    local = build_provider("local", cfg.local)
    remote = build_provider("remote", cfg.remote)
    embedder = build_embedder(cfg.embeddings) if cfg.cache.semantic else None
    cache = AnswerCache(cfg.cache, embedder)
    compressor = build_compressor(cfg.compression.backend, cfg.compression.min_tokens,
                                  cfg.compression.rate)
    return Router(cfg, local, remote, cache, compressor)
