"""Provider interface. One method, usage + latency captured on every call."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

from core.types import ChatResult, Message


def approx_tokens(text: str) -> int:
    """Cheap fallback when a provider doesn't return usage (~4 chars/token)."""
    return max(1, len(text) // 4)


class ChatProvider(ABC):
    name: str

    @abstractmethod
    def chat(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 256,
        stop: Optional[list[str]] = None,
        temperature: float = 0.0,
        context: Optional[dict[str, Any]] = None,  # mock-only task hints; real providers ignore
    ) -> ChatResult:
        ...
