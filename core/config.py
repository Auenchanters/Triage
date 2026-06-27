"""Config schema + loader. Launch day = edit YAML, not code."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import yaml
from pydantic import BaseModel, Field


class ProviderCfg(BaseModel):
    type: str = "mock"                 # mock | fireworks | local (OpenAI-compatible)
    model: str = "mock-model"
    base_url: Optional[str] = None     # e.g. https://api.fireworks.ai/inference/v1
    api_key_env: Optional[str] = None  # name of env var holding the key
    # mock-only knobs: simulated competence by difficulty (0..1)
    competence_easy: float = 0.95
    competence_hard: float = 0.35
    base_latency_ms: float = 40.0


class RouterCfg(BaseModel):
    easy_threshold: float = 0.30       # predicted difficulty <= this -> trust local
    hard_threshold: float = 0.80       # predicted difficulty >= this -> straight to remote
    escalate_threshold: float = 0.55   # local confidence < this -> escalate (THE calibration knob)
    # Self-consistency (Wang et al. 2022): on a low-confidence local answer, draw a few
    # more *local* samples and vote. Strong agreement -> accept local (saves remote tokens);
    # disagreement -> escalate. 1 = single-pass (off, the original behavior).
    self_consistency_samples: int = 1
    consistency_accept: float = 0.75   # min agreement ratio to accept (0.75 = unanimous at K=3)


class CostCfg(BaseModel):
    # Default: remote-only cost (local runs on the standardized env -> weight 0).
    # Flip local weights >0 at kickoff if scoring counts total tokens.
    w_remote_prompt: float = 1.0
    w_remote_completion: float = 1.0
    w_local_prompt: float = 0.0
    w_local_completion: float = 0.0


class CacheCfg(BaseModel):
    enabled: bool = True
    semantic: bool = True
    threshold: float = 0.92            # cosine sim for a semantic hit


class CalibrationCfg(BaseModel):
    target_accuracy: float = 0.90      # stay at/above the leaderboard accuracy bar
    sweep: list[float] = Field(default_factory=lambda: [round(x / 20, 2) for x in range(2, 19)])


class CompressionCfg(BaseModel):
    backend: str = "heuristic"         # none | heuristic | llmlingua | headroom
    min_tokens: int = 40               # don't compress prompts shorter than this
    rate: float = 0.5                  # llmlingua target keep-rate (0..1)


class EmbeddingsCfg(BaseModel):
    type: str = "mock"                 # mock | fireworks | local


class Config(BaseModel):
    local: ProviderCfg = ProviderCfg(type="mock", model="mock-local",
                                     competence_easy=0.95, competence_hard=0.30)
    remote: ProviderCfg = ProviderCfg(type="mock", model="mock-remote",
                                      competence_easy=0.99, competence_hard=0.97,
                                      base_latency_ms=350.0)
    router: RouterCfg = RouterCfg()
    cost: CostCfg = CostCfg()
    cache: CacheCfg = CacheCfg()
    calibration: CalibrationCfg = CalibrationCfg()
    compression: CompressionCfg = CompressionCfg()
    embeddings: EmbeddingsCfg = EmbeddingsCfg()
    results_dir: str = "results"


def load_config(path: Optional[str] = None) -> Config:
    if not path:
        return Config()
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    return Config(**data)
