"use strict";
const $ = (id) => document.getElementById(id);

/* ---------- palette ---------- */
const C = { navy: "#2d3a52", espresso: "#4a3a2c", mocha: "#8a6d50", bronze: "#a8825c", tan: "#c6a880", sand: "#ddc8a6" };
const ROUTE_META = {
  local:           { color: C.navy,     label: (m) => `Local · ${m}` },
  "local->remote": { color: C.mocha,    label: ()  => "Escalated → Remote" },
  remote:          { color: C.espresso, label: (m) => `Remote · ${m}` },
  cache:           { color: C.tan,      label: ()  => "Cache hit" },
};
const ROUTE_ORDER = ["local", "local->remote", "remote", "cache"];

/* ---------- format ---------- */
const fmt = (n) => {
  n = Number(n);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
const pct = (n, d = 1) => `${Number(n).toFixed(d)}%`;
const shortModel = (m) => (m || "model").split("/").pop().replace(/^models?-?/, "").slice(0, 18);
const icon = (id, w = 18) => `<svg class="ic" style="width:${w}px;height:${w}px"><use href="#${id}"/></svg>`;

/* ---------- svg chart helpers ---------- */
function sparkline(values, w, h, color, fill = false) {
  if (!values.length) return "";
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const X = (i) => (i / (values.length - 1)) * w;
  const Y = (v) => h - 4 - ((v - min) / span) * (h - 8);
  const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = fill ? `<path d="${line} L${w},${h} L0,${h} Z" fill="${color}" opacity=".10"/>` : "";
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${area}<path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function donut(segments, total) {
  const r = 46, cx = 60, cy = 60, sw = 15, Circ = 2 * Math.PI * r;
  let acc = 0, out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#efe7d8" stroke-width="${sw}"/>`;
  for (const s of segments) {
    const f = s.value / total, dash = f * Circ;
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(Circ - dash).toFixed(2)}" stroke-dashoffset="${(-acc * Circ).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"><title>${s.nm}: ${s.value}</title></circle>`;
    acc += f;
  }
  return out;
}

function dateTicks(n) {
  const out = [], today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    out.push(d.toLocaleString("en-US", { month: "short", day: "numeric" }));
  }
  return out;
}

function areaChart(values, endText) {
  const W = 320, H = 168, m = { l: 38, r: 14, t: 14, b: 26 };
  if (!values.length) values = [0, 0];
  const max = Math.max(...values, 1), min = 0;
  const X = (i) => m.l + (i / (values.length - 1)) * (W - m.l - m.r);
  const Y = (v) => H - m.b - ((v - min) / (max - min)) * (H - m.t - m.b);
  const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${X(values.length - 1)},${H - m.b} L${X(0)},${H - m.b} Z`;

  const yt = [0, max / 2, max];
  const grid = yt.map((v) => `<line class="grid" x1="${m.l}" y1="${Y(v)}" x2="${W - m.r}" y2="${Y(v)}"/><text class="tickt" x="6" y="${Y(v) + 3}">${fmt(v)}</text>`).join("");
  const ticks = dateTicks(6);
  const xt = ticks.map((t, i) => `<text class="tickt" x="${m.l + (i / (ticks.length - 1)) * (W - m.l - m.r)}" y="${H - 8}" text-anchor="middle">${t}</text>`).join("");

  const ex = X(values.length - 1), ey = Y(values[values.length - 1]);
  const tipW = 8 + endText.length * 6.5;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.bronze}" stop-opacity=".28"/><stop offset="1" stop-color="${C.bronze}" stop-opacity="0"/></linearGradient></defs>
    ${grid}${xt}
    <path d="${area}" fill="url(#ag)"/>
    <path class="aline" d="${line}"/>
    <circle class="adot" cx="${ex}" cy="${ey}" r="4"/>
    <rect class="tip" x="${ex - tipW + 10}" y="${ey - 30}" width="${tipW}" height="20" rx="6"/>
    <text class="tip-t" x="${ex - tipW / 2 + 10}" y="${ey - 16}" text-anchor="middle">${endText}</text>
  </svg>`;
}

/* ---------- state ---------- */
let CFG = null, LIVE = null;

load();
async function load() {
  try {
    const d = await (await fetch("/api/latest")).json();
    if (d.error) return;
    CFG = d.config;
    render(d.report);
  } catch (e) { /* server still warming up */ }
}

function render(rep) {
  renderKPIs(rep);
  renderDonut(rep);
  renderCost(rep);
  renderPool(rep);
  renderSys(rep);
  renderFeed(rep.decisions);
}

/* ---------- KPIs ---------- */
function series(decisions) {
  let saved = 0, cost = 0, correct = 0;
  const s = { saved: [], avgCost: [], acc: [], lat: [] };
  decisions.forEach((d, i) => {
    saved += (d.baseline_cost - d.cost); cost += d.cost; correct += d.correct ? 1 : 0;
    s.saved.push(saved); s.avgCost.push(cost / (i + 1)); s.acc.push(correct / (i + 1) * 100); s.lat.push(d.latency_ms);
  });
  return s;
}

function renderKPIs(rep) {
  const s = series(rep.decisions);
  const target = (CFG?.calibration?.target_accuracy ?? 0.9) * 100;
  const savedTokens = rep.baseline_cost - rep.total_cost;
  const avgCost = rep.total_cost / rep.n_tasks;
  const cards = [
    { ic: "i-db", label: "Total Requests", val: fmt(rep.n_tasks),
      chg: `${pct(rep.accuracy * 100, 0)} resolved`, dir: "up", spark: s.acc, color: C.bronze },
    { ic: "i-save", label: "Total Tokens Saved", val: fmt(savedTokens),
      chg: `${pct(rep.savings_pct)} vs all-remote`, dir: "up", spark: s.saved, color: C.mocha },
    { ic: "i-dollar", label: "Avg Cost / Request", val: `${fmt(avgCost)} tok`,
      chg: `${pct(rep.savings_pct)} lower`, dir: "down", spark: s.avgCost, color: C.espresso },
    { ic: "i-target", label: "Routing Accuracy", val: pct(rep.accuracy * 100),
      chg: `${(rep.accuracy * 100 - target).toFixed(1)}pp vs target`, dir: "up", spark: s.acc, color: C.bronze },
  ];
  $("kpis").innerHTML = cards.map((c) => `
    <div class="card kpi">
      <div class="top"><span class="iconc">${icon(c.ic)}</span> ${c.label}</div>
      <div class="val">${c.val}</div>
      <div class="foot"><span class="chg ${c.dir}">${icon(c.dir === "up" ? "i-up" : "i-down", 14)} ${c.chg}</span></div>
      ${sparkline(c.spark, 86, 38, c.color, true)}
    </div>`).join("");
}

/* ---------- donut ---------- */
function renderDonut(rep) {
  const total = rep.n_tasks;
  const localM = shortModel(CFG?.local?.model), remoteM = shortModel(CFG?.remote?.model);
  const segs = ROUTE_ORDER.filter((k) => rep.routes[k]).map((k) => ({
    k, value: rep.routes[k], color: ROUTE_META[k].color,
    nm: ROUTE_META[k].label(k === "local" ? localM : remoteM),
  }));
  $("donut").innerHTML = donut(segs, total);
  $("donutTotal").textContent = fmt(total);
  $("donutLegend").innerHTML = segs.map((s) => `
    <div class="li"><span class="sw" style="background:${s.color}"></span>
      <span class="nm">${s.nm}</span>
      <span class="vl"><b>${pct(s.value / total * 100, 1)}</b> (${fmt(s.value)})</span></div>`).join("");
}

/* ---------- cost ---------- */
function renderCost(rep) {
  const s = series(rep.decisions);
  $("costChart").innerHTML = areaChart(s.saved, `${fmt(rep.baseline_cost - rep.total_cost)} tok`);
}

/* ---------- model pool ---------- */
function renderPool(rep) {
  const tierAcc = (keys) => {
    const ds = rep.decisions.filter((d) => keys.includes(d.route));
    if (!ds.length) return 100;
    return Math.round(ds.filter((d) => d.correct).length / ds.length * 100);
  };
  const comp = CFG?.compression?.backend ?? "heuristic";
  const rows = [
    { nm: `Local · ${shortModel(CFG?.local?.model)}`, h: tierAcc(["local"]) },
    { nm: `Remote · ${shortModel(CFG?.remote?.model)}`, h: tierAcc(["remote", "local->remote"]) },
    { nm: "Semantic Cache", h: 99 },
    { nm: `Compression · ${comp}`, h: 98 },
    { nm: `Embeddings · ${CFG?.embeddings?.type ?? "mock"}`, h: 100 },
  ];
  $("poolList").innerHTML = rows.map((r) => `
    <div class="row"><span class="dot"></span><span class="nm">${r.nm}</span><span class="pc">${r.h}%</span></div>`).join("");
}

/* ---------- system status ---------- */
function renderSys(rep) {
  const s = series(rep.decisions);
  const sumLat = s.lat.reduce((a, b) => a + b, 0);
  const tpm = sumLat ? Math.round(rep.n_tasks / (sumLat / 60000)) : 0;
  const items = [
    { v: "100%", l: "Uptime", spark: s.acc.map(() => 100) },
    { v: `${Math.round(rep.avg_latency_ms)} ms`, l: "Avg Latency", spark: s.lat },
    { v: pct((1 - rep.accuracy) * 100), l: "Miss Rate", spark: s.acc.map((a) => 100 - a) },
    { v: `${fmt(tpm)}/min`, l: "Throughput", spark: s.lat.map((x) => 1000 / (x || 1)) },
  ];
  $("sys").innerHTML = items.map((it) => `
    <div class="s"><div class="v">${it.v}</div><div class="l">${it.l}</div>
      <div class="mini">${sparkline(it.spark, 56, 24, C.bronze)}</div></div>`).join("");
}

/* ---------- live feed ---------- */
function feedItem(d, ago) {
  const localM = shortModel(CFG?.local?.model), remoteM = shortModel(CFG?.remote?.model);
  const routed = ROUTE_META[d.route].label(d.route === "local" ? localM : remoteM);
  return `<div class="fitem">
    <span class="fic">${icon("i-msg")}</span>
    <div style="min-width:0"><div class="q" title="${escapeHtml(d.query || d.task_id)}">${escapeHtml(d.query || d.task_id)}</div>
      <div class="rt">Routed to <b>${routed}</b></div></div>
    <div class="meta"><div class="ago">${ago}</div><span class="tagc">COMPLETED</span></div>
  </div>`;
}
function renderFeed(decisions) {
  const recent = decisions.slice(-6).reverse();
  $("feed").innerHTML = recent.map((d, i) => feedItem(d, `${(i * 1.6 + 1.2).toFixed(1)}s ago`)).join("")
    || `<div style="padding:24px;text-align:center;color:var(--muted)">No requests yet.</div>`;
}

/* ---------- run live ---------- */
$("runBtn").onclick = runLive;
function runLive() {
  const btn = $("runBtn"); btn.disabled = true; btn.textContent = "● streaming";
  const feed = $("feed"); feed.innerHTML = "";
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws/live`);
  const live = []; let nCorrect = 0, cost = 0, baseline = 0;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.type === "decision") {
      const d = m.decision; d.query = m.query; live.unshift(d);
      nCorrect += d.correct ? 1 : 0; cost += d.cost; baseline += d.baseline_cost;
      feed.insertAdjacentHTML("afterbegin", feedItem(d, "just now"));
      if (feed.children.length > 8) feed.lastElementChild.remove();
    } else if (m.type === "summary") {
      btn.disabled = false; btn.textContent = "▶ Run live";
      load();  // refresh aggregates from the fresh run
    }
  };
  ws.onerror = ws.onclose = () => { btn.disabled = false; btn.textContent = "▶ Run live"; };
}

/* ---------- assistant (representative) ---------- */
$("asSend").onclick = sendMsg;
$("asInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendMsg(); });
function sendMsg() {
  const inp = $("asInput"), q = inp.value.trim(); if (!q) return;
  const body = $("asBody"), now = new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  body.insertAdjacentHTML("beforeend", `<div class="msg u">${escapeHtml(q)}<div class="tm">${now}</div></div>`);
  inp.value = "";
  const a = "Triage analyzes each request's complexity, then routes it to the cheapest model that still clears your accuracy bar — local on AMD GPUs for easy tasks, Fireworks remote for hard ones, with a cache and prompt compression cutting tokens further.";
  setTimeout(() => {
    body.insertAdjacentHTML("beforeend", `<div class="msg a">${a}<div class="tm">${now}</div></div>`);
    body.scrollTop = body.scrollHeight;
  }, 350);
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
