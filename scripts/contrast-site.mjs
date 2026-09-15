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

const T = {
  ground: "#07090d",
  surface: "#0d1016",
  raised: "#141922",
  lineStrong: "#2e3747",
  steel: "#6b7385",
  text: "#eceff4",
  soft: "#c3c9d4",
  muted: "#9aa3b4",
  brand: "#4c86ff",
  brandHi: "#7aa7ff",
  brandFill: "#2a62e0",
  brandFillHover: "#2256c9",
  flow: "#2ee6d6",
  shipped: "#34d399",
  target: "#fbbf24",
  focus: "#8ab4ff",
  white: "#ffffff",
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

/* [foreground, background, need, where it is used] — a background is a token
   name or an [r,g,b] composite. */
const pairs = [
  ["text", "ground", TEXT, "headings, primary text, labels on the page"],
  ["text", "surface", TEXT, "text on the footer, drawer, diagram plates, lanes"],
  ["text", "raised", TEXT, "tier-chip labels, diagram node labels, the honesty note"],
  ["soft", "ground", TEXT, "body copy"],
  ["soft", "surface", TEXT, "body copy in the footer and drawer"],
  ["soft", "raised", TEXT, "a tier chip's scope"],
  ["muted", "ground", TEXT, "eyebrows, meta, labels, the pause control"],
  ["muted", "surface", TEXT, "footer labels and base row, diagram notes"],
  ["muted", "raised", TEXT, "muted text on a raised surface"],
  ["brand", "ground", TEXT, "links, the quiet call to action, stage numbers"],
  ["brand", "surface", TEXT, "links on the footer and drawer"],
  ["brandHi", "ground", TEXT, "link hover, a pressed map part"],
  ["brandHi", "surface", TEXT, "the drawer's current link"],
  ["white", "brandFill", TEXT, "the primary button, the skip link"],
  ["white", "brandFillHover", TEXT, "the primary button, hovered"],
  ["shipped", over(T.shipped, 0.1, T.ground), TEXT, "a shipped chip on the ground"],
  ["shipped", over(T.shipped, 0.1, T.surface), TEXT, "a shipped chip on a surface"],
  ["target", over(T.target, 0.1, T.ground), TEXT, "a target chip on the ground"],
  ["target", over(T.target, 0.1, T.surface), TEXT, "a target chip on a surface"],
  ["text", "#0b0b12", TEXT, "the older design's logo tile (the WarmChats sign-off): the mark"],
  ["steel", "ground", UI, "input borders, ghost-button borders, diagram strokes (non-text)"],
  ["steel", "surface", UI, "diagram strokes on the plate (non-text)"],
  ["steel", "raised", UI, "the Lab chip's dashed edge (non-text)"],
  ["flow", "surface", UI, "the cyan flow lines on a diagram plate (non-text)"],
  ["flow", "ground", UI, "the cyan on the system map (non-text)"],
  ["brand", "surface", UI, "an accented node's outline, a tier meter step (non-text)"],
  ["brand", "raised", UI, "a tier meter step on the chip (non-text)"],
  ["focus", "ground", UI, "the focus ring on the ground (non-text)"],
  ["focus", "surface", UI, "the focus ring in the footer and drawer (non-text)"],
];

const color = (c) => (typeof c === "string" ? (T[c] ? hex(T[c]) : hex(c)) : c);
const name = (c) => (typeof c === "string" ? (T[c] ? `${c} ${T[c]}` : c) : `rgb(${c.join(",")})`);

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
