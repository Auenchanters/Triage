# Launch-day playbook (Jul 6, kickoff)

The framework is done. On kickoff you only **configure + adapt + calibrate** — no core code changes.

### 1. Confirm the two scoring unknowns (from the challenge briefing)
- [ ] Cost metric = **remote-only tokens** or **total tokens**?
      → if total, set `cost.w_local_prompt` / `w_local_completion` > 0 in the config.
- [ ] Accuracy threshold = **per-task** or **aggregate**, and what value?
      → set `calibration.target_accuracy`.

### 2. Wire the revealed models (`config/launch.example.yaml` → `config/launch.yaml`)
- [ ] `remote`: Fireworks model id + `FIREWORKS_API_KEY` in env.
- [ ] `local`: start the local model on AMD GPU — `docker compose up local-model`
      (rocm/vllm, OpenAI-compatible) — and point `local.base_url` at it.

### 3. Add a task adapter for the revealed tasks
- [ ] Write `tasks/<event>.py` with a `load_tasks()` returning `list[Task]`
      (same shape as `tasks/samples.py`). Pick the right `type` per task so the
      matching evaluator in `tasks/evaluators.py` scores it; add a new evaluator there
      if a task needs one.
- [ ] Point the harness/server at it (swap the `load_tasks` import, or set it in config).

### 4. Calibrate and lock the operating point
- [ ] `ROUTER_CONFIG=config/launch.yaml python -m eval.harness`
- [ ] Read the sweep → set `router.escalate_threshold` to the **chosen** point
      (cheapest at/above target accuracy). Re-run to confirm.
- [ ] Tune `easy_threshold` / `hard_threshold` if the predictive router mis-sends.

### 5. Squeeze tokens (only if the sweep shows headroom)
- [ ] Tighten `prompts/compress.py` budgets / stop sequences per task type.
- [ ] Turn on few-shot only where it changes accuracy.
- [ ] If heuristics leave tokens on the table, train the predictive classifier
      behind `core/strategies/predictive.estimate_difficulty` (same signature).

### 6. Submit
- [ ] `docker compose up` → dashboard at `:8000` for the demo/video.
- [ ] Public GitHub repo (README present), containerized ✓, Application URL ✓.
- [ ] Record the 3-panel story: live routing → savings vs baseline → Pareto/threshold.
