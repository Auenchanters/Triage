/* Front / loading screen: an interactive particle sphere the user plays with
   (move the cursor to rotate + scatter it), then clicks anywhere or presses any
   key to enter. The dashboard boots underneath the whole time, so the intro
   doubles as the load screen.
   ponytail: canvas-2D point cloud (Fibonacci sphere) — no WebGL/three.js dep.
   Reads --accent + data-theme live, so it tracks the accent + light/dark. */
(() => {
  const intro = document.getElementById("intro");
  const cv = document.getElementById("introCanvas");
  if (!intro || !cv) return;
  if (location.search) { intro.remove(); return; }   // capture/param loads (?still, ?abN…) skip the intro
  const ctx = cv.getContext("2d");

  const N = 900;                              // particle count
  const GA = Math.PI * (3 - Math.sqrt(5));    // golden angle → even distribution
  const pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;          // 1 → -1
    const r = Math.sqrt(1 - y * y);
    const t = i * GA;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  // self-check: the whole effect is wrong if these aren't unit vectors
  console.assert(pts.every((p) => Math.abs(Math.hypot(p[0], p[1], p[2]) - 1) < 1e-6),
    "sphere points must lie on the unit sphere");

  let W, H, cx, cy, R, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.34;
  }
  window.addEventListener("resize", resize);
  resize();

  let mx = 0, my = 0, ax = 0, ay = 0, spin = 0;
  let px = -1e4, py = -1e4;
  window.addEventListener("pointermove", (e) => {       // the "play" interaction
    mx = e.clientX / W - 0.5; my = e.clientY / H - 0.5;
    px = e.clientX; py = e.clientY;
  });

  const VIO = [167, 139, 250];                 // --violet: top of the brand gradient
  const rgb = (s, fb) => {
    const h = ((s || "").trim() || fb).replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  let raf;
  function frame() {
    const root = document.documentElement;
    const still = document.body.classList.contains("reduce-motion") || reduced.matches;
    const light = root.dataset.theme === "light";
    const acc = rgb(root.style.getPropertyValue("--accent"), "5b8cff");
    const aMul = light ? 0.6 : 0.72;

    if (still) { ax += (0 - ax) * 0.1; ay += (0.5 - ay) * 0.1; }   // fixed tilt, no autospin
    else { ax += (my * 0.6 - ax) * 0.05; ay += (mx * 0.9 - ay) * 0.05; spin += 0.0018; }
    const RY = ay + spin, RX = ax;
    const cosY = Math.cos(RY), sinY = Math.sin(RY);
    const cosX = Math.cos(RX), sinX = Math.sin(RX);
    const persp = 2.6, rad = 120, push = 32;

    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const x1 = p[0] * cosY + p[2] * sinY;        // rotate Y
      let z = -p[0] * sinY + p[2] * cosY;
      const y = p[1] * cosX - z * sinX;            // then X
      z = p[1] * sinX + z * cosX;
      const s = persp / (persp - z);               // perspective
      let sx = cx + x1 * R * s, sy = cy + y * R * s;
      if (!still && px > -1e3) {                    // cursor scatter
        const dx = sx - px, dy = sy - py, d2 = dx * dx + dy * dy;
        if (d2 < rad * rad) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / rad) * push;
          sx += (dx / d) * f; sy += (dy / d) * f;
        }
      }
      const depth = (z + 1) / 2;                    // 0 far → 1 near
      const k = (p[1] + 1) / 2;                      // accent (bottom) → violet (top)
      const cr = (acc[0] + (VIO[0] - acc[0]) * k) | 0;
      const cg = (acc[1] + (VIO[1] - acc[1]) * k) | 0;
      const cb = (acc[2] + (VIO[2] - acc[2]) * k) | 0;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${((0.1 + depth * 0.8) * aMul).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, (0.7 + depth * 1.9) * s, 0, 6.2832);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // click anywhere or any key → fade out the intro, revealing the loaded dashboard
  let entered = false;
  function enter() {
    if (entered) return;
    entered = true;
    intro.classList.add("hide");
    setTimeout(() => { cancelAnimationFrame(raf); intro.remove(); }, 650);
  }
  window.addEventListener("click", enter);
  window.addEventListener("keydown", enter);
})();
