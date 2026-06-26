"""A stand-in suite (trivial + hard mix) so the pipeline, calibration and dashboard
run end-to-end before kickoff. On Jul 6 this is replaced by an adapter that loads the
revealed tasks into the same `Task` shape — nothing downstream changes.

Difficulty is the *ground-truth* used by the mock provider to simulate competence;
the predictive router never sees it.
"""
from __future__ import annotations

from core.types import Task

_RAW: list[tuple[str, object, str, float]] = [
    # query, gold, type, difficulty
    ("What is the capital of France?", "Paris", "exact", 0.05),
    ("What is 2 + 2?", "4", "numeric", 0.05),
    ("Is the sky blue? Answer true or false.", "true", "boolean", 0.08),
    ("Who wrote Romeo and Juliet?", "William Shakespeare", "f1", 0.10),
    ("Translate 'hello' to Spanish.", "hola", "exact", 0.10),
    ("What is the chemical symbol for gold?", "Au", "exact", 0.12),
    ("How many continents are there?", "7", "numeric", 0.10),
    ("What is the capital of Japan?", "Tokyo", "exact", 0.06),
    ("Spell the word 'accommodate'.", "accommodate", "exact", 0.15),
    ("What is 15 percent of 200?", "30", "numeric", 0.30),
    ("Is 17 a prime number? true or false.", "true", "boolean", 0.35),
    ("What is the largest planet in our solar system?", "Jupiter", "exact", 0.15),
    ("Summarize: the cat sat on the mat because it was warm.", "cat sat on warm mat", "f1", 0.40),
    ("If a train travels 60 km in 1.5 hours, what is its speed in km/h?", "40", "numeric", 0.55),
    ("What is the derivative of x squared?", "2x", "exact", 0.55),
    ("Solve step by step: a shirt costs 80 after a 20 percent discount; original price?",
     "100", "numeric", 0.75),
    ("Prove that the sum of the first n odd numbers equals n squared, then give the value for n=5.",
     "25", "numeric", 0.85),
    ("Analyze the trade-offs of microservices vs a monolith and give the single best choice for a 2-person startup.",
     "monolith", "f1", 0.80),
    ("A bat and a ball cost 1.10 in total. The bat costs 1.00 more than the ball. How much is the ball in cents?",
     "5", "numeric", 0.88),
    ("Multi-step: convert 3/8 to a percentage.", "37.5", "numeric", 0.60),
    ("What is the boiling point of water in Celsius at sea level?", "100", "numeric", 0.18),
    ("Who painted the Mona Lisa?", "Leonardo da Vinci", "f1", 0.20),
    ("Compare and justify: is recursion or iteration better for computing factorial of 5? give the number.",
     "120", "numeric", 0.78),
    ("What is the square root of 144?", "12", "numeric", 0.20),
    ("Reason carefully: how many times does the digit 1 appear from 1 to 20?", "12", "numeric", 0.82),
]


# A deliberately verbose, filler-heavy instruction — representative of the long
# prompts real tasks often carry, and where prompt compression actually pays off.
VERBOSE_SYSTEM = (
    "You are a highly meticulous and knowledgeable assistant. Please make sure to read "
    "the question very carefully and think about it step by step in order to arrive at "
    "the best possible answer. It is important that you are accurate and precise. Kindly "
    "respond with just the final answer and nothing else, due to the fact that downstream "
    "systems parse only the answer."
)
_FEWSHOT = [
    ("As well as being careful, what is 3 plus 4? Please answer.", "7"),
    ("In order to warm up, what is the capital of Italy?", "Rome"),
]


def load_tasks() -> list[Task]:
    tasks = []
    for i, (q, g, ty, d) in enumerate(_RAW):
        # Harder tasks hit the billed remote path; give them realistic long context so
        # the compression stage has something to compress.
        system = VERBOSE_SYSTEM if d >= 0.5 else None
        few_shot = _FEWSHOT if d >= 0.8 else []
        tasks.append(Task(id=f"t{i:03d}", query=q, gold=g, type=ty, difficulty=d,
                          system=system, few_shot=few_shot))
    return tasks
