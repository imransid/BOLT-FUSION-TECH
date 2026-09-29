#!/usr/bin/env node
/**
 * Probes the hero's three.js scene on rendered frames — the composition rules
 * the poster script checks only at t = 0 (CLAUDE.md, "The hero field").
 *
 *   yarn build && yarn start -p 3462                     (in another shell)
 *   node scripts/probe-scene.mjs [--base http://localhost:3462] [--gpu] [--shots <dir>] [--only a,b] [--json <file>]
 *
 * It opens `/` at 1440x1000 with a fine pointer and motion allowed (a profile
 * where HeroScene mounts the scene), lets the scene build and draw its t = 0
 * frame, and then takes over its CLOCK: an init script queues the page's
 * requestAnimationFrame callbacks and runs them with synthetic timestamps, a
 * 60fps step at a time, so the scene reaches t = 100s in a few seconds. While
 * it fast-forwards, the context's draw calls are skipped (the scene still
 * poses every frame; only the last one is drawn), so the frame it reads is the
 * scene's own at that moment. The field is fixed at 0,200 (as the poster
 * script does), at each width under test.
 *
 * Every check reads PIXELS. "Lit" is any pixel whose channels differ from the
 * ground #07090D by more than 12 in sum, the poster script's test.
 *
 *   clearance   at 660 and at 467 (the narrowest field, 1025–1039px) across
 *               t = 0–100s with the pointer at rest, and at the four parallax
 *               extremes: the 16px band around the frame is the ground (every
 *               channel within 1 of #07090D), and it prints how close the lit
 *               content comes to each edge.
 *   overlap     the LAYOUT over time, from the scene's own objects
 *               (scripts/lib/scene-layout.mjs): every part of the core and of
 *               each module projected through the camera, at rest and at the
 *               four parallax extremes, every 0.25s over seven of the tiers'
 *               48s sways, assembled and fully open. It fails a module in
 *               front of the core within 12px of it, anything within 12px of
 *               the Lab robot, and any two modules within 8px (in the 660
 *               frame).
 *   poster      the poster as the browser draws it where no scene mounts —
 *               390 (a phone), 768, 1024 and a touch tablet at 1180x820 — at
 *               both ends of its drift: the 16px band of the field is the
 *               ground (no pixel lit, every channel within 3 of #07090D, the
 *               encoder's noise).
 *   identity    the t = 0 frame against the poster the browser draws under
 *               it (the canvas hidden, its currentSrc): at 660 at DPR 1 (the
 *               -660-1x file) and DPR 2 (the 1320 file) within 1.5 on average
 *               and 1% of pixels, and at 536 and 467 (1025-1100px, where both
 *               draw the frame smaller) within 1.5 and 3%: the canvas draws a
 *               one-pixel line at full strength at every size, the resampled
 *               poster thinner and dimmer. With --gpu the canvas is the
 *               machine's GPU and the poster SwiftShader's, so it prints and
 *               does not fail.
 *   charge      on fresh pages, hovering and then focusing the hero's
 *               Schedule a Call: the seams brighten ~40% (x1.2–1.7), eased in
 *               (at most 60% in the first 0.1s, at least 75% by 0.6s), stay
 *               blue (b > g > r, and the blue channel held while red and
 *               green rise), and return within 1.6s of leaving; paused,
 *               a hover changes nothing; hovered before the scene mounts, the
 *               first frame is still the poster, and the charge follows.
 *   explode     scrolled past the span (the field held in view), the stack
 *               fully open at 660 and 467 across t = 3–103s and the four
 *               parallax extremes: the 16px band is still the ground. Then on
 *               a fresh page nobody has scrolled, against an unscrolled one on
 *               the same clock: identity at scroll 0, opening further at each
 *               quarter of the span, frozen while paused (no frame runs), and
 *               assembled again once back at the top.
 *   view        the page as laid out (1440x1000; the header pinned while
 *               scrollY <= 200): scrolled 10px at a time and held, the stack
 *               must be fully open (its highest plate's lift, read from the
 *               scene's own objects, at 98% of its lift far past the span)
 *               before any of the drawing goes under the pinned header or
 *               above the screen — it opens while the reader can see all of
 *               it (the design review, 2026-09-29: at the 202px span its top
 *               modules were under the header and off the screen as it
 *               finished opening).
 *   reload      a page reloaded at scrollY 300: its first frame is still the
 *               poster, and 2.5s on it has opened (against a page loaded at
 *               the top, on the same clock).
 *   watchdog    frames fed at 40ms, each costing 30ms of the scene's own
 *               script work: the degradation steps (drawing buffer, comets,
 *               outer tier) happen as fades — no phase loses more than half
 *               of what it drops in one 0.2s step. Then a GPU clocked at 30ms
 *               a frame (the timer query's results, stood in for) at a
 *               smooth 60Hz cadence and cheap script work: the drawing buffer
 *               steps down within 4s — the GPU's own time is the slow part.
 *   cadence     a steady 30Hz cadence (33.3ms frames: Safari's Low Power
 *               Mode, Chrome's Energy Saver) with cheap work, 12s, with the
 *               GPU clocked at 1.5ms (Chrome, an M2 through Metal) and with no
 *               GPU clock (Safari): nothing degrades — the drawing buffer is
 *               whole, and the t = 12s frame is the 60Hz one's, comets and
 *               outer tier included. Its control: with no GPU clock, an
 *               uneven cadence (16.7/50/33.3/66.7/33.3ms, 40ms on average)
 *               with cheap work steps the buffer down within 5s, or the check
 *               could not tell a display's cadence from a device that cannot
 *               keep up, and proves nothing.
 *
 * Exit 0 when every check passed, 1 otherwise. The frames it read go to
 * --shots when given; --json writes a report in the suite's shape (each check
 * `probe:<name>`, its status, findings and info), which the gate reads
 * (scripts/gate/gate-cases.py, PROBE_CASES).
 */
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cameraPose, captureHook, layoutRun } from "./lib/scene-layout.mjs";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const BASE = opt("--base", "http://localhost:3462").replace(/\/$/, "");
const URL_ = opt("--url", `${BASE}/`);
const GPU = argv.includes("--gpu");
const SHOTS = opt("--shots", null);
const ONLY = opt("--only", null)?.split(",");
const JSON_OUT = opt("--json", null);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTER = path.join(REPO, "public", "hero", `${opt("--poster", "scene-poster-v2")}-1320.webp`);
const GROUND = [7, 9, 13];
const want = (k) => !ONLY || ONLY.includes(k);

const failures = [];
const report = []; // one entry per check, in the suite's report shape
let current = null;
const begin = (id, title) => {
  current = { id: `probe:${id}`, status: "PASS", findings: [], info: [] };
  report.push(current);
  console.log(title);
};
const fail = (s) => {
  failures.push(s);
  if (current) {
    current.status = "FAIL";
    current.findings.push(s);
  }
  console.log(`  FAIL  ${s}`);
};
const info = (s) => {
  current?.info.push(s);
  console.log(`  ${s}`);
};

/* The clock and the draw calls, taken over once the scene has drawn t = 0. */
function clockHook() {
  const raf = window.requestAnimationFrame.bind(window);
  const caf = window.cancelAnimationFrame.bind(window);
  const pending = new Map(); // our id -> callback, until it runs or is cancelled
  const queue = []; // ids whose frame came while the clock was ours
  let next = 1;
  let manual = false;
  let now = 0;
  window.requestAnimationFrame = (cb) => {
    const id = next++;
    const entry = { cb, real: 0 };
    pending.set(id, entry);
    if (manual) queue.push(id);
    else
      entry.real = raf((ts) => {
        if (!pending.has(id)) return;
        if (manual) queue.push(id);
        else {
          pending.delete(id);
          cb(ts);
        }
      });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    const entry = pending.get(id);
    if (entry?.real) caf(entry.real);
    pending.delete(id);
  };
  new MutationObserver(() => {
    if (!manual && document.querySelector("[data-scene-ready]")) {
      manual = true;
      now = performance.now();
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-scene-ready"] });
  /* skip the context's draws while fast-forwarding: the scene still poses.
     Every draw the scene ATTEMPTS is counted, skipped or not: a scene frame
     is the only thing on the page that draws, where a count of rAF callbacks
     also counts the header's and the page's own */
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const ctx = getContext.call(this, type, attrs);
    if (ctx && /webgl/.test(String(type)) && !ctx.__bfProbe) {
      ctx.__bfProbe = true;
      for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced", "drawRangeElements"]) {
        const f = ctx[name];
        if (typeof f === "function")
          ctx[name] = function (...a) {
            window.__bfDraws = (window.__bfDraws || 0) + 1;
            /* the watchdog check's slow frames: `__bfWorkMs` of the scene's
               own script work, once a frame, inside its draw (drawn or not) */
            if (window.__bfWorkMs && !window.__bfWorked) {
              window.__bfWorked = true;
              const until = performance.now() + window.__bfWorkMs;
              while (performance.now() < until);
            }
            return window.__bfSkipDraw ? undefined : f.apply(this, a);
          };
      }
      /* the GPU's clock (EXT_disjoint_timer_query_webgl2), stood in for:
         `__bfTimer = "none"` hides it (Safari, Firefox); a number in
         `__bfGpuMs` makes every query report that much GPU time, at once and
         never disjoint — a GPU of known speed, whatever this one is */
      const getExtension = ctx.getExtension;
      ctx.getExtension = function (n) {
        return n === "EXT_disjoint_timer_query_webgl2" && window.__bfTimer === "none" ? null : getExtension.call(this, n);
      };
      const getQueryParameter = ctx.getQueryParameter;
      if (getQueryParameter)
        ctx.getQueryParameter = function (q, pname) {
          if (typeof window.__bfGpuMs !== "number") return getQueryParameter.call(this, q, pname);
          if (pname === this.QUERY_RESULT_AVAILABLE) return true;
          if (pname === this.QUERY_RESULT) return window.__bfGpuMs * 1e6;
          return getQueryParameter.call(this, q, pname);
        };
      const getParameter = ctx.getParameter;
      ctx.getParameter = function (pname) {
        if (typeof window.__bfGpuMs === "number" && pname === 0x8fbb) return false; // GPU_DISJOINT_EXT
        return getParameter.call(this, pname);
      };
    }
    return ctx;
  };
  /* run the queued frames: `frames` of them, `dtMs` apart; only the last is drawn (none, with drawLast false) */
  window.__bfStep = (frames, dtMs = 1000 / 60, drawLast = true) => {
    let ran = 0;
    for (let f = 0; f < frames; f++) {
      window.__bfSkipDraw = !drawLast || f < frames - 1;
      window.__bfWorked = false;
      const ids = queue.splice(0);
      now += dtMs;
      for (const id of ids) {
        const entry = pending.get(id);
        if (!entry) continue;
        pending.delete(id);
        entry.cb(now);
        ran++;
      }
    }
    window.__bfSkipDraw = false;
    return ran;
  };
  window.__bfQueued = () => queue.length;
}

/* the field fixed at `left`,200: at the left edge, or at 760 where it leaves the hero's calls to action uncovered.
   Its z-index works inside .bf-hero__stage, which isolates (the radial light
   behind the field), so the stage is lifted too: without it, content after
   the hero that positions itself paints over the fixed field once the page
   scrolls — since the 2026-09-28 IA, #recent-work's write-up screenshots
   start 755px down at 1440, and the explode and reload checks, which scroll,
   read them as the scene (the merge, 2026-09-29). */
const fieldCss = (w, left = 0) =>
  ".bf-hero__stage{z-index:9999!important}" +
  `[data-hero-field]{position:fixed!important;left:${left}px!important;top:200px!important;margin:0!important;z-index:9999!important;` +
  `box-sizing:content-box!important;width:${w}px!important;height:560px!important;max-width:none!important;border:0!important;border-radius:0!important;flex:none!important}` +
  "[data-hero-field] canvas{transition:none!important}";

const browser = await chromium.launch({
  args: GPU
    ? ["--use-angle=metal", "--ignore-gpu-blocklist"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

/** A fresh page with the scene drawn at t = 0 and its clock ours; `before(page)` runs after load; `init`'s keys are set on window before any page script (the watchdog's stand-ins). */
async function open({ dpr = 1, width = 660, left = 0, css = "", before, init, pinned = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, reducedMotion: "no-preference" });
  /* The GPU's clock reports a fast GPU (1ms a frame) unless a check says
     otherwise. The scene's watchdog reads it, and SwiftShader's real times
     (14-25ms a frame, and more under load) on the few frames the fast-forward
     draws would otherwise trip it at random: one late reading is all a batch
     of hundreds of synthetic frames sees, and a check that is not about the
     watchdog would compare a degraded scene with a whole one (a 0.34% "did not
     reassemble" in the explode check, 2026-09-29). */
  await ctx.addInitScript((o) => Object.assign(window, o), { __bfGpuMs: 1, ...init });
  await ctx.addInitScript(clockHook);
  await ctx.addInitScript(captureHook);
  await ctx.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.id = "bf-probe-field";
      s.textContent = css;
      document.head.append(s);
    });
  }, (pinned ? fieldCss(width, left) : "[data-hero-field] canvas{transition:none!important}") + css);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(URL_, { waitUntil: "load", timeout: 120000 });
  if (before) await before(page);
  await page.waitForSelector("[data-hero-field][data-scene-ready]", { timeout: 90000 });
  await page.waitForTimeout(150);
  /* one frame to start the loop's clock (its first frame has no delta: t stays 0) */
  await page.evaluate(() => window.__bfStep(1));
  return { ctx, page, errors, width, left };
}
/** How many draw calls the scene has attempted so far: none while it is paused. */
const draws = (p) => p.page.evaluate(() => window.__bfDraws || 0);
const advance = (p, seconds, dtMs = 1000 / 60) => p.page.evaluate(([n, d]) => window.__bfStep(n, d), [Math.max(1, Math.round((seconds * 1000) / dtMs)), dtMs]);
const pointerAt = (p, fx, fy) => p.page.mouse.move(1440 * fx, 1000 * fy);

/** The field as pixels: RGB rows at the page's DPR. */
async function grab(p, name) {
  await p.page.waitForTimeout(60);
  const png = await p.page.screenshot({ type: "png", clip: { x: p.left, y: 200, width: p.width, height: 560 } });
  if (SHOTS && name) await writeFile(path.join(SHOTS, `${name}.png`), png);
  const { data, info: px } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: px.width, h: px.height, scale: px.width / p.width, png };
}
/** The band's worst channel, the lit share, and how close lit pixels come to each edge (CSS px). */
function measure(img) {
  const { data, w, h, scale } = img;
  const band = Math.round(16 * scale);
  let dev = 0;
  let lit = 0;
  let flow = 0; // the comets' light: how far green and blue both lead red, summed (cyan is the comets' alone)
  let L = w;
  let R = w;
  let T = h;
  let B = h;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const dr = Math.abs(data[i] - GROUND[0]);
      const dg = Math.abs(data[i + 1] - GROUND[1]);
      const db = Math.abs(data[i + 2] - GROUND[2]);
      if (x < band || x >= w - band || y < band || y >= h - band) dev = Math.max(dev, dr, dg, db);
      flow += Math.max(0, Math.min(data[i + 1], data[i + 2] + 20) - data[i] - 40) / 255;
      if (dr + dg + db > 12) {
        lit++;
        L = Math.min(L, x);
        R = Math.min(R, w - 1 - x);
        T = Math.min(T, y);
        B = Math.min(B, h - 1 - y);
      }
    }
  const c = (v) => Math.round(v / scale);
  return { dev, lit: (100 * lit) / (w * h), flow: (100 * flow) / (w * h), L: c(L), R: c(R), T: c(T), B: c(B) };
}
/** The seams of `img` against the same moment untouched (`ref`): the median ratio of
 *  linear luminance over the pixels that are the brand blue in `ref`, and their mean colour in `img`. */
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function seamGain(ref, img) {
  const ratios = [];
  let r = 0;
  let g = 0;
  let b = 0;
  let r0 = 0;
  let g0 = 0;
  let b0 = 0;
  for (let i = 0; i < ref.data.length; i += 3) {
    const R = ref.data[i];
    const G = ref.data[i + 1];
    const B = ref.data[i + 2];
    if (!(B > 200 && B - R > 120 && G < 175)) continue; // the brand blue, #4C86FF, and its antialiased edge
    const lr = 0.2126 * lin(R) + 0.7152 * lin(G) + 0.0722 * lin(B);
    const li = 0.2126 * lin(img.data[i]) + 0.7152 * lin(img.data[i + 1]) + 0.0722 * lin(img.data[i + 2]);
    ratios.push(li / Math.max(lr, 1e-6));
    r += img.data[i];
    g += img.data[i + 1];
    b += img.data[i + 2];
    r0 += R;
    g0 += G;
    b0 += B;
  }
  ratios.sort((x, y) => x - y);
  const n = ratios.length;
  const mean = (x, y, z) => (n ? [x / n, y / n, z / n] : [0, 0, 0]);
  const c = mean(r, g, b);
  const c0 = mean(r0, g0, b0);
  return { gain: n ? ratios[n >> 1] : 0, n, rgb: c.map(Math.round).join(","), restRgb: c0.map(Math.round).join(","), d: c.map((v, k) => v - c0[k]) };
}
/** Two frames' difference: mean per channel, the share of pixels off by more than 24 in sum, the largest channel. */
function diff(a, b) {
  let sum = 0;
  let big = 0;
  let max = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    const dr = Math.abs(a.data[i] - b.data[i]);
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
    const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
    sum += dr + dg + db;
    max = Math.max(max, dr, dg, db);
    if (dr + dg + db > 24) big++;
  }
  const mean = sum / a.data.length;
  const bigPct = (100 * big) / (a.w * a.h);
  return { mean, bigPct, max, line: `mean |diff| ${mean.toFixed(3)} per channel, ${bigPct.toFixed(2)}% of pixels off by more than 24, largest ${max}` };
}
const fmt = (m) => `band ${m.dev}, lit ${m.lit.toFixed(1)}%, clear L${m.L} R${m.R} T${m.T} B${m.B}`;

try {
  if (SHOTS) await mkdir(SHOTS, { recursive: true });
  console.log(`probe-scene: ${URL_} — ${GPU ? "GPU (ANGLE/Metal)" : "SwiftShader"}`);

  /* ── clearance: 660 and 467, t = 0–100s, the pointer at rest and at its extremes ── */
  if (want("clearance")) {
    begin("clearance", "clearance — the 16px band is the ground at every frame");
    for (const width of [660, 467]) {
      const p = await open({ width });
      const worst = { dev: 0, L: 1e9, R: 1e9, T: 1e9, B: 1e9, at: {} };
      const take = (m, label) => {
        if (m.dev > worst.dev) worst.dev = m.dev;
        for (const k of ["L", "R", "T", "B"])
          if (m[k] < worst[k]) {
            worst[k] = m[k];
            worst.at[k] = label;
          }
        if (m.dev > 1) fail(`@${width} ${label}: the edge band is ${m.dev} off the ground — something reaches the frame's edge (${fmt(m)})`);
      };
      for (let t = 0; t <= 100; t += 5) {
        if (t) await advance(p, 5);
        take(measure(await grab(p, `clear-${width}-t${t}`)), `t=${t}s`);
      }
      /* the parallax extremes: the pointer held at each corner until the camera has eased to it */
      for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        await pointerAt(p, fx ? 0.999 : 0.001, fy ? 0.999 : 0.001);
        for (let k = 0; k < 3; k++) {
          await advance(p, k ? 9 : 6);
          take(measure(await grab(p, `clear-${width}-ptr${fx}${fy}-${k}`)), `pointer ${fx ? "right" : "left"}-${fy ? "bottom" : "top"} (${k})`);
        }
      }
      info(`@${width}: band within ${worst.dev} of the ground; closest lit pixel L ${worst.L}px (${worst.at.L}), R ${worst.R}px (${worst.at.R}), T ${worst.T}px (${worst.at.T}), B ${worst.B}px (${worst.at.B})`);
      if (p.errors.length) fail(`@${width}: page errors — ${p.errors.slice(0, 3).join(" | ")}`);
      await p.ctx.close();
    }
  }

  /* ── identity: the t = 0 frame against the poster the browser draws under it ── */
  if (want("identity")) {
    begin("identity", "identity — the canvas's t = 0 frame against the poster the browser draws under it");
    /* [DPR, field width, strict]: 660 is the frame itself, drawn 1:1 by both; at 536
       and 467 (1025-1100px) both draw it smaller, the poster resampled */
    for (const [dpr, width, strict] of [[1, 660, true], [2, 660, true], [1, 536, false], [2, 536, false], [1, 467, false], [2, 467, false]]) {
      const p = await open({ dpr, width });
      const img = await grab(p, `identity-${width}-dpr${dpr}-canvas`);
      const m = measure(img);
      if (m.dev > 1) fail(`@${width} DPR ${dpr}, t = 0: the edge band is ${m.dev} off the ground`);
      /* the poster under it, as the browser draws it: the canvas hidden for one
         capture. A poster hidden in the page is check 28's finding and this
         one's too, but it is SHOWN for the comparison, so that the file the
         browser picks is still compared (the gate builds every misuse at once) */
      const under = await p.page.evaluate(() => {
        const c = document.querySelector("[data-hero-field] canvas");
        const im = document.querySelector("img[data-hero-poster]");
        c.style.visibility = "hidden";
        const st = getComputedStyle(im);
        const was = { display: st.display, visibility: st.visibility, opacity: +st.opacity };
        for (const [k, v] of [["display", "block"], ["visibility", "visible"], ["opacity", "1"]]) im.style.setProperty(k, v, "important");
        return { src: im.currentSrc.split("/").pop(), ...was, fit: getComputedStyle(im).objectFit, decoded: im.complete && im.naturalWidth > 0 };
      });
      if (under.display === "none" || under.visibility !== "visible" || under.opacity < 0.99) fail(`@${width} DPR ${dpr}: the poster under the canvas is hidden (display ${under.display}, visibility ${under.visibility}, opacity ${under.opacity}) — the canvas fades in over nothing; compared as if shown`);
      if (!under.decoded) {
        fail(`@${width} DPR ${dpr}: the poster under the canvas never decoded (${under.src || "no source"})`);
        await p.ctx.close();
        continue;
      }
      await p.page.waitForTimeout(60);
      const poster = await grab(p, `identity-${width}-dpr${dpr}-poster`);
      await p.page.evaluate(() => (document.querySelector("[data-hero-field] canvas").style.visibility = ""));
      /* the file for this density: sizes says 660px, so DPR 1 takes the 660w file, DPR 2 the 1320w */
      const file = dpr === 1 ? /-660-1x\.(avif|webp)$/ : /-1320\.(avif|webp)$/;
      if (!file.test(under.src)) fail(`@${width} DPR ${dpr}: the browser draws ${under.src} — at DPR ${dpr} it takes the ${dpr === 1 ? "-660-1x" : "-1320"} file, the frame rendered at that density`);
      /* the control: the same scene two seconds on, which the comparison must tell apart */
      await advance(p, 2);
      const later = await grab(p);
      const d0 = diff(img, poster);
      const d2 = diff(later, poster);
      info(`@${width} DPR ${dpr}: t = 0 against ${under.src} as drawn (${under.fit}) — ${d0.line}; control, t = 2s: ${d2.bigPct.toFixed(2)}% off${GPU ? " (the GPU's canvas against SwiftShader's poster)" : ""}`);
      if (d2.bigPct < 3 * d0.bigPct || d2.bigPct < 1) fail(`@${width} DPR ${dpr}: the comparison cannot tell t = 0 from t = 2s (${d0.bigPct.toFixed(2)}% against ${d2.bigPct.toFixed(2)}%) — it proves nothing`);
      const cap = strict ? 1 : 3;
      if (!GPU && (d0.mean > 1.5 || d0.bigPct > cap)) fail(`@${width} DPR ${dpr}: the canvas's t = 0 frame differs from the poster the browser draws under it (${under.src}: ${d0.line}; at most 1.5 and ${cap}%) — the crossfade jumps`);
      await p.ctx.close();
    }
  }

  /* ── overlap: no module crosses the core, the Lab robot or another module ── */
  if (want("overlap")) {
    begin("overlap", "overlap — the layout over the sway, from the scene's own objects, assembled and fully open");
    const LIMITS = { core: 12, lab: 12, module: 8 };
    const p = await open({ width: 660 });
    /* the parallax extremes as the scene reaches them: the pointer held at each corner until the camera has eased there */
    const rest = await p.page.evaluate(cameraPose);
    const variants = [{ daz: 0, del: 0, label: "the pointer at rest" }];
    for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      await pointerAt(p, fx ? 0.999 : 0.001, fy ? 0.999 : 0.001);
      await advance(p, 12);
      const at = await p.page.evaluate(cameraPose);
      variants.push({ daz: at.az - rest.az, del: at.el - rest.el, label: `the pointer ${fx ? "right" : "left"}-${fy ? "bottom" : "top"}` });
    }
    info(`the parallax extremes: ${variants.slice(1).map((v) => `${(v.daz * 57.3).toFixed(1)}° yaw ${(v.del * 57.3).toFixed(1)}° pitch`).join(", ")}`);
    if (!variants.slice(1).every((v) => Math.abs(v.daz) > 0.05)) fail("the pointer did not move the camera — the parallax extremes were not measured, and the check would test the camera at rest only");
    await p.page.mouse.move(720, 500); // the viewport's centre: the pointer at rest
    await advance(p, 12);
    const runs = [
      ["assembled", 336],
      ["fully open", 96],
    ];
    for (const [state, secs] of runs) {
      if (state === "fully open") {
        await p.page.evaluate(() => window.scrollTo(0, document.querySelector("#hero").offsetHeight * 1.2));
        await p.page.waitForTimeout(150);
        await advance(p, 3);
      }
      const t0 = Date.now();
      const r = await p.page.evaluate(layoutRun, { samples: Math.round(secs / 0.25), frames: 15, dtMs: 1000 / 60, variants, W: 660, H: 560, limits: LIMITS });
      if (r.error) {
        fail(`${state}: ${r.error}`);
        continue;
      }
      const expect = ["core", "web", "ai", "cloud", "mobile", "robot:lab", "erp", "pos"];
      if (r.objects.map((o) => o.replace(/^module:/, "")).sort().join() !== [...expect].sort().join()) fail(`${state}: the scene's objects are ${r.objects.join(", ")} — the check reads the core and seven modules by name (scene.ts), and would test the wrong things`);
      const rows = Object.entries(r.pairs).filter(([, x]) => x.limit !== null);
      rows.sort((a, b) => a[1].min - a[1].limit - (b[1].min - b[1].limit));
      const closest = rows.slice(0, 4).map(([k, x]) => `${k} ${x.min}px (limit ${x.limit})`).join(", ");
      info(`${state}, ${r.seconds}s of the sway every 0.25s, ${variants.length} camera poses (${((Date.now() - t0) / 1000).toFixed(0)}s): the closest pairs ${closest}; the parts' hulls clear the frame by L ${r.bounds.L} R ${r.bounds.R} T ${r.bounds.T} B ${r.bounds.B}px`);
      for (const [k, x] of rows) {
        if (x.min >= x.limit) continue;
        const [a, b] = k.split(" / ");
        const what = b.startsWith("core") ? `"${a}" comes within ${x.min}px of the core, in front of it — a module crosses the core` : x.limit === LIMITS.lab ? `"${a}" and "${b}" come within ${x.min}px of each other — a live module crosses the Lab robot` : `"${a}" and "${b}" come within ${x.min}px of each other — two modules cross`;
        fail(`${state}: ${what} (it must stay ${x.limit}px clear) at t = ${x.at.t.toFixed(1)}s, ${variants[x.at.variant].label}; ${x.underS}s of ${r.seconds}s under the limit`);
      }
    }
    if (p.errors.length) fail(`page errors — ${p.errors.slice(0, 3).join(" | ")}`);
    await p.ctx.close();
  }

  /* ── poster: where no scene mounts, the drifting poster never reaches the field's edge ── */
  if (want("poster")) {
    begin("poster", "poster — as the browser draws it where no scene mounts, at both ends of its drift");
    const profiles = [
      { label: "390 (a phone)", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
      { label: "768", viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 },
      { label: "1024", viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 },
      { label: "1180x820 tablet (touch, coarse pointer)", viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    ];
    for (const { label, ...o } of profiles) {
      const ctx = await browser.newContext({ ...o, reducedMotion: "no-preference" });
      const page = await ctx.newPage();
      await page.goto(URL_, { waitUntil: "load", timeout: 120000 });
      const ready = await page.waitForSelector(".bf-motion-toggle[data-ready]", { timeout: 30000 }).then(() => true, () => false);
      await page.waitForFunction(() => {
        const im = document.querySelector("img[data-hero-poster]");
        return im && im.complete && im.naturalWidth > 0;
      });
      if (!ready) fail(`@${label}: the pause control never became ready — the drift never starts, so this read its first frame only`);
      const worst = { dev: 0, lit: 0, T: 1e9, B: 1e9, L: 1e9, R: 1e9 };
      let st = null;
      for (const [end, ms] of [["from", 0], ["to", 25999]]) {
        st = await page.evaluate((t) => {
          const im = document.querySelector("img[data-hero-poster]");
          /* hidden or faded is check 28's finding and this one's; shown here, so its geometry is still read */
          const cs = getComputedStyle(im);
          const hidden = cs.display === "none" || cs.visibility !== "visible" || +cs.opacity < 0.99 ? `display ${cs.display}, visibility ${cs.visibility}, opacity ${cs.opacity}` : "";
          for (const [k, v] of [["display", "block"], ["visibility", "visible"], ["opacity", "1"]]) im.style.setProperty(k, v, "important");
          const a = im.getAnimations().find((x) => x.animationName === "bf-field-drift");
          if (a) {
            a.pause();
            a.currentTime = t;
          }
          const f = im.closest("[data-hero-field]");
          f.scrollIntoView({ block: "center" });
          const b = f.getBoundingClientRect();
          return { hidden, drift: !!a, tf: getComputedStyle(im).transform, fit: getComputedStyle(im).objectFit, src: im.currentSrc.split("/").pop(), canvas: f.querySelectorAll("canvas").length, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
        }, ms);
        if (st.hidden && end === "from") fail(`@${label}: the poster is hidden (${st.hidden}) — read as if shown`);
        await page.waitForTimeout(120);
        const png = await page.screenshot({ type: "png", clip: { x: st.x, y: st.y, width: st.w, height: st.h } });
        if (SHOTS) await writeFile(path.join(SHOTS, `poster-${o.viewport.width}-${end}.png`), png);
        const { data, info: px } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const scale = px.width / st.w;
        const band = Math.round(16 * scale);
        let dev = 0;
        let lit = 0;
        const m = measure({ data, w: px.width, h: px.height, scale });
        for (let y = 0; y < px.height; y++)
          for (let x = 0; x < px.width; x++) {
            if (x >= band && x < px.width - band && y >= band && y < px.height - band) continue;
            const i = (y * px.width + x) * 3;
            const dr = Math.abs(data[i] - GROUND[0]);
            const dg = Math.abs(data[i + 1] - GROUND[1]);
            const db = Math.abs(data[i + 2] - GROUND[2]);
            dev = Math.max(dev, dr, dg, db);
            if (dr + dg + db > 12) lit++;
          }
        worst.dev = Math.max(worst.dev, dev);
        worst.lit += lit;
        for (const k of ["T", "B", "L", "R"]) worst[k] = Math.min(worst[k], m[k]);
        if (lit || dev > 3) fail(`@${label}, the drift's ${end} end: the field's 16px band is not the ground — ${lit} lit pixel(s), a channel ${dev} off #07090D (${st.src}, ${st.fit}, transform ${st.tf}); the poster reaches the field's edge`);
      }
      info(`@${label}: field ${st.w}x${st.h}, ${st.src} ${st.fit}, drift ${st.drift ? "running" : "absent"}${st.canvas ? `, ${st.canvas} canvas` : ""}; across both ends the band is within ${worst.dev} of the ground and the closest lit pixel is T ${worst.T} B ${worst.B} L ${worst.L} R ${worst.R}px from the field's edges`);
      if (!st.drift && ready) fail(`@${label}: no drift is running on the poster — the check read one position only`);
      await ctx.close();
    }
  }

  /* ── charge: hovering or focusing the hero's Schedule a Call charges the system ── */
  if (want("charge")) {
    begin("charge", 'charge — hover and focus on #hero [data-cta="schedule"], each page against an untouched one at the same moment');
    const CTA = '#hero [data-cta="schedule"]';
    /* Five fresh pages on one clock, every pointer at the CTA's centre (the
       pointer drives the camera's parallax, so the frames compare only if
       every page has it in the same place). Where the CTA must NOT be hovered
       it takes no pointer events, so the pointer rests on the same spot
       without entering it. */
    const deaf = `${CTA}{pointer-events:none!important}`;
    const at = async (page) => {
      const b = await page.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().toJSON(), CTA);
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    };
    const rest = await open({ dpr: 2, width: 660, left: 760, css: deaf }); // untouched
    const hov = await open({ dpr: 2, width: 660, left: 760 }); // hovered at 1.5s
    const foc = await open({ dpr: 2, width: 660, left: 760, css: deaf }); // focused at 1.5s
    const earlyRest = await open({ dpr: 2, width: 660, left: 760, css: deaf, before: at }); // the pointer there from load, not hovering
    const early = await open({ dpr: 2, width: 660, left: 760, before: at }); // hovering from load, before the scene mounted
    const all = [rest, hov, foc, earlyRest, early];
    const earlyT0 = await grab(early, "charge-early-t0");
    const names = ["rest", "hover", "focus", "early-rest", "early"];
    let clock = 0;
    const step = async (sec) => {
      for (const p of all) await advance(p, sec);
      clock += sec;
      return Promise.all(all.map((p, i) => grab(p, `charge-${names[i]}-${clock.toFixed(1)}`)));
    };
    await step(1.5); // past the hold
    for (const p of [rest, hov, foc]) await at(p.page);
    await foc.page.focus(CTA);
    const series = { hover: [], focus: [], early: [] };
    let now = 0;
    for (const t of [0.1, 0.2, 0.4, 0.6, 1.0, 1.6]) {
      const [r, h, f, er, e] = await step(t - now);
      now = t;
      series.hover.push({ t, ...seamGain(r, h) });
      series.focus.push({ t, ...seamGain(r, f) });
      series.early.push({ t, ...seamGain(er, e) });
    }
    for (const how of ["hover", "focus"]) {
      const sr = series[how];
      const full = sr[sr.length - 1];
      const rise = (x) => (x.gain - 1) / Math.max(1e-6, full.gain - 1);
      info(`${how}: the seams' linear luminance against the untouched page — ${sr.map((x) => `x${x.gain.toFixed(2)} at ${x.t}s`).join(", ")} (${full.n} seam pixels); charged, they read rgb ${full.rgb} (at rest ${full.restRgb}: ${full.d.map((v) => (v >= 0 ? "+" : "") + v.toFixed(1)).join(", ")})`);
      if (full.gain < 1.3 || full.gain > 1.55) fail(`${how}: at full charge the seams are x${full.gain.toFixed(2)} as bright — the charge is +40%`);
      if (rise(sr[0]) > 0.6) fail(`${how}: ${Math.round(100 * rise(sr[0]))}% of the charge came in the first 0.1s — it eases in, it does not jump`);
      if (rise(sr[3]) < 0.75) fail(`${how}: only ${Math.round(100 * rise(sr[3]))}% of the charge after 0.6s — it eases in over about 0.6s`);
      /* brighter BLUE, never amber: blue leads green leads red, and the blue
         holds while red and green rise. The order alone cannot see amber —
         mixed in at the charge's 24% it still reads blue > green > red — and
         nor can the hue, which the antialiased seams hold within 2 degrees
         either way. The blue channel can: the brand blue is at full, the pale
         blue keeps it there, and any warmer target lowers it (measured
         2026-09-29: +0.2 for the pale blue, -10.1 for amber) */
      const [cr, cg, cb] = full.rgb.split(",").map(Number);
      const [dr, dg, db] = full.d;
      if (!(cb > cg && cg > cr) || db < -3 || !(dr > 0 && dg > 0)) fail(`${how}: the charged seams are rgb ${full.rgb} against ${full.restRgb} at rest — blue ${db >= 0 ? "+" : ""}${db.toFixed(1)} as red rises ${dr.toFixed(1)} — the charge is a brighter blue, never amber`);
    }
    /* and back out: the hovered page's pointer steps off the CTA (8px below it,
       a 2px change of the pointer against 1000: the camera barely moves) */
    {
      const b = await hov.page.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().toJSON(), CTA);
      for (const p of [rest, hov]) await p.page.mouse.move(b.x + b.width / 2, b.y + b.height + 8);
    }
    await foc.page.evaluate(() => document.activeElement?.blur());
    const [r2, h2, f2] = await step(1.6);
    for (const [how, img] of [["hover", h2], ["focus", f2]]) {
      const g = seamGain(r2, img);
      info(`${how}: 1.6s after ${how === "hover" ? "the pointer left" : "blur"}, x${g.gain.toFixed(3)}`);
      if (Math.abs(g.gain - 1) > 0.04) fail(`${how}: 1.6s after ${how === "hover" ? "the pointer left" : "blur"} the seams are x${g.gain.toFixed(3)} — the charge eases back out`);
    }
    /* hovered before the scene mounted: the first frame is the poster, and the charge follows the hold */
    if (existsSync(POSTER)) {
      const ref = await sharp(POSTER).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const d = diff(earlyT0, { data: ref.data, w: ref.info.width, h: ref.info.height });
      info(`hovered before the scene mounted: its first frame against the poster, ${d.line}`);
      if (!GPU && (d.mean > 1.5 || d.bigPct > 1)) fail(`with the pointer already on the CTA the first frame is not the poster (${d.line})`);
    }
    const eFull = series.early[series.early.length - 1];
    info(`and once the hold is over it charges: x${eFull.gain.toFixed(2)} at 1.6s`);
    if (eFull.gain < 1.3) fail(`the pointer was on the CTA when the scene mounted, and after the hold the seams are only x${eFull.gain.toFixed(2)}`);
    for (const p of all) await p.ctx.close();
    /* paused (the hero's Pause motion): hovering changes nothing */
    const p = await open({ width: 660, left: 760 });
    await advance(p, 1.5);
    const before = await grab(p);
    await p.page.evaluate(() => {
      document.documentElement.dataset.motion = "paused";
      window.dispatchEvent(new CustomEvent("bf:motion", { detail: { paused: true } }));
    });
    await p.page.hover(CTA);
    const drawsBefore = await draws(p);
    await advance(p, 1.6);
    const drew = (await draws(p)) - drawsBefore;
    const d = diff(before, await grab(p));
    info(`paused: hovered for 1.6s, the scene drew ${drew} time(s), the field changed by ${d.line}`);
    if (drew || d.bigPct > 0) fail(`paused, the scene still answered the hover (${drew} draw calls; ${d.line}) — Pause motion freezes it`);
    await p.ctx.close();
  }

  /* ── explode: the hero scrolled away opens the stack; the band stays the ground ── */
  if (want("explode")) {
    begin("explode", "explode — scrolled past the span: the stack fully open, at 660 and 467");
    for (const width of [660, 467]) {
      const p = await open({ width });
      /* past the span, whatever the hero's height: the field is fixed here, so it stays in view */
      await p.page.evaluate(() => window.scrollTo(0, document.querySelector("#hero").offsetHeight * 1.2));
      await p.page.waitForTimeout(150);
      const worst = { dev: 0, L: 1e9, R: 1e9, T: 1e9, B: 1e9, at: {} };
      const take = (m, label) => {
        worst.dev = Math.max(worst.dev, m.dev);
        for (const k of ["L", "R", "T", "B"])
          if (m[k] < worst[k]) {
            worst[k] = m[k];
            worst.at[k] = label;
          }
        if (m.dev > 1) fail(`@${width} fully open, ${label}: the edge band is ${m.dev} off the ground — the opened stack reaches the frame's edge (${fmt(m)})`);
      };
      await advance(p, 3); // the hold, then the damped opening: e^-13, open
      for (let t = 3; t <= 103; t += 10) {
        if (t > 3) await advance(p, 10);
        take(measure(await grab(p, `explode-${width}-t${t}`)), `t=${t}s`);
      }
      for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        await pointerAt(p, fx ? 0.999 : 0.001, fy ? 0.999 : 0.001);
        await advance(p, 7);
        take(measure(await grab(p, `explode-${width}-ptr${fx}${fy}`)), `pointer ${fx ? "right" : "left"}-${fy ? "bottom" : "top"}`);
      }
      info(`@${width} fully open: band within ${worst.dev} of the ground; closest lit pixel L ${worst.L}px (${worst.at.L}), R ${worst.R}px (${worst.at.R}), T ${worst.T}px (${worst.at.T}), B ${worst.B}px (${worst.at.B})`);
      if (p.errors.length) fail(`@${width}: page errors — ${p.errors.slice(0, 3).join(" | ")}`);
      await p.ctx.close();
    }
    /* it follows the scroll, on a fresh page nobody has scrolled: open as it
       scrolls down, frozen while paused, and assembled again at the top */
    console.log("explode — following the scroll on a fresh page, against an unscrolled one at the same moment");
    const still = await open({ width: 660 });
    const moved = await open({ width: 660 });
    const both = async (sec) => {
      await advance(still, sec);
      await advance(moved, sec);
      return diff(await grab(still), await grab(moved)).bigPct;
    };
    /* the span is EXPLODE_SPAN (components/field/scene.ts) of the canvas's height — keep the two in step */
    const span = await moved.page.evaluate(() => document.querySelector("[data-hero-field] canvas").clientHeight * 0.16);
    const opening = [];
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await moved.page.evaluate((y) => window.scrollTo(0, y), Math.round(span * f));
      await moved.page.waitForTimeout(120);
      opening.push(await both(1.2));
    }
    info(`scrolled 0, 25, 50, 75 and 100% of the span: the frame differs from the unscrolled one by ${opening.map((v) => `${v.toFixed(1)}%`).join(", ")} of its pixels`);
    if (opening[0] > 0.05) fail(`at scroll 0 the frame is not the assembled one (${opening[0].toFixed(2)}% differ) — the exploded view is identity at scroll 0`);
    for (let i = 1; i < opening.length; i++) if (!(opening[i] > opening[i - 1])) fail(`the stack does not open further as the scroll goes on (${opening.map((v) => v.toFixed(1)).join(" → ")})`);
    await moved.page.evaluate(() => {
      document.documentElement.dataset.motion = "paused";
      window.dispatchEvent(new CustomEvent("bf:motion", { detail: { paused: true } }));
    });
    const pausedBefore = await grab(moved);
    await moved.page.evaluate(() => window.scrollTo(0, 0));
    await moved.page.waitForTimeout(120);
    const drawsPaused = await draws(moved);
    await advance(moved, 1.5);
    const drewPaused = (await draws(moved)) - drawsPaused;
    const frozen = diff(pausedBefore, await grab(moved));
    info(`paused, scrolled back to the top: the scene drew ${drewPaused} time(s), the field changed by ${frozen.line}`);
    if (drewPaused || frozen.bigPct > 0) fail(`paused, the stack still moved with the scroll (${drewPaused} draw calls; ${frozen.line}) — Pause motion freezes it`);
    await moved.page.evaluate(() => {
      delete document.documentElement.dataset.motion;
      window.dispatchEvent(new CustomEvent("bf:motion", { detail: { paused: false } }));
    });
    await advance(moved, 0); // its first frame after a pause has no delta (the loop restarts): the clocks agree again
    const back = await both(2.5);
    info(`resumed at the top: 2.5s later it differs from the unscrolled page by ${back.toFixed(2)}% of its pixels`);
    if (back > 0.05) fail(`back at the top, the stack did not reassemble (${back.toFixed(2)}% of the frame differs from the unscrolled one)`);
    await still.ctx.close();
    await moved.ctx.close();
  }

  /* ── reload: a page loaded mid-scroll still draws the poster first ── */
  if (want("reload")) {
    begin("reload", "reload — loaded mid-scroll, the first frame is still the poster");
    const p = await open({
      dpr: 2,
      width: 660,
      before: async (page) => {
        await page.evaluate(() => window.scrollTo(0, 300));
        await page.reload({ waitUntil: "load" });
        await page.evaluate(() => window.scrollY < 300 && window.scrollTo(0, 300));
      },
    });
    const y = await p.page.evaluate(() => window.scrollY);
    const first = await grab(p, "reload-t0");
    if (y < 200) fail(`the reload did not keep the page scrolled (scrollY ${y}) — the probe tested nothing`);
    if (!existsSync(POSTER)) fail(`no poster at ${path.relative(REPO, POSTER)}`);
    else {
      const ref = await sharp(POSTER).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const d0 = diff(first, { data: ref.data, w: ref.info.width, h: ref.info.height });
      info(`at scrollY ${y}: the first frame against the poster, ${d0.line}`);
      if (!GPU && (d0.mean > 1.5 || d0.bigPct > 1)) fail(`loaded mid-scroll, the first frame is not the poster (${d0.line}) — the exploded view must start assembled`);
      /* and then it opens: against a page loaded at the top, on the same clock */
      const top = await open({ dpr: 2, width: 660 });
      await advance(p, 2.5);
      await advance(top, 2.5);
      const d1 = diff(await grab(p, "reload-t2.5"), await grab(top, "reload-top-t2.5"));
      info(`2.5s on, against a page loaded at the top at the same moment: ${d1.line}`);
      if (d1.bigPct < 5) fail(`2.5s after a mid-scroll load the stack has not opened (${d1.line} against an unscrolled page)`);
      await top.ctx.close();
    }
    await p.ctx.close();
  }

  /* ── view: the exploded view opens fully while the whole drawing is on screen ── */
  if (want("view")) {
    begin("view", "view — on the page as laid out, the stack opens fully before any of it goes under the pinned header");
    const p = await open({ width: 660, pinned: false });
    /* the stack's opening, from the scene's own objects: its highest plate's height */
    const lift = () =>
      p.page.evaluate(() => {
        const scene = (window.__bfScenes || []).find((x) => x.getObjectByName && x.getObjectByName("core"));
        const core = scene?.getObjectByName("core");
        return core ? Math.max(...core.children.map((c) => c.position.y)) : null;
      });
    const box = await p.page.evaluate(() => {
      const f = document.querySelector("[data-hero-field]").getBoundingClientRect();
      return { x: f.left, w: f.width, top: f.top + scrollY, vh: innerHeight };
    });
    const y0 = await lift();
    const rows = [];
    for (let sy = 0; sy <= 260; sy += 10) {
      await p.page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), sy);
      await p.page.waitForTimeout(80); // the scroll event lands (the scene reads scrollY in its listener)
      await advance(p, 2); // the damped opening: e^-12, there
      /* the header hidden for the read, so what is under it can be seen */
      const hdr = await p.page.evaluate(() => {
        const h = document.getElementById("masthead");
        const b = Math.max(0, h.getBoundingClientRect().bottom);
        h.style.visibility = "hidden";
        return Math.round(b);
      });
      await p.page.waitForTimeout(60);
      const png = await p.page.screenshot({ type: "png", clip: { x: box.x, y: 0, width: box.w, height: box.vh } });
      await p.page.evaluate(() => (document.getElementById("masthead").style.visibility = ""));
      const { data, info: px } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const k = px.width / box.w;
      const fieldTop = box.top - sy;
      let top = -1;
      for (let y = Math.max(0, Math.round(fieldTop * k)); y < px.height && top < 0; y++)
        for (let x = 0; x < px.width; x++) {
          const i = (y * px.width + x) * 3;
          if (Math.abs(data[i] - GROUND[0]) + Math.abs(data[i + 1] - GROUND[1]) + Math.abs(data[i + 2] - GROUND[2]) > 12) {
            top = Math.round(y / k);
            break;
          }
        }
      rows.push({ sy, lift: await lift(), top, hdr, fieldTop });
    }
    const y1 = rows.at(-1).lift;
    const pct = (r) => (y1 !== null && y0 !== null && y1 - y0 > 1e-6 ? (r.lift - y0) / (y1 - y0) : 0);
    info(`scrolled 0-260px, held: ${rows.map((r) => `${r.sy}: ${Math.round(100 * pct(r))}% open, top ${r.top}${r.hdr ? ` (header ${r.hdr})` : ""}`).join("; ")}`);
    const full = rows.find((r) => pct(r) >= 0.98);
    const cut = rows.find((r) => r.top >= 0 && r.top < r.hdr);
    if (y0 === null || y1 === null || !(y1 - y0 > 1e-6)) fail(`the stack's opening could not be read from the scene (lift ${y0} at the top, ${y1} past the span) — unsure is a failure`);
    else if (!full) fail("the stack never opened fully by scroll 260px — unsure is a failure");
    else {
      info(`fully open at scroll ${full.sy}px: the drawing's top at ${full.top}px, the pinned header's bottom at ${full.hdr}px`);
      if (cut && pct(cut) < 0.98) fail(`the opened stack goes under the pinned header (${cut.hdr}px) at scroll ${cut.sy}px while it is only ${Math.round(100 * pct(cut))}% open — it opens fully only at scroll ${full.sy}px, with its top cut off; it must open fully while the whole drawing is below the header`);
    }
    if (p.errors.length) fail(`page errors — ${p.errors.slice(0, 3).join(" | ")}`);
    await p.ctx.close();
  }

  /* the drawing buffer's size: 1155x980 whole at DPR 2 (1.75 x 660x560), 825x700 once the watchdog has stepped it */
  const bufferOf = (p) =>
    p.page.evaluate(() => {
      const c = document.querySelector("[data-hero-field] canvas");
      return `${c.width}x${c.height}`;
    });

  /* ── watchdog: slow frames degrade by fades, never in one frame ── */
  if (want("watchdog")) {
    begin("watchdog", "watchdog — 40ms frames, each 30ms of the scene's own work: each step a fade; a GPU clocked slow steps it too");
    /* the scene's own script work, 30ms a frame: the watchdog judges work, never the cadence alone */
    const p = await open({ dpr: 2, width: 660, init: { __bfWorkMs: 30 } });
    const first = measure(await grab(p));
    const flow = [first.flow];
    const solid = [first.lit - first.flow];
    /* 40ms frames for 10s: the drawing buffer steps at ~2s, the comets fade at ~4s, the outer tier sinks at ~6s */
    for (let i = 1; i <= 50; i++) {
      await advance(p, 0.2, 40);
      const m = measure(await grab(p, i % 5 ? null : `watchdog-${i}`));
      flow.push(m.flow);
      solid.push(m.lit - m.flow);
    }
    const buf = await bufferOf(p);
    info(`the comets' light every 0.2s: ${flow.map((v) => v.toFixed(3)).join(" ")}`);
    info(`the rest, lit: ${solid.map((v) => v.toFixed(1)).join(" ")}`);
    info(`drawing buffer after the steps: ${buf}`);
    if (buf !== "825x700") fail(`the drawing buffer is ${buf} after the watchdog's steps — at DPR 2 its one step is from 1.75 to 1.25 (825x700)`);
    /* a fade spreads its change over several 0.2s samples; a pop puts all of
       it in one. Each phase: the comets (all of them go) and the outer tier
       (the rest drops by its share) */
    const phase = (series, label, share) => {
      const peak = Math.max(...series.slice(0, 8));
      const drop = peak - series[series.length - 1];
      const minDrop = share * peak;
      let worst = 0;
      let at = 0;
      for (let i = 1; i < series.length; i++)
        if (series[i - 1] - series[i] > worst) {
          worst = series[i - 1] - series[i];
          at = i * 0.2;
        }
      info(`${label}: down ${drop.toFixed(3)} in all, at most ${worst.toFixed(3)} (${Math.round((100 * worst) / Math.max(drop, 1e-9))}%) in one 0.2s step, at ${at.toFixed(1)}s`);
      /* two findings, not one: a drop a little short of the share still shows
         whether it went in one step (the gate builds every misuse at once, and
         a scene swung elsewhere shows less comet light to lose) */
      if (drop < minDrop) fail(`${label}: only ${drop.toFixed(3)} went — the watchdog never dropped it`);
      if (drop >= 0.5 * minDrop && worst > 0.5 * drop) fail(`${label}: ${Math.round((100 * worst) / drop)}% of it went in one 0.2s step at ${at.toFixed(1)}s — it vanished instead of fading`);
    };
    /* the comets go (a trace of cyan elsewhere stays); the outer tier is at least 5% of what is lit */
    phase(flow, "the comets", 0.8);
    phase(solid, "the outer tier", 0.05);
    await p.ctx.close();

    /* a slow GPU the browser can clock: 30ms of GPU time a frame, at a smooth
       60Hz cadence and cheap script work — the GPU's time is the slow part */
    const g = await open({ dpr: 2, width: 660, init: { __bfGpuMs: 30 } });
    await advance(g, 4);
    const gbuf = await bufferOf(g);
    info(`a GPU clocked at 30ms a frame, 60Hz, cheap script work: the drawing buffer is ${gbuf} after 4s`);
    if (gbuf !== "825x700") fail(`a GPU clocked at 30ms a frame, at a smooth 60Hz cadence with cheap script work: the drawing buffer never stepped down in 4s (it is ${gbuf}) — where the browser clocks the GPU, its time is what the watchdog judges`);
    await g.ctx.close();
  }

  /* ── cadence: a steady 30Hz display is not a slow GPU ── */
  if (want("cadence")) {
    begin("cadence", "cadence — a steady 30Hz cadence with cheap work degrades nothing; an uneven one does");
    /* the 60Hz reference at t = 12s, the same scene time: the pose depends on t alone, so a scene that kept everything draws the same frame */
    const ref = await open({ dpr: 2, width: 660, init: { __bfGpuMs: 1.5 } });
    await advance(ref, 12);
    const refImg = await grab(ref, "cadence-60hz-t12");
    const refM = measure(refImg);
    const refBuf = await bufferOf(ref);
    info(`60Hz reference at t = 12s: the drawing buffer ${refBuf}, the comets' light ${refM.flow.toFixed(3)}, lit ${refM.lit.toFixed(1)}%`);
    await ref.ctx.close();
    for (const [label, init] of [
      ["GPU clocked at 1.5ms a frame", { __bfGpuMs: 1.5 }],
      ["no GPU clock (Safari)", { __bfTimer: "none" }],
    ]) {
      const p = await open({ dpr: 2, width: 660, init });
      await advance(p, 12, 1000 / 30);
      const img = await grab(p, `cadence-30hz-${init.__bfTimer ? "noclock" : "clock"}-t12`);
      const m = measure(img);
      const buf = await bufferOf(p);
      const d = diff(img, refImg);
      info(`30Hz, ${label}, t = 12s: the drawing buffer ${buf}, the comets' light ${m.flow.toFixed(3)} (60Hz ${refM.flow.toFixed(3)}), lit ${m.lit.toFixed(1)}% (60Hz ${refM.lit.toFixed(1)}%); against the 60Hz frame: ${d.line}`);
      if (buf !== refBuf) fail(`30Hz, ${label}: the drawing buffer stepped down to ${buf} (60Hz: ${refBuf}) — a steady 30Hz cadence with cheap work is the display's rate (a laptop on battery), not a slow GPU`);
      if (m.flow < 0.8 * refM.flow) fail(`30Hz, ${label}: the comets' light is ${m.flow.toFixed(3)} at t = 12s against ${refM.flow.toFixed(3)} at 60Hz — the data flow faded at the display's own cadence`);
      if (d.bigPct > 1) fail(`30Hz, ${label}: the t = 12s frame differs from the 60Hz one (${d.line}) — at a steady 30Hz with cheap work the watchdog took something away`);
      await p.ctx.close();
    }
    /* the control: frames that are slow AND uneven, with no GPU clock and
       cheap work — a device that cannot keep up — do step it down */
    const c = await open({ dpr: 2, width: 660, init: { __bfTimer: "none" } });
    await c.page.evaluate(() => {
      const seq = [1000 / 60, 50, 1000 / 30, 200 / 3, 1000 / 30];
      for (let i = 0; i < 125; i++) window.__bfStep(1, seq[i % seq.length], i === 124);
    });
    const cbuf = await bufferOf(c);
    info(`control, no GPU clock, an uneven cadence (16.7/50/33.3/66.7/33.3ms) for 5s: the drawing buffer is ${cbuf}`);
    if (cbuf !== "825x700") fail(`control: with no GPU clock, an uneven cadence averaging 40ms never stepped the drawing buffer down in 5s (it is ${cbuf}) — this check cannot tell a display's cadence from a device that cannot keep up, and proves nothing`);
    await c.ctx.close();
  }
} finally {
  await browser.close();
}
if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify({ tool: "probe-scene", base: URL_, gpu: GPU, results: report }, null, 1));
console.log(failures.length ? `probe-scene: ${failures.length} failure(s)` : "probe-scene: every check passed");
process.exit(failures.length ? 1 : 0);
