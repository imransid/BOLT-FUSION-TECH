#!/usr/bin/env node
/**
 * Probes the hero's three.js scene on rendered frames — the composition rules
 * the poster script checks only at t = 0 (CLAUDE.md, "The hero field").
 *
 *   yarn build && yarn start -p 3462                     (in another shell)
 *   node scripts/probe-scene.mjs [--base http://localhost:3462] [--gpu] [--shots <dir>] [--only a,b]
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
 *   identity    the t = 0 frame at 660x560, DPR 2, against the poster file
 *               (public/hero/<NAME>-1320.webp): its mean difference, to show
 *               the canvas fades in over the same picture. With --gpu the
 *               canvas is the machine's GPU and the poster is SwiftShader's,
 *               so this is the cross-rasteriser diff; it prints, it does not
 *               fail on a GPU.
 *   charge      on fresh pages, hovering and then focusing the hero's
 *               Schedule a Call: the seams brighten ~40% (x1.2–1.7), eased in
 *               (at most 60% in the first 0.1s, at least 75% by 0.6s), stay
 *               blue (b > g > r), and return within 1.6s of leaving; paused,
 *               a hover changes nothing; hovered before the scene mounts, the
 *               first frame is still the poster, and the charge follows.
 *   watchdog    frames fed at 40ms: the degradation steps (drawing buffer,
 *               comets, outer tier) happen as fades — no phase loses more
 *               than half of what it drops in one 0.2s step.
 *
 * Exit 0 when every check passed, 1 otherwise. The frames it read go to
 * --shots when given.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTER = path.join(REPO, "public", "hero", `${opt("--poster", "scene-poster-v2")}-1320.webp`);
const GROUND = [7, 9, 13];
const want = (k) => !ONLY || ONLY.includes(k);

const failures = [];
const fail = (s) => {
  failures.push(s);
  console.log(`  FAIL  ${s}`);
};
const info = (s) => console.log(`  ${s}`);

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
  /* skip the context's draws while fast-forwarding: the scene still poses */
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const ctx = getContext.call(this, type, attrs);
    if (ctx && /webgl/.test(String(type)) && !ctx.__bfProbe) {
      ctx.__bfProbe = true;
      for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced", "drawRangeElements"]) {
        const f = ctx[name];
        if (typeof f === "function") ctx[name] = function (...a) { return window.__bfSkipDraw ? undefined : f.apply(this, a); };
      }
    }
    return ctx;
  };
  /* run the queued frames: `frames` of them, `dtMs` apart; only the last is drawn */
  window.__bfStep = (frames, dtMs = 1000 / 60) => {
    let ran = 0;
    for (let f = 0; f < frames; f++) {
      window.__bfSkipDraw = f < frames - 1;
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

/* the field fixed at `left`,200: at the left edge, or at 760 where it leaves the hero's calls to action uncovered */
const fieldCss = (w, left = 0) =>
  `[data-hero-field]{position:fixed!important;left:${left}px!important;top:200px!important;margin:0!important;z-index:9999!important;` +
  `box-sizing:content-box!important;width:${w}px!important;height:560px!important;max-width:none!important;border:0!important;border-radius:0!important;flex:none!important}` +
  "[data-hero-field] canvas{transition:none!important}";

const browser = await chromium.launch({
  args: GPU
    ? ["--use-angle=metal", "--ignore-gpu-blocklist"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

/** A fresh page with the scene drawn at t = 0 and its clock ours; `before(page)` runs after load. */
async function open({ dpr = 1, width = 660, left = 0, css = "", before } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, reducedMotion: "no-preference" });
  await ctx.addInitScript(clockHook);
  await ctx.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.id = "bf-probe-field";
      s.textContent = css;
      document.head.append(s);
    });
  }, fieldCss(width, left) + css);
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
  }
  ratios.sort((x, y) => x - y);
  const n = ratios.length;
  return { gain: n ? ratios[n >> 1] : 0, n, rgb: n ? `${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)}` : "0,0,0" };
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
    console.log("clearance — the 16px band is the ground at every frame");
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

  /* ── identity: the t = 0 frame against the poster file ── */
  if (want("identity")) {
    console.log("identity — the canvas's t = 0 frame against the poster");
    const p = await open({ dpr: 2, width: 660 });
    const img = await grab(p, "identity-t0");
    const m = measure(img);
    info(`t = 0 @660 DPR 2: ${fmt(m)}`);
    if (m.dev > 1) fail(`t = 0: the edge band is ${m.dev} off the ground`);
    /* the control: the same scene two seconds on, which the comparison must tell apart */
    await advance(p, 2);
    const later = await grab(p, "identity-t2");
    if (!existsSync(POSTER)) fail(`no poster at ${path.relative(REPO, POSTER)}`);
    else {
      const ref = await sharp(POSTER).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      if (ref.info.width !== img.w || ref.info.height !== img.h) fail(`the poster is ${ref.info.width}x${ref.info.height}, the frame ${img.w}x${img.h}`);
      else {
        const t0 = diff(img, ref);
        const t2 = diff(later, ref);
        info(`t = 0 against ${path.basename(POSTER)}: ${t0.line}${GPU ? " (the GPU's canvas against SwiftShader's poster)" : ""}`);
        info(`control, t = 2s against it: ${t2.line}`);
        /* the poster is the first frame, less its WebP encoding; a frame two
           seconds later must read as clearly further away, or the comparison
           tells nothing apart */
        if (t2.bigPct < 3 * t0.bigPct || t2.bigPct < 1) fail(`the comparison cannot tell t = 0 from t = 2s (${t0.bigPct.toFixed(2)}% against ${t2.bigPct.toFixed(2)}%) — it proves nothing`);
        if (!GPU && (t0.mean > 1.5 || t0.bigPct > 1)) fail(`t = 0 differs from the poster (${t0.line}) — the poster is not this scene's first frame; re-render it`);
      }
    }
    await p.ctx.close();
  }

  /* ── charge: hovering or focusing the hero's Schedule a Call charges the system ── */
  if (want("charge")) {
    console.log('charge — hover and focus on #hero [data-cta="schedule"], each page against an untouched one at the same moment');
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
      info(`${how}: the seams' linear luminance against the untouched page — ${sr.map((x) => `x${x.gain.toFixed(2)} at ${x.t}s`).join(", ")} (${full.n} seam pixels); charged, they read rgb ${full.rgb}`);
      if (full.gain < 1.3 || full.gain > 1.55) fail(`${how}: at full charge the seams are x${full.gain.toFixed(2)} as bright — the charge is +40%`);
      if (rise(sr[0]) > 0.6) fail(`${how}: ${Math.round(100 * rise(sr[0]))}% of the charge came in the first 0.1s — it eases in, it does not jump`);
      if (rise(sr[3]) < 0.75) fail(`${how}: only ${Math.round(100 * rise(sr[3]))}% of the charge after 0.6s — it eases in over about 0.6s`);
      /* brighter BLUE, never amber: blue leads green leads red */
      const [cr, cg, cb] = full.rgb.split(",").map(Number);
      if (!(cb > cg && cg > cr)) fail(`${how}: the charged seams are rgb ${full.rgb} — the charge is a brighter blue, never amber`);
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
    const ran = await advance(p, 1.6);
    const d = diff(before, await grab(p));
    info(`paused: hovered for 1.6s, ${ran} frame(s) ran, the field changed by ${d.line}`);
    if (ran || d.bigPct > 0) fail(`paused, the scene still answered the hover (${ran} frames ran; ${d.line}) — Pause motion freezes it`);
    await p.ctx.close();
  }

  /* ── watchdog: slow frames degrade by fades, never in one frame ── */
  if (want("watchdog")) {
    console.log("watchdog — 40ms frames: each step a fade");
    const p = await open({ dpr: 2, width: 660 });
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
    const buf = await p.page.evaluate(() => {
      const c = document.querySelector("[data-hero-field] canvas");
      return `${c.width}x${c.height}`;
    });
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
      if (drop < minDrop) fail(`${label}: only ${drop.toFixed(3)} went — the watchdog never dropped it`);
      else if (worst > 0.5 * drop) fail(`${label}: ${Math.round((100 * worst) / drop)}% of it went in one 0.2s step at ${at.toFixed(1)}s — it vanished instead of fading`);
    };
    /* the comets go (a trace of cyan elsewhere stays); the outer tier is at least 5% of what is lit */
    phase(flow, "the comets", 0.8);
    phase(solid, "the outer tier", 0.05);
    await p.ctx.close();
  }
} finally {
  await browser.close();
}
console.log(failures.length ? `probe-scene: ${failures.length} failure(s)` : "probe-scene: every check passed");
process.exit(failures.length ? 1 : 0);
