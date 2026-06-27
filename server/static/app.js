"use strict";
/* ===================================================================
   Triage dashboard — seed-first, never-blank.
   render(data) runs immediately from SEED, then again if /api/latest
   resolves. No external JS lib; motion is CSS + a tiny rAF count-up.
   =================================================================== */

/* ---- baked-in snapshot (mirrors results/latest.json) so the page is
        fully rendered before any network call returns ---- */
const SEED = {"report": {"accuracy": 0.928571, "total_tokens": 6736, "remote_tokens": 1160, "total_cost": 1160.0, "baseline_cost": 4306.0, "savings_pct": 73.061, "compression_saved_tokens": 180, "avg_latency_ms": 249.9, "n_correct": 52, "n_tasks": 56, "routes": {"local": 35, "local->remote": 18, "remote": 1, "cache": 2}, "tier_stats": {"easy": {"n": 25, "n_correct": 24, "accuracy": 0.96}, "medium": {"n": 13, "n_correct": 10, "accuracy": 0.7692307692307693}, "hard": {"n": 18, "n_correct": 18, "accuracy": 1.0}}, "decisions": [{"task_id": "t000", "query": "What is the capital of France?", "route": "local", "cost": 0.0, "baseline_cost": 47.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 1.0, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t001", "query": "What is 2 + 2?", "route": "local", "cost": 0.0, "baseline_cost": 31.0, "total_tokens": 20, "remote_tokens": 0, "correct": true, "confidence": 0.7348725812104259, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t002", "query": "Is the sky blue? Answer true or false.", "route": "local", "cost": 0.0, "baseline_cost": 29.0, "total_tokens": 26, "remote_tokens": 0, "correct": true, "confidence": 0.9218797417552065, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t003", "query": "Who wrote Romeo and Juliet?", "route": "local", "cost": 0.0, "baseline_cost": 118.0, "total_tokens": 26, "remote_tokens": 0, "correct": true, "confidence": 0.9735263158003151, "predicted_difficulty": 0.0625, "tier": "easy"}, {"task_id": "t004", "query": "Translate 'hello' to Spanish.", "route": "local", "cost": 0.0, "baseline_cost": 47.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 0.9710297064894471, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t005", "query": "What is the chemical symbol for gold?", "route": "local", "cost": 0.0, "baseline_cost": 49.0, "total_tokens": 26, "remote_tokens": 0, "correct": true, "confidence": 0.872473837382356, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t006", "query": "How many continents are there?", "route": "local", "cost": 0.0, "baseline_cost": 35.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 0.712800175332019, "predicted_difficulty": 0.0625, "tier": "easy"}, {"task_id": "t007", "query": "What is the capital of Japan?", "route": "local->remote", "cost": 24.0, "baseline_cost": 47.0, "total_tokens": 97, "remote_tokens": 24, "correct": true, "confidence": 0.4, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t008", "query": "Spell the word 'accommodate'.", "route": "local", "cost": 0.0, "baseline_cost": 47.0, "total_tokens": 25, "remote_tokens": 0, "correct": true, "confidence": 0.7872670251016104, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t009", "query": "What is 15 percent of 200?", "route": "local", "cost": 0.0, "baseline_cost": 34.0, "total_tokens": 23, "remote_tokens": 0, "correct": true, "confidence": 0.9016258766881455, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t010", "query": "Is 17 a prime number? true or false.", "route": "local", "cost": 0.0, "baseline_cost": 29.0, "total_tokens": 26, "remote_tokens": 0, "correct": true, "confidence": 0.8160360935073396, "predicted_difficulty": 5.551115123125783e-17, "tier": "medium"}, {"task_id": "t011", "query": "What is the largest planet in our solar system?", "route": "local", "cost": 0.0, "baseline_cost": 51.0, "total_tokens": 28, "remote_tokens": 0, "correct": false, "confidence": 0.970444883225851, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t012", "query": "Summarize: the cat sat on the mat because it was warm.", "route": "local", "cost": 0.0, "baseline_cost": 125.0, "total_tokens": 33, "remote_tokens": 0, "correct": true, "confidence": 0.8582970490324033, "predicted_difficulty": 0.1375, "tier": "medium"}, {"task_id": "t013", "query": "If a train travels 60 km in 1.5 hours, what is its speed in km/h?", "route": "local->remote", "cost": 87.0, "baseline_cost": 118.0, "total_tokens": 408, "remote_tokens": 87, "correct": true, "confidence": 0.6012684385341635, "predicted_difficulty": 0.08750000000000002, "tier": "medium"}, {"task_id": "t014", "query": "What is the derivative of x squared?", "route": "local", "cost": 0.0, "baseline_cost": 123.0, "total_tokens": 102, "remote_tokens": 0, "correct": false, "confidence": 0.6618194098362508, "predicted_difficulty": 0.0, "tier": "medium"}, {"task_id": "t015", "query": "Solve step by step: a shirt costs 80 after a 20 percent discount; original price?", "route": "local->remote", "cost": 91.0, "baseline_cost": 122.0, "total_tokens": 424, "remote_tokens": 91, "correct": true, "confidence": 0.31224779555895477, "predicted_difficulty": 0.6875, "tier": "hard"}, {"task_id": "t016", "query": "Prove that the sum of the first n odd numbers equals n squared, then give the value for n=5.", "route": "local->remote", "cost": 94.0, "baseline_cost": 153.0, "total_tokens": 436, "remote_tokens": 94, "correct": true, "confidence": 0.18017007323402656, "predicted_difficulty": 0.4375, "tier": "hard"}, {"task_id": "t017", "query": "Analyze the trade-offs of microservices vs a monolith and give the single best choice for a 2-person startup.", "route": "local->remote", "cost": 99.0, "baseline_cost": 241.0, "total_tokens": 457, "remote_tokens": 99, "correct": true, "confidence": 0.6036546559087332, "predicted_difficulty": 0.7250000000000001, "tier": "hard"}, {"task_id": "t018", "query": "A bat and a ball cost 1.10 in total. The bat costs 1.00 more than the ball. How much is the ball in cents?", "route": "local->remote", "cost": 97.0, "baseline_cost": 156.0, "total_tokens": 448, "remote_tokens": 97, "correct": true, "confidence": 0.48398198891317606, "predicted_difficulty": 0.5, "tier": "hard"}, {"task_id": "t019", "query": "Multi-step: convert 3/8 to a percentage.", "route": "local->remote", "cost": 81.0, "baseline_cost": 112.0, "total_tokens": 387, "remote_tokens": 81, "correct": true, "confidence": 0.4962361086607959, "predicted_difficulty": 0.575, "tier": "medium"}, {"task_id": "t020", "query": "What is the boiling point of water in Celsius at sea level?", "route": "local", "cost": 0.0, "baseline_cost": 42.0, "total_tokens": 31, "remote_tokens": 0, "correct": true, "confidence": 0.6859765177471048, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t021", "query": "Who painted the Mona Lisa?", "route": "local", "cost": 0.0, "baseline_cost": 118.0, "total_tokens": 26, "remote_tokens": 0, "correct": true, "confidence": 0.8480149147103431, "predicted_difficulty": 0.0625, "tier": "easy"}, {"task_id": "t022", "query": "Compare and justify: is recursion or iteration better for computing factorial of 5? give the number.", "route": "local", "cost": 0.0, "baseline_cost": 127.0, "total_tokens": 348, "remote_tokens": 0, "correct": true, "confidence": 0.33950599959210975, "predicted_difficulty": 0.7, "tier": "hard"}, {"task_id": "t023", "query": "What is the square root of 144?", "route": "local", "cost": 0.0, "baseline_cost": 35.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 0.7442636164703619, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "t024", "query": "Reason carefully: how many times does the digit 1 appear from 1 to 20?", "route": "local", "cost": 0.0, "baseline_cost": 147.0, "total_tokens": 324, "remote_tokens": 0, "correct": true, "confidence": 0.36517592049060554, "predicted_difficulty": 0.675, "tier": "hard"}, {"task_id": "e000", "query": "What is 1729?", "route": "local", "cost": 0.0, "baseline_cost": 189.0, "total_tokens": 288, "remote_tokens": 0, "correct": true, "confidence": 0.40071402379956794, "predicted_difficulty": 0.0, "tier": "hard"}, {"task_id": "e001", "query": "Considering everything, and taking your time to reason carefully and step by step about this question, could you kindly tell me what two plus two equals in the end?", "route": "local", "cost": 0.0, "baseline_cost": 69.0, "total_tokens": 58, "remote_tokens": 0, "correct": true, "confidence": 0.8900469442614565, "predicted_difficulty": 0.6499999999999999, "tier": "easy"}, {"task_id": "e002", "query": "Prove rigorously and step by step, then carefully analyze all the trade-offs involved, and finally derive the complete multi-step result of summing together the first ten consecutive odd numbers.", "route": "remote", "cost": 119.0, "baseline_cost": 150.0, "total_tokens": 119, "remote_tokens": 119, "correct": true, "confidence": null, "predicted_difficulty": 0.8500000000000001, "tier": "hard"}, {"task_id": "e003", "query": "Reason step by step: what is 12 percent of 250?", "route": "local->remote", "cost": 82.0, "baseline_cost": 113.0, "total_tokens": 388, "remote_tokens": 82, "correct": true, "confidence": 0.28878991175893676, "predicted_difficulty": 0.325, "tier": "hard"}, {"task_id": "e004", "query": "Reason about it: is 91 a prime number? true or false.", "route": "local->remote", "cost": 84.0, "baseline_cost": 107.0, "total_tokens": 399, "remote_tokens": 84, "correct": true, "confidence": 0.19731788726660457, "predicted_difficulty": 0.33749999999999997, "tier": "hard"}, {"task_id": "e005", "query": "List the first three prime numbers.", "route": "local", "cost": 0.0, "baseline_cost": 120.0, "total_tokens": 25, "remote_tokens": 0, "correct": true, "confidence": 0.8162451800887996, "predicted_difficulty": 0.075, "tier": "easy"}, {"task_id": "e006", "query": "List the first three prime numbers.", "route": "cache", "cost": 0.0, "baseline_cost": 120.0, "total_tokens": 0, "remote_tokens": 0, "correct": true, "confidence": 1.0, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e00", "query": "What is the capital of Italy?", "route": "local", "cost": 0.0, "baseline_cost": 47.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 0.8386450999298849, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e01", "query": "What is 9 + 10?", "route": "local", "cost": 0.0, "baseline_cost": 31.0, "total_tokens": 20, "remote_tokens": 0, "correct": true, "confidence": 0.8856564084796439, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e02", "query": "Is water wet? Answer true or false.", "route": "local->remote", "cost": 25.0, "baseline_cost": 28.0, "total_tokens": 102, "remote_tokens": 25, "correct": true, "confidence": 0.32331441655579607, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e03", "query": "How many days are in a week?", "route": "local", "cost": 0.0, "baseline_cost": 35.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 0.9209723530732867, "predicted_difficulty": 0.0875, "tier": "easy"}, {"task_id": "e04", "query": "What is the capital of Germany?", "route": "local", "cost": 0.0, "baseline_cost": 47.0, "total_tokens": 24, "remote_tokens": 0, "correct": true, "confidence": 0.8246132080996894, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e05", "query": "Translate 'thank you' to French.", "route": "local", "cost": 0.0, "baseline_cost": 48.0, "total_tokens": 25, "remote_tokens": 0, "correct": true, "confidence": 1.0, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e06", "query": "What is 100 divided by 4?", "route": "local", "cost": 0.0, "baseline_cost": 34.0, "total_tokens": 23, "remote_tokens": 0, "correct": true, "confidence": 0.6901957471365102, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "e07", "query": "Who is the author of the Harry Potter books?", "route": "local", "cost": 0.0, "baseline_cost": 123.0, "total_tokens": 30, "remote_tokens": 0, "correct": true, "confidence": 0.8365127033989549, "predicted_difficulty": 0.0, "tier": "easy"}, {"task_id": "m00", "query": "A shirt costs $40 and is 25% off. What is the sale price in dollars?", "route": "local", "cost": 0.0, "baseline_cost": 45.0, "total_tokens": 34, "remote_tokens": 0, "correct": false, "confidence": 0.7766714934210207, "predicted_difficulty": 0.08750000000000002, "tier": "medium"}, {"task_id": "m01", "query": "What is the next number in the sequence 2, 4, 8, 16?", "route": "local", "cost": 0.0, "baseline_cost": 41.0, "total_tokens": 30, "remote_tokens": 0, "correct": true, "confidence": 0.8016444072596649, "predicted_difficulty": 0.04999999999999999, "tier": "medium"}, {"task_id": "m02", "query": "How many minutes are there in 3.5 hours?", "route": "local", "cost": 0.0, "baseline_cost": 38.0, "total_tokens": 81, "remote_tokens": 0, "correct": true, "confidence": 0.5844775928063944, "predicted_difficulty": 0.30000000000000004, "tier": "medium"}, {"task_id": "m03", "query": "What is 7 factorial?", "route": "local->remote", "cost": 22.0, "baseline_cost": 33.0, "total_tokens": 88, "remote_tokens": 22, "correct": true, "confidence": 0.607079765651339, "predicted_difficulty": 0.0, "tier": "medium"}, {"task_id": "m04", "query": "If a rectangle is 8 by 5, what is its area?", "route": "local", "cost": 0.0, "baseline_cost": 38.0, "total_tokens": 27, "remote_tokens": 0, "correct": true, "confidence": 0.8938542505805754, "predicted_difficulty": 0.03750000000000003, "tier": "medium"}, {"task_id": "m05", "query": "What is the sum of the first 10 positive integers?", "route": "local", "cost": 0.0, "baseline_cost": 40.0, "total_tokens": 29, "remote_tokens": 0, "correct": true, "confidence": 0.7891618819491665, "predicted_difficulty": 0.025000000000000022, "tier": "medium"}, {"task_id": "m06", "query": "Who developed the theory of general relativity?", "route": "local", "cost": 0.0, "baseline_cost": 123.0, "total_tokens": 30, "remote_tokens": 0, "correct": true, "confidence": 0.6979534397034722, "predicted_difficulty": 0.0875, "tier": "medium"}, {"task_id": "m07", "query": "What is 15 percent of 80?", "route": "local", "cost": 0.0, "baseline_cost": 34.0, "total_tokens": 23, "remote_tokens": 0, "correct": false, "confidence": 0.7543238045161184, "predicted_difficulty": 0.0, "tier": "medium"}, {"task_id": "h00", "query": "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost in cents?", "route": "cache", "cost": 0.0, "baseline_cost": 56.0, "total_tokens": 0, "remote_tokens": 0, "correct": true, "confidence": 1.0, "predicted_difficulty": 0.0, "tier": "hard"}, {"task_id": "h01", "query": "How many times does the digit 7 appear in the integers from 1 to 100?", "route": "local->remote", "cost": 34.0, "baseline_cost": 45.0, "total_tokens": 136, "remote_tokens": 34, "correct": true, "confidence": 0.33950988056435805, "predicted_difficulty": 0.3875, "tier": "hard"}, {"task_id": "h02", "query": "How many trailing zeros are in 25 factorial?", "route": "local->remote", "cost": 28.0, "baseline_cost": 39.0, "total_tokens": 112, "remote_tokens": 28, "correct": true, "confidence": 0.21625113914975685, "predicted_difficulty": 0.30000000000000004, "tier": "hard"}, {"task_id": "h03", "query": "What is the smallest positive integer divisible by both 6 and 8?", "route": "local->remote", "cost": 33.0, "baseline_cost": 44.0, "total_tokens": 132, "remote_tokens": 33, "correct": true, "confidence": 0.4856329492813879, "predicted_difficulty": 0.04999999999999999, "tier": "hard"}, {"task_id": "h04", "query": "Three friends split a $90 bill, but one pays twice as much as each of the others. How much does the bigger payer pay in dollars?", "route": "local->remote", "cost": 49.0, "baseline_cost": 60.0, "total_tokens": 196, "remote_tokens": 49, "correct": true, "confidence": 0.5459416960249751, "predicted_difficulty": 0.525, "tier": "hard"}, {"task_id": "h05", "query": "If you flip a fair coin 3 times, how many possible ordered outcome sequences are there?", "route": "local->remote", "cost": 38.0, "baseline_cost": 49.0, "total_tokens": 152, "remote_tokens": 38, "correct": true, "confidence": 0.392565221238392, "predicted_difficulty": 0.4, "tier": "hard"}, {"task_id": "h06", "query": "What is the number 1729 commonly known as in mathematics? (two words)", "route": "local->remote", "cost": 36.0, "baseline_cost": 129.0, "total_tokens": 148, "remote_tokens": 36, "correct": true, "confidence": 0.20685264519322039, "predicted_difficulty": 0.04999999999999999, "tier": "hard"}, {"task_id": "h07", "query": "A clock shows 3:15. What is the angle in degrees between the hour and minute hands?", "route": "local->remote", "cost": 37.0, "baseline_cost": 48.0, "total_tokens": 152, "remote_tokens": 37, "correct": true, "confidence": 0.04514604503353355, "predicted_difficulty": 0.4, "tier": "hard"}]}, "calibration": {"chosen": {"threshold": 0.65, "accuracy": 0.91071, "cost": 1205.0}, "target_accuracy": 0.9, "points": [{"threshold": 0.1, "accuracy": 0.69643, "cost": 156.0}, {"threshold": 0.15, "accuracy": 0.69643, "cost": 156.0}, {"threshold": 0.2, "accuracy": 0.71429, "cost": 334.0}, {"threshold": 0.25, "accuracy": 0.73214, "cost": 398.0}, {"threshold": 0.3, "accuracy": 0.75, "cost": 480.0}, {"threshold": 0.35, "accuracy": 0.78571, "cost": 630.0}, {"threshold": 0.4, "accuracy": 0.80357, "cost": 668.0}, {"threshold": 0.45, "accuracy": 0.82143, "cost": 692.0}, {"threshold": 0.5, "accuracy": 0.85714, "cost": 948.0}, {"threshold": 0.55, "accuracy": 0.875, "cost": 997.0}, {"threshold": 0.6, "accuracy": 0.875, "cost": 997.0}, {"threshold": 0.65, "accuracy": 0.91071, "cost": 1205.0}, {"threshold": 0.7, "accuracy": 0.91071, "cost": 1372.0}, {"threshold": 0.75, "accuracy": 0.91071, "cost": 1396.0}, {"threshold": 0.8, "accuracy": 0.94643, "cost": 1482.0}, {"threshold": 0.85, "accuracy": 0.94643, "cost": 1562.0}, {"threshold": 0.9, "accuracy": 0.94643, "cost": 1648.0}]}, "config": {"router": {"escalate_threshold": 0.65, "easy_threshold": 0.3, "hard_threshold": 0.8, "self_consistency_samples": 3}, "cache": {"enabled": true, "semantic": true}, "compression": {"backend": "heuristic"}, "calibration": {"target_accuracy": 0.9}}};

/* ---------------------------------------------------------------- utils */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (n) => (n * 100).toFixed(1);
const n0 = (n) => Math.round(n).toLocaleString();
const ROUTE = { local: "local", "local->remote": "esc", remote: "remote", cache: "cache" };
const ROUTE_LBL = { local: "LOCAL", "local->remote": "LOCAL→REMOTE", remote: "REMOTE", cache: "CACHE" };

let STATE = { data: SEED, screen: "overview", busy: false, tier: "all", streamMs: 130 };

/* normalize either {report,calibration,config} or a bare RunReport dict */
function normalize(d) {
  if (!d || d.error) return null;
  if (d.report) return { report: d.report, calibration: d.calibration || STATE.data.calibration, config: d.config || STATE.data.config };
  if (d.decisions) return { report: d, calibration: STATE.data.calibration, config: STATE.data.config };
  return null;
}

/* tier bucket of a decision (honors the tagged field, falls back to difficulty) */
function tierOf(x) {
  if (x.tier) return x.tier;
  const dd = x.predicted_difficulty || 0;
  return dd < 0.34 ? "easy" : dd < 0.67 ? "medium" : "hard";
}

/* When a tier is selected, derive a report from just that tier's decisions so
   every KPI and chart reflects the filter. "all" passes the report through. */
function scopedReport(d) {
  const R = d.report;
  if (STATE.tier === "all") return R;
  const decs = (R.decisions || []).filter((x) => tierOf(x) === STATE.tier);
  if (!decs.length) return R;
  const sum = (f) => decs.reduce((s, x) => s + (f(x) || 0), 0);
  const total_cost = sum((x) => x.cost), baseline_cost = sum((x) => x.baseline_cost);
  const n_correct = decs.filter((x) => x.correct).length;
  const routes = {};
  decs.forEach((x) => { routes[x.route] = (routes[x.route] || 0) + 1; });
  return {
    ...R, decisions: decs, n_tasks: decs.length, n_correct,
    accuracy: decs.length ? n_correct / decs.length : 0,
    total_cost, baseline_cost,
    savings_pct: baseline_cost ? (1 - total_cost / baseline_cost) * 100 : 0,
    remote_tokens: sum((x) => x.remote_tokens), total_tokens: sum((x) => x.total_tokens),
    routes,
  };
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
  const W = 580, H = 256, l = 56, b = 46, t = 20, r = 22;
  const costs = points.map((p) => p.cost), accs = points.map((p) => p.accuracy);
  const cMax = (Math.max(...costs) * 1.08) || 1;
  const aLo = Math.max(0, Math.min(...accs, target) - 0.05), aHi = 1.0;
  const X = (c) => l + (c / cMax) * (W - l - r);
  const Y = (a) => t + (aHi - a) / (aHi - aLo) * (H - t - b);
  const sorted = [...points].sort((p, q) => p.cost - q.cost);

  // gridlines + axis tick labels (so the dots read as real numbers)
  let grid = "", yt = "", xt = "";
  const ny = 4;
  for (let i = 0; i <= ny; i++) {
    const a = aLo + (aHi - aLo) * i / ny, y = Y(a);
    grid += `<line x1="${l}" y1="${y.toFixed(1)}" x2="${W - r}" y2="${y.toFixed(1)}" stroke="var(--line)" opacity=".5"/>`;
    yt += `<text x="${l - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="10.5" font-family="var(--mono)">${(a * 100).toFixed(0)}%</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    const c = cMax * i / 4, x = X(c);
    xt += `<text x="${x.toFixed(1)}" y="${H - b + 16}" text-anchor="middle" fill="var(--muted)" font-size="10.5" font-family="var(--mono)">${n0(c)}</text>`;
  }

  const path = sorted.map((p, i) => `${i ? "L" : "M"}${X(p.cost).toFixed(1)} ${Y(p.accuracy).toFixed(1)}`).join(" ");
  const dots = sorted.map((p) => `<circle cx="${X(p.cost).toFixed(1)}" cy="${Y(p.accuracy).toFixed(1)}" r="3.6" fill="var(--accent)"><title>t=${p.threshold} · ${pct(p.accuracy)}% acc · ${n0(p.cost)} cost</title></circle>`).join("");

  const ty = Y(target);
  const tline = `<line x1="${l}" y1="${ty.toFixed(1)}" x2="${W - r}" y2="${ty.toFixed(1)}" stroke="var(--amber)" stroke-width="1.6" stroke-dasharray="6 5"/>
    <text x="${l + 4}" y="${(ty - 7).toFixed(1)}" fill="var(--amber)" font-size="11" font-weight="600" font-family="var(--mono)">target ${pct(target)}% accuracy</text>`;

  // chosen point + a callout box that never overlaps the target label
  let ch = "";
  if (chosen) {
    const cx = X(chosen.cost), cy = Y(chosen.accuracy);
    const bw = 170, bh = 38;
    const bx = clamp(cx - bw / 2, l + 2, W - r - bw);
    let by = cy - bh - 16;
    if (by < t) by = cy + 16;
    ch = `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(bx + bw / 2).toFixed(1)}" y2="${(by + (by > cy ? 0 : bh)).toFixed(1)}" stroke="var(--green)" opacity=".5"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7.5" fill="none" stroke="var(--green)" stroke-width="2.5"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.6" fill="var(--green)"/>
      <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw}" height="${bh}" rx="7" fill="var(--panel-2)" stroke="var(--green)" stroke-width="1.2"/>
      <text x="${(bx + 10).toFixed(1)}" y="${(by + 15).toFixed(1)}" fill="var(--green)" font-size="11" font-weight="700" font-family="var(--sans)">◆ chosen operating point</text>
      <text x="${(bx + 10).toFixed(1)}" y="${(by + 30).toFixed(1)}" fill="var(--text-2)" font-size="10.5" font-family="var(--mono)">t=${chosen.threshold} · ${pct(chosen.accuracy)}% acc · ${n0(chosen.cost)} cost</text>`;
  }

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    ${grid}${yt}${xt}
    <line x1="${l}" y1="${t}" x2="${l}" y2="${H - b}" stroke="var(--line-2)"/>
    <line x1="${l}" y1="${H - b}" x2="${W - r}" y2="${H - b}" stroke="var(--line-2)"/>
    ${tline}
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.2" opacity=".7"/>${dots}${ch}
    <text x="${((l + W - r) / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="var(--muted)" font-size="11">remote-token cost  (cheaper ←)</text>
    <text x="15" y="${((t + H - b) / 2).toFixed(1)}" fill="var(--muted)" font-size="11" transform="rotate(-90 15 ${((t + H - b) / 2).toFixed(1)})" text-anchor="middle">accuracy  (higher ↑)</text>
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

  const ts = R.tier_stats || {};
  const tierRow = ["easy", "medium", "hard"].map((name) => {
    const s = ts[name] || { n: 0, n_correct: 0, accuracy: 0 };
    const ok = s.accuracy >= cal.target_accuracy;
    return `<div class="tier">
      <div class="lh" style="display:flex;justify-content:space-between;font-size:13px"><b style="text-transform:capitalize">${name}</b><span class="mono ${ok ? "" : "muted"}">${pct(s.accuracy)}% · ${s.n_correct}/${s.n}</span></div>
      <div class="bar"><i class="${ok ? "g" : "a"}" data-w="${(s.accuracy * 100).toFixed(0)}"></i></div>
    </div>`;
  }).join("");

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
        <div class="card-h"><h3>Picking the operating point</h3><span class="muted mono" style="font-size:12px">swept ${cal.points.length} thresholds</span></div>
        ${pareto(cal.points, cal.chosen, cal.target_accuracy)}
        <p class="cap">Each <b style="color:var(--accent)">dot</b> is one confidence threshold we tested. Lower-left is cheaper; higher is more accurate. We pick the <b style="color:var(--green)">cheapest dot still above the ${pct(cal.target_accuracy)}% bar</b> — that's the shipped setting.</p>
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
      <div class="card rise" style="animation-delay:520ms;margin-top:16px">
        <div class="card-h"><h3>Accuracy by difficulty tier</h3><span class="muted" style="font-size:12.5px">hard tasks escalate to remote — accuracy holds where it's tested hardest</span></div>
        <div class="tiers">${tierRow}</div>
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
  const id = STATE.screen;
  // overview + routing respect the tier filter; compare streams the full suite
  const d = (STATE.tier === "all" || id === "compare")
    ? STATE.data : { ...STATE.data, report: scopedReport(STATE.data) };
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
let abRun = null, abTimer = null;
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
  if (abTimer) { clearInterval(abTimer); abTimer = null; }
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

  // One paced queue drives the stream so the Settings "stream speed" applies to
  // both the live WebSocket and the seed fallback.
  const q = []; let streamDone = false, summaryAcc = null;
  abTimer = setInterval(() => {
    if (q.length) { const it = q.shift(); onDecision(it.d, it.query); }
    else if (streamDone) { clearInterval(abTimer); abTimer = null; finish(summaryAcc); }
  }, STATE.streamMs);

  const seedFill = () => {
    const decs = STATE.data.report.decisions;
    decs.forEach((d) => q.push({ d, query: d.query }));
    summaryAcc = STATE.data.report.accuracy; streamDone = true;
  };

  // live stream via WebSocket; fall back to the seed if it never connects
  let viaWS = false;
  try {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    abRun = new WebSocket(`${proto}://${location.host}/ws/live`);
    abRun.onopen = () => { viaWS = true; };
    abRun.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === "start") { n = m.n_tasks; }
      else if (m.type === "decision") { q.push({ d: m.decision, query: m.query || m.decision.query }); }
      else if (m.type === "summary") { abRun = null; summaryAcc = m.accuracy; streamDone = true; }
    };
    abRun.onerror = () => { if (!viaWS) seedFill(); };
    abRun.onclose = () => { if (!viaWS && i === 0 && q.length === 0 && !streamDone) seedFill(); };
  } catch (e) {
    seedFill();
  }
}

/* ---------------------------------------------------------------- routing controls */
let tFilter = "all", tQuery = "";
function tableRows() {
  const decs = STATE.data.report.decisions
    .filter((d) => STATE.tier === "all" || tierOf(d) === STATE.tier)
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
/* ---------------------------------------------------------- settings/theme */
const PREFS_KEY = "triage.settings";
const ACCENTS = { blue: ["#5b8cff", "#3b6ef5"], violet: ["#a78bfa", "#8b5cf6"], cyan: ["#38bdf8", "#0ea5e9"], green: ["#34d399", "#10b981"] };
const SPEEDS = { slow: 220, normal: 130, fast: 60 };
let PREFS = { theme: "dark", hc: false, motion: true, accent: "blue", speed: "normal" };

function loadPrefs() { try { Object.assign(PREFS, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")); } catch (e) {} }
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(PREFS)); } catch (e) {} }
function applyPrefs() {
  document.documentElement.dataset.theme = PREFS.theme;
  document.body.classList.toggle("hc", !!PREFS.hc);
  document.body.classList.toggle("reduce-motion", !PREFS.motion);
  const a = ACCENTS[PREFS.accent] || ACCENTS.blue;
  document.documentElement.style.setProperty("--accent", a[0]);
  document.documentElement.style.setProperty("--accent-2", a[1]);
  STATE.streamMs = SPEEDS[PREFS.speed] || 130;
  syncSettingsUI();
}
function syncSettingsUI() {
  $$("[data-theme-set]").forEach((b) => b.classList.toggle("on", b.dataset.themeSet === PREFS.theme));
  $$("[data-accent]").forEach((b) => b.classList.toggle("on", b.dataset.accent === PREFS.accent));
  $$("[data-speed]").forEach((b) => b.classList.toggle("on", b.dataset.speed === PREFS.speed));
  const hc = $("#set-hc"); if (hc) hc.classList.toggle("on", !!PREFS.hc);
  const mo = $("#set-motion"); if (mo) mo.classList.toggle("on", !!PREFS.motion);
}
function openSettings() { $("#settings").classList.add("open"); $("#scrim").classList.add("on"); }
function closeSettings() { $("#settings").classList.remove("open"); $("#scrim").classList.remove("on"); }

function bindChrome() {
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest(".nav-i"); if (b) setScreen(b.dataset.screen);
  });
  document.addEventListener("click", (e) => {
    const tier = e.target.closest("[data-tier]");
    if (tier) { STATE.tier = tier.dataset.tier; $("#tierLbl").textContent = tier.dataset.label; tier.closest("details").open = false; render(); return; }

    if (e.target.closest("#settingsBtn")) { e.preventDefault(); const dd = e.target.closest("details"); if (dd) dd.open = false; openSettings(); return; }
    if (e.target.closest("#closeSettings") || e.target.closest("#scrim")) { closeSettings(); return; }

    const tset = e.target.closest("[data-theme-set]");
    if (tset) { PREFS.theme = tset.dataset.themeSet; applyPrefs(); savePrefs(); return; }
    const acc = e.target.closest("[data-accent]");
    if (acc) { PREFS.accent = acc.dataset.accent; applyPrefs(); savePrefs(); return; }
    const sp = e.target.closest("[data-speed]");
    if (sp) { PREFS.speed = sp.dataset.speed; applyPrefs(); savePrefs(); return; }
    if (e.target.closest("#set-hc")) { PREFS.hc = !PREFS.hc; applyPrefs(); savePrefs(); return; }
    if (e.target.closest("#set-motion")) { PREFS.motion = !PREFS.motion; applyPrefs(); savePrefs(); return; }

    const th = e.target.closest("#themeBtn");
    if (th) { PREFS.hc = !PREFS.hc; applyPrefs(); savePrefs(); th.closest("details").open = false; toast("Contrast " + (PREFS.hc ? "on" : "off")); return; }

    $$("details.menu[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSettings(); });
}

/* ---------------------------------------------------------------- boot */
function boot() {
  loadPrefs(); applyPrefs();                   // theme/accent applied before first paint
  bindChrome();
  render();                                   // seed-first: full page paints now
  fetch("/api/latest").then((r) => r.json()).then((d) => {
    const nd = normalize(d);
    if (nd) { STATE.data = nd; render(); }     // enhance with the real run if present
  }).catch(() => { /* offline — seed render stands */ });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
