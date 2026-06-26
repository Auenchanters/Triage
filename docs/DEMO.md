# Submission assets — video script · cover image · slides

Numbers below are from the bundled offline run (mock providers). Re-run
`python -m eval.harness` after kickoff and update them with the real-model results.

---

## 1 · Video script (~2:30, screen-recording + voiceover)

Record the dashboard at `http://localhost:8000`. Hit **▶ Run live** at the start of
Scene 3 so the feed streams while you talk.

**Scene 1 — The problem (0:00–0:20)**
> *On screen: title slide.*
> "Every LLM call costs tokens. Send everything to a frontier model and you overpay on
> the 80% of tasks a small local model could have answered. Track 1 is exactly this
> trade-off: complete each task **under** the token budget without dropping below the
> accuracy bar. Our agent does it by **routing**, not by brute compute."

**Scene 2 — How it routes (0:20–0:55)**
> *On screen: the 5-stage pipeline diagram (slide 3).*
> "Each task flows through five stages, cheapest first. Cache catches repeats for zero
> tokens. A predictive router sends the obvious cases the right way. For everything in
> between we try the **local model on an AMD GPU**, score its confidence, and escalate to
> **Fireworks** only when it's not sure. Every remote call is compressed before it's sent."

**Scene 3 — Live run (0:55–1:30)**
> *On screen: dashboard, Run live streaming.*
> "Here it is live. Green is local — free. Amber escalated to remote. Blue went straight
> to remote, violet hit the cache. Watch the top: accuracy holds at ninety-plus percent
> while tokens saved climbs past sixty percent versus sending everything remote."

**Scene 4 — The winning lever: calibration (1:30–2:00)**
> *On screen: the Pareto curve + threshold sweep.*
> "This is where the leaderboard is won. We sweep the escalation threshold and pick the
> **cheapest point that still clears the accuracy bar** — here, 0.65: ninety-point-six
> percent accuracy at a third of the token cost. Everyone can route. We **calibrate** to
> sit right on the line."

**Scene 5 — Token savers + AMD (2:00–2:20)**
> *On screen: cost panel showing the compression line.*
> "On top of routing, a pluggable compression stage trims the billed prompt — heuristic
> today, Microsoft **LLMLingua-2** and **Headroom** on the AMD GPU at kickoff. Local on
> ROCm, remote on Fireworks: AMD silicon does the cheap work, the expensive tier is the
> exception."

**Scene 6 — Close (2:20–2:30)**
> *On screen: 'config-driven · containerized · launch-day ready'.*
> "It's containerized, config-driven, and already runs end-to-end. On launch day we swap
> in the revealed models, re-run the sweep, and ship. Routing intelligence wins."

---

## 2 · Cover image spec (lablab card)

- **Canvas:** 1200 × 675 px (16:9). Safe margins 64 px.
- **Background:** near-black `#0a0d12` with a soft radial glow top-right in `#0C5CAB`
  (the dashboard's exact background — screenshot it for instant brand match).
- **Headline (IBM Plex Sans, 700, ~64px, `#fafafa`):** the project name.
- **Sub-headline (500, ~26px, `#8b95a5`):** "Token-efficient hybrid LLM routing — local on
  AMD GPUs, remote on Fireworks."
- **Hero visual:** the 5-stage pipeline as a horizontal chip flow
  `cache → predict → local → confidence → remote`, with a glowing badge:
  **"90%+ accuracy · 60%+ fewer tokens."**
- **Footer chips:** `AMD ACT II · Track 1` · `ROCm / vLLM` · `Fireworks AI`.
- **Tip:** the cleanest cover is a cropped screenshot of the live dashboard header + KPI
  row with the name overlaid — zero extra design work, perfect consistency.

---

## 3 · Slide outline (8 slides)

1. **Title** — name, tagline, "AMD Developer Hackathon ACT II · Track 1", your handle.
2. **Problem** — overpaying for easy tasks; the cost-vs-accuracy constraint.
3. **Approach** — the 5-stage cheapest-first pipeline (one diagram).
4. **The lever** — threshold calibration; the Pareto curve with the chosen point.
5. **Results** — accuracy ≥ target at 60%+ token savings; the route-mix + savings KPIs.
6. **Token savers** — pluggable compression: heuristic / LLMLingua-2 / Headroom.
7. **AMD fit** — local on ROCm/vLLM = cheap tier; Fireworks = escalation; containerized.
8. **Launch-day ready** — config-driven swap-in; `LAUNCH_DAY.md` checklist; repo + demo URL.

> Build these with the `ui-ux-pro-max` slide skill using the dashboard tokens
> (dark, IBM Plex Sans, `#0C5CAB`) so deck, cover, and product look like one product.
