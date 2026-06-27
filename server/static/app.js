"use strict";
const $ = (id) => document.getElementById(id);
const A = () => window.anime;

/* ---------- palette / route meta ---------- */
const C = { navy: "#2d3a52", espresso: "#4a3a2c", mocha: "#8a6d50", bronze: "#a8825c", tan: "#c6a880", sand: "#ddc8a6", green: "#4f9d69", down: "#b06a4f" };
const RB = {
  local:           { c: "local",  t: "Local",     color: C.navy,     lab: (m) => `Local · ${m}` },
  "local->remote": { c: "escal",  t: "Escalated", color: C.mocha,    lab: ()  => "Escalated → Remote" },
  remote:          { c: "remote", t: "Remote",    color: C.espresso, lab: (m) => `Remote · ${m}` },
  cache:           { c: "cache",  t: "Cache",     color: C.tan,      lab: ()  => "Cache hit" },
};
const ORDER = ["local", "local->remote", "remote", "cache"];

/* ---------- format ---------- */
const fmt = (n) => {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
const pct = (n, d = 1) => `${(Number(n) || 0).toFixed(d)}%`;
const shortModel = (m) => (m || "model").split("/").pop().replace(/^models?-?/, "").slice(0, 18);
const icon = (id, w = 18) => `<svg class="ic" style="width:${w}px;height:${w}px"><use href="#${id}"/></svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- state ---------- */
const STATE = { report: null, calibration: null, config: null };
let CURRENT = "overview";

/* ================= charts ================= */
function sparkline(values, w, h, color, fill = false) {
  if (!values || !values.length) return "";
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const X = (i) => (i / (values.length - 1)) * w, Y = (v) => h - 4 - ((v - min) / span) * (h - 8);
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
      transform="rotate(-90 ${cx} ${cy})"><title>${esc(s.nm)}: ${s.value}</title></circle>`;
    acc += f;
  }
  return `<g class="dg">${out}</g>`;
}
function dateTicks(n) {
  const out = [], today = new Date();
  for (let i = n - 1; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i);
    out.push(d.toLocaleString("en-US", { month: "short", day: "numeric" })); }
  return out;
}
function areaChart(values, endText) {
  const W = 320, H = 168, m = { l: 38, r: 14, t: 14, b: 26 };
  if (!values.length) values = [0, 0];
  const max = Math.max(...values, 1);
  const X = (i) => m.l + (i / (values.length - 1)) * (W - m.l - m.r), Y = (v) => H - m.b - (v / max) * (H - m.t - m.b);
  const line = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${X(values.length - 1)},${H - m.b} L${X(0)},${H - m.b} Z`;
  const grid = [0, max / 2, max].map((v) => `<line class="grid" x1="${m.l}" y1="${Y(v)}" x2="${W - m.r}" y2="${Y(v)}"/><text class="tickt" x="6" y="${Y(v) + 3}">${fmt(v)}</text>`).join("");
  const t = dateTicks(6), xt = t.map((s, i) => `<text class="tickt" x="${m.l + (i / (t.length - 1)) * (W - m.l - m.r)}" y="${H - 8}" text-anchor="middle">${s}</text>`).join("");
  const ex = X(values.length - 1), ey = Y(values[values.length - 1]), tw = 8 + endText.length * 6.5;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bronze}" stop-opacity=".28"/><stop offset="1" stop-color="${C.bronze}" stop-opacity="0"/></linearGradient></defs>
    ${grid}${xt}<path d="${area}" fill="url(#ag)"/><path class="aline" d="${line}"/>
    <circle class="adot" cx="${ex}" cy="${ey}" r="4"/>
    <rect class="tip" x="${ex - tw + 10}" y="${ey - 30}" width="${tw}" height="20" rx="6"/>
    <text class="tip-t" x="${ex - tw / 2 + 10}" y="${ey - 16}" text-anchor="middle">${endText}</text></svg>`;
}
function ring(value, color, sub) {
  const r = 44, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  return `<div class="gauge"><svg viewBox="0 0 120 120" width="148" height="148">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#efe7d8" stroke-width="12"/>
    <circle class="ring" cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
    <div class="lbl"><div class="n">${pct(value)}</div><div class="s">${sub}</div></div></div>`;
}
function pareto(cal) {
  const pts = cal.points, W = 460, H = 280, m = { l: 46, r: 16, t: 14, b: 34 };
  const xs = pts.map((p) => p.cost), ys = pts.map((p) => p.accuracy);
  const xMax = Math.max(...xs, 1), yMin = Math.min(...ys, cal.target_accuracy) - 0.03, yMax = Math.max(...ys, 1);
  const X = (v) => m.l + (v / xMax) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - yMin) / (yMax - yMin)) * (H - m.t - m.b);
  const sorted = [...pts].sort((a, b) => a.cost - b.cost);
  const line = sorted.map((p, i) => `${i ? "L" : "M"}${X(p.cost).toFixed(1)},${Y(p.accuracy).toFixed(1)}`).join(" ");
  const ty = Y(cal.target_accuracy);
  const grid = [yMin, (yMin + yMax) / 2, yMax].map((v) => `<line class="grid" x1="${m.l}" y1="${Y(v)}" x2="${W - m.r}" y2="${Y(v)}"/><text class="tickt" x="6" y="${Y(v) + 3}">${(v * 100).toFixed(0)}%</text>`).join("");
  const dots = pts.map((p) => { const ch = cal.chosen && p.threshold === cal.chosen.threshold;
    return `<circle cx="${X(p.cost)}" cy="${Y(p.accuracy)}" r="${ch ? 6 : 3.5}" fill="${ch ? C.green : C.mocha}" ${ch ? 'stroke="#fff" stroke-width="2"' : ""}><title>t=${p.threshold} · ${(p.accuracy * 100).toFixed(0)}% · ${p.cost} tok</title></circle>`; }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}
    <line class="grid" x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${H - m.b}"/>
    <line x1="${m.l}" y1="${ty}" x2="${W - m.r}" y2="${ty}" stroke="${C.down}" stroke-dasharray="4 4"/>
    <text class="tickt" x="${W - m.r}" y="${ty - 5}" text-anchor="end" style="fill:${C.down}">target ${(cal.target_accuracy * 100).toFixed(0)}%</text>
    <path d="${line}" fill="none" stroke="${C.bronze}" stroke-width="2.2"/>${dots}
    <text class="tickt" x="${W / 2}" y="${H - 6}" text-anchor="middle">cost (remote tokens) →</text></svg>`;
}

/* ================= anime helpers ================= */
function countUp(el, to, f) {
  const a = A();
  if (!a || !to) { el.textContent = f(to); return; }
  const o = { v: 0 }; a({ targets: o, v: to, duration: 950, easing: "easeOutCubic", update: () => { el.textContent = f(o.v); } });
}
function reveal(scope) {
  const a = A(); if (!a) return;
  const els = scope.querySelectorAll(".reveal, .kpi");
  els.forEach((e) => (e.style.opacity = 0));
  a({ targets: els, translateY: [14, 0], opacity: [0, 1], delay: a.stagger(55), duration: 480, easing: "easeOutQuad" });
}
function drawDonut() {
  const a = A(), g = document.querySelector(".dg"); if (!g) return;
  if (a) a({ targets: g, scale: [0.7, 1], opacity: [0, 1], duration: 700, easing: "easeOutBack" });
}
function drawArea() {
  const a = A(), p = document.querySelector(".aline"); if (!p || !a) return;
  const len = p.getTotalLength();
  p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
  a({ targets: p, strokeDashoffset: [len, 0], duration: 1100, easing: "easeInOutSine" });
}
function drawRing() {
  const a = A(), r = document.querySelector(".ring"); if (!r || !a) return;
  const to = r.getAttribute("stroke-dashoffset"), full = r.getAttribute("stroke-dasharray");
  a({ targets: r, strokeDashoffset: [full, to], duration: 1000, easing: "easeOutCubic" });
}

/* ================= load ================= */
load();
async function load() {
  try {
    const d = await (await fetch("/api/latest")).json();
    if (d.error) { $("page").innerHTML = `<div class="card" style="padding:40px;text-align:center;color:var(--muted)">No run yet — run <code>python -m eval.harness</code>.</div>`; return; }
    STATE.report = d.report; STATE.calibration = d.calibration; STATE.config = d.config;
    renderPool(STATE.report);
    showView(CURRENT);
  } catch (e) { /* server warming up */ }
}

/* ================= view router ================= */
const VIEWS = {
  overview:    { title: "Good evening, Admin 👋", sub: "Here's what's happening with your LLM routing system.", render: renderOverview },
  requests:    { title: "Requests", sub: "Every task the router has handled.", render: (p) => renderTable(p, false) },
  logs:        { title: "Logs", sub: "Full decision trace for every request.", render: (p) => renderTable(p, true) },
  analytics:   { title: "Analytics", sub: "Routing, cost and accuracy at a glance.", render: renderAnalytics },
  models:      { title: "Models", sub: "Health and load across your model pool.", render: renderModels },
  rules:       { title: "Routing Rules", sub: "Tune the router and preview the impact live.", render: renderRules },
  evaluations: { title: "Evaluations", sub: "Threshold sweep and the cost / accuracy frontier.", render: renderEvaluations },
  settings:    { title: "Settings", sub: "Configuration for this run.", render: renderSettings },
};
function showView(id) {
  if (!VIEWS[id] || !STATE.report) return;
  CURRENT = id;
  document.querySelectorAll("#nav .nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === id));
  $("pageTitle").textContent = VIEWS[id].title; $("pageSub").textContent = VIEWS[id].sub;
  const page = $("page"); page.innerHTML = "";
  VIEWS[id].render(page);
  const a = A(); if (a) a({ targets: page, opacity: [0, 1], translateY: [6, 0], duration: 260, easing: "easeOutQuad" });
}

/* ---------- shared series ---------- */
function series(decisions) {
  let saved = 0, cost = 0, correct = 0; const s = { saved: [], avgCost: [], acc: [], lat: [] };
  decisions.forEach((d, i) => { saved += d.baseline_cost - d.cost; cost += d.cost; correct += d.correct ? 1 : 0;
    s.saved.push(saved); s.avgCost.push(cost / (i + 1)); s.acc.push(correct / (i + 1) * 100); s.lat.push(d.latency_ms); });
  return s;
}
const localM = () => shortModel(STATE.config?.local?.model);
const remoteM = () => shortModel(STATE.config?.remote?.model);

/* ================= OVERVIEW ================= */
function renderOverview(page) {
  page.appendChild($("tpl-overview").content.cloneNode(true));
  const rep = STATE.report;
  renderKPIs(rep); renderDonut(rep); renderCost(rep); renderSys(rep); renderFeed(rep.decisions);
  bindRunLive(); bindAssistant();
  reveal(page); drawDonut(); drawArea();
}
function renderKPIs(rep) {
  const s = series(rep.decisions), target = (STATE.calibration?.target_accuracy ?? 0.9) * 100;
  const saved = rep.baseline_cost - rep.total_cost, avg = rep.total_cost / rep.n_tasks;
  const cards = [
    { ic: "i-db", label: "Total Requests", n: rep.n_tasks, f: (v) => fmt(Math.round(v)), chg: `${pct(rep.accuracy * 100, 0)} resolved`, dir: "up", spark: s.acc, color: C.bronze },
    { ic: "i-save", label: "Total Tokens Saved", n: saved, f: fmt, chg: `${pct(rep.savings_pct)} vs all-remote`, dir: "up", spark: s.saved, color: C.mocha },
    { ic: "i-dollar", label: "Avg Cost / Request", n: avg, f: (v) => `${fmt(v)} tok`, chg: `${pct(rep.savings_pct)} lower`, dir: "down", spark: s.avgCost, color: C.espresso },
    { ic: "i-target", label: "Routing Accuracy", n: rep.accuracy * 100, f: (v) => pct(v), chg: `${(rep.accuracy * 100 - target).toFixed(1)}pp vs target`, dir: "up", spark: s.acc, color: C.bronze },
  ];
  $("kpis").innerHTML = cards.map((c) => `<div class="card kpi">
    <div class="top"><span class="iconc">${icon(c.ic)}</span> ${c.label}</div>
    <div class="val">${c.f(c.n)}</div>
    <div class="foot"><span class="chg ${c.dir}">${icon(c.dir === "up" ? "i-up" : "i-down", 14)} ${c.chg}</span></div>
    ${sparkline(c.spark, 86, 38, c.color, true)}</div>`).join("");
  document.querySelectorAll("#kpis .val").forEach((el, i) => countUp(el, cards[i].n, cards[i].f));
}
function renderDonut(rep) {
  const total = rep.n_tasks;
  const segs = ORDER.filter((k) => rep.routes[k]).map((k) => ({ k, value: rep.routes[k], color: RB[k].color, nm: RB[k].lab(k === "local" ? localM() : remoteM()) }));
  $("donut").innerHTML = donut(segs, total);
  $("donutTotal").textContent = fmt(total);
  $("donutLegend").innerHTML = segs.map((s) => `<div class="li"><span class="sw" style="background:${s.color}"></span>
    <span class="nm">${esc(s.nm)}</span><span class="vl"><b>${pct(s.value / total * 100)}</b> (${fmt(s.value)})</span></div>`).join("");
}
function renderCost(rep) { $("costChart").innerHTML = areaChart(series(rep.decisions).saved, `${fmt(rep.baseline_cost - rep.total_cost)} tok`); }
function renderSys(rep) {
  const s = series(rep.decisions), sum = s.lat.reduce((a, b) => a + b, 0), tpm = sum ? Math.round(rep.n_tasks / (sum / 60000)) : 0;
  const items = [
    { v: "100%", l: "Uptime", spark: s.acc.map(() => 100) },
    { v: `${Math.round(rep.avg_latency_ms)} ms`, l: "Avg Latency", spark: s.lat },
    { v: pct((1 - rep.accuracy) * 100), l: "Miss Rate", spark: s.acc.map((a) => 100 - a) },
    { v: `${fmt(tpm)}/min`, l: "Throughput", spark: s.lat.map((x) => 1000 / (x || 1)) },
  ];
  $("sys").innerHTML = items.map((it) => `<div class="s"><div class="v">${it.v}</div><div class="l">${it.l}</div><div class="mini">${sparkline(it.spark, 56, 24, C.bronze)}</div></div>`).join("");
}
function renderPool(rep) {
  const tierAcc = (keys) => { const ds = rep.decisions.filter((d) => keys.includes(d.route)); return ds.length ? Math.round(ds.filter((d) => d.correct).length / ds.length * 100) : 100; };
  const rows = [
    { nm: `Local · ${localM()}`, h: tierAcc(["local"]) },
    { nm: `Remote · ${remoteM()}`, h: tierAcc(["remote", "local->remote"]) },
    { nm: "Semantic Cache", h: 99 },
    { nm: `Compression · ${STATE.config?.compression?.backend ?? "heuristic"}`, h: 98 },
    { nm: `Embeddings · ${STATE.config?.embeddings?.type ?? "mock"}`, h: 100 },
  ];
  $("poolList").innerHTML = rows.map((r) => `<div class="row"><span class="dot"></span><span class="nm">${esc(r.nm)}</span><span class="pc">${r.h}%</span></div>`).join("");
}
function feedItem(d, ago) {
  const routed = RB[d.route].lab(d.route === "local" ? localM() : remoteM());
  return `<div class="fitem"><span class="fic">${icon("i-msg")}</span>
    <div style="min-width:0"><div class="q" title="${esc(d.query || d.task_id)}">${esc(d.query || d.task_id)}</div>
      <div class="rt">Routed to <b>${esc(routed)}</b></div></div>
    <div class="meta"><div class="ago">${ago}</div><span class="tagc">COMPLETED</span></div></div>`;
}
function renderFeed(decisions) {
  const recent = decisions.slice(-6).reverse();
  $("feed").innerHTML = recent.map((d, i) => feedItem(d, `${(i * 1.6 + 1.2).toFixed(1)}s ago`)).join("") || `<div style="padding:24px;text-align:center;color:var(--muted)">No requests yet.</div>`;
}
function bindRunLive() {
  const btn = $("runBtn"); if (!btn) return;
  btn.onclick = () => {
    btn.disabled = true; btn.textContent = "● streaming"; const feed = $("feed"); feed.innerHTML = "";
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws/live`);
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
      if (m.type === "decision") { const d = m.decision; d.query = m.query; feed.insertAdjacentHTML("afterbegin", feedItem(d, "just now")); if (feed.children.length > 8) feed.lastElementChild.remove(); }
      else if (m.type === "summary") { btn.disabled = false; btn.textContent = "▶ Run live"; toast("Live run complete — refreshed metrics"); load(); } };
    ws.onerror = ws.onclose = () => { btn.disabled = false; btn.textContent = "▶ Run live"; };
  };
}
function bindAssistant() {
  const send = $("asSend"), inp = $("asInput"); if (!send) return;
  const go = () => {
    const q = inp.value.trim(); if (!q) return; const body = $("asBody");
    const now = new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
    body.insertAdjacentHTML("beforeend", `<div class="msg u">${esc(q)}<div class="tm">${now}</div></div>`); inp.value = "";
    const ans = "Triage analyzes each request's complexity, then routes it to the cheapest model that still clears your accuracy bar — local on AMD GPUs for easy tasks, Fireworks remote for hard ones, with a cache and prompt compression cutting tokens further.";
    setTimeout(() => { body.insertAdjacentHTML("beforeend", `<div class="msg a">${ans}<div class="tm">${now}</div></div>`); body.scrollTop = body.scrollHeight; }, 320);
    body.scrollTop = body.scrollHeight;
  };
  send.onclick = go; inp.onkeydown = (e) => { if (e.key === "Enter") go(); };
}

/* ================= REQUESTS / LOGS ================= */
function renderTable(page, full) {
  const decisions = STATE.report.decisions;
  page.innerHTML = `
    <div class="view-head"><div class="toolbar">
      <div class="search">${icon("i-inbox", 16)}<input id="tblSearch" placeholder="Search requests..."/></div>
      <div class="chips" id="tblChips">
        <span class="chip on" data-r="all">All</span>
        <span class="chip" data-r="local">Local</span>
        <span class="chip" data-r="local->remote">Escalated</span>
        <span class="chip" data-r="remote">Remote</span>
        <span class="chip" data-r="cache">Cache</span>
      </div></div>
      <span class="pill"><span class="dot"></span> ${decisions.length} requests</span>
    </div>
    <section class="card reveal"><div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>#</th><th>Request</th><th>Route</th>${full ? "<th class='num'>Pred</th><th class='num'>Conf</th>" : ""}
      <th class="num">Remote tok</th><th class="num">Total tok</th><th class="num">Latency</th><th>Result</th>
    </tr></thead><tbody id="tblBody"></tbody></table></div></section>`;
  let q = "", rf = "all";
  const draw = () => {
    const rows = decisions.filter((d) => (rf === "all" || d.route === rf) && (!q || (d.query || "").toLowerCase().includes(q)));
    $("tblBody").innerHTML = rows.map((d, i) => `<tr>
      <td class="num" style="color:var(--muted)">${i + 1}</td>
      <td><div class="q-cell" title="${esc(d.query)}">${esc(d.query || d.task_id)}</div></td>
      <td><span class="rb ${RB[d.route].c}">${RB[d.route].t}</span></td>
      ${full ? `<td class="num">${d.predicted_difficulty.toFixed(2)}</td><td class="num">${d.confidence == null ? "—" : d.confidence.toFixed(2)}</td>` : ""}
      <td class="num">${fmt(d.remote_tokens)}</td><td class="num">${fmt(d.total_tokens)}</td>
      <td class="num">${Math.round(d.latency_ms)} ms</td>
      <td><span class="yn ${d.correct ? "y" : "n"}">${d.correct ? "✓ pass" : "✗ miss"}</span></td></tr>`).join("")
      || `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px">No matching requests.</td></tr>`;
  };
  draw();
  $("tblSearch").oninput = (e) => { q = e.target.value.toLowerCase(); draw(); };
  $("tblChips").onclick = (e) => { const c = e.target.closest(".chip"); if (!c) return;
    document.querySelectorAll("#tblChips .chip").forEach((x) => x.classList.toggle("on", x === c)); rf = c.dataset.r; draw(); };
  reveal(page);
}

/* ================= ANALYTICS ================= */
function renderAnalytics(page) {
  const rep = STATE.report;
  page.innerHTML = `
    <div class="grid-2">
      <section class="card reveal"><div class="card-h"><div><h3>Routing Distribution</h3><div class="sub">By tier</div></div></div>
        <div class="donut-wrap"><div class="donut"><svg id="donut" viewBox="0 0 120 120"></svg><div class="ctr"><div class="n" id="donutTotal">—</div><div class="l">Total</div></div></div><div class="legend" id="donutLegend"></div></div></section>
      <section class="card reveal"><div class="card-h"><div><h3>Routing Accuracy</h3><div class="sub">vs target ${pct((STATE.calibration?.target_accuracy ?? .9) * 100, 0)}</div></div></div>
        ${ring(rep.accuracy * 100, C.green, `${rep.n_correct}/${rep.n_tasks} correct`)}</section>
    </div>
    <section class="card reveal" style="margin-top:18px"><div class="card-h"><div><h3>Cumulative Token Savings</h3><div class="sub">vs all-remote baseline</div></div></div><div class="chart-box"><div id="costChart"></div></div></section>`;
  renderDonut(rep); renderCost(rep); reveal(page); drawDonut(); drawArea(); drawRing();
}

/* ================= MODELS ================= */
function renderModels(page) {
  const rep = STATE.report;
  const stat = (keys) => { const ds = rep.decisions.filter((d) => keys.includes(d.route));
    const acc = ds.length ? Math.round(ds.filter((d) => d.correct).length / ds.length * 100) : 100;
    const lat = ds.length ? Math.round(ds.reduce((a, d) => a + d.latency_ms, 0) / ds.length) : 0; return { n: ds.length, acc, lat }; };
  const cards = [
    { nm: `Local · ${localM()}`, tier: "AMD GPU · ROCm/vLLM", color: C.navy, ...stat(["local"]) },
    { nm: `Remote · ${remoteM()}`, tier: "Fireworks AI", color: C.espresso, ...stat(["remote", "local->remote"]) },
    { nm: "Semantic Cache", tier: "Exact + embedding", color: C.tan, ...stat(["cache"]) },
  ];
  page.innerHTML = `<div class="grid-3">${cards.map((c) => `
    <section class="card reveal" style="padding:20px">
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:14px">
        <span style="width:40px;height:40px;border-radius:11px;background:${c.color};display:grid;place-items:center;color:#fff">${icon("i-box")}</span>
        <div><div style="font-weight:600">${esc(c.nm)}</div><div style="font-size:12px;color:var(--muted)">${c.tier}</div></div>
        <span class="pill" style="margin-left:auto;padding:5px 10px"><span class="dot"></span> online</span>
      </div>
      <div class="grid-3" style="gap:10px">
        <div class="pv card" style="padding:12px"><div class="v">${fmt(c.n)}</div><div class="l">requests</div></div>
        <div class="pv card" style="padding:12px"><div class="v">${c.acc}%</div><div class="l">accuracy</div></div>
        <div class="pv card" style="padding:12px"><div class="v">${c.lat}ms</div><div class="l">latency</div></div>
      </div></section>`).join("")}</div>`;
  reveal(page);
}

/* ================= ROUTING RULES (interactive) ================= */
function renderRules(page) {
  const r = STATE.config.router, init = Math.round(r.escalate_threshold * 100);
  page.innerHTML = `
    <div class="rules-grid">
      <section class="card ctrl reveal">
        <div class="row1"><span class="k">Escalation threshold</span><span class="v" id="thV">${(init / 100).toFixed(2)}</span></div>
        <div class="hint">Local answers below this confidence escalate to the remote model. Higher = more accuracy, more tokens.</div>
        <input type="range" id="thR" min="5" max="95" value="${init}" style="--p:${(init - 5) / 90 * 100}%"/>
        <div class="toggle"><div><div class="k" style="font-weight:600">Response cache</div><div class="hint" style="margin:0">Reuse answers for repeat / near-duplicate queries.</div></div><div class="sw-btn ${STATE.config.cache.enabled ? "on" : ""}" id="cacheSw"></div></div>
        <div style="margin:14px 0 8px;font-weight:600">Prompt compression</div>
        <div class="seg-group" id="compSeg">
          <div class="seg ${STATE.config.compression.backend === "none" ? "on" : ""}" data-c="none">None</div>
          <div class="seg ${STATE.config.compression.backend !== "none" ? "on" : ""}" data-c="heuristic">Heuristic</div>
        </div>
        <div style="margin-top:18px"><button class="btn-dark" id="applyRules">Apply &amp; refresh dashboard ${icon("i-arr", 15)}</button></div>
      </section>
      <section class="card reveal" style="padding:20px">
        <div class="card-h" style="padding:0 0 14px"><div><h3>Live preview</h3><div class="sub" id="pvNote">drag the threshold to re-run</div></div></div>
        <div class="preview-kpis">
          <div class="pv card" style="padding:14px"><div class="v" id="pvAcc">—</div><div class="l">accuracy</div></div>
          <div class="pv card" style="padding:14px"><div class="v" id="pvSave">—</div><div class="l">tokens saved</div></div>
          <div class="pv card" style="padding:14px"><div class="v" id="pvRem">—</div><div class="l">remote tokens</div></div>
          <div class="pv card" style="padding:14px"><div class="v" id="pvCost">—</div><div class="l">total cost</div></div>
        </div>
        <div class="donut-wrap" style="padding:18px 0 0"><div class="donut"><svg id="donut" viewBox="0 0 120 120"></svg><div class="ctr"><div class="n" id="donutTotal">—</div><div class="l">Total</div></div></div><div class="legend" id="donutLegend"></div></div>
      </section>
    </div>`;
  const getComp = () => document.querySelector("#compSeg .seg.on").dataset.c;
  const getCache = () => $("cacheSw").classList.contains("on");
  let timer = null;
  const run = () => { clearTimeout(timer); timer = setTimeout(() => apply(false), 180); };
  async function apply(commit) {
    const e = $("thR").value / 100;
    $("pvNote").textContent = "running...";
    try {
      const rep = await (await fetch(`/api/run?escalate=${e}&cache=${getCache()}&compression=${getComp()}`)).json();
      const target = (STATE.calibration?.target_accuracy ?? .9) * 100, acc = rep.accuracy * 100;
      $("pvAcc").innerHTML = `<span style="color:${acc >= target ? C.green : C.down}">${pct(acc)}</span>`;
      $("pvSave").textContent = fmt(rep.baseline_cost - rep.total_cost);
      $("pvRem").textContent = fmt(rep.remote_tokens);
      $("pvCost").textContent = fmt(rep.total_cost);
      $("pvNote").textContent = acc >= target ? "✓ clears the accuracy bar" : "✗ below target — raise threshold";
      renderDonut(rep);
      if (commit) { STATE.report = rep; renderPool(rep); toast("Routing rules applied"); }
    } catch (err) { $("pvNote").textContent = "run failed"; }
  }
  $("thR").oninput = (e) => { const v = e.target.value; $("thV").textContent = (v / 100).toFixed(2);
    e.target.style.setProperty("--p", `${(v - 5) / 90 * 100}%`); run(); };
  $("cacheSw").onclick = () => { $("cacheSw").classList.toggle("on"); run(); };
  $("compSeg").onclick = (e) => { const s = e.target.closest(".seg"); if (!s) return;
    document.querySelectorAll("#compSeg .seg").forEach((x) => x.classList.toggle("on", x === s)); run(); };
  $("applyRules").onclick = () => apply(true);
  reveal(page); apply(false);
}

/* ================= EVALUATIONS ================= */
function renderEvaluations(page) {
  const cal = STATE.calibration;
  if (!cal) { page.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:var(--muted)">No calibration data — run the harness with calibration enabled.</div>`; return; }
  page.innerHTML = `
    <div class="rules-grid">
      <section class="card reveal"><div class="card-h"><div><h3>Cost vs Accuracy (Pareto)</h3><div class="sub">chosen = cheapest point clearing the target</div></div></div><div class="chart-box">${pareto(cal)}</div></section>
      <section class="card reveal"><div class="card-h"><div><h3>Threshold sweep</h3></div></div>
        <div class="tbl-wrap" style="max-height:360px"><table class="tbl"><thead><tr><th>escalate t</th><th class="num">accuracy</th><th class="num">cost</th></tr></thead><tbody>
        ${cal.points.map((p) => { const ch = cal.chosen && p.threshold === cal.chosen.threshold;
          return `<tr ${ch ? 'style="background:rgba(79,157,105,.10)"' : ""}><td>${p.threshold}${ch ? " ◀ chosen" : ""}</td><td class="num">${pct(p.accuracy * 100)}</td><td class="num">${fmt(p.cost)}</td></tr>`; }).join("")}
        </tbody></table></div></section>
    </div>`;
  reveal(page);
}

/* ================= SETTINGS ================= */
function renderSettings(page) {
  const c = STATE.config, R = c.router, K = c.cost;
  const kv = [
    ["Local model", `${c.local.type} · ${c.local.model}`], ["Remote model", `${c.remote.type} · ${c.remote.model}`],
    ["Easy threshold", R.easy_threshold], ["Hard threshold", R.hard_threshold], ["Escalate threshold", R.escalate_threshold],
    ["Cost weights", `remote ${K.w_remote_prompt}/${K.w_remote_completion} · local ${K.w_local_prompt}/${K.w_local_completion}`],
    ["Cache", `${c.cache.enabled ? "on" : "off"} · semantic ${c.cache.semantic} · ${c.cache.threshold}`],
    ["Compression", `${c.compression.backend} · min ${c.compression.min_tokens} tok`],
    ["Embeddings", c.embeddings.type], ["Target accuracy", c.calibration.target_accuracy],
  ];
  page.innerHTML = `
    <section class="card reveal"><div class="card-h"><div><h3>Run configuration</h3><div class="sub">config/default.yaml — edit + re-run to change</div></div></div>
      <div class="kv">${kv.map(([k, v]) => `<div class="k">${k}</div><div class="v">${esc(String(v))}</div>`).join("")}</div></section>
    <div class="view-head" style="margin-top:18px"><div class="toolbar">
      <a class="btn-dark" href="/api/latest" download="triage-traces.json">Download traces ${icon("i-arr", 15)}</a>
      <button class="btn-dark ghost" id="themeBtn2">${icon("i-sun", 15)} Toggle theme</button>
    </div></div>`;
  $("themeBtn2").onclick = toggleTheme;
  reveal(page);
}

/* ================= global UI: menus, toast, theme, delegation ================= */
let toastT = null;
function toast(msg) {
  const t = $("toast"); t.innerHTML = `<span class="dot"></span>${esc(msg)}`; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
}
function toggleTheme() { document.body.classList.toggle("dark"); toast(document.body.classList.contains("dark") ? "Dark theme" : "Light theme"); }
function closeMenus() { document.querySelectorAll(".menu.open").forEach((m) => m.classList.remove("open")); }
function bindMenu(btnId, menuId) {
  const b = $(btnId); if (!b) return;
  b.addEventListener("click", (e) => { e.stopPropagation(); const m = $(menuId); const open = m.classList.contains("open"); closeMenus(); if (!open) m.classList.add("open"); });
}
bindMenu("bellBtn", "bellMenu"); bindMenu("userBtn", "userMenu"); bindMenu("dateBtn", "dateMenu");

document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu-wrap")) closeMenus();
  const range = e.target.closest("[data-range]");
  if (range) { $("dateLabel").textContent = range.dataset.range; closeMenus(); toast(`Range: ${range.dataset.range}`); return; }
  if (e.target.closest("#themeToggle")) { toggleTheme(); closeMenus(); return; }
  const v = e.target.closest("[data-view]");
  if (v) { closeMenus(); showView(v.dataset.view); }
});
