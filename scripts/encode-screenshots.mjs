// Pre-encodes every project screenshot the site renders into AVIF and WebP at
// fixed widths, and writes lib/screenshots.json, which
// components/techwix/ScreenImage.tsx reads. Why: CLAUDE.md, "Screenshots are
// pre-encoded" (2026-09-16).
//
// Usage: node scripts/encode-screenshots.mjs
// It is idempotent: it rewrites every output. Commit the files in
// public/projects/opt/ and lib/screenshots.json.
// To add a screenshot: put it in public/projects/, add its path to SCREENSHOTS
// below, and run this. ScreenImage refuses a screenshot that has no encodes, so a
// missing entry fails the build rather than silently falling back.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every screenshot a page renders through ScreenImage, as the path the content uses. */
const SCREENSHOTS = [
  "/projects/warmchats-ai-booking.png",
  "/projects/warmchats-dashboard.png",
  "/projects/warmchats-ai-agent.png",
  "/projects/warmchats-onboarding.png",
  "/projects/case-fnb-smart-search.png",
  "/projects/fanlock.webp",
  "/projects/balanzify.webp",
  "/projects/go-style-business.webp",
  "/projects/opal.webp",
];
const OUT = "/projects/opt";
/* 640 for phones; the full width (capped at 1280) for everything larger. The
   frames these sit in are at most about 700 CSS px wide, so 1280 covers 2x. */
const TARGETS = [640, 1280];

mkdirSync(path.join(ROOT, "public", OUT), { recursive: true });
const manifest = {};
for (const src of SCREENSHOTS) {
  const file = path.join(ROOT, "public", src);
  if (!existsSync(file)) throw new Error(`${src} is listed but public${src} does not exist`);
  const { width, height } = await sharp(file).metadata();
  const widths = [...new Set(TARGETS.map((w) => Math.min(w, width)))].sort((a, b) => a - b);
  const base = path.basename(src).replace(/\.[a-z0-9]+$/i, "");
  for (const w of widths) {
    await sharp(file).resize({ width: w }).avif({ quality: 50, effort: 4 }).toFile(path.join(ROOT, "public", OUT, `${base}-${w}.avif`));
    await sharp(file).resize({ width: w }).webp({ quality: 80 }).toFile(path.join(ROOT, "public", OUT, `${base}-${w}.webp`));
  }
  manifest[src] = { width, height, widths, base: `${OUT}/${base}` };
  console.log(`${src}  ${width}x${height} → ${widths.map((w) => `${w}w`).join(", ")}`);
}
writeFileSync(path.join(ROOT, "lib", "screenshots.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`lib/screenshots.json: ${Object.keys(manifest).length} screenshots`);
