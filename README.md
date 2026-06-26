# ⚡ Triage — token-thrifty LLM router

**AMD Developer Hackathon · ACT II — Track 1**

> Route each task to the cheapest model that still clears the accuracy bar.

An agent that completes each task using the **fewest billed tokens** while staying
**above the accuracy threshold**. Every task is routed, cheapest-tier-first, between a
**local model on AMD GPUs (ROCm/vLLM)** and a **remote model on Fireworks AI** — and the
escalation threshold is **calibrated** to sit just above the accuracy bar, so we spend the
minimum remote tokens that still clears it.

> Routing intelligence wins, not raw compute.

On the bundled offline suite the calibrated router holds **92% accuracy at ~77% fewer
remote tokens** than sending everything to the remote model.

---

## How it routes (the IP)

Per task, each stage is cheaper than escalating to the next:

1. **Cache** (exact + semantic) — repeats/near-duplicates return with **zero** remote tokens.
2. **Predictive router** — cheap difficulty heuristics send the obvious cases without a
   wasted attempt: trivial → local, clearly-hard → straight to remote.
3. **Local attempt + confidence** — run local; score adequacy from logprobs / self-signal.
4. **Cascade escalation** — call remote **only** when confidence is below the calibrated bar.
5. **Token minimization** on every remote call — dynamic few-shot, `max_tokens` + stop
   budgeting, plus a **pluggable prompt-compression stage** (billed path only, context
   only, length-gated): a zero-dep `heuristic` backend, or **LLMLingua-2** (Microsoft,
   2–5× task-agnostic compression on the AMD GPU) / **Headroom** (reversible
   prefix/cache-stabilizing) — flipped on via `compression.backend` in config. On the
   sample suite the heuristic backend alone cuts remote tokens ~17% at equal accuracy.

**Calibration is the lever.** `eval/harness.py` sweeps the escalation threshold and picks
the operating point that **minimizes cost subject to accuracy ≥ target** (Pareto frontier).

```
core/router.py            cache → predict → local+confidence → escalate
core/strategies/          predictive · confidence · cascade · calibration
providers/                base · mock (offline) · openai_compatible (Fireworks/local) · factory
cache/ prompts/ budget    semantic cache · prompt compression · token→cost
tasks/                    Task + evaluators + sample suite (swapped for real tasks on Jul 6)
eval/harness.py           accuracy + cost + threshold sweep + Pareto report → results/latest.json
server/                   FastAPI API + websocket + static observability dashboard
```

Everything is **config-driven** (`config/default.yaml`). Launch day = edit config + add a
task adapter; no core changes. See [LAUNCH_DAY.md](LAUNCH_DAY.md).

---

## Quickstart

### Docker (recommended)
```bash
docker compose up --build
# open http://localhost:8000  — dashboard with a seeded run
```

### Local
```bash
pip install -r requirements.txt

# 1) run the eval + calibration sweep (writes results/latest.json)
python -m eval.harness --config config/default.yaml

# 2) serve the dashboard (API + live websocket + static UI)
uvicorn server.api:app --reload          # http://localhost:8000

# 3) self-check (no network)
python tests/test_router.py              # or: pytest
```

The dashboard shows live routing decisions, tokens saved vs an all-remote baseline,
accuracy vs the threshold, the route mix, and the cost-vs-accuracy Pareto curve with the
chosen operating point.

---

## Going live (Jul 6)

Models and tasks are revealed at kickoff. Offline dev uses `type: mock` providers so the
full pipeline + dashboard run without network. To go live, switch the provider `type`s to
`fireworks` / `local`, set the model ids and `FIREWORKS_API_KEY`, add a `tasks/` adapter,
and re-run the sweep. Template: [`config/launch.example.yaml`](config/launch.example.yaml).
Step-by-step: [LAUNCH_DAY.md](LAUNCH_DAY.md).

## Submission assets
Video script, cover-image spec, and slide outline: [docs/DEMO.md](docs/DEMO.md).
Routing edge cases (cache hit, escalation, pre-route, compression) live in
`tasks/edge_cases.py` and are asserted in `tests/test_edge_cases.py`.

## AMD platforms
- **Local tier** runs on **AMD GPUs via ROCm/vLLM** (OpenAI-compatible) — the cheap path.
- **Remote tier** is **Fireworks AI** on AMD hardware — the escalation path.
- `docker-compose.yml` includes a commented `rocm/vllm` service for the local model.
