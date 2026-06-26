"use strict";
const $ = (id) => document.getElementById(id);

const ROUTE = {
  local:            { cls: "local",  label: "local",        color: "var(--local)" },
  remote:           { cls: "remote", label: "remote",       color: "var(--remote)" },
  "local->remote":  { cls: "escal",  label: "local→remote", color: "var(--escalate)" },
  cache:            { cls: "cache",  label: "cache",        color: "var(--cache)" },
};
const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const pct = (n) => `${(n).toFixed(1)}%`;

let LATEST = null;

// ---------- initial load ----------
load();
async function load() {
  try {
    const r = await fetch("/api/latest");
    LATEST = await r.json();
    if (LATEST.error) return;
    renderReport(LATEST.report);
    renderFeed(LATEST.report.decisions, false);
    renderCalibration(LATEST.calibration);
    setCfgChip(LATEST.config);
  } catch (e) { /* server not up yet — live run still works */ }
}

function setCfgChip(cfg) {
  if (!cfg) return;
  $("cfgChip").textContent = `${cfg.local.type}·local / ${cfg.remote.type}·remote`;
}

// ---------- KPIs + panels ----------
function renderReport(rep, target) {
  const tgt = target ?? (LATEST?.calibration?.target_accuracy ?? 0.9);
  $("kAcc").textContent = pct(rep.accuracy * 100);
  $("kAcc").className = "value " + (rep.accuracy >= tgt ? "good" : "warn");
  $("kAccD").textContent = `target ${pct(tgt * 100)} · ${rep.n_correct}/${rep.n_tasks}`;
  $("kSave").textContent = pct(rep.savings_pct);
  $("kSaveD").textContent = `${fmt(rep.baseline_cost)} → ${fmt(rep.total_cost)} tokens`;
  $("kRemote").textContent = fmt(rep.remote_tokens);
  $("kRemoteD").textContent = `${fmt(rep.total_tokens)} total`;
  $("kLat").textContent = `${fmt(rep.avg_latency_ms)} ms`;
  renderMix(rep.routes, rep.n_tasks);
  renderCost(rep.total_cost, rep.baseline_cost, rep.compression_saved_tokens || 0);
}

function renderMix(routes, total) {
  const order = ["local", "local->remote", "remote", "cache"];
  const segs = order.filter((k) => routes[k]).map((k) => ({
    k, n: routes[k], w: (routes[k] / total) * 100, color: ROUTE[k].color, label: ROUTE[k].label,
  }));
  $("mix").innerHTML = `
    <div class="bar">${segs.map((s) => `<span style="width:${s.w}%;background:${s.color};float:left"></span>`).join("")}</div>
    ${segs.map((s) => `<div class="legend"><span><span class="swatch" style="background:${s.color}"></span>${s.label}</span><span class="mono">${s.n} · ${s.w.toFixed(0)}%</span></div>`).join("")}`;
}

function renderCost(cost, baseline, compSaved) {
  const w = baseline ? (cost / baseline) * 100 : 0;
  const comp = compSaved
    ? `<div class="legend" style="margin-top:4px"><span><span class="swatch" style="background:var(--cache)"></span>of which prompt compression</span><span class="mono">−${fmt(compSaved)} tokens</span></div>`
    : "";
  $("costbars").innerHTML = `
    <div class="cb"><div class="top"><span>Hybrid router</span><span class="mono">${fmt(cost)} tokens</span></div>
      <div class="track"><span style="width:${w}%;background:linear-gradient(90deg,var(--local),var(--primary))"></span></div></div>
    <div class="cb"><div class="top"><span>All-remote baseline</span><span class="mono">${fmt(baseline)} tokens</span></div>
      <div class="track"><span style="width:100%;background:var(--remote);opacity:.5"></span></div></div>
    ${comp}`;
}

// ---------- feed ----------
function renderFeed(decisions, animate) {
  const feed = $("feed");
  feed.innerHTML = "";
  decisions.forEach((d) => feed.appendChild(rowEl(d)));
  if (!decisions.length) feed.innerHTML = `<div class="empty">No decisions.</div>`;
}
function rowEl(d) {
  const r = ROUTE[d.route] || ROUTE.remote;
  const el = document.createElement("div");
  el.className = "row";
  const ok = d.correct === null ? "" : d.correct ? `<span class="ok y">✓</span>` : `<span class="ok n">✗</span>`;
  el.innerHTML = `
    <div class="q" title="${escapeHtml(d.query || d.task_id)}">${escapeHtml(d.query || d.task_id)}</div>
    <span class="route ${r.cls}">${r.label}</span>
    <span class="tok">${fmt(d.remote_tokens)}R · ${fmt(d.total_tokens)}T</span>
    ${ok}`;
  el.onclick = () => drill(d);
  return el;
}
function drill(d) {
  const c = d.confidence === null ? "—" : d.confidence.toFixed(2);
  alert(
    `Q: ${d.query || d.task_id}\n\n` +
    `route: ${d.route}\npredicted difficulty: ${d.predicted_difficulty.toFixed(2)}\n` +
    `local confidence: ${c}   escalated: ${d.escalated}\n` +
    `answer: ${d.answer}\ncorrect: ${d.correct}\n` +
    `tokens — local ${d.local_prompt_tokens + d.local_completion_tokens}, remote ${d.remote_tokens}\n` +
    `cost: ${d.cost}  (baseline ${d.baseline_cost})`
  );
}

// ---------- calibration: pareto svg + sweep table ----------
function renderCalibration(cal) {
  if (!cal) return;
  drawPareto(cal);
  const tb = $("sweep").querySelector("tbody");
  tb.innerHTML = cal.points.map((p) => {
    const chosen = cal.chosen && p.threshold === cal.chosen.threshold;
    return `<tr class="${chosen ? "chosen" : ""}"><td class="l">${p.threshold}${chosen ? " ◀" : ""}</td><td>${pct(p.accuracy * 100)}</td><td>${fmt(p.cost)}</td></tr>`;
  }).join("");
  if (cal.chosen) {
    $("kThr").textContent = cal.chosen.threshold;
    $("kThrD").textContent = `acc ${pct(cal.chosen.accuracy * 100)} · cost ${fmt(cal.chosen.cost)}`;
  }
}

function drawPareto(cal) {
  const pts = cal.points;
  const W = 460, H = 300, m = { l: 46, r: 16, t: 14, b: 34 };
  const xs = pts.map((p) => p.cost), ys = pts.map((p) => p.accuracy);
  const xMax = Math.max(...xs, 1), yMin = Math.min(...ys, cal.target_accuracy) - 0.03, yMax = Math.max(...ys, 1);
  const X = (v) => m.l + (v / xMax) * (W - m.l - m.r);
  const Y = (v) => H - m.b - ((v - yMin) / (yMax - yMin)) * (H - m.t - m.b);

  const sorted = [...pts].sort((a, b) => a.cost - b.cost);
  const line = sorted.map((p, i) => `${i ? "L" : "M"}${X(p.cost).toFixed(1)},${Y(p.accuracy).toFixed(1)}`).join(" ");
  const ty = Y(cal.target_accuracy);

  const gridY = [yMin, (yMin + yMax) / 2, yMax].map((v) =>
    `<line class="grid-l" x1="${m.l}" y1="${Y(v)}" x2="${W - m.r}" y2="${Y(v)}"/><text class="tick" x="6" y="${Y(v) + 3}">${(v * 100).toFixed(0)}%</text>`).join("");
  const dots = pts.map((p) => {
    const chosen = cal.chosen && p.threshold === cal.chosen.threshold;
    return `<circle class="pt ${chosen ? "chosen" : ""}" cx="${X(p.cost)}" cy="${Y(p.accuracy)}" r="${chosen ? 6 : 3.5}"><title>t=${p.threshold} · ${(p.accuracy * 100).toFixed(0)}% · ${p.cost} tok</title></circle>`;
  }).join("");

  $("pareto").innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet">
      ${gridY}
      <line class="axis" x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${H - m.b}"/>
      <line class="axis" x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}"/>
      <line class="target" x1="${m.l}" y1="${ty}" x2="${W - m.r}" y2="${ty}"/>
      <text class="tick" x="${W - m.r}" y="${ty - 5}" text-anchor="end" style="fill:var(--escalate)">target ${(cal.target_accuracy * 100).toFixed(0)}%</text>
      <path class="pareto" d="${line}"/>
      ${dots}
      <text class="tick" x="${(W) / 2}" y="${H - 6}" text-anchor="middle">cost (remote tokens) →</text>
    </svg>`;
}

// ---------- live websocket run ----------
$("runBtn").onclick = runLive;
function runLive() {
  const btn = $("runBtn"); btn.disabled = true;
  $("dot").classList.add("on"); $("statusText").textContent = "running";
  $("feed").innerHTML = "";
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws/live`);
  const live = []; let nCorrect = 0, cost = 0, baseline = 0, target = 0.9;

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === "start") {
      target = msg.target_accuracy;
      $("statusText").textContent = `running · 0/${msg.n_tasks}`;
    } else if (msg.type === "decision") {
      const d = msg.decision; d.query = msg.query; live.push(d);
      nCorrect += d.correct ? 1 : 0; cost += d.cost; baseline += d.baseline_cost;
      const feed = $("feed"); feed.insertBefore(rowEl(d), feed.firstChild);
      const rep = {
        accuracy: nCorrect / live.length, n_correct: nCorrect, n_tasks: live.length,
        savings_pct: baseline ? (1 - cost / baseline) * 100 : 0,
        total_cost: cost, baseline_cost: baseline,
        remote_tokens: live.reduce((a, x) => a + x.remote_tokens, 0),
        total_tokens: live.reduce((a, x) => a + x.total_tokens, 0),
        avg_latency_ms: live.reduce((a, x) => a + x.latency_ms, 0) / live.length,
        compression_saved_tokens: live.reduce((a, x) => a + (x.compression_saved_tokens || 0), 0),
        routes: countRoutes(live),
      };
      renderReport(rep, target);
      $("statusText").textContent = `running · ${live.length}`;
    } else if (msg.type === "summary") {
      $("dot").classList.remove("on"); $("statusText").textContent = "done";
      btn.disabled = false;
    }
  };
  ws.onerror = () => { $("statusText").textContent = "ws error"; btn.disabled = false; $("dot").classList.remove("on"); };
  ws.onclose = () => { btn.disabled = false; $("dot").classList.remove("on"); };
}
function countRoutes(arr) { const c = {}; arr.forEach((d) => (c[d.route] = (c[d.route] || 0) + 1)); return c; }

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
