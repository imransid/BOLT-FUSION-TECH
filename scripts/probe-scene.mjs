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
 *   watchdog    frames fed at 40ms: the degradation steps (drawing buffer,
 *               comets, outer tier) happen as fades — no frame-to-frame
 *               change bigger than a fade step.
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

const fieldCss = (w) =>
  "[data-hero-field]{position:fixed!important;left:0!important;top:200px!important;margin:0!important;z-index:9999!important;" +
  `box-sizing:content-box!important;width:${w}px!important;height:560px!important;max-width:none!important;border:0!important;border-radius:0!important;flex:none!important}` +
  "[data-hero-field] canvas{transition:none!important}";

const browser = await chromium.launch({
  args: GPU
    ? ["--use-angle=metal", "--ignore-gpu-blocklist"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

/** A fresh page with the scene drawn at t = 0 and its clock ours; `before(page)` runs after load. */
async function open({ dpr = 1, width = 660, before } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: dpr, reducedMotion: "no-preference" });
  await ctx.addInitScript(clockHook);
  await ctx.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.id = "bf-probe-field";
      s.textContent = css;
      document.head.append(s);
    });
  }, fieldCss(width));
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
  return { ctx, page, errors, width };
}
const advance = (p, seconds, dtMs = 1000 / 60) => p.page.evaluate(([n, d]) => window.__bfStep(n, d), [Math.max(1, Math.round((seconds * 1000) / dtMs)), dtMs]);
const pointerAt = (p, fx, fy) => p.page.mouse.move(1440 * fx, 1000 * fy);

/** The field as pixels: RGB rows at the page's DPR. */
async function grab(p, name) {
  await p.page.waitForTimeout(60);
  const png = await p.page.screenshot({ type: "png", clip: { x: 0, y: 200, width: p.width, height: 560 } });
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
