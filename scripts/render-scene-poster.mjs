#!/usr/bin/env node
/**
 * Renders the hero poster from the live three.js scene, so the LCP image is a
 * real frame of exactly what the canvas fades in over it.
 *
 *   yarn build && yarn next start -p 3462        (in another shell)
 *   node scripts/render-scene-poster.mjs [--base http://localhost:3462] [--gpu] [--png out.png]
 *
 * It opens `/` in Playwright Chromium at 1440x1000, a fine pointer and motion
 * allowed, which is a profile where HeroScene mounts the scene — twice, at
 * DPR 2 and at DPR 1. Headless
 * Chromium has no GPU by default, so WebGL runs on SwiftShader
 * (`--use-angle=swiftshader --enable-unsafe-swiftshader`); `--gpu` uses the
 * machine's GPU through ANGLE/Metal instead.
 *
 * WHICH MOMENT: t = 0, the scene's first frame. The scene's clock starts at 0
 * when it mounts and moves only by frame deltas, and the frame that resolves
 * its `ready` promise is always t = 0 with the camera at rest (no pointer has
 * moved; this script sends none). HeroScene sets `data-scene-ready` in that
 * same microtask checkpoint, and an init script here freezes
 * requestAnimationFrame the moment the attribute appears. So the loop's next
 * callback never runs, and the canvas holds the t = 0 frame, the same on every
 * run and on every visitor's first frame.
 *
 * WHICH FRAME: the full 660x560 poster. The scene keeps a fixed HORIZONTAL
 * field of view (the 660x560 frame's), so a narrower canvas draws the same
 * frame smaller, just as `object-fit: contain` draws the poster in a narrower
 * field at >=1025px. For the capture, injected CSS makes the field exactly
 * 660x560 with square corners and no fade. At DPR 2 the canvas renders at the
 * scene's DPR cap, 1.75, and the browser composites it at DPR 2: that capture
 * is what a DPR-2 visitor's canvas shows. At DPR 1 it is what a DPR-1
 * visitor's canvas shows, one-pixel lines at full strength — which a
 * downsample of the DPR-2 capture draws at about half (2026-09-29).
 *
 * It then encodes, with sharp, into public/hero/:
 *   scene-poster-v2-1320.{avif,webp}    the DPR-2 capture (1320x1120)
 *   scene-poster-v2-660-1x.{avif,webp}  the DPR-1 capture: >=768px at DPR 1
 *   scene-poster-v2-660.{avif,webp}     the DPR-2 capture downsampled: phones
 * A re-rendered poster needs a NEW name (v3, ...): /hero/* is served immutable,
 * and v1 (2026-09-16) stays as it was deployed. (v2 was re-rendered in its own
 * branch on 2026-09-29, before it had ever been served.) `scripts/probe-scene.mjs`
 * checks the frames the poster cannot: t = 0-100s, at 660 and 467, and the
 * poster as the browser draws it, drifting, below 1025px.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const BASE = opt("--base", "http://localhost:3462");
const GPU = argv.includes("--gpu");
const PNG_OUT = opt("--png", null);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(REPO, "public", "hero");
const NAME = "scene-poster-v2";

/* Encoder settings. 4:4:4 keeps the thin blue and cyan lines their colour.
   The DPR-1 file carries one-pixel lines at full strength, which AVIF softens
   most: at 56 it was 0.91% of pixels off the canvas it must match, at 64
   0.36%, for 2.5KB more (8.7 -> 11.2KB), measured 2026-09-29. */
const AVIF = { quality: 56, effort: 9, chromaSubsampling: "4:4:4" };
const AVIF_1X = { ...AVIF, quality: 64 };
const WEBP = { quality: 82, effort: 6, smartSubsample: true };

const browser = await chromium.launch({
  args: GPU
    ? ["--use-angle=metal", "--ignore-gpu-blocklist"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
/** One capture of the field at t = 0, at this DPR: the PNG and what it was. */
async function capture(dpr) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: dpr,
    isMobile: false,
    hasTouch: false,
    reducedMotion: "no-preference",
  });
  await ctx.addInitScript(() => {
    /* freeze script animation frames once the scene has drawn t = 0 */
    let frozen = false;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((ts) => (frozen ? undefined : cb(ts)));
    new MutationObserver(() => {
      if (document.querySelector("[data-scene-ready]")) frozen = true;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-scene-ready"] });
    /* the full poster frame: 660x560, square corners, no fade */
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent =
        /* at whole-pixel coordinates (in flow the field can sit at a fractional x,
           and the capture would be resampled), clear of the sticky header */
        "[data-hero-field]{position:fixed!important;left:0!important;top:200px!important;margin:0!important;z-index:9999!important;" +
        "box-sizing:content-box!important;width:660px!important;height:560px!important;max-width:none!important;border:0!important;border-radius:0!important;flex:none!important}" +
        "[data-hero-field] canvas{transition:none!important}";
      document.head.append(s);
    });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });

  const env = await page.evaluate(() => ({
    fine: matchMedia("(pointer: fine) and (min-width: 1025px)").matches,
    dpr: devicePixelRatio,
  }));
  if (!env.fine) throw new Error("the profile does not match (pointer: fine) and (min-width: 1025px); HeroScene would not mount");

  await page.waitForSelector("[data-hero-field][data-scene-ready]", { timeout: 90000 });
  await page.waitForFunction(() => getComputedStyle(document.querySelector("[data-hero-field] canvas")).opacity === "1");
  await page.waitForTimeout(400);

  const info = await page.evaluate(() => {
    const f = document.querySelector("[data-hero-field]");
    const c = f.querySelector("canvas");
    const b = f.getBoundingClientRect();
    return { field: `${f.clientWidth}x${f.clientHeight}`, at: `${b.left},${b.top}`, buffer: `${c.width}x${c.height}` };
  });
  if (info.field !== "660x560" || info.at !== "0,200") throw new Error(`the field is ${info.field} at ${info.at}, not 660x560 at 0,200`);

  const png = await page.screenshot({ type: "png", clip: { x: 0, y: 200, width: 660, height: 560 } });
  await ctx.close();

  /* the canvas must have drawn: most pixels are the ground, but not all */
  const { data, info: px } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  if (px.width !== 660 * dpr || px.height !== 560 * dpr) throw new Error(`the capture is ${px.width}x${px.height}, not ${660 * dpr}x${560 * dpr}`);
  let lit = 0;
  for (let i = 0; i < data.length; i += px.channels) if (Math.abs(data[i] - 7) + Math.abs(data[i + 1] - 9) + Math.abs(data[i + 2] - 13) > 12) lit++;
  const litPct = (100 * lit) / (px.width * px.height);
  if (litPct < 3) throw new Error(`only ${litPct.toFixed(1)}% of the DPR-${dpr} capture differs from the ground; the scene did not draw`);
  /* the scene dissolves into the page: a 16px band around the poster is
     exactly the ground, #07090D, with nothing reaching an edge */
  const band = 16 * dpr;
  let edgeDev = 0;
  for (let y = 0; y < px.height; y++)
    for (let x = 0; x < px.width; x++) {
      if (x >= band && x < px.width - band && y >= band && y < px.height - band) continue;
      const i = (y * px.width + x) * px.channels;
      edgeDev = Math.max(edgeDev, Math.abs(data[i] - 7), Math.abs(data[i + 1] - 9), Math.abs(data[i + 2] - 13));
    }
  if (edgeDev > 1) throw new Error(`the DPR-${dpr} capture's edge band is not the ground: a channel is ${edgeDev} off #07090D; something reaches the edge`);
  return { png, info, env, litPct, edgeDev, errors };
}

try {
  const two = await capture(2);
  const one = await capture(1);
  if (PNG_OUT) await writeFile(PNG_OUT, two.png);
  const small = await sharp(two.png).resize(660, 560, { kernel: "lanczos3" }).png().toBuffer();
  const files = [
    [`${NAME}-1320.avif`, sharp(two.png).avif(AVIF)],
    [`${NAME}-1320.webp`, sharp(two.png).webp(WEBP)],
    [`${NAME}-660-1x.avif`, sharp(one.png).avif(AVIF_1X)],
    [`${NAME}-660-1x.webp`, sharp(one.png).webp(WEBP)],
    [`${NAME}-660.avif`, sharp(small).avif(AVIF)],
    [`${NAME}-660.webp`, sharp(small).webp(WEBP)],
  ];
  for (const [name, pipeline] of files) {
    const r = await pipeline.toFile(path.join(OUT, name));
    console.log(`${name.padEnd(30)} ${r.width}x${r.height}  ${(r.size / 1024).toFixed(1)}KB`);
  }
  for (const c of [two, one])
    console.log(`captured at t = 0, DPR ${c.env.dpr}: field ${c.info.field}, canvas buffer ${c.info.buffer}, ${c.litPct.toFixed(1)}% of pixels off the ground, edge band within ${c.edgeDev} of #07090D, ${GPU ? "GPU" : "SwiftShader"}`);
  const errors = [...two.errors, ...one.errors];
  if (errors.length) console.log(`console errors during the capture:\n  ${errors.join("\n  ")}`);
} finally {
  await browser.close();
}
