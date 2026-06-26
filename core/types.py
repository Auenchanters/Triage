"""Shared data types. No external deps so everything else can import freely."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional

Role = Literal["system", "user", "assistant"]
Route = Literal["cache", "local", "remote", "local->remote"]


@dataclass
class Message:
    role: Role
    content: str


@dataclass
class ChatResult:
    text: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    provider: str
    model: str
    # Confidence in [0,1] if the provider can supply one (mock, or self-eval);
    # logprob is the mean token logprob when available (real providers).
    confidence: Optional[float] = None
    logprob: Optional[float] = None

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


@dataclass
class Task:
    id: str
    query: str
    gold: Any
    type: str = "exact"          # selects the evaluator
    difficulty: float = 0.5      # ground-truth difficulty for the sample suite (0..1)
    system: Optional[str] = None
    few_shot: list[tuple[str, str]] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class Decision:
    """Everything the dashboard and scorer need about one task."""
    task_id: str
    route: Route
    predicted_difficulty: float
    confidence: Optional[float]
    escalated: bool
    answer: str
    correct: Optional[bool]
    query: str = ""
    # token accounting, split by tier
    local_prompt_tokens: int = 0
    local_completion_tokens: int = 0
    remote_prompt_tokens: int = 0
    remote_completion_tokens: int = 0
    latency_ms: float = 0.0
    cost: float = 0.0
    baseline_cost: float = 0.0   # naive all-remote, uncompressed cost (the "saved" yardstick)
    cache_hit: bool = False
    compression_saved_tokens: int = 0

    @property
    def remote_tokens(self) -> int:
        return self.remote_prompt_tokens + self.remote_completion_tokens

    @property
    def total_tokens(self) -> int:
        return (self.local_prompt_tokens + self.local_completion_tokens
                + self.remote_prompt_tokens + self.remote_completion_tokens)

    def as_dict(self) -> dict[str, Any]:
        from dataclasses import asdict
        d = asdict(self)
        d["remote_tokens"] = self.remote_tokens
        d["total_tokens"] = self.total_tokens
        return d
