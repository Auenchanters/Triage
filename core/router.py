"""The orchestrator. Per task: cache -> predict -> (local + confidence) -> escalate.
Each stage is cheaper than the next; we only pay for remote tokens when the cheaper
stages can't clear the confidence bar.
"""
from __future__ import annotations

from typing import Optional

from cache.store import AnswerCache
from core.budget import baseline_all_remote, cost
from core.config import Config
from core.strategies import cascade, confidence, predictive
from core.types import Decision, Task
from prompts import compress
from prompts.compressor import Compressor, NoCompressor, apply_compression
from providers.base import ChatProvider, approx_tokens


class Router:
    def __init__(self, cfg: Config, local: ChatProvider, remote: ChatProvider,
                 cache: Optional[AnswerCache] = None, compressor: Optional[Compressor] = None):
        self.cfg = cfg
        self.local = local
        self.remote = remote
        self.cache = cache
        self.compressor = compressor or NoCompressor()

    def _ctx(self, task: Task) -> dict:
        # task hints for the mock provider; real providers ignore these.
        return {"task_id": task.id, "gold": task.gold, "difficulty": task.difficulty}

    def run(self, task: Task) -> Decision:
        budget = compress.budget_max_tokens(task.type)
        stop = compress.stop_for(task.type)
        ctx = self._ctx(task)

        # baseline = cost if we had always gone remote (consistent yardstick).
        base_msgs = compress.build_messages(task, include_few_shot=True)
        base_prompt = sum(approx_tokens(m.content) for m in base_msgs)
        baseline_cost = baseline_all_remote(base_prompt, budget, self.cfg.cost)

        # 1) cache
        if self.cache:
            hit = self.cache.get(task.query)
            if hit is not None:
                return Decision(task_id=task.id, route="cache", predicted_difficulty=0.0,
                                confidence=1.0, escalated=False, answer=hit, correct=None,
                                query=task.query, cost=0.0, baseline_cost=baseline_cost,
                                cache_hit=True)

        # 2) predictive pre-route
        pred = predictive.estimate_difficulty(task.query)
        plan = cascade.pre_plan(pred, self.cfg.router)

        lp = lc = rp = rc = 0
        comp_saved = 0
        latency = 0.0
        route = "remote"
        conf: Optional[float] = None
        escalated = False
        answer = ""

        # 3) local attempt + confidence gate
        if plan.try_local:
            msgs = compress.build_messages(task, include_few_shot=False)
            lr = self.local.chat(msgs, max_tokens=budget, stop=stop, context=ctx)
            lp, lc = lr.prompt_tokens, lr.completion_tokens
            latency += lr.latency_ms
            conf = confidence.score(lr)
            answer = lr.text
            if cascade.accept_local(conf, self.cfg.router):
                route = "local"
            else:
                escalated = True  # 4) escalate

        # 4) remote (direct, or after a low-confidence local attempt)
        if route != "local":
            include_fs = pred >= self.cfg.router.hard_threshold
            msgs = compress.build_messages(task, include_few_shot=include_fs)
            msgs, comp_saved = apply_compression(msgs, self.compressor)  # billed path only
            rr = self.remote.chat(msgs, max_tokens=budget, stop=stop, context=ctx)
            rp, rc = rr.prompt_tokens, rr.completion_tokens
            latency += rr.latency_ms
            answer = rr.text
            route = "local->remote" if escalated else "remote"

        if self.cache:
            self.cache.put(task.query, answer)

        return Decision(
            task_id=task.id, route=route, predicted_difficulty=pred, confidence=conf,
            escalated=escalated, answer=answer, correct=None, query=task.query,
            local_prompt_tokens=lp, local_completion_tokens=lc,
            remote_prompt_tokens=rp, remote_completion_tokens=rc,
            latency_ms=latency, cost=cost(lp, lc, rp, rc, self.cfg.cost),
            baseline_cost=baseline_cost, compression_saved_tokens=comp_saved,
        )
