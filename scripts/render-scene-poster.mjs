#!/usr/bin/env node
/**
 * Renders the hero poster from the live three.js scene, so the LCP image is a
 * real frame of exactly what the canvas fades in over it.
 *
 *   yarn build && yarn next start -p 3462        (in another shell)
 *   node scripts/render-scene-poster.mjs [--base http://localhost:3462] [--gpu] [--png out.png]
 *
 * It opens `/` in Playwright Chromium at 1440x1000, DPR 2, a fine pointer and
 * motion allowed, which is a profile where HeroScene mounts the scene. Headless
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
 * WHICH FRAME: the full 660x560 poster. At 1440 the field is 590 wide, and the
 * scene keeps a fixed vertical field of view, so a narrower canvas is only the
 * centre crop of a wider one, just as `object-fit: cover` crops the poster.
 * For the capture, injected CSS makes the field exactly 660x560 with square
 * corners and no fade. The canvas renders at the scene's DPR cap, 1.75, and the
 * browser composites it at DPR 2: the poster is what a DPR-2 visitor's canvas
 * shows, pixel for pixel, so the crossfade is seamless.
 *
 * It then encodes public/hero/scene-poster-v1-{1320,660}.{avif,webp} with sharp.
 * A re-rendered poster needs a NEW name (v2, ...): /hero/* is served immutable.
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
const NAME = "scene-poster-v1";

/* Encoder settings. 4:4:4 keeps the thin blue and cyan lines their colour. */
const AVIF = { quality: 56, effort: 9, chromaSubsampling: "4:4:4" };
const WEBP = { quality: 82, effort: 6, smartSubsample: true };

const browser = await chromium.launch({
  args: GPU
    ? ["--use-angle=metal", "--ignore-gpu-blocklist"]
    : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
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
  if (PNG_OUT) await writeFile(PNG_OUT, png);

  /* the canvas must have drawn: most pixels are the ground, but not all */
  const { data, info: px } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  if (px.width !== 1320 || px.height !== 1120) throw new Error(`the capture is ${px.width}x${px.height}, not 1320x1120`);
  let lit = 0;
  for (let i = 0; i < data.length; i += px.channels) if (Math.abs(data[i] - 7) + Math.abs(data[i + 1] - 9) + Math.abs(data[i + 2] - 13) > 12) lit++;
  const litPct = (100 * lit) / (px.width * px.height);
  if (litPct < 3) throw new Error(`only ${litPct.toFixed(1)}% of the capture differs from the ground; the scene did not draw`);

  const small = await sharp(png).resize(660, 560, { kernel: "lanczos3" }).png().toBuffer();
  const files = [
    [`${NAME}-1320.avif`, sharp(png).avif(AVIF)],
    [`${NAME}-1320.webp`, sharp(png).webp(WEBP)],
    [`${NAME}-660.avif`, sharp(small).avif(AVIF)],
    [`${NAME}-660.webp`, sharp(small).webp(WEBP)],
  ];
  for (const [name, pipeline] of files) {
    const r = await pipeline.toFile(path.join(OUT, name));
    console.log(`${name.padEnd(28)} ${r.width}x${r.height}  ${(r.size / 1024).toFixed(1)}KB`);
  }
  console.log(`captured at t = 0: field ${info.field}, canvas buffer ${info.buffer}, DPR ${env.dpr}, ${litPct.toFixed(1)}% of pixels off the ground, ${GPU ? "GPU" : "SwiftShader"}`);
  if (errors.length) console.log(`console errors during the capture:\n  ${errors.join("\n  ")}`);
} finally {
  await browser.close();
}
