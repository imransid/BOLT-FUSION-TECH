#!/usr/bin/env node
/* Insights: every figure labelled or exempted, per instance — before a page exists.
 *
 * `node scripts/verify-insights.mjs` loads content/insights.ts through its real
 * Zod schema and applies to every article string the rule verify-site check 8
 * applies to a rendered page (CLAUDE.md, Hard rules):
 *
 *   · the FIGURE GRAMMAR is the suite's own `tokenizeFigures`, read out of
 *     scripts/verify-site.mjs at run time — not a copy that can drift;
 *   · paragraphs and bullets render through <FigureText>: every figure in them
 *     must sit inside an entry of content/figure-labels.ts matched exactly as
 *     components/FigureText.tsx matches it (earliest start wins, the longer
 *     entry on a tie), and each such wrapper must cover exactly one figure — a
 *     label with its status and source, or an exemption with its reason;
 *   · titles, deks and headings feed the Article JSON-LD and the meta tags,
 *     where there is no chip, and code blocks and diagrams do not render
 *     through <FigureText>: a figure there fails.
 *
 * It also holds the copy rules the articles are written to: 700–1200 words of
 * prose each, no banned marketing words, and no internal repository, employer
 * or excluded product named. Exit 1 on any failure; every figure, exemption and
 * number judged not a figure is printed with its reason.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ts = require("typescript");

/* ── load /content the way `next build` would, minus the bundler ─────────── */
const modules = new Map();
function resolveTs(base) {
  for (const p of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) if (existsSync(p) && !p.endsWith("/")) if (/\.tsx?$/.test(p)) return p;
  throw new Error(`cannot resolve ${base}`);
}
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const mod = { exports: {} };
  modules.set(file, mod);
  const js = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const req = (id) => {
    /* the "react-server" condition of server-only resolves to its empty module */
    if (id === "server-only") return {};
    if (id.startsWith("./") || id.startsWith("../")) return load(resolveTs(resolve(dirname(file), id)));
    if (id.startsWith("@/")) return load(resolveTs(resolve(ROOT, id.slice(2))));
    return require(id);
  };
  new Function("module", "exports", "require", js)(mod, mod.exports, req);
  return mod.exports;
}

/* ── the suite's figure grammar, read out of the suite ─────────────────────── */
const suite = readFileSync(resolve(ROOT, "scripts/verify-site.mjs"), "utf8");
const at = suite.indexOf("function tokenizeFigures(input) {");
const end = at < 0 ? -1 : suite.indexOf("\n}\n", at);
if (at < 0 || end < 0) {
  console.error("FAIL scripts/verify-site.mjs has no `function tokenizeFigures(input) {` ending in a column-0 `}` — the grammar cannot be mirrored");
  process.exit(1);
}
const tokenizeFigures = new Function(`${suite.slice(at, end + 2)}\nreturn tokenizeFigures;`)();

/* ── the content ───────────────────────────────────────────────────────────── */
let insights, registry;
try {
  ({ insights } = load(resolve(ROOT, "content/insights.ts")));
  ({ figureLabels: registry } = load(resolve(ROOT, "content/figure-labels.ts")));
} catch (e) {
  console.error(`FAIL content/insights.ts or content/figure-labels.ts did not load:\n${e.message}`);
  process.exit(1);
}

/* components/FigureText.tsx, as data: the wrappers a string renders with */
function wrappersOf(text) {
  const hits = [];
  for (const label of registry)
    for (let i = text.indexOf(label.text); i >= 0; i = text.indexOf(label.text, i + label.text.length)) hits.push({ at: i, label });
  hits.sort((a, b) => a.at - b.at || b.label.text.length - a.label.text.length);
  const out = [];
  let pos = 0;
  for (const h of hits) {
    if (h.at < pos) continue;
    out.push({ start: h.at, end: h.at + h.label.text.length, label: h.label });
    pos = h.at + h.label.text.length;
  }
  return out;
}

const BANNED_WORDS = [
  /* SPEC §5 and COPY.md */
  "cutting-edge", "cutting edge", "next-generation", "next generation", "revolutionary", "innovative solutions",
  "digital transformation", "seamless", "seamlessly", "elite", "world-class", "robust", "leverage", "synergy",
  "best-in-class", "game-changing", "transform your business",
];
/* SPEC §5 (POS): the internal repositories are never named; CLAUDE.md and the
   brief: no employer's product and no product kept out of public positioning */
const BANNED_NAMES = [
  "GoRestora", "Go ResTora", "nResto", "n-resto", "B-POS", "BPOS", "bpos_", "Plinth", "Jumatechs", "Myrep", "IQ Test",
  "Cleva", "Bidesh", "SaraAI", "sara-leads", "elu", "EluInstnt", "Bangladesh RAB", "Gentle Park", "SplitAbility", "Lagos",
  "Book a call",
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (w) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(w)}(?![\\p{L}\\p{N}])`, "iu");

const failures = [];
const info = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const quote = (s, a, b) => `…${s.slice(Math.max(0, a - 30), Math.min(s.length, b + 30)).replace(/\s+/g, " ")}…`;

for (const a of insights) {
  /* every string of the article, with whether it renders through <FigureText> */
  const strings = [
    { where: "title", text: a.title, chips: false },
    { where: "dek", text: a.dek, chips: false },
  ];
  a.sections.forEach((s, i) => {
    const w = `section ${i + 1} "${s.heading}"`;
    strings.push({ where: `${w} heading`, text: s.heading, chips: false });
    s.paragraphs.forEach((p, j) => strings.push({ where: `${w} paragraph ${j + 1}`, text: p, chips: true, prose: true }));
    (s.bullets || []).forEach((b, j) => strings.push({ where: `${w} bullet ${j + 1}`, text: b, chips: true, prose: true }));
    if (s.code) {
      strings.push({ where: `${w} code caption`, text: s.code.caption, chips: false });
      strings.push({ where: `${w} code`, text: s.code.source, chips: false });
    }
    if (s.diagram) {
      strings.push({ where: `${w} diagram caption`, text: s.diagram.caption, chips: false });
      for (const step of s.diagram.steps)
        for (const n of [step, ...(step.branches || [])]) {
          strings.push({ where: `${w} diagram "${n.label}"`, text: n.label, chips: false });
          if (n.detail) strings.push({ where: `${w} diagram "${n.label}" detail`, text: n.detail, chips: false });
        }
    }
  });

  let words = 0;
  const lines = [];
  for (const s of strings) {
    const where = `${a.slug} · ${s.where}`;
    if (s.prose || s.where.endsWith("heading")) words += s.text.split(/\s+/).filter(Boolean).length;

    for (const w of BANNED_WORDS) if (wordRe(w).test(s.text)) fail(where, `banned word "${w}" (SPEC §5, COPY.md)`);
    for (const n of BANNED_NAMES) if (wordRe(n).test(s.text)) fail(where, `names "${n}", which site copy never names (SPEC §5, CLAUDE.md "Projects and attribution")`);

    const { figures, not } = tokenizeFigures(s.text);
    for (const x of not) info.push(`${where}: not a figure: "${s.text.slice(x.start, x.end)}" — ${x.reason}`);

    if (!s.chips) {
      for (const f of figures)
        fail(where, `figure "${s.text.slice(f.start, f.end)}" where no chip can render (${s.where.includes("code") || s.where.includes("diagram") ? "not rendered through <FigureText>" : "it feeds the Article JSON-LD and meta tags"}) — reword it in words, or move it to a paragraph with its label — ${quote(s.text, f.start, f.end)}`);
      continue;
    }

    const wraps = wrappersOf(s.text);
    for (const w of wraps) {
      const inside = figures.filter((f) => f.start < w.end && f.end > w.start);
      const kind = "exempt" in w.label ? `exempt — "${w.label.exempt}"` : `${w.label.status} — source: ${w.label.source}`;
      if (inside.length !== 1)
        fail(where, `the entry "${w.label.text}" covers ${inside.length} figures; a wrapper holds exactly one (check 8, K2)`);
      else if (inside[0].start < w.start || inside[0].end > w.end)
        fail(where, `the entry "${w.label.text}" splits the figure "${s.text.slice(inside[0].start, inside[0].end)}"`);
      else if (!("exempt" in w.label) && !w.label.source.trim()) fail(where, `the label "${w.label.text}" has no source`);
      else lines.push(`  ${s.text.slice(inside[0].start, inside[0].end).padEnd(10)} in "${w.label.text}" → ${kind}`);
    }
    for (const f of figures)
      if (!wraps.some((w) => w.start <= f.start && f.end <= w.end))
        fail(where, `figure "${s.text.slice(f.start, f.end)}" has no entry in content/figure-labels.ts — ${quote(s.text, f.start, f.end)}`);
  }
  if (words < 700 || words > 1200) fail(a.slug, `${words} words of prose; an article is 700–1200`);
  console.log(`\n${a.slug} — ${words} words, ${lines.length} figure(s)`);
  for (const l of lines) console.log(l);
}

console.log(`\n${info.length} number(s) judged not figures, each with the suite's reason:`);
for (const l of info) console.log(`  ${l}`);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`\nOK — ${insights.length} articles; every figure labelled or exempted in place, none outside the prose.`);
