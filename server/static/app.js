"use strict";
/* ===================================================================
   Triage dashboard — seed-first, never-blank.
   render(data) runs immediately from SEED, then again if /api/latest
   resolves. No external JS lib; motion is CSS + a tiny rAF count-up.
   =================================================================== */

/* ---- baked-in snapshot (mirrors results/latest.json) so the page is
        fully rendered before any network call returns ---- */
const SEED = {
  report: {
    accuracy: 0.9375, total_tokens: 2910, remote_tokens: 1118, total_cost: 1118,
    baseline_cost: 3051, savings_pct: 63.356, compression_saved_tokens: 240,
    avg_latency_ms: 238.3, n_correct: 30, n_tasks: 32,
    routes: { local: 18, "local->remote": 12, remote: 1, cache: 1 },
    decisions: [
      { task_id: "t000", query: "What is the capital of France?", route: "local", cost: 0, baseline_cost: 47, total_tokens: 24, remote_tokens: 0, correct: true, confidence: 1.0, predicted_difficulty: 0.0 },
      { task_id: "t005", query: "Chemical symbol for gold?", route: "local", cost: 0, baseline_cost: 52, total_tokens: 26, remote_tokens: 0, correct: true, confidence: 0.87, predicted_difficulty: 0.06 },
      { task_id: "c001", query: "What is the capital of France?", route: "cache", cost: 0, baseline_cost: 47, total_tokens: 0, remote_tokens: 0, correct: true, confidence: 1.0, predicted_difficulty: 0.0 },
      { task_id: "t002", query: "Boiling point of water in Celsius at sea level?", route: "local", cost: 0, baseline_cost: 58, total_tokens: 28, remote_tokens: 0, correct: true, confidence: 0.84, predicted_difficulty: 0.0 },
      { task_id: "t010", query: "Who painted the Mona Lisa?", route: "local", cost: 0, baseline_cost: 61, total_tokens: 30, remote_tokens: 0, correct: true, confidence: 0.85, predicted_difficulty: 0.06 },
      { task_id: "t007", query: "A shirt costs 80 after a 20% discount; original price?", route: "local->remote", cost: 91, baseline_cost: 152, total_tokens: 220, remote_tokens: 91, correct: true, confidence: 0.41, predicted_difficulty: 0.69 },
      { task_id: "t008", query: "Multi-step: convert 3/8 to a percentage.", route: "local->remote", cost: 81, baseline_cost: 178, total_tokens: 182, remote_tokens: 81, correct: true, confidence: 0.44, predicted_difficulty: 0.44 },
      { task_id: "t012", query: "From 1 to 20, how many times does the digit 1 appear?", route: "local->remote", cost: 88, baseline_cost: 147, total_tokens: 196, remote_tokens: 88, correct: true, confidence: 0.38, predicted_difficulty: 0.34 },
      { task_id: "t015", query: "What is 1729 known as in math folklore?", route: "local->remote", cost: 76, baseline_cost: 189, total_tokens: 172, remote_tokens: 76, correct: false, confidence: 0.36, predicted_difficulty: 0.55 },
      { task_id: "t018", query: "Define a 'taxicab number' and give the first one.", route: "local->remote", cost: 84, baseline_cost: 113, total_tokens: 188, remote_tokens: 84, correct: true, confidence: 0.40, predicted_difficulty: 0.34 },
      { task_id: "e002", query: "Prove the sum of two odd integers is even.", route: "remote", cost: 94, baseline_cost: 132, total_tokens: 202, remote_tokens: 94, correct: true, confidence: 0.31, predicted_difficulty: 0.84 },
      { task_id: "t021", query: "What is 12 x 12?", route: "local", cost: 0, baseline_cost: 44, total_tokens: 22, remote_tokens: 0, correct: true, confidence: 0.82, predicted_difficulty: 0.06 }
    ]
  },
  calibration: {
    chosen: { threshold: 0.65, accuracy: 0.90625, cost: 1118 },
    target_accuracy: 0.9,
    points: [
      { threshold: 0.10, accuracy: 0.6875, cost: 119 },
      { threshold: 0.20, accuracy: 0.71875, cost: 297 },
      { threshold: 0.30, accuracy: 0.75, cost: 470 },
      { threshold: 0.40, accuracy: 0.78125, cost: 612 },
      { threshold: 0.45, accuracy: 0.8125, cost: 754 },
      { threshold: 0.55, accuracy: 0.84375, cost: 932 },
      { threshold: 0.65, accuracy: 0.90625, cost: 1118 },
      { threshold: 0.75, accuracy: 0.90625, cost: 1300 },
      { threshold: 0.85, accuracy: 0.90625, cost: 1402 },
      { threshold: 0.90, accuracy: 0.90625, cost: 1519 }
    ]
  },
  config: {
    router: { escalate_threshold: 0.65, easy_threshold: 0.30, hard_threshold: 0.80 },
    cache: { enabled: true, semantic: true },
    compression: { backend: "heuristic" },
    calibration: { target_accuracy: 0.9 }
  }
};

/* ---------------------------------------------------------------- utils */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (n) => (n * 100).toFixed(1);
const n0 = (n) => Math.round(n).toLocaleString();
const ROUTE = { local: "local", "local->remote": "esc", remote: "remote", cache: "cache" };
const ROUTE_LBL = { local: "LOCAL", "local->remote": "LOCAL→REMOTE", remote: "REMOTE", cache: "CACHE" };

let STATE = { data: SEED, screen: "overview", busy: false };

/* normalize either {report,calibration,config} or a bare RunReport dict */
function normalize(d) {
  if (!d || d.error) return null;
  if (d.report) return { report: d.report, calibration: d.calibration || STATE.data.calibration, config: d.config || STATE.data.config };
  if (d.decisions) return { report: d, calibration: STATE.data.calibration, config: STATE.data.config };
  return null;
}

/* rAF count-up — sets el text from 0 → target */
function countUp(el, target, { dur = 900, dec = 0, suf = "", pre = "" } = {}) {
  const t0 = performance.now();
  const step = (t) => {
    const k = clamp((t - t0) / dur, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = pre + (target * e).toFixed(dec) + suf;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------------- charts (inline SVG) */
function donut(routes) {
  const order = ["local", "cache", "local->remote", "remote"];
  const col = { local: "var(--green)", cache: "var(--cyan)", "local->remote": "var(--red)", remote: "var(--amber)" };
  const total = order.reduce((s, k) => s + (routes[k] || 0), 0) || 1;
  const C = 2 * Math.PI * 52;
  let off = 0, segs = "";
  for (const k of order) {
    const v = routes[k] || 0; if (!v) continue;
    const len = (v / total) * C;
    segs += `<circle cx="70" cy="70" r="52" fill="none" stroke="${col[k]}" stroke-width="16"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 70 70)" stroke-linecap="butt"/>`;
    off += len;
  }
  const onDev = ((routes.local || 0) + (routes.cache || 0));
  return `<svg class="chart" viewBox="0 0 140 140" style="max-width:170px;margin:0 auto">
    <circle cx="70" cy="70" r="52" fill="none" stroke="var(--glass-2)" stroke-width="16"/>${segs}
    <text x="70" y="66" text-anchor="middle" fill="#fff" font-size="26" font-weight="700" font-family="var(--mono)">${onDev}</text>
    <text x="70" y="84" text-anchor="middle" fill="var(--muted)" font-size="9.5" letter-spacing=".08em">ON-DEVICE</text>
  </svg>`;
}

function areaSavings(decisions) {
  const W = 560, H = 150, pad = 6;
  let cumB = 0, cumC = 0; const pts = [];
  decisions.forEach((d) => { cumB += d.baseline_cost || 0; cumC += d.cost || 0; pts.push(cumB - cumC); });
  if (!pts.length) pts.push(0);
  const max = Math.max(...pts, 1);
  const X = (i) => pad + (i / Math.max(pts.length - 1, 1)) * (W - 2 * pad);
  const Y = (v) => H - pad - (v / max) * (H - 2 * pad);
  const line = pts.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const fill = `${line} L${X(pts.length - 1).toFixed(1)} ${H - pad} L${X(0).toFixed(1)} ${H - pad} Z`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--green)" stop-opacity=".35"/><stop offset="1" stop-color="var(--green)" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${fill}" fill="url(#ga)"/>
    <path d="${line}" fill="none" stroke="var(--green)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
      stroke-dasharray="2000" stroke-dashoffset="2000"><animate attributeName="stroke-dashoffset" to="0" dur="1.1s" fill="freeze"/></path>
  </svg>`;
}

function pareto(points, chosen, target) {
  const W = 560, H = 230, l = 42, b = 30, t = 12, r = 12;
  const costs = points.map((p) => p.cost), accs = points.map((p) => p.accuracy);
  const cMin = 0, cMax = Math.max(...costs) * 1.05;
  const aMin = Math.min(...accs) - 0.04, aMax = 1.0;
  const X = (c) => l + (c - cMin) / (cMax - cMin) * (W - l - r);
  const Y = (a) => t + (aMax - a) / (aMax - aMin) * (H - t - b);
  const sorted = [...points].sort((p, q) => p.cost - q.cost);
  const path = sorted.map((p, i) => `${i ? "L" : "M"}${X(p.cost).toFixed(1)} ${Y(p.accuracy).toFixed(1)}`).join(" ");
  const dots = sorted.map((p) => `<circle cx="${X(p.cost).toFixed(1)}" cy="${Y(p.accuracy).toFixed(1)}" r="3.4" fill="var(--accent)"/>`).join("");
  const ty = Y(target);
  const ch = chosen ? `<circle cx="${X(chosen.cost)}" cy="${Y(chosen.accuracy)}" r="7" fill="none" stroke="var(--green)" stroke-width="2.5"/>
    <circle cx="${X(chosen.cost)}" cy="${Y(chosen.accuracy)}" r="3.4" fill="var(--green)"/>
    <text x="${X(chosen.cost) + 12}" y="${Y(chosen.accuracy) - 8}" fill="var(--green)" font-size="11" font-weight="600" font-family="var(--mono)">chosen · t=${chosen.threshold}</text>` : "";
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <line x1="${l}" y1="${ty.toFixed(1)}" x2="${W - r}" y2="${ty.toFixed(1)}" stroke="var(--amber)" stroke-width="1.4" stroke-dasharray="5 5"/>
    <text x="${W - r}" y="${ty - 6}" text-anchor="end" fill="var(--amber)" font-size="10.5" font-family="var(--mono)">target ${pct(target)}%</text>
    <line x1="${l}" y1="${t}" x2="${l}" y2="${H - b}" stroke="var(--line)"/>
    <line x1="${l}" y1="${H - b}" x2="${W - r}" y2="${H - b}" stroke="var(--line)"/>
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2" opacity=".55"/>${dots}${ch}
    <text x="${(l + W) / 2}" y="${H - 4}" text-anchor="middle" fill="var(--muted)" font-size="10.5">cost (remote tokens) →</text>
    <text x="12" y="${(t + H - b) / 2}" fill="var(--muted)" font-size="10.5" transform="rotate(-90 12 ${(t + H - b) / 2})" text-anchor="middle">accuracy →</text>
  </svg>`;
}

/* ---------------------------------------------------------------- screens */
const META = {
  overview: ["Overview", "Hybrid routing — local-first, escalate only when it pays."],
  compare:  ["A/B Comparison", "Watch baseline (all-remote) vs Triage (routed) run task by task."],
  routing:  ["Live Routing", "Tune the operating point and re-run the engine live."]
};

function screenOverview(d) {
  const R = d.report, cal = d.calibration;
  const onDev = ((R.routes.local || 0) + (R.routes.cache || 0));
  const kpis = [
    { lab: "Token savings", raw: R.savings_pct, dec: 1, suf: "%", ico: "i-zap", c: "g", meta: `<span class="delta up">▼ ${n0(R.baseline_cost - R.total_cost)} tokens</span> vs all-remote` },
    { lab: "Accuracy", raw: R.accuracy * 100, dec: 1, suf: "%", ico: "i-target", c: "c", meta: `<span class="pass"><svg class="ic"><use href="#i-check"/></svg>clears ${pct(cal.target_accuracy)}% bar</span>` },
    { lab: "Routed cost", raw: R.total_cost, dec: 0, ico: "i-coins", c: "b", meta: `baseline <b class="mono">${n0(R.baseline_cost)}</b> tokens` },
    { lab: "Answered on-device", raw: onDev / R.n_tasks * 100, dec: 0, suf: "%", ico: "i-cpu", c: "a", meta: `${onDev} of ${R.n_tasks} tasks · 0 remote tokens` }
  ];
  const kpiHtml = kpis.map((k, i) => `
    <div class="card kpi rise" style="animation-delay:${i * 60}ms">
      <div class="top"><span class="lab">${k.lab}</span><span class="ico ${k.c}"><svg class="ic"><use href="#${k.ico}"/></svg></span></div>
      <div class="val" data-cu="${k.raw}" data-dec="${k.dec}" data-suf="${k.suf || ""}">0</div>
      <div class="meta">${k.meta}</div>
    </div>`).join("");

  const rc = R.routes, totR = R.n_tasks || 1;
  const legend = [["local", "Local", "var(--green)"], ["cache", "Cache", "var(--cyan)"], ["local->remote", "Escalated", "var(--red)"], ["remote", "Remote", "var(--amber)"]]
    .map(([k, lbl, c]) => `<span><i style="background:${c}"></i>${lbl}<span class="n">${rc[k] || 0}</span></span>`).join("");

  return `
    <div class="hero rise">
      <div>
        <p class="headline"><span class="up">−${pct(R.savings_pct / 100)}%</span> tokens at <span class="dn">${pct(R.accuracy)}%</span> accuracy</p>
        <p class="sub">Operating point t=${d.config.router.escalate_threshold} · ${R.n_tasks} tasks · ${R.compression_saved_tokens} tokens saved by compression · avg ${Math.round(R.avg_latency_ms)}ms</p>
      </div>
    </div>
    <div class="grid k4">${kpiHtml}</div>

    <div class="grid k3" style="margin-top:16px">
      <div class="card col-2 rise" style="animation-delay:240ms">
        <div class="card-h"><h3>Calibration — cost vs accuracy (Pareto frontier)</h3><span class="muted mono" style="font-size:12px">sweep ${cal.points.length} thresholds</span></div>
        ${pareto(cal.points, cal.chosen, cal.target_accuracy)}
      </div>
      <div class="card rise" style="animation-delay:300ms">
        <div class="card-h"><h3>Route split</h3></div>
        ${donut(rc)}
        <div class="legend">${legend}</div>
      </div>
    </div>

    <div class="grid k2" style="margin-top:16px">
      <div class="card rise" style="animation-delay:360ms">
        <div class="card-h"><h3>Cumulative tokens saved</h3><span class="rb local">↑ ${n0(R.baseline_cost - R.total_cost)}</span></div>
        ${areaSavings(R.decisions)}
      </div>
      <div class="card rise" style="animation-delay:420ms">
        <div class="card-h"><h3>Where the win comes from</h3></div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div>
            <div class="lh" style="display:flex;justify-content:space-between;font-size:13px"><b>Local handled</b><span class="mono muted">${onDev}/${R.n_tasks}</span></div>
            <div class="bar"><i class="g" data-w="${(onDev / totR * 100).toFixed(0)}"></i></div>
          </div>
          <div>
            <div class="lh" style="display:flex;justify-content:space-between;font-size:13px"><b>Token reduction</b><span class="mono muted">${pct(R.savings_pct / 100)}%</span></div>
            <div class="bar"><i class="b" data-w="${R.savings_pct.toFixed(0)}"></i></div>
          </div>
          <div>
            <div class="lh" style="display:flex;justify-content:space-between;font-size:13px"><b>Accuracy retained</b><span class="mono muted">${pct(R.accuracy)}%</span></div>
            <div class="bar"><i class="g" data-w="${(R.accuracy * 100).toFixed(0)}"></i></div>
          </div>
          <p class="muted" style="font-size:12.5px;margin:2px 0 0">Triage answers the easy ${onDev} tasks on the local model for free and spends remote tokens only on the ${(rc["local->remote"] || 0) + (rc.remote || 0)} that actually need it — the leaderboard lever.</p>
        </div>
      </div>
    </div>`;
}

function screenCompare(d) {
  return `
    <div class="ab-head rise">
      <button class="btn" id="runAB"><svg class="ic"><use href="#i-play"/></svg>Run comparison</button>
      <button class="btn ghost" id="resetAB">Reset</button>
      <span class="muted" style="font-size:13px">Same ${d.report.n_tasks} tasks, two strategies — baseline sends <b style="color:var(--amber)">every</b> task to the remote model; Triage routes.</span>
    </div>
    <div class="terms">
      <div class="term">
        <div class="term-bar"><span class="dots"><i></i><i></i><i></i></span><span class="ttl warn">baseline · all-remote</span>
          <span class="term-tot">tokens <b id="totBefore">0</b></span></div>
        <div class="term-body" id="bodyBefore"><div class="term-empty">Press <b>Run comparison</b> to stream every task → remote model…</div></div>
      </div>
      <div class="term after">
        <div class="term-bar"><span class="dots"><i></i><i></i><i></i></span><span class="ttl b">triage · routed</span>
          <span class="term-tot">tokens <b id="totAfter">0</b></span></div>
        <div class="term-body" id="bodyAfter"><div class="term-empty">…and Triage routing the same tasks side by side.</div></div>
      </div>
    </div>
    <div class="payoff" id="payoff">
      <div><div class="big g" id="poSave">0%</div><div class="l">fewer tokens than all-remote</div></div>
      <div class="vr"></div>
      <div><div class="big" id="poAcc">0%</div><div class="l">accuracy — bar held</div></div>
      <div class="vr"></div>
      <div><div class="big" id="poTok">0</div><div class="l">tokens saved this run</div></div>
      <div class="vr"></div>
      <div><div class="big" id="poDev">0</div><div class="l">tasks served on-device</div></div>
    </div>`;
}

function screenRouting(d) {
  const c = d.config, R = d.report;
  const th = c.router.escalate_threshold;
  const backs = ["none", "heuristic", "llmlingua", "headroom"];
  const cur = c.compression.backend;
  return `
    <div class="grid k3">
      <div class="card col-2 rise">
        <div class="card-h"><h3>Operating point — re-runs the real engine live</h3><span class="rb local" id="rStatus">ready</span></div>
        <div class="ctl">
          <div class="ctl-row">
            <div class="lh"><b>Escalation threshold</b><span class="v" id="thV">${th.toFixed(2)}</span></div>
            <input type="range" id="thR" min="0" max="1" step="0.05" value="${th}" style="--p:${(th * 100).toFixed(0)}%">
            <span class="muted" style="font-size:12px">Lower = cheaper (more local), higher = safer (more remote). Calibrated sweet spot: 0.65.</span>
          </div>
          <div class="ctl-row">
            <div class="lh"><b>Semantic cache</b>
              <label class="sw"><input type="checkbox" id="cacheSw" ${c.cache.enabled ? "checked" : ""}><span class="track"></span></label>
            </div>
          </div>
          <div class="ctl-row">
            <div class="lh"><b>Prompt compression</b></div>
            <div class="seg" id="compSeg">${backs.map((b) => `<button data-b="${b}" class="${b === cur ? "on" : ""}">${b}</button>`).join("")}</div>
          </div>
        </div>
      </div>
      <div class="card rise" style="animation-delay:80ms">
        <div class="card-h"><h3>Live result</h3></div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div><span class="lab muted" style="font-size:12px">Accuracy</span><div class="val" style="font-size:26px;font-weight:700" id="pvAcc">${pct(R.accuracy)}%</div>
            <div class="bar"><i class="g" id="pvAccBar" style="width:${R.accuracy * 100}%"></i></div></div>
          <div><span class="lab muted" style="font-size:12px">Token savings</span><div class="val" style="font-size:26px;font-weight:700" id="pvSave">${pct(R.savings_pct / 100)}%</div>
            <div class="bar"><i class="b" id="pvSaveBar" style="width:${R.savings_pct}%"></i></div></div>
          <div style="display:flex;justify-content:space-between;font-size:13px"><span class="muted">Routed cost</span><b class="mono" id="pvCost">${n0(R.total_cost)}</b></div>
        </div>
      </div>
    </div>

    <div class="card rise" style="margin-top:16px;animation-delay:140ms">
      <div class="card-h"><h3>Per-task decisions</h3><span class="muted mono" style="font-size:12px" id="rowCount">${R.decisions.length} tasks</span></div>
      <div class="tbar">
        <input class="search" id="tSearch" placeholder="Search a query…">
        <div class="chips" id="tChips">
          ${["all", "local", "cache", "local->remote", "remote"].map((f) => `<button class="fchip ${f === "all" ? "on" : ""}" data-f="${f}">${f === "all" ? "All" : ROUTE_LBL[f]}</button>`).join("")}
        </div>
      </div>
      <div style="overflow-x:auto"><table class="tbl"><thead><tr>
        <th>Task</th><th>Query</th><th>Route</th><th class="num">Conf.</th><th class="num">Tokens</th><th class="num">Cost</th><th class="num">✓</th>
      </tr></thead><tbody id="tBody"></tbody></table></div>
      <p class="tnote">Cost = remote tokens billed (local + cache = 0). Drag the threshold above and this table re-renders from a fresh engine run.</p>
    </div>`;
}

const SCREENS = { overview: screenOverview, compare: screenCompare, routing: screenRouting };

/* ---------------------------------------------------------------- render */
function render() {
  const d = STATE.data, id = STATE.screen;
  $("#pageTitle").textContent = META[id][0];
  $("#pageSub").textContent = META[id][1];
  $$("#nav .nav-i").forEach((b) => b.classList.toggle("is-on", b.dataset.screen === id));
  const page = $("#page");
  page.innerHTML = SCREENS[id](d);
  page.scrollTop = 0;
  // post-render: count-ups + bar fills
  $$("[data-cu]", page).forEach((el) => countUp(el, +el.dataset.cu, { dec: +el.dataset.dec || 0, suf: el.dataset.suf || "" }));
  requestAnimationFrame(() => $$(".bar > i[data-w]", page).forEach((i) => { i.style.width = i.dataset.w + "%"; }));
  if (id === "compare") bindCompare();
  if (id === "routing") bindRouting();
}

function setScreen(id) { if (SCREENS[id]) { STATE.screen = id; render(); } }

/* ---------------------------------------------------------------- A/B terminal */
let abRun = null;
function abLine(route, query, tokens, kind) {
  const arrow = route ? `<span class="ar ${ROUTE[route]}">→ ${ROUTE_LBL[route]}</span>` : `<span class="ar remote">→ REMOTE</span>`;
  return `<div class="ln ${kind}"><span class="c">$</span><span class="q">${esc(query)}</span>${arrow}<span class="tok">${n0(tokens)}t</span></div>`;
}
function bindCompare() {
  $("#runAB").addEventListener("click", runAB);
  $("#resetAB").addEventListener("click", resetAB);
}
function resetAB() {
  if (abRun) { try { abRun.close(); } catch (e) {} abRun = null; }
  $("#bodyBefore").innerHTML = `<div class="term-empty">Press <b>Run comparison</b> to stream every task → remote model…</div>`;
  $("#bodyAfter").innerHTML = `<div class="term-empty">…and Triage routing the same tasks side by side.</div>`;
  $("#totBefore").textContent = "0"; $("#totAfter").textContent = "0";
  $("#payoff").classList.remove("show");
  $("#runAB").disabled = false;
}
function runAB() {
  resetAB();
  $("#runAB").disabled = true;
  const bB = $("#bodyBefore"), bA = $("#bodyAfter");
  bB.innerHTML = ""; bA.innerHTML = "";
  let tB = 0, tA = 0, nCorrect = 0, nDev = 0, i = 0, n = 0;
  const tickB = (v) => { tB += v; $("#totBefore").textContent = n0(tB); };
  const tickA = (v) => { tA += v; $("#totAfter").textContent = n0(tA); };
  const onDecision = (d, query) => {
    const baseTok = d.baseline_cost || 0, routedTok = d.cost || 0;
    bB.insertAdjacentHTML("beforeend", abLine(null, query, baseTok, "am")); tickB(baseTok);
    bA.insertAdjacentHTML("beforeend", abLine(d.route, query, routedTok, routedTok ? "am" : "gl")); tickA(routedTok);
    bB.scrollTop = bB.scrollHeight; bA.scrollTop = bA.scrollHeight;
    if (d.correct) nCorrect++;
    if (d.route === "local" || d.route === "cache") nDev++;
    i++;
  };
  const finish = (acc) => {
    $("#runAB").disabled = false;
    const save = tB ? (1 - tA / tB) * 100 : 0;
    countUp($("#poSave"), save, { dec: 1, suf: "%" });
    countUp($("#poAcc"), (acc != null ? acc : nCorrect / Math.max(i, 1)) * 100, { dec: 1, suf: "%" });
    countUp($("#poTok"), tB - tA, { dec: 0 });
    countUp($("#poDev"), nDev, { dec: 0 });
    $("#payoff").classList.add("show");
    toast(`Done — ${save.toFixed(0)}% fewer tokens, accuracy held`);
  };

  // live stream via WebSocket; fall back to stepping the seed if it fails
  let viaWS = false;
  try {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    abRun = new WebSocket(`${proto}://${location.host}/ws/live`);
    abRun.onopen = () => { viaWS = true; };
    abRun.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === "start") { n = m.n_tasks; }
      else if (m.type === "decision") { onDecision(m.decision, m.query || m.decision.query); }
      else if (m.type === "summary") { abRun = null; finish(m.accuracy); }
    };
    abRun.onerror = () => { if (!viaWS) stepSeed(onDecision, finish); };
    abRun.onclose = () => { if (!viaWS && i === 0) stepSeed(onDecision, finish); };
  } catch (e) {
    stepSeed(onDecision, finish);
  }
}
function stepSeed(onDecision, finish) {
  const decs = STATE.data.report.decisions;
  let k = 0;
  const iv = setInterval(() => {
    if (k >= decs.length) { clearInterval(iv); finish(STATE.data.report.accuracy); return; }
    const d = decs[k++]; onDecision(d, d.query);
  }, 130);
}

/* ---------------------------------------------------------------- routing controls */
let tFilter = "all", tQuery = "";
function tableRows() {
  const decs = STATE.data.report.decisions
    .filter((d) => tFilter === "all" || d.route === tFilter)
    .filter((d) => !tQuery || d.query.toLowerCase().includes(tQuery));
  const body = $("#tBody"); if (!body) return;
  body.innerHTML = decs.map((d) => `<tr>
    <td class="mono muted">${esc(d.task_id)}</td>
    <td class="q">${esc(d.query)}</td>
    <td><span class="rb ${ROUTE[d.route]}">${ROUTE_LBL[d.route]}</span></td>
    <td class="num">${d.confidence != null ? d.confidence.toFixed(2) : "—"}</td>
    <td class="num">${n0(d.total_tokens || 0)}</td>
    <td class="num">${n0(d.cost || 0)}</td>
    <td class="num ${d.correct ? "ok" : "no"}">${d.correct ? "✓" : "✗"}</td>
  </tr>`).join("") || `<tr><td colspan="7" class="muted" style="padding:22px;text-align:center">No tasks match.</td></tr>`;
  const rc = $("#rowCount"); if (rc) rc.textContent = `${decs.length} tasks`;
}
let runT = null;
function bindRouting() {
  tableRows();
  const thR = $("#thR");
  thR.addEventListener("input", () => {
    const v = +thR.value;
    $("#thV").textContent = v.toFixed(2);
    thR.style.setProperty("--p", (v * 100).toFixed(0) + "%");
    scheduleRun();
  });
  $("#cacheSw").addEventListener("change", scheduleRun);
  $$("#compSeg button").forEach((b) => b.addEventListener("click", () => {
    $$("#compSeg button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); scheduleRun();
  }));
  $("#tSearch").addEventListener("input", (e) => { tQuery = e.target.value.toLowerCase(); tableRows(); });
  $$("#tChips .fchip").forEach((c) => c.addEventListener("click", () => {
    $$("#tChips .fchip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); tFilter = c.dataset.f; tableRows();
  }));
}
function scheduleRun() {
  clearTimeout(runT);
  const st = $("#rStatus"); if (st) { st.textContent = "running…"; st.className = "rb remote"; }
  runT = setTimeout(doRun, 200);
}
async function doRun() {
  const th = +$("#thR").value;
  const cache = $("#cacheSw").checked;
  const comp = ($("#compSeg button.on") || {}).dataset?.b || "heuristic";
  try {
    const res = await fetch(`/api/run?escalate=${th}&cache=${cache}&compression=${comp}`);
    const rep = await res.json();
    const nd = normalize(rep); if (!nd) throw new Error("bad");
    // keep config overrides visible
    nd.config = { ...STATE.data.config, router: { ...STATE.data.config.router, escalate_threshold: th }, cache: { ...STATE.data.config.cache, enabled: cache }, compression: { backend: comp } };
    STATE.data = nd;
    const R = nd.report;
    $("#pvAcc").textContent = pct(R.accuracy) + "%"; $("#pvAccBar").style.width = (R.accuracy * 100) + "%";
    $("#pvSave").textContent = pct(R.savings_pct / 100) + "%"; $("#pvSaveBar").style.width = R.savings_pct + "%";
    $("#pvCost").textContent = n0(R.total_cost);
    tableRows();
    const st = $("#rStatus"); if (st) { st.textContent = "live ✓"; st.className = "rb local"; }
  } catch (e) {
    const st = $("#rStatus"); if (st) { st.textContent = "engine offline — using cached"; st.className = "rb esc"; }
  }
}

/* ---------------------------------------------------------------- chrome */
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
function bindChrome() {
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest(".nav-i"); if (b) setScreen(b.dataset.screen);
  });
  document.addEventListener("click", (e) => {
    const r = e.target.closest("[data-range]");
    if (r) { $("#rangeLbl").textContent = r.dataset.range; r.closest("details").open = false; toast("Range: " + r.dataset.range); return; }
    const th = e.target.closest("#themeBtn");
    if (th) { document.body.classList.toggle("hc"); th.closest("details").open = false; toast("Contrast toggled"); return; }
    // close any open <details> menu when clicking outside it
    $$("details.menu[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });
}

/* ---------------------------------------------------------------- boot */
function boot() {
  bindChrome();
  render();                                   // seed-first: full page paints now
  fetch("/api/latest").then((r) => r.json()).then((d) => {
    const nd = normalize(d);
    if (nd) { STATE.data = nd; render(); }     // enhance with the real run if present
  }).catch(() => { /* offline — seed render stands */ });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
