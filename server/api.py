"""FastAPI backend for the dashboard.

  uvicorn server.api:app --reload

- GET  /api/health        liveness
- GET  /api/latest        last harness run (report + calibration) for static panels
- WS   /ws/live           streams one decision per task, then a summary
"""
from __future__ import annotations

import asyncio
import dataclasses
import json
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from agent import runner
from core.build import build_router
from core.config import load_config
from tasks.suite import load_suite

app = FastAPI(title="Hybrid Routing Agent API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_CONFIG_PATH = os.environ.get("ROUTER_CONFIG") or None


def _cfg():
    return load_config(_CONFIG_PATH)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/latest")
def latest():
    p = Path(_cfg().results_dir) / "latest.json"
    if not p.exists():
        return {"error": "no run yet — run `python -m eval.harness` first"}
    return json.loads(p.read_text(encoding="utf-8"))


@app.get("/api/run")
def run_once(escalate: Optional[float] = None, cache: Optional[bool] = None,
            compression: Optional[str] = None, samples: Optional[int] = None):
    """Re-run the suite with live overrides — powers the interactive Routing Rules
    controls. Cheap (small suite), so it's fine to call on a slider drag (debounced)."""
    cfg = _cfg()
    if escalate is not None:
        cfg.router.escalate_threshold = max(0.0, min(1.0, escalate))
    if cache is not None:
        cfg.cache.enabled = cache
    if compression is not None:
        cfg.compression.backend = compression
    if samples is not None:
        cfg.router.self_consistency_samples = max(1, min(7, samples))
    report = runner.run(build_router(cfg), load_suite())
    return dataclasses.asdict(report)


@app.websocket("/ws/live")
async def live(ws: WebSocket):
    await ws.accept()
    try:
        cfg = _cfg()
        router = build_router(cfg)
        tasks = load_suite()
        await ws.send_json({"type": "start", "n_tasks": len(tasks),
                            "target_accuracy": cfg.calibration.target_accuracy})

        from tasks.evaluators import evaluate
        n_correct = 0
        total_cost = baseline = 0.0
        for i, task in enumerate(tasks):
            d = router.run(task)
            d.correct = evaluate(task.type, d.answer, task.gold)
            n_correct += int(bool(d.correct))
            total_cost += d.cost
            baseline += d.baseline_cost
            await ws.send_json({"type": "decision", "i": i, "query": task.query,
                                "decision": runner.decision_dict(task, d)})
            await asyncio.sleep(0.12)  # let the UI animate; remove for raw speed

        await ws.send_json({"type": "summary",
                            "accuracy": n_correct / len(tasks) if tasks else 0,
                            "total_cost": total_cost, "baseline_cost": baseline,
                            "savings_pct": (1 - total_cost / baseline) * 100 if baseline else 0})
    except WebSocketDisconnect:
        return


# Serve the dashboard (static SPA) at / — mounted last so /api and /ws win.
_STATIC = Path(__file__).parent / "static"
app.mount("/", StaticFiles(directory=str(_STATIC), html=True), name="dashboard")
