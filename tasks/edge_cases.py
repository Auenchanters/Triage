"""Edge-case tasks that each stress one routing path, so we can prove the machinery
behaves before the real tasks land. Paired with tests/test_edge_cases.py.

Each task is crafted so the *predicted* difficulty (from the query text) and the
*ground-truth* difficulty (which drives the mock's competence) pull in instructive
directions:
  - short-but-hard   looks easy, is hard  -> caught by the confidence gate (escalates)
  - long-but-easy    looks hard, is easy  -> NOT over-escalated (stays local)
  - pre-route-remote clearly hard         -> skips a doomed local attempt
  - verbose-context  long instructions    -> compression fires on the remote call
  - repeat           identical query      -> cache hit, zero remote tokens
"""
from __future__ import annotations

from core.types import Task
from tasks.samples import VERBOSE_SYSTEM

_LONG_EASY = ("Considering everything, and taking your time to reason carefully and "
              "step by step about this question, could you kindly tell me what two plus "
              "two equals in the end?")


def load_edge_cases() -> list[Task]:
    return [
        # looks trivial ("what is ..."), is actually hard -> confidence gate escalates
        Task(id="e000", query="What is 1729?", gold="taxicab number", type="f1",
             difficulty=0.92, system=VERBOSE_SYSTEM),
        # dressed-up trivial question -> must stay local, not burn remote tokens
        Task(id="e001", query=_LONG_EASY, gold="4", type="numeric", difficulty=0.05),
        # clearly hard -> predictive sends straight to remote (no wasted local attempt)
        Task(id="e002",
             query="Prove rigorously and step by step, then carefully analyze all the "
                   "trade-offs involved, and finally derive the complete multi-step result "
                   "of summing together the first ten consecutive odd numbers.",
             gold="100", type="numeric", difficulty=0.80, system=VERBOSE_SYSTEM),
        # mid-difficulty with long context -> remote path + compression
        Task(id="e003",
             query="Reason step by step: what is 12 percent of 250?", gold="30",
             type="numeric", difficulty=0.70, system=VERBOSE_SYSTEM),
        # hard boolean -> local likely hedges/low-confidence -> escalates
        Task(id="e004", query="Reason about it: is 91 a prime number? true or false.",
             gold="false", type="boolean", difficulty=0.85, system=VERBOSE_SYSTEM),
        # repeat pair -> the second is a cache hit (zero remote tokens)
        Task(id="e005", query="List the first three prime numbers.", gold="2, 3, 5",
             type="f1", difficulty=0.20),
        Task(id="e006", query="List the first three prime numbers.", gold="2, 3, 5",
             type="f1", difficulty=0.20),
    ]
