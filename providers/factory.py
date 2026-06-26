"""Build providers from config. The only place that knows provider types."""
from __future__ import annotations

from core.config import ProviderCfg
from providers.base import ChatProvider
from providers.mock import MockProvider


def build_provider(name: str, cfg: ProviderCfg) -> ChatProvider:
    if cfg.type == "mock":
        return MockProvider(name, cfg.model, cfg.competence_easy,
                            cfg.competence_hard, cfg.base_latency_ms)
    if cfg.type in ("fireworks", "local", "openai"):
        from providers.openai_compatible import OpenAICompatibleProvider
        return OpenAICompatibleProvider(name, cfg.model, cfg.base_url, cfg.api_key_env)
    raise ValueError(f"unknown provider type: {cfg.type!r}")
