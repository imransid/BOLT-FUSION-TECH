#!/usr/bin/env node
/**
 * WCAG 2.x contrast of every text/background pair app/site.css uses, and of
 * the boundaries that must read (inputs, diagram strokes, the focus ring).
 *
 *   node scripts/contrast-site.mjs            prints the table, exits 1 on a failure
 *   node scripts/contrast-site.mjs --markdown prints it as the Markdown table in CLAUDE.md
 *
 * Text needs 4.5:1 (3:1 only where it is large: 24px, or 18.66px bold). A
 * boundary or indicator needs 3:1 (SC 1.4.11). A translucent background is
 * composited over the ground it sits on before it is measured. The colours are
 * app/site.css's tokens, written out here; change one there, change it here,
 * and run this.
 */

/* Two grounds since the studio redesign (2026-10-24): the paper every page
   reads on, and the graphite of the screens and the shell. Each lists the
   values its tokens take there (`:root` and `.bf-ink` in app/site.css). The
   pilot's cobalt plate is a third, measured on its own below. */
const INK = {
  ground: "#07090d",
  surface: "#0e1118",
  raised: "#161a23",
  steel: "#6b7385",
  text: "#f3f2ef",
  soft: "#c6cad3",
  muted: "#9aa2b2",
  brand: "#8e9cff",
  brandHi: "#b6bfff",
  shipped: "#34d399",
  target: "#fbbf24",
  focus: "#8ab4ff",
};
const PAPER = {
  ground: "#f3f1ec",
  surface: "#eae7e0",
  raised: "#fbfaf7",
  steel: "#837d70",
  text: "#121316",
  soft: "#3a3c42",
  muted: "#5c5e65",
  brand: "#2b44ff",
  brandHi: "#1a2ac4",
  shipped: "#086640",
  target: "#854c00",
  focus: "#2b44ff",
};
const T = {
  cobalt: "#2b44ff",
  cobaltHover: "#1d33db",
  flow: "#2ee6d6",
  white: "#ffffff",
  pilotSoft: "#e1e5ff",
  pilotSteel: "#cdd3ff",
  pilotHover: "#e8ebff",
  calendar: "#ffffff",
  calendarMuted: "#4a5266",
};

const hex = (h) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16));
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** `fg` at `alpha` over `bg` — a tinted chip's fill. */
const over = (fg, alpha, bg) => hex(fg).map((c, i) => Math.round(c * alpha + hex(bg)[i] * (1 - alpha)));

const TEXT = 4.5;
const LARGE = 3;
const UI = 3;

/* The chips' fills are the dark design's tints, on either ground (app/site.css,
   "Status chips"): 10% of the shipped green and the target amber. */
const SHIPPED_TINT = "#34d399";
const TARGET_TINT = "#fbbf24";

/* [foreground, background, need, where it is used] on one ground — a colour
   is a hex string or an [r,g,b] composite. */
const onGround = (G, at) => [
  [G.text, G.ground, TEXT, `${at}: headings, primary text, labels`],
  [G.text, G.surface, TEXT, `${at}: text on a surface — a plate, the footer, the drawer`],
  [G.text, G.raised, TEXT, `${at}: tier-chip labels, a raised card's text`],
  [G.soft, G.ground, TEXT, `${at}: body copy`],
  [G.soft, G.surface, TEXT, `${at}: body copy on a surface`],
  [G.soft, G.raised, TEXT, `${at}: a tier chip's scope, a card's body`],
  [G.muted, G.ground, TEXT, `${at}: meta, labels, the pause control`],
  [G.muted, G.surface, TEXT, `${at}: labels on a surface`],
  [G.muted, G.raised, TEXT, `${at}: muted text on a raised card`],
  [G.brand, G.ground, TEXT, `${at}: links, the quiet call to action, numbers`],
  [G.brand, G.surface, TEXT, `${at}: links on a surface`],
  [G.brand, G.raised, TEXT, `${at}: links on a raised card`],
  [G.brandHi, G.ground, TEXT, `${at}: link hover`],
  [G.shipped, over(SHIPPED_TINT, 0.1, G.ground), TEXT, `${at}: a shipped chip`],
  [G.shipped, over(SHIPPED_TINT, 0.1, G.surface), TEXT, `${at}: a shipped chip on a surface`],
  [G.shipped, over(SHIPPED_TINT, 0.1, G.raised), TEXT, `${at}: a shipped chip on a raised card`],
  [G.target, over(TARGET_TINT, 0.1, G.ground), TEXT, `${at}: a target chip`],
  [G.target, over(TARGET_TINT, 0.1, G.surface), TEXT, `${at}: a target chip on a surface`],
  [G.target, over(TARGET_TINT, 0.1, G.raised), TEXT, `${at}: a target chip on a raised card`],
  [G.steel, G.ground, UI, `${at}: input and ghost-button borders, diagram strokes (non-text)`],
  [G.steel, G.surface, UI, `${at}: strokes on a surface (non-text)`],
  [G.steel, G.raised, UI, `${at}: the Lab chip's dashed edge (non-text)`],
  [G.brand, G.raised, UI, `${at}: a tier meter step (non-text)`],
  [G.focus, G.ground, UI, `${at}: the focus ring (non-text)`],
  [G.focus, G.surface, UI, `${at}: the focus ring on a surface (non-text)`],
];

const pairs = [
  ...onGround(PAPER, "paper"),
  ...onGround(INK, "graphite"),
  [T.white, T.cobalt, TEXT, "the primary button, the skip link; the pilot plate's headings"],
  [T.white, T.cobaltHover, TEXT, "the primary button, hovered"],
  [T.flow, INK.ground, UI, "the cyan flow lines on a diagram's screen (non-text)"],
  [T.flow, INK.surface, UI, "the cyan on a surface inside a screen (non-text)"],
  [T.pilotSoft, T.cobalt, TEXT, "the pilot plate's body, stations and ghost label"],
  [T.cobalt, T.white, TEXT, "the pilot plate's primary: cobalt words on white"],
  [T.cobalt, T.pilotHover, TEXT, "the pilot plate's primary, hovered"],
  [T.pilotSteel, T.cobalt, UI, "the pilot plate's ghost border and trace (non-text)"],
  [T.white, T.cobalt, UI, "the pilot plate's focus ring (non-text)"],
  [T.calendarMuted, T.calendar, TEXT, "the booking calendar panel's caption and placeholder (/contact)"],
  [T.cobalt, T.calendar, UI, "that panel's focus ring and links on white (non-text)"],
];

const color = (c) => (typeof c === "string" ? hex(c) : c);
const name = (c) => (typeof c === "string" ? c : `rgb(${c.join(",")})`);

const rows = pairs.map(([fg, bg, need, use]) => {
  const r = ratio(color(fg), color(bg));
  return { fg: name(fg), bg: name(bg), r, need, use, ok: r >= need };
});

const markdown = process.argv.includes("--markdown");
if (markdown) {
  console.log("| foreground | background | ratio | needs | used for |");
  console.log("|---|---|---|---|---|");
  for (const x of rows) console.log(`| ${x.fg} | ${x.bg} | ${x.r.toFixed(2)}:1 | ${x.need}:1 | ${x.use} |`);
} else {
  for (const x of rows) console.log(`${x.ok ? "ok  " : "FAIL"} ${x.r.toFixed(2).padStart(6)}:1 (needs ${x.need})  ${x.fg}  on  ${x.bg}  — ${x.use}`);
}
const bad = rows.filter((x) => !x.ok);
if (bad.length) {
  console.error(`\n${bad.length} pair(s) below their threshold`);
  process.exit(1);
}
if (!markdown) console.log(`\nall ${rows.length} pairs pass (text ${TEXT}:1, large ${LARGE}:1, non-text ${UI}:1)`);
