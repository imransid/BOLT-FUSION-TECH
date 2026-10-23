#!/usr/bin/env node
/**
 * Regenerates the site's icons from the Forward Monogram (lib/mark.ts, the one
 * source of its geometry). Run after any change to the mark:
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes, and the layout declares (app/layout.tsx, `icons`):
 *   public/favicon.svg          the small cut (3-unit seams), white on the brand
 *                               ground — SPEC §2: below 24px the mark is one
 *                               colour on the brand ground
 *   public/apple-touch-icon.png 180x180, the standard cut, white on the brand
 *                               ground with clear space; iOS rounds the corners
 *   app/favicon.ico             16, 32 and 48 px PNGs in one ICO (Next serves
 *                               app/favicon.ico by convention) — the small cut at
 *                               16 and 32, the standard at 48
 *
 * Node strips the types from lib/mark.ts as it imports it (Node 22.18+ / 23.6+).
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { markSvg } from "../lib/mark.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* The brand ground: the cobalt of every primary button (app/site.css
   --cobalt, the studio redesign of 2026-10-24), which carries white at
   6.2:1. */
const GROUND = "#2B44FF";
const INK = "#FFFFFF";

const favicon = markSvg({ variant: "small", ink: INK, ground: GROUND, radius: 10 });
const png = (svg, size) => sharp(Buffer.from(svg), { density: 72 * (size / 48) * 4 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/* An ICO holding PNG images (every current browser reads PNG-in-ICO). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await writeFile(join(root, "public/favicon.svg"), favicon + "\n");

const apple = markSvg({ variant: "standard", ink: INK, ground: GROUND, radius: 0, scale: 0.72 });
await writeFile(join(root, "public/apple-touch-icon.png"), await png(apple, 180));

const standard = markSvg({ variant: "standard", ink: INK, ground: GROUND, radius: 10 });
const images = [
  { size: 16, data: await png(favicon, 16) },
  { size: 32, data: await png(favicon, 32) },
  { size: 48, data: await png(standard, 48) },
];
await writeFile(join(root, "app/favicon.ico"), ico(images));

console.log("wrote public/favicon.svg, public/apple-touch-icon.png (180), app/favicon.ico (16, 32, 48)");
