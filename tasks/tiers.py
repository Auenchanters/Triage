"""A graded benchmark: easy / medium / hard tasks (hard = deliberately tricky).

`difficulty` is ground truth (drives the mock's competence and the dashboard tier
buckets). The hard tier is where routing earns its keep: the small local model is
unreliable there, so those tasks should escalate to remote and still come back
correct — i.e. hard-tier accuracy holds even as the cheap path handles the rest.
"""
from __future__ import annotations

from core.types import Task

# (query, gold, type, difficulty)
_EASY: list[tuple[str, str, str, float]] = [
    ("What is the capital of Italy?", "Rome", "exact", 0.06),
    ("What is 9 + 10?", "19", "numeric", 0.05),
    ("Is water wet? Answer true or false.", "true", "boolean", 0.08),
    ("How many days are in a week?", "7", "numeric", 0.05),
    ("What is the capital of Germany?", "Berlin", "exact", 0.10),
    ("Translate 'thank you' to French.", "merci", "exact", 0.18),
    ("What is 100 divided by 4?", "25", "numeric", 0.15),
    ("Who is the author of the Harry Potter books?", "J. K. Rowling", "f1", 0.20),
]

_MEDIUM: list[tuple[str, str, str, float]] = [
    ("A shirt costs $40 and is 25% off. What is the sale price in dollars?", "30", "numeric", 0.45),
    ("What is the next number in the sequence 2, 4, 8, 16?", "32", "numeric", 0.40),
    ("How many minutes are there in 3.5 hours?", "210", "numeric", 0.42),
    ("What is 7 factorial?", "5040", "numeric", 0.55),
    ("If a rectangle is 8 by 5, what is its area?", "40", "numeric", 0.38),
    ("What is the sum of the first 10 positive integers?", "55", "numeric", 0.50),
    ("Who developed the theory of general relativity?", "Albert Einstein", "f1", 0.40),
    ("What is 15 percent of 80?", "12", "numeric", 0.50),
]

_HARD: list[tuple[str, str, str, float]] = [
    # the classic intuition trap: most people say 10 cents
    ("A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. "
     "How much does the ball cost in cents?", "5", "numeric", 0.90),
    ("How many times does the digit 7 appear in the integers from 1 to 100?", "20", "numeric", 0.90),
    ("How many trailing zeros are in 25 factorial?", "6", "numeric", 0.92),
    ("What is the smallest positive integer divisible by both 6 and 8?", "24", "numeric", 0.80),
    ("Three friends split a $90 bill, but one pays twice as much as each of the others. "
     "How much does the bigger payer pay in dollars?", "45", "numeric", 0.85),
    ("If you flip a fair coin 3 times, how many possible ordered outcome sequences are there?",
     "8", "numeric", 0.82),
    ("What is the number 1729 commonly known as in mathematics? (two words)",
     "taxicab number", "f1", 0.92),
    ("A clock shows 3:15. What is the angle in degrees between the hour and minute hands?",
     "7.5", "numeric", 0.95),
]


def load_tiers() -> list[Task]:
    rows = [("easy", _EASY), ("medium", _MEDIUM), ("hard", _HARD)]
    tasks: list[Task] = []
    for tier, group in rows:
        for j, (q, g, ty, d) in enumerate(group):
            tasks.append(Task(id=f"{tier[0]}{j:02d}", query=q, gold=g, type=ty,
                              difficulty=d, meta={"tier": tier}))
    return tasks
