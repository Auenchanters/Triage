"""Real provider for any OpenAI-compatible endpoint: Fireworks AI (remote) and a
local vLLM-on-ROCm / Ollama / llama.cpp server (local). Same class, different config.

Only imported/instantiated when config asks for it, so offline dev never needs the
`openai` package or network. Logprobs are requested when available and averaged into
a confidence signal for the router.
"""
from __future__ import annotations

import math
import os
import time
from typing import Any, Optional

from core.types import ChatResult, Message
from providers.base import ChatProvider, approx_tokens


class OpenAICompatibleProvider(ChatProvider):
    def __init__(self, name: str, model: str, base_url: Optional[str],
                 api_key_env: Optional[str], want_logprobs: bool = True):
        from openai import OpenAI  # lazy: only when a real provider is used
        api_key = os.environ.get(api_key_env or "", "") or "not-needed"
        self.name = name
        self.model = model
        self.want_logprobs = want_logprobs
        self._client = OpenAI(base_url=base_url, api_key=api_key)

    def chat(self, messages, *, max_tokens=256, stop=None, temperature=0.0,
             context: Optional[dict[str, Any]] = None) -> ChatResult:
        t0 = time.perf_counter()
        kwargs: dict[str, Any] = dict(
            model=self.model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        if stop:
            kwargs["stop"] = stop
        if self.want_logprobs:
            kwargs["logprobs"] = True
        resp = self._client.chat.completions.create(**kwargs)
        latency_ms = (time.perf_counter() - t0) * 1000

        choice = resp.choices[0]
        text = choice.message.content or ""
        usage = getattr(resp, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", None) or sum(
            approx_tokens(m.content) for m in messages)
        completion_tokens = getattr(usage, "completion_tokens", None) or approx_tokens(text)

        logprob, confidence = _mean_logprob_to_confidence(choice)
        return ChatResult(
            text=text,
            prompt_tokens=int(prompt_tokens),
            completion_tokens=int(completion_tokens),
            latency_ms=latency_ms,
            provider=self.name,
            model=self.model,
            confidence=confidence,
            logprob=logprob,
        )


def _mean_logprob_to_confidence(choice) -> tuple[Optional[float], Optional[float]]:
    lp = getattr(choice, "logprobs", None)
    content = getattr(lp, "content", None) if lp else None
    if not content:
        return None, None
    vals = [c.logprob for c in content if getattr(c, "logprob", None) is not None]
    if not vals:
        return None, None
    mean_lp = sum(vals) / len(vals)
    return mean_lp, math.exp(mean_lp)  # geometric-mean token prob in [0,1]
