#!/usr/bin/env node
/**
 * verify-site — what must hold on boltfusiontech.com whatever the content says.
 *
 * This is not a visual diff. The site has no reference to diff against, and its
 * content changes legitimately. Each check below names the class of bug it
 * exists to catch; most of them were found on the live site first.
 *
 *   yarn verify:site                                   against production
 *   yarn verify:site --base http://localhost:3000      against a local build
 *   options:  --widths 1440,390   --only 1,2,8   --json report.json
 *             --repo <checkout>   runs check 24 (lockfile, tsc, eslint, tracked build output)
 *
 * Routes come from the site's own /sitemap.xml, so a page is covered the day
 * it is published.
 *
 * READ BEFORE ADDING A CHECK. Anything triggered by entering the viewport —
 * lazy images, web-font loads, whileInView reveals, count-ups — has to be
 * measured on a FRESH page that is then scrolled at reading speed. Measured
 * on a page nobody scrolled, it reports the absence of the behaviour as a
 * fact about the site. Every browser visit here starts from a new context.
 *
 * "Unsure" is a failure. A check that cannot tell whether something is wrong
 * reports it, and a human decides; it does not pass it.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import pngjs from "pngjs";

const { PNG } = pngjs;
const require = createRequire(import.meta.url);

/* ── options ─────────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? dflt : argv[i + 1];
};
const BASE = String(opt("base", "https://boltfusiontech.com")).replace(/\/$/, "");
const WIDTHS = String(opt("widths", "1440,390")).split(",").map(Number);
const ONLY = opt("only") ? new Set(String(opt("only")).split(",")) : null;
const JSON_OUT = opt("json");
const REPO = opt("repo");
const PROD_HOST = "boltfusiontech.com";
const PROD_ORIGIN = `https://${PROD_HOST}`;

/* Check 6 sweeps these widths, and compares each breakpoint's two sides. */
const SWEEP_WIDTHS = [360, 390, 767, 768, 1023, 1024, 1280, 1440, 1920];
const EDGE_PAIRS = [
  [767, 768],
  [1023, 1024],
];

/* Text that may legitimately render in a system face, by the first family of
   its declared stack. Empty: this site loads web faces for everything it
   sets, so system-rendered text means a token failed to resolve. */
const ALLOW_SYSTEM = [];

/* Structured-data types each route must carry. Routes not listed are reported,
   not asserted. */
const EXPECT_LD = [
  [/^\/$/, ["Organization", "WebSite", "BreadcrumbList"]],
  [/^\/work\/[^/]+$/, ["BreadcrumbList", "Article"]],
];

const want = (id) => !ONLY || ONLY.has(String(id));

/* 25 — WebGL (the owner's redesign, 2026-09-16: three.js returns for the hero
   scene, lazy and desktop-only, at most 180KB gzipped). Exactly one profile may
   have a context: / at >=1025px with a FINE pointer, no touch, no Save-Data and
   no reduced motion — and there one MUST be created, drawn into a canvas inside
   [data-hero-field], which then carries data-scene-ready (a scene that is
   silently dead passes every "never" rule). Every other profile, and every other
   page, has none, and never requests three.js. The scene chunk — the script that
   asks for the context and the three.js code it imports — is at most
   SCENE_MAX_GZ gzipped and requested only after the load event. */
const GL_WIDTHS = [390, 768, 1440];

/* 8 (K9) — check 8 also reads every page at these widths, beyond WIDTHS: a
   figure shown only by the 768–1024 layout was never read. */
const FIGURE_WIDTHS = [768, 1024];
/* K7/H3 (2026-09-15): the tablet is where "width >= 1025 and not a phone"
   would let a renderer mount — an iPad in landscape is 1180 or 1366 wide with
   a coarse pointer. None of these profiles is ever allowed a context. */
const GL_EXTRA = [
  { width: 1024, label: "/ @1024" },
  { width: 1180, height: 820, touch: true, label: "/ @1180x820 tablet (touch, coarse pointer)" },
  { width: 1366, height: 1024, touch: true, label: "/ @1366x1024 tablet (touch, coarse pointer)" },
  { width: 1440, saveData: true, label: "/ @1440 Save-Data" },
];
/* SPEC §7 and PLAN.md §5.2: the whole scene chunk, three.js included. The
   15KB raw-WebGL2 renderer budget it replaces was reversed by the owner on
   2026-09-16 (CLAUDE.md, "Decided 2026-09-16"). Measured by gzipping each file
   as served (level 6) — what a gzip transfer carries; the WebGL runs re-serve
   scripts through the worker hook, so their resource timings are not the wire. */
const SCENE_MAX_GZ = 180 * 1024;
/* the one profile allowed a WebGL context (see GL_WIDTHS) */
const glAllowed = (run) => run.route === "/" && run.width >= 1025 && !run.reduced && !run.phone && !run.touch && !run.saveData && run.pointer === "fine";
/* three.js by what its code carries, @react-three (banned: SPEC §7, three.js
   core and not React Three Fiber) by its names, and a script that asks for a
   WebGL context by the call */
/* a minifier may rename the classes, never a shader's source: three.js ships
   its GLSL chunks as strings, "#include <begin_vertex>" among them */
const THREE_CODE = /WebGLRenderer|three\.module|__THREE__|#include <begin_vertex>/;
const REACT_THREE_CODE = /@react-three|react-three-fiber|__r3f/;
const GL_CALL_CODE = /getContext\(\s*["'`](?:webgl2?|experimental-webgl)["'`]|WebGL2RenderingContext/;

/* 12 — the canonical company description, word for word (owner, 2026-09-16;
   COPY.md, "Company description — canonical"). Written HERE, as check 9 writes
   its labels, so a changed line cannot pass by agreeing with itself: the site's
   own copy is content/canonical.ts, and the check fails if that file and this
   line differ. Changing the description means changing both, on purpose. */
const CANONICAL = "We engineer intelligent software, business systems, automation, and connected technologies — from idea to production.";

/* 28 — the hero contract (SPEC §5, the copy deck): the headline, the support
   line and both calls to action, word for word. The body is the paragraph
   after the support line; its words are check 30's. */
const HERO = {
  headline: "Build what's next.",
  support: "Software. Intelligence. Automation. Machines.",
  ctas: [
    { kind: "schedule", text: "Schedule a Call", path: "/contact", hash: "#schedule" },
    { kind: "explore", text: "Explore Our Capabilities", path: "/capabilities", hash: "" },
  ],
};

/* 32 — "Schedule a Call" (SPEC §1, owner, 2026-09-16): the words of every
   primary call to action, and where each goes. "Book a call" is retired
   everywhere; the WarmChats write-up's locked labels ("Book a similar build",
   "Book a strategy call") and the restaurant write-up's "Book a technical call"
   are other phrases. */
const CTA_WORDS = {
  schedule: { text: "Schedule a Call", path: "/contact", hash: "#schedule" },
  explore: { text: "Explore Our Capabilities", path: "/capabilities", hash: "" },
  project: { text: "Tell Us About Your Project", path: "/contact", hash: "#project" },
};
const BOOK_A_CALL = /\bbook\s+a\s+call\b/i;
/* 32 (2026-09-28) — the project form on /contact, at 1440: never narrower
   than this. It rendered 203px wide there (a class collision). */
const PROJECT_FORM_MIN = 480;

/* 33 — the honesty contract (SPEC §8b.7, binding, verbatim): robotics is Lab,
   and says so where it is shown. The tiers and their labels (CLAUDE.md,
   "Evidence tiers"; content/engineering-schema.ts). */
const ROBOTICS_HONESTY =
  "We engineer software for machines; we don't manufacture hardware. We haven't delivered robotics work yet, and nothing here is a shipped system — ask us and we'll tell you exactly what exists today.";
const TIER_LABELS = { proven: "Proven", core: "Core", capable: "Capable", lab: "Lab" };

/* 29 — the performance budget, from the approved plan (CLAUDE.md, Performance
   targets). Measured on / as the Phase 1 baseline was (scratchpad perf.mjs): a
   fresh context per run, the median of three. */
const PERF_RUNS = 3;
const PERF_PROFILES = {
  mobile: {
    label: "mobile lab (390 wide, 4x CPU, 150ms RTT, 1.6Mbps down)",
    viewport: { width: 390, height: 844 },
    phone: true,
    cpu: 4,
    net: { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
  },
  desktop: { label: "desktop (1440 wide, unthrottled)", viewport: { width: 1440, height: 900 }, phone: false, cpu: 1, net: null },
};
const BUDGET = { mobileLcp: 1500, mobileTbt: 150, desktopLcp: 500, cls: 0.005, initialJs: 260 * 1024 };

/* 28 — where the poster must be the LCP element, and still rendered, opaque,
   on top and beside the headline once the page has settled. H1/K6
   (2026-09-15): the layout switches at 1025, and nothing measured 1024, 1025
   or 1280 — a CSS change there made the h1 the LCP element and this check
   passed. One run at >=1025 is at DPR 2. */
const LCP_PROFILES = [
  { width: 390, label: "@390" },
  { width: 390, phone: true, label: "@390 phone (touch, 3x DPR)" },
  { width: 768, label: "@768" },
  { width: 1024, label: "@1024" },
  { width: 1025, label: "@1025" },
  { width: 1280, label: "@1280" },
  { width: 1280, dpr: 2, label: "@1280 DPR 2" },
  { width: 1440, label: "@1440" },
];

/* A page's SERVED text, as a crawler reads it: scripts, styles and templates
   stripped (Next's RSC payload repeats the content and must not count),
   entities decoded, and — for matching — every whitespace character removed,
   so text split across inline tags still matches. */
const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const squash = (s) => String(s).replace(/[\s\u00a0\u202f\u2009]+/g, "");
const servedText = (html) =>
  decodeEntities(
    html
      .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, "")
      /* an image's alt text is content — it describes the screenshot — so it is
         lifted out of the tag before the tags are dropped */
      .replace(/<img\b[^>]*?\balt="([^"]*)"[^>]*>/gi, " $1 ")
      .replace(/<[^>]+>/g, " "),
  );
const servedSquashed = (html) => squash(servedText(html));
/* 30 (2026-09-16) — the same text with its words kept apart, for a needle that
   must match a whole word: "Expo" is not "export" or "exposure" */
const servedWords = (html) => servedText(html).replace(/[\s   ]+/g, " ");

/* WCAG 2.2 Success Criterion 1.4.3 Contrast (Minimum), exception "Logotypes":
   "Text that is part of a logo or brand name has no contrast requirement."
   The exemption is scoped, and the scope is enforced:
     · it covers the one element marked data-logotype — the wordmark — and the
       text inside it: components/techwix/Logo.tsx, the site's only wordmark.
       Every page renders it in the header, and again in the mobile drawer,
       which carries `hidden` until it is opened: one of the two is rendered at
       a time. Anywhere else the brand name is plain text and meets contrast.
       Check 18 prints the count on every page and fails a page that renders
       more than one;
     · it applies to contrast only: axe's color-contrast rule (check 18) and the
       pixel check (check 20). Every other axe rule still runs on the wordmark;
     · check 18 FAILS if a data-logotype element ever holds anything but
       LOGOTYPE_TEXT, so moving the attribute onto other small text cannot
       quietly widen it. It is not a small-text exemption. */
const LOGOTYPE = "[data-logotype]";
const LOGOTYPE_TEXT = "Bolt Fusion Tech";

/* 8 (K10) — the ONE figure allowed outside the visible text with no label: the
   restaurant-search meta description (CLAUDE.md, Hard rules, "One scoped
   exception, decided 2026-09-11"). That string, on that route, wherever the
   page emits it — its meta description, og:description, twitter:description
   and its Article's description are the same constant — and nothing else. The
   check prints every place it allows it. */
const META_ALLOW = [
  { route: "/work/restaurant-search", text: "How we built a multi-tenant restaurant search service that classifies queries before any paid inference, keeping most traffic under 100ms." },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */
const baseUrl = new URL(BASE);
const isSameSite = (u) => {
  try {
    const x = new URL(u, BASE);
    return x.host === baseUrl.host || x.host === PROD_HOST || x.host === `www.${PROD_HOST}`;
  } catch {
    return false;
  }
};
/* Production URLs inside the page (canonical, JSON-LD) are fetched from BASE,
   so a local run checks its own build rather than production. */
const toBase = (u) => {
  const x = new URL(u, BASE);
  return `${BASE}${x.pathname}${x.search}`;
};

const httpCache = new Map();
function http(url) {
  if (!httpCache.has(url)) {
    httpCache.set(
      url,
      fetch(url, { redirect: "follow" })
        .then(async (r) => {
          const type = r.headers.get("content-type") || "";
          const text = /^text\/|html|json|xml|javascript/.test(type) ? await r.text() : null;
          return { status: r.status, final: r.url, type, html: type.includes("html") ? text : null, text, robots: r.headers.get("x-robots-tag") || "" };
        })
        .catch((e) => ({ status: 0, error: String(e?.cause?.code || e?.message || e) })),
    );
  }
  return httpCache.get(url);
}

const binCache = new Map();
function httpBin(url) {
  if (!binCache.has(url)) {
    binCache.set(
      url,
      fetch(url, { redirect: "follow" })
        .then(async (r) => ({ status: r.status, type: r.headers.get("content-type") || "", buf: Buffer.from(await r.arrayBuffer()) }))
        .catch((e) => ({ status: 0, type: "", error: String(e?.cause?.code || e?.message || e), buf: Buffer.alloc(0) })),
    );
  }
  return binCache.get(url);
}
/* Width and height from the file's own header: PNG (IHDR), JPEG (SOFn), WebP
   (VP8 / VP8L / VP8X). null when the format is none of these — which check 16
   reports, rather than passing an image it could not measure. */
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(12) === 0x49484452) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: "png" };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i + 9 < buf.length; ) {
      if (buf[i] !== 0xff) return null;
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: "jpeg" };
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), type: "webp" };
    if (kind === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, type: "webp" };
    if (kind === "VP8L") { const b = buf.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff), type: "webp" }; }
  }
  return null;
}
const pngSize = (buf) => { const s = imageSize(buf); return s && s.type === "png" ? s : null; };

/* The content the site is built from, read from THIS checkout — as check 30
   reads its inventory: a content/*.ts file transpiled with the checkout's own
   TypeScript, its schema and zod imports stubbed (the values, not their
   validation; `next build` validates). Checks 8 and 28 compare what a page
   shows with what these files say (K1, K11). Throws if the file cannot be read
   or imports anything else — the caller reports that as a failure. */
const contentCache = new Map();
function loadContent(rel) {
  if (!contentCache.has(rel)) {
    const ts = require("typescript");
    const file = fileURLToPath(new URL(`../${rel}`, import.meta.url));
    const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const mod = { exports: {} };
    const stubs = { "./schema": { parseContent: (_schema, data) => data, metricSchema: null }, zod: { z: new Proxy({}, { get: () => () => null }) } };
    new Function("module", "exports", "require", js)(mod, mod.exports, (id) => {
      if (id in stubs) return stubs[id];
      throw new Error(`it imports "${id}", which the suite does not load`);
    });
    contentCache.set(rel, mod.exports);
  }
  return contentCache.get(rel);
}
const short = (u) => String(u).replace(BASE, "").replace(/^https?:\/\/(www\.)?boltfusiontech\.com/, "").slice(0, 90);

/* ~670 px/s: 100px every 150ms, the pace of a mouse wheel, measured to reveal
   every section a person scrolls past. The first version stepped 150px every
   60ms (~2,500 px/s) — a flick, not reading — and at that speed the Featured
   work heading is skipped in 5 of 6 passes. That is a finding about fast
   scrolling, not about reading; see the check 4 notes. */
async function readingSpeedScroll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 100) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
  });
}

/* 25 ── every WebGL context a page asks for. Installed as an init script, so it
   is in place before any page script runs: it wraps getContext on both canvas
   kinds and records every webgl / webgl2 / experimental-webgl request, granted
   or not. Only the main frame is read: a third-party iframe's canvas (Calendly)
   is not this site's code. */
function glHook(workerHookSrc) {
  if (window.__vsGl) return;
  const log = [];
  Object.defineProperty(window, "__vsGl", { value: log });
  for (const C of [window.HTMLCanvasElement, window.OffscreenCanvas]) {
    if (!C) continue;
    const orig = C.prototype.getContext;
    C.prototype.getContext = function (type, ...rest) {
      if (!/webgl/i.test(String(type))) return orig.call(this, type, ...rest);
      const entry = { type: String(type), at: Math.round(performance.now()), stack: String(new Error().stack || "").split("\n").slice(2, 4).map((x) => x.trim()).join(" <- ").slice(0, 160), id: Math.random().toString(36).slice(2), granted: false };
      log.push(entry);
      /* a child frame that shares the page's origin (about:blank, srcdoc,
         blob:, same site) also reports into the page's own log at once: a
         frame that makes a context and then removes itself cannot take the
         request with it. A cross-origin frame throws here, and is read
         directly (readFrameGl). */
      let mirror = null;
      try {
        if (window.top !== window && window.top.__vsGl) window.top.__vsGl.push((mirror = { ...entry, where: `a child frame (${location.href || "no URL"})`, mirrored: true }));
      } catch {
        /* cross-origin: read by readFrameGl */
      }
      const ctx = orig.call(this, type, ...rest);
      /* 25 (2026-09-16): whether the browser gave a context — the scene must
         get one at 1440, and a refused request there is unsure, not a pass */
      entry.granted = Boolean(ctx);
      if (mirror) mirror.granted = entry.granted;
      return ctx;
    };
  }
  /* K7 (2026-09-15): a context made in a WORKER never touched this frame's
     getContext, and passed. Each worker's script is prefixed with
     workerGlHook — a blob worker's as its Blob is built (here), a fetched
     one's on the wire (installGlHooks) — which reports every request on this
     channel. */
  try {
    new BroadcastChannel("__vs_gl").onmessage = (e) => {
      if (e.data && e.data.type) log.push({ ...e.data, where: `a worker (${e.data.worker})` });
    };
  } catch {
    /* no channel: the worker hook's reports are lost, and a worker run reads 0 */
  }
  const OrigBlob = window.Blob;
  if (OrigBlob && workerHookSrc) {
    const prefix = `(${workerHookSrc})();\n`;
    const Hooked = function Blob(parts, opts) {
      if (opts && /javascript|ecmascript/i.test(String(opts.type || "")) && Array.isArray(parts)) parts = [prefix, ...parts];
      return new OrigBlob(parts, opts);
    };
    Hooked.prototype = OrigBlob.prototype;
    Object.setPrototypeOf(Hooked, OrigBlob);
    window.Blob = Hooked;
  }
}
/* the same hook inside a dedicated worker: a no-op anywhere else */
function workerGlHook() {
  if (typeof WorkerGlobalScope === "undefined" || self.__vsGlHooked) return;
  self.__vsGlHooked = true;
  let ch = null;
  try {
    ch = new BroadcastChannel("__vs_gl");
  } catch {
    return;
  }
  const C = self.OffscreenCanvas;
  if (!C) return;
  const orig = C.prototype.getContext;
  C.prototype.getContext = function (type, ...rest) {
    if (!/webgl/i.test(String(type))) return orig.call(this, type, ...rest);
    const stack = String(new Error().stack || "").split("\n").slice(2, 4).map((x) => x.trim()).join(" <- ").slice(0, 160);
    const ctx = orig.call(this, type, ...rest);
    ch.postMessage({ type: String(type), at: Math.round(performance.now()), stack, worker: String(self.location.href).slice(0, 100), granted: Boolean(ctx) });
    return ctx;
  };
}
/* every hook a WebGL run carries: the frame hook (init scripts run in every
   frame, iframes included), Save-Data as the page sees it, and the worker hook
   on every same-site script on the wire — the page's own scripts ignore it */
async function installGlHooks(ctx, prof = {}) {
  await ctx.addInitScript(glHook, workerGlHook.toString());
  if (prof.saveData)
    await ctx.addInitScript(() => {
      try {
        if (navigator.connection) Object.defineProperty(navigator.connection, "saveData", { get: () => true, configurable: true });
      } catch {
        /* reported: the run reads saveData back */
      }
    });
  const prefix = `(${workerGlHook.toString()})();\n`;
  await ctx.route(
    (u) => isSameSite(u.href) && /\.m?js$/i.test(u.pathname),
    async (r) => {
      try {
        const resp = await r.fetch();
        const headers = { ...resp.headers() };
        delete headers["content-encoding"];
        delete headers["content-length"];
        await r.fulfill({ status: resp.status(), headers, body: prefix + (await resp.text()) });
      } catch {
        await r.continue().catch(() => {});
      }
    },
  );
}
/* a page call that cannot hang the suite: Playwright's evaluate has no
   timeout, and a frame caught mid-navigation never answers */
const bounded = (p, ms, fallback) => Promise.race([Promise.resolve(p).catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);
const glTrace = (label, step) => process.env.VS_TRACE_GL && process.stderr.write(`    [gl ${label}] ${step}\n`);
/* the hook's log in every frame but the main one: a frame the page made
   (same site, about:blank, srcdoc, blob:, data:) is the site's code. A frame
   that does not answer in 5s reads as null: unsure, reported by check 25 for
   the site's own frames */
async function readFrameGl(page) {
  const out = [];
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    let url = f.url();
    /* a frame that has not navigated yet (a lazy iframe, url "") is judged by
       its element: a src on another site is that site's; no src, a srcdoc or
       a same-site src is the page's own */
    if (!url || url === "about:blank") {
      const el = await bounded(f.frameElement(), 3000, null);
      const src = el ? await bounded(el.getAttribute("src"), 3000, null) : null;
      if (src) url = new URL(src, BASE).href;
      else if (el && (await bounded(el.getAttribute("srcdoc"), 3000, null)) !== null) url = "about:srcdoc";
    }
    const ours = !/^https?:/i.test(url) || isSameSite(url);
    const gl = await bounded(f.evaluate(() => (window.__vsGl ? [...window.__vsGl] : null)), 5000, null);
    const inherits = !url || /^(about:|blob:)/i.test(url);
    out.push({ url: (url || "(a frame with no URL)").slice(0, 120), ours, gl, loaded: Boolean(f.url()), detached: f.isDetached(), inherits });
  }
  return out;
}
/* K7: a renderer can wait for the first input. Before the reading, a pointer
   moves over a spot that is no control (the hero's field, else the h1), then a
   tap (touch profiles) or a click, a wheel turn and two keys. */
async function firstInput(page, prof) {
  const pt = await bounded(
    page.evaluate(() => {
      const el = document.querySelector("[data-hero-field]") || document.querySelector("h1");
      const r = el?.getBoundingClientRect();
      if (!r) return null;
      const x = r.left + r.width / 2;
      const y = Math.min(r.top + r.height / 2, innerHeight - 10);
      const hit = document.elementFromPoint(x, y);
      return hit && !hit.closest("a, button, summary, input, select, textarea, label, iframe") ? { x, y } : null;
    }),
    10000,
    null,
  );
  const send = async () => {
    if (pt) {
      await page.mouse.move(pt.x - 30, pt.y - 20);
      await page.mouse.move(pt.x, pt.y, { steps: 4 });
      if (prof.phone || prof.touch) await page.touchscreen.tap(pt.x, pt.y);
      else await page.mouse.click(pt.x, pt.y, { noWaitAfter: true });
    }
    await page.mouse.wheel(0, 240);
    await page.keyboard.press("Shift");
    await page.keyboard.press("ArrowDown");
    return true;
  };
  const sent = await bounded(send(), 20000, false);
  await page.waitForTimeout(700);
  return Boolean(pt) && sent;
}
/* what the hook recorded, and every script the page requested with its start
   time against the load event: a renderer must never be initial JavaScript */
function glReport() {
  const nav = performance.getEntriesByType("navigation")[0];
  const field = document.querySelector("[data-hero-field]");
  return {
    gl: window.__vsGl ? [...window.__vsGl] : null,
    pointer: matchMedia("(pointer: coarse)").matches ? "coarse" : matchMedia("(pointer: fine)").matches ? "fine" : "none",
    saveDataSeen: Boolean(navigator.connection && navigator.connection.saveData),
    canvases: document.querySelectorAll("canvas").length,
    /* 25 (2026-09-16): the scene's own evidence that it drew — its canvas in
       the field, and the field's data-scene-ready */
    field: Boolean(field),
    fieldCanvases: field ? field.querySelectorAll("canvas").length : 0,
    sceneReady: Boolean(field && field.hasAttribute("data-scene-ready")),
    loadEnd: nav ? nav.loadEventEnd : 0,
    scripts: performance
      .getEntriesByType("resource")
      .filter((e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name))
      .map((e) => ({ url: e.name, start: e.startTime })),
  };
}
/* One route under one profile. The renderer is imported after load, inside
   requestIdleCallback, and pauses offscreen: the page gets idle time, one walk
   down and back up (anything mounted on entering the viewport mounts), then
   idle time again. */
async function visitGl(browser, route, prof) {
  const ctx = await browser.newContext({
    viewport: { width: prof.width, height: prof.height || (prof.width < 768 ? 844 : 900) },
    reducedMotion: prof.reduced ? "reduce" : "no-preference",
    ...(prof.phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}),
    ...(prof.touch ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    ...(prof.saveData ? { extraHTTPHeaders: { "Save-Data": "on" } } : {}),
  });
  await installGlHooks(ctx, prof);
  const page = await ctx.newPage();
  glTrace(prof.label, "goto");
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  glTrace(prof.label, "first input");
  const input = await firstInput(page, prof);
  glTrace(prof.label, `input sent: ${input}; walking`);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000);
  /* the one allowed profile: the scene waits for LCP, load and an idle
     callback (up to 3s) before it imports, then draws — give it up to 12s more
     to mark the field ready. Every other profile never gets one, so nothing
     waits there. */
  if (glAllowed({ ...prof, route, pointer: "fine" }))
    await page.waitForFunction(() => document.querySelector("[data-hero-field][data-scene-ready]"), null, { timeout: 12000 }).catch(() => {});
  glTrace(prof.label, "report");
  const r = await bounded(page.evaluate(glReport), 20000, { gl: null, scripts: [], error: "the page did not answer for 20s" });
  glTrace(prof.label, "frames");
  r.frames = await readFrameGl(page);
  r.input = input;
  await bounded(ctx.close(), 20000, null);
  glTrace(prof.label, "done");
  return r;
}

/* 28 (a, c) ── the hero as a crawler gets it: the SERVED HTML, scripts, styles
   and templates stripped, parsed in the page and compared with the hero the
   browser renders. The roles are read from the rendered hero — the h1, the
   first paragraph after it (the support line), the next (the body), and every
   link after those (the calls to action) — and each must be in the served hero,
   word for word. The proof strip left the hero for the engineering stories on
   2026-09-16 (SPEC §5): its rows are read in #recent-work — the list holding
   the [data-metric] rows — and each must be in the served section as shown. */
async function visitHero(browser) {
  const raw = await (await fetch(`${BASE}/`)).text();
  const stripped = raw.replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const r = await page.evaluate((html) => {
    const n = (x) => String(x || "").replace(/\s+/g, " ").trim();
    const served = new DOMParser().parseFromString(html, "text/html");
    const h1 = document.querySelector("#hero h1") || document.querySelector("h1");
    const hero = h1?.closest("section");
    if (!hero) return { error: "no <h1> inside a <section> on / — the hero cannot be found" };
    const sHero = hero.id ? served.getElementById(hero.id) : served.querySelector("h1")?.closest("section");
    const follows = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const paras = [...hero.querySelectorAll("p")].filter((p) => follows(h1, p) && n(p.textContent) && !p.querySelector("a, button"));
    const support = paras[0] || null;
    const body = paras[1] || null;
    const ctas = [...hero.querySelectorAll("a[href]")].filter((a) => follows(body || support || h1, a) && n(a.textContent));
    const roles = [{ role: "headline", text: n(h1.textContent) }];
    if (support) roles.push({ role: "support line", text: n(support.textContent) });
    if (body) roles.push({ role: "body", text: n(body.textContent) });
    for (const a of ctas) roles.push({ role: "call to action", text: n(a.textContent), href: a.getAttribute("href"), cta: a.getAttribute("data-cta") });
    /* the proof strip: the list in #recent-work that holds the [data-metric]
       rows — every row of it holding a digit, so a row that loses its
       data-metric is still read (and fails for it) */
    const work = document.getElementById("recent-work");
    const sWork = served.getElementById("recent-work");
    const list = work ? [...work.querySelectorAll("ul, ol")].find((l) => l.querySelector("[data-metric]")) : null;
    const items = list ? [...list.children].filter((li) => li.localName === "li" && /\d/.test(li.textContent)) : [];
    const FIG = /^[<>≤≥~≈+−-]?\s*[$£€]?\s*\d[\d,.]*\s*(ms|s|sec|min|h|%|x|×|k|K|M|B)?\s*\+?$/;
    /* K1: the figure's status is ITS chip — in its [data-metric] row when the
       card names one, and never a chip inside another figure's [data-status]
       wrapper (the label's "80% of traffic" carries a target chip of its own).
       The label is the card's text less the figure, every chip and the link. */
    const isChip = (e) => !e.children.length && /^(shipped|target)$/i.test(n(e.textContent));
    const proof = items.map((li, i) => {
      const leaves = [...li.querySelectorAll("*")].filter((e) => !e.children.length);
      const fig = leaves.find((e) => FIG.test(n(e.textContent)));
      const owner = fig?.closest("[data-metric]");
      const scope = owner && li.contains(owner) ? [...owner.querySelectorAll("*")] : leaves;
      const status = scope.find((e) => isChip(e) && (!e.closest("[data-status]") || (fig && e.closest("[data-status]").contains(fig))));
      const link = li.querySelector("a[href]");
      const skip = [fig, link, ...leaves.filter(isChip)].filter(Boolean);
      const parts = [];
      const w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
      for (let t = w.nextNode(); t; t = w.nextNode()) if (!skip.some((s) => s.contains(t))) parts.push(t.textContent);
      return {
        i: i + 1,
        text: n(li.textContent),
        figure: fig ? n(fig.textContent) : null,
        status: status ? n(status.textContent).toLowerCase() : null,
        metric: owner ? owner.getAttribute("data-metric") : null,
        link: link ? { href: link.getAttribute("href"), text: n(link.textContent) } : null,
        label: n(parts.join(" ")).replace(/\s+([,.;:])/g, "$1"),
      };
    });
    const posters = [...served.querySelectorAll("img[data-hero-poster]")].map((img) => ({
      width: img.getAttribute("width"),
      height: img.getAttribute("height"),
      fetchpriority: img.getAttribute("fetchpriority"),
      loading: img.getAttribute("loading"),
    }));
    return {
      heroId: hero.id || "",
      servedHero: Boolean(sHero),
      roles,
      sText: n(sHero?.textContent),
      sLinks: sHero ? [...sHero.querySelectorAll("a[href]")].map((a) => ({ href: a.getAttribute("href"), text: n(a.textContent) })) : [],
      work: Boolean(work),
      servedWork: Boolean(sWork),
      proofList: Boolean(list),
      sItems: sWork ? [...sWork.querySelectorAll("li")].map((li) => n(li.textContent)) : [],
      sProofLinks: sWork ? [...sWork.querySelectorAll("a[href]")].map((a) => ({ href: a.getAttribute("href"), text: n(a.textContent) })) : [],
      proof,
      posters,
    };
  }, stripped);
  await ctx.close();
  return r;
}

/* 28 (b) ── the FINAL largest-contentful-paint entry, from a buffered observer
   installed before any page script, on a fresh page nobody scrolls or touches
   (an input ends LCP reporting; a scroll brings other candidates into view):
   load, then three seconds of settling. */
async function visitLcp(browser, prof) {
  const ctx = await browser.newContext({
    viewport: { width: prof.width, height: prof.width < 768 ? 844 : 900 },
    ...(prof.phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}),
    ...(prof.dpr ? { deviceScaleFactor: prof.dpr } : {}),
  });
  await ctx.addInitScript(() => {
    const out = (window.__vsLcp = []);
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const el = e.element;
        const cls = el && typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "";
        const txt = el && el.tagName !== "IMG" ? (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) : "";
        out.push({
          t: Math.round(e.startTime),
          size: e.size,
          url: e.url || "",
          tag: el ? el.tagName.toLowerCase() : "(removed from the page)",
          poster: Boolean(el && el.hasAttribute("data-hero-poster")),
          desc: el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls}${txt ? ` "${txt}"` : ""}` : "(removed from the page)",
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(3000);
  /* 2026-09-16: where the scene may run (>=1025px, a fine pointer — every
     desktop profile here), the settled poster is read once the scene has drawn
     over it, up to 12s more: "the poster stays rendered under the canvas" is
     only a finding about the scene if the scene is there. No input is sent. */
  if (prof.width >= 1025 && !prof.phone)
    await page.waitForFunction(() => document.querySelector("[data-hero-field][data-scene-ready]"), null, { timeout: 12000 }).catch(() => {});
  const r = await page.evaluate(() => {
    const p = document.querySelector("img[data-hero-poster]");
    const b = p?.getBoundingClientRect();
    const out = { entries: window.__vsLcp || [], posterSrc: p ? p.currentSrc : null, posterBox: b ? `${Math.round(b.width)}x${Math.round(b.height)}` : null, state: null };
    if (!p) return out;
    /* H2/K6: an LCP entry is never withdrawn, so the identity test cannot see a
       poster hidden, faded, covered or moved after it painted. Read it again,
       settled: rendered, opaque, its box the field's, on top of everything in
       the field but a canvas with the field's box, and never under the h1. */
    const field = p.closest("[data-hero-field]");
    const tag = (el) => `${el.localName}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : ""}`;
    let op = 1;
    let why = "";
    for (let a = p; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      op *= parseFloat(s.opacity);
      if (!why && s.display === "none") why = `display:none on ${tag(a)}`;
    }
    if (!why && getComputedStyle(p).visibility !== "visible") why = `visibility:${getComputedStyle(p).visibility}`;
    if (!why && !p.getClientRects().length) why = "it has no box";
    const same = (el) => field && Math.abs(el.offsetWidth - field.clientWidth) <= 1 && Math.abs(el.offsetHeight - field.clientHeight) <= 1 && el.offsetParent === field && Math.abs(el.offsetLeft) <= 1 && Math.abs(el.offsetTop) <= 1;
    const fb = field ? field.getBoundingClientRect() : b;
    /* the visible poster: its box inside the field's (the drift's scale overflows it, clipped) */
    const vis = { l: Math.max(b.left, fb.left), t: Math.max(b.top, fb.top), r: Math.min(b.right, fb.right), btm: Math.min(b.bottom, fb.bottom) };
    const pe = document.createElement("style");
    pe.textContent = "*,*::before,*::after{pointer-events:auto!important}";
    document.head.append(pe);
    let coveredBy = "";
    for (const fx of [0.2, 0.5, 0.8])
      for (const fy of [0.2, 0.5, 0.8]) {
        const x = vis.l + (vis.r - vis.l) * fx;
        const y = vis.t + (vis.btm - vis.t) * fy;
        if (coveredBy || x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        const top = document.elementFromPoint(x, y);
        if (!top || top === p || (top.localName === "canvas" && field?.contains(top) && same(top))) continue;
        coveredBy = tag(top);
      }
    pe.remove();
    /* the h1's line boxes, against the visible poster */
    let h1Overlap = 0;
    const h1 = document.querySelector("h1");
    /* SPEC §7: beside the headline at >=1025px — the field in the right-hand
       column, clear of every line of the h1 — and above it below that */
    let h1Box = null;
    if (h1) {
      const rg = document.createRange();
      rg.selectNodeContents(h1);
      const lines = [...rg.getClientRects()].filter((q) => q.width > 1 && q.height > 1);
      for (const q of [...lines, h1.getBoundingClientRect()]) {
        const w = Math.min(q.right, vis.r) - Math.max(q.left, vis.l);
        const h = Math.min(q.bottom, vis.btm) - Math.max(q.top, vis.t);
        if (w > 1 && h > 1) h1Overlap = Math.max(h1Overlap, Math.round(w * h));
      }
      if (lines.length) h1Box = { l: Math.min(...lines.map((q) => q.left)), r: Math.max(...lines.map((q) => q.right)), t: Math.min(...lines.map((q) => q.top)), b: Math.max(...lines.map((q) => q.bottom)) };
    }
    const beside = h1Box ? vis.l >= h1Box.r - 1 && vis.t < h1Box.b && vis.btm > h1Box.t : null;
    const above = h1Box ? vis.btm <= h1Box.t + 1 : null;
    const where = h1Box ? `the visible poster spans x ${Math.round(vis.l)}–${Math.round(vis.r)}, y ${Math.round(vis.t)}–${Math.round(vis.btm)}; the h1's lines x ${Math.round(h1Box.l)}–${Math.round(h1Box.r)}, y ${Math.round(h1Box.t)}–${Math.round(h1Box.b)}` : "no h1";
    const badCanvases = [...document.querySelectorAll("canvas")].filter((c) => !field?.contains(c) || !same(c)).map((c) => `${tag(c)} ${c.offsetWidth}x${c.offsetHeight}${field?.contains(c) ? " inside the field, not its box" : " outside [data-hero-field]"}`);
    /* H4: how far the chosen file is stretched to cover the field. The file's
       own width is its srcset `w` descriptor — naturalWidth is density-corrected
       by `sizes` for a srcset image, and says nothing about the file. */
    let fileW = 0;
    for (const s of [...(p.parentElement?.querySelectorAll("source") || []), p])
      for (const c of (s.getAttribute("srcset") || "").split(",")) {
        const [u, d] = c.trim().split(/\s+/);
        if (u && d && /^\d+w$/.test(d) && new URL(u, location.href).href === p.currentSrc) fileW = parseInt(d, 10);
      }
    const aspect = p.naturalWidth && p.naturalHeight ? p.naturalWidth / p.naturalHeight : 0;
    const needW = field && aspect ? Math.max(field.clientWidth, field.clientHeight * aspect) * devicePixelRatio : 0;
    out.state = {
      rendered: !why,
      why,
      opacity: op,
      boxEqual: Boolean(same(p)),
      pBox: `${p.offsetWidth}x${p.offsetHeight} at ${p.offsetLeft},${p.offsetTop}`,
      fBox: field ? `${field.clientWidth}x${field.clientHeight}` : "no [data-hero-field] around it",
      coveredBy,
      h1Overlap,
      beside,
      above,
      where,
      sceneReady: Boolean(field && field.hasAttribute("data-scene-ready")),
      fieldCanvases: field ? field.querySelectorAll("canvas").length : 0,
      badCanvases,
      upscale: needW && fileW ? +(needW / fileW).toFixed(2) : null,
      natural: fileW || "?",
      dpr: devicePixelRatio,
    };
    return out;
  });
  await ctx.close();
  return { ...prof, ...r };
}

/* 29 ── one lab run: CPU and network throttled over CDP before the page loads,
   observers installed before any page script, no input and no scroll — load,
   then four seconds of settling. Blocking time is perf.mjs's definition: every
   long task's time over 50ms, from navigation to the end of the settle — stricter
   than Lighthouse's FCP-to-interactive window. Initial JavaScript is every
   script requested by the end of the load event, in bytes transferred
   (compressed on the wire, headers included). */
async function perfRun(browser, prof) {
  const ctx = await browser.newContext({ viewport: prof.viewport, ...(prof.phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: prof.cpu });
  if (prof.net) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", prof.net);
  }
  await page.addInitScript(() => {
    const p = (window.__vsPerf = { lcp: 0, lcpEl: "", lcpPoster: false, cls: 0, longtasks: [] });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        p.lcp = e.startTime;
        const el = e.element;
        p.lcpPoster = Boolean(el && el.hasAttribute("data-hero-poster"));
        p.lcpEl = el ? `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : ""}` : "(removed)";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) p.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) p.longtasks.push({ start: e.startTime, dur: e.duration });
    }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => {
    const p = window.__vsPerf;
    const nav = performance.getEntriesByType("navigation")[0];
    const loadEnd = nav ? nav.loadEventEnd : 0;
    const js = performance.getEntriesByType("resource").filter((e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name));
    /* INITIAL JavaScript is what is requested by the end of the load event.
       The hero's scene chunk is imported after load (inside an idle callback),
       so it is not counted — by design, and made explicit: check 29 lists every
       scene chunk with its start time, and fails one that starts before load
       (the guard: a scene imported statically would be initial JavaScript). */
    const initial = js.filter((e) => e.startTime <= loadEnd);
    const sent = (list) => list.reduce((a, e) => a + (e.transferSize || e.encodedBodySize), 0);
    return {
      scripts: js.map((e) => ({ url: e.name, start: e.startTime, sent: e.transferSize || e.encodedBodySize })),
      lcp: p.lcp,
      lcpEl: p.lcpEl,
      lcpPoster: p.lcpPoster,
      cls: p.cls,
      fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0,
      tbt: p.longtasks.reduce((a, t) => a + Math.max(0, t.dur - 50), 0),
      longtasks: p.longtasks.length,
      load: loadEnd,
      jsInitial: sent(initial),
      jsInitialFiles: initial.length,
      jsAll: sent(js),
      jsDecoded: js.reduce((a, e) => a + e.decodedBodySize, 0),
    };
  });
  await ctx.close();
  return r;
}

/* ── in-page collector (runs in the browser) ─────────────────────────────── */
function collectInPage() {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) < 0.05) return false;
    }
    return true;
  };
  const snip = (el, n = 50) => (el?.textContent || "").trim().replace(/\s+/g, " ").slice(0, n);
  const describe = (el) => {
    if (!el) return "";
    const t = snip(el, 40);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${t ? ` "${t}"` : ""}`;
  };
  const sectionOf = (el) => {
    const s = el.closest("section[id], [id]");
    return s ? `#${s.id}` : "";
  };

  /* 1 ── every var(--x) a rendered element uses resolves ────────────────── */
  const csCache = new WeakMap();
  const cs = (el) => {
    let s = csCache.get(el);
    if (!s) csCache.set(el, (s = getComputedStyle(el)));
    return s;
  };
  const isDefined = (el, name) => cs(el).getPropertyValue(name).trim() !== "";
  const topComma = (s) => {
    let d = 0;
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (c === "(") d++;
      else if (c === ")") d--;
      else if (c === "," && d === 0) return k;
    }
    return -1;
  };
  const varsIn = (value) => {
    const out = [];
    let i = 0;
    while ((i = value.indexOf("var(", i)) !== -1) {
      let j = i + 4;
      let depth = 1;
      while (j < value.length && depth) {
        if (value[j] === "(") depth++;
        else if (value[j] === ")") depth--;
        j++;
      }
      const inner = value.slice(i + 4, j - 1);
      const c = topComma(inner);
      out.push({ name: (c === -1 ? inner : inner.slice(0, c)).trim(), fallback: c === -1 ? null : inner.slice(c + 1) });
      i = j;
    }
    return out;
  };
  /* A var with a fallback is fine only if its fallback resolves. A custom
     property that itself references an undefined var computes to nothing, so
     isDefined() already follows chains like --a: var(--b). */
  const unresolved = (el, value) => {
    const bad = [];
    for (const { name, fallback } of varsIn(value)) {
      if (isDefined(el, name)) continue;
      if (fallback === null) bad.push(name);
      else bad.push(...unresolved(el, fallback));
    }
    return bad;
  };
  const declarations = (text) => {
    const out = [];
    let d = 0;
    let q = null;
    let start = 0;
    for (let k = 0; k <= text.length; k++) {
      const c = text[k];
      if (q) {
        if (c === q) q = null;
        continue;
      }
      if (c === '"' || c === "'") q = c;
      else if (c === "(") d++;
      else if (c === ")") d--;
      else if ((c === ";" || k === text.length) && d === 0) {
        const decl = text.slice(start, k);
        const colon = decl.indexOf(":");
        if (colon > 0) out.push([decl.slice(0, colon).trim(), decl.slice(colon + 1).replace(/!important/, "").trim()]);
        start = k + 1;
      }
    }
    return out;
  };
  const STATE = /::?(before|after|placeholder|selection|marker|backdrop|file-selector-button|-webkit-[a-z-]+|-moz-[a-z-]+)|:(hover|focus-visible|focus-within|focus|active|visited|checked|disabled|enabled|placeholder-shown|target)\b/g;
  const undefinedUses = [];
  const seen = new Set();
  const record = (el, prop, name, where, selector) => {
    const key = `${name}|${prop}|${selector}|${describe(el)}`;
    if (seen.has(key)) return;
    seen.add(key);
    undefinedUses.push({ name, prop, where, selector: selector.slice(0, 90), el: describe(el), section: sectionOf(el) });
  };
  const rules = [];
  const walk = (list, parentSel) => {
    for (const r of list) {
      if (r instanceof CSSStyleRule) {
        let sel = r.selectorText;
        if (parentSel) sel = sel.includes("&") ? sel.replaceAll("&", `:is(${parentSel})`) : `:is(${parentSel}) ${sel}`;
        if (r.style.cssText.includes("var(")) rules.push([sel, r.style.cssText]);
        if (r.cssRules?.length) walk(r.cssRules, sel);
      } else if (r instanceof CSSMediaRule) {
        if (matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules, parentSel);
      } else if (r instanceof CSSSupportsRule) {
        if (CSS.supports(r.conditionText)) walk(r.cssRules, parentSel);
      } else if (r.cssRules) walk(r.cssRules, parentSel);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules, null);
    } catch {
      /* cross-origin sheet: not ours */
    }
  }
  for (const [sel, text] of rules) {
    const target = sel.replace(STATE, "").replace(/:is\(\s*\)/g, "*").trim() || "*";
    let els;
    try {
      els = document.querySelectorAll(target);
    } catch {
      continue;
    }
    if (!els.length) continue;
    for (const [prop, value] of declarations(text)) {
      if (prop.startsWith("--") || !value.includes("var(")) continue;
      let n = 0;
      for (const el of els) {
        if (n++ > 40) break;
        for (const name of unresolved(el, value)) record(el, prop, name, "stylesheet", sel);
      }
    }
  }
  for (const el of document.querySelectorAll("[style*='var(']")) {
    for (const [prop, value] of declarations(el.getAttribute("style"))) {
      if (prop.startsWith("--") || !value.includes("var(")) continue;
      for (const name of unresolved(el, value)) record(el, prop, name, "inline style", `[style] ${el.tagName.toLowerCase()}`);
    }
  }

  /* 2 ── fonts: declared vs actually used ───────────────────────────────── */
  const fam = (f) => f.family.replace(/["']/g, "");
  const faces = [...document.fonts].filter((f) => !/ Fallback$/.test(fam(f)));
  const fontsDeclared = [...new Set(faces.map(fam))];
  const fontsLoaded = [...new Set(faces.filter((f) => f.status === "loaded").map(fam))];
  const fontFiles = performance
    .getEntriesByType("resource")
    .filter((e) => /\.(woff2?|ttf|otf)(\?|$)/i.test(e.name))
    .map((e) => e.name.replace(location.origin, ""));
  const fontPreloads = [...document.querySelectorAll('link[rel="preload"][as="font"]')].map((l) => l.getAttribute("href"));

  /* stamp text-bearing elements so the CDP pass can ask which platform font
     actually rendered them — getComputedStyle only says what was asked for.
     Only text the browser renders: an element inside a closed <details> has a
     box (an inline one even reports a size) but is never painted, so CDP names
     no font for it, and "?" read as a fallback (2026-09-28: the first figure
     wrapper inside an FAQ answer). checkVisibility() is false there. */
  let stamped = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("script, style, noscript, template, svg")) continue;
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
    if (!visible(el)) continue;
    if (typeof el.checkVisibility === "function" && !el.checkVisibility()) continue;
    el.setAttribute("data-vs-t", String(stamped));
    if (++stamped >= 1200) break;
  }
  const stampedInfo = [...document.querySelectorAll("[data-vs-t]")].map((el) => ({
    declared: getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim(),
    weight: getComputedStyle(el).fontWeight,
    style: getComputedStyle(el).fontStyle,
    el: describe(el),
    section: sectionOf(el),
  }));

  /* 9 ── published projects: loaded screenshot + write-up link ──────────── */
  const srcOf = (img) => decodeURIComponent(img.currentSrc || img.src || "");
  const projImgs = [...document.images].filter((i) => /\/projects\//.test(srcOf(i)));
  const images = projImgs.map((i) => ({
    src: srcOf(i).replace(/^.*?\/projects\//, "/projects/").replace(/[&?].*$/, ""),
    loaded: i.complete && i.naturalWidth > 0,
    alt: i.getAttribute("alt") || "",
  }));
  const cardEls = new Map();
  for (const img of projImgs) {
    /* a card marked with its kind is its own root — a feature-work card's name
       is an h4, and the walk would climb past it to the sub-group's h3 —
       otherwise the nearest box holding a heading */
    let c = img.closest("[data-project-kind]");
    if (!c) {
      c = img.parentElement;
      while (c && c !== document.body && !c.querySelector("h2, h3")) c = c.parentElement;
    }
    if (!c || c === document.body || cardEls.has(c)) continue;
    const h = c.querySelector("h2, h3, h4");
    cardEls.set(c, {
      title: snip(h, 60),
      kind: c.closest("[data-project-kind]")?.getAttribute("data-project-kind") || null,
      screenshotLoaded: [...c.querySelectorAll("img")].filter((i) => /\/projects\//.test(srcOf(i))).every((i) => i.complete && i.naturalWidth > 0),
      writeups: [...new Set([...(c.closest("a[href]") ? [c.closest("a[href]")] : []), ...c.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => new URL(h).pathname.startsWith("/work/")))],
    });
  }

  /* 9 ── who built it (decided 2026-09-15): every project card, found two ways —
     any element marked data-project-kind, and on /work every h3 and h4 in
     <main>, whose card is its list item — so a card that loses its marker is
     still found. A heading whose box holds marked cards and is not one itself
     heads a GROUP of them (the feature-work sub-group, 2026-09-16), not a card.
     What each card says about its kind, scope, employer and role, and whether a
     reader can see it: on the page, at least 24x10px, not clipped away. */
  const flat = (el) => (el?.textContent || "").trim().replace(/\s+/g, " ");
  const readable = (el) => {
    if (!visible(el)) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width >= 24 && r.height >= 10 && st.clip === "auto" && (!st.clipPath || st.clipPath === "none");
  };
  const cardRoots = new Set(document.querySelectorAll("[data-project-kind]"));
  if (location.pathname.replace(/\/$/, "") === "/work")
    for (const h of document.querySelectorAll("main h3, main h4")) {
      const root = h.closest("li, article") || h.parentElement;
      if (!root.matches("[data-project-kind]") && root.querySelector("[data-project-kind]")) continue;
      cardRoots.add(root);
    }
  const projectCards = [...cardRoots].map((c) => {
    const heading = c.querySelector("h2, h3, h4");
    const label = c.querySelector("[data-attribution]");
    const fact = (sel) => {
      const el = c.querySelector(sel);
      return el ? { text: flat(el), seen: readable(el) } : null;
    };
    return {
      id: c.getAttribute("data-project-id"),
      kind: c.getAttribute("data-project-kind"),
      scope: c.getAttribute("data-project-scope"),
      title: flat(heading).slice(0, 60) || describe(c),
      label: label ? { text: flat(label), seen: readable(label), beforeHeading: Boolean(heading) && label.nextElementSibling === heading } : null,
      builtAt: fact("[data-built-at]"),
      role: fact("[data-role]"),
      images: [...c.querySelectorAll("img")].map((i) => ({ src: srcOf(i).replace(location.origin, "").replace(/[&?]w=.*$/, ""), loaded: i.complete && i.naturalWidth > 0 })),
      links: [...c.querySelectorAll("a[href]")].map((a) => ({ href: a.href, text: flat(a).slice(0, 40) })),
    };
  });

  /* 4 (JS-on side) ── what is readable once scripts have run, so the JS-off
     pass can tell "waits for a script" from "hidden by design" (hover reveals) */
  const visibleTexts = [...document.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,td,th,a,button,label,span,div")]
    .filter((el) => !el.closest("script, style, noscript, template") && [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1) && visible(el))
    .map((el) => el.textContent.trim().replace(/\s+/g, " ").slice(0, 60));

  /* 14, 15 ── structured data, links, anchor targets ────────────────────── */
  const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent);
  const links = [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.getAttribute("href"), abs: a.href, el: describe(a) }));
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);

  /* 11, 26 ── headings as rendered */
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .filter((h) => h.getClientRects().length)
    .map((h) => ({ level: Number(h.tagName[1]), text: snip(h, 60) }));

  /* 12, 13, 16, 26 ── what the page declares about itself */
  const metaContent = (sel) => document.querySelector(sel)?.getAttribute("content") ?? null;
  const meta = {
    title: document.title,
    description: metaContent('meta[name="description"]'),
    robots: metaContent('meta[name="robots"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
    ogDescription: metaContent('meta[property="og:description"]'),
    twitterDescription: metaContent('meta[name="twitter:description"]'),
    ogImage: metaContent('meta[property="og:image"]'),
    ogImageAlt: metaContent('meta[property="og:image:alt"]'),
    twitterImage: metaContent('meta[name="twitter:image"]'),
    icons: [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map((l) => ({ rel: l.getAttribute("rel"), href: l.href, type: l.type || "", sizes: l.getAttribute("sizes") || "" })),
  };

  /* 10 ── every image */
  const allImages = [...document.images].map((i) => ({
    src: srcOf(i),
    loaded: i.complete && i.naturalWidth > 0,
    alt: i.hasAttribute("alt") ? i.getAttribute("alt") : null,
    visible: visible(i),
  }));

  /* 3, 25 ── declared faces, and which file each comes from */
  const fontFaces = faces.map((f) => ({ family: fam(f), weight: f.weight, style: f.style, status: f.status }));
  const fontFaceRules = [];
  const walkFaces = (list) => {
    for (const r of list) {
      if (r instanceof CSSFontFaceRule)
        fontFaceRules.push({
          family: r.style.getPropertyValue("font-family").replace(/["']/g, "").trim(),
          src: r.style.getPropertyValue("src"),
          weight: r.style.getPropertyValue("font-weight") || "400",
          style: r.style.getPropertyValue("font-style") || "normal",
        });
      else if (r.cssRules) walkFaces(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walkFaces(sheet.cssRules);
    } catch {
      /* cross-origin sheet */
    }
  }

  /* 5 ── after the reading-speed scroll: text that should be readable and is not */
  const stuckHidden = [];
  for (const el of document.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,td,th,a,button,label,span")) {
    if (el.closest("script, style, noscript, template, [aria-hidden='true'], [hidden], details:not([open])")) continue;
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) continue;
    if (!el.getClientRects().length) continue;
    let hider = null;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const st = getComputedStyle(a);
      if (parseFloat(st.opacity) < 0.05 || st.visibility === "hidden") {
        hider = a;
        break;
      }
    }
    if (!hider) continue;
    const cls = typeof hider.className === "string" ? hider.className : "";
    if (/(^|\s)(\S*:)?(group-|peer-)?(hover|focus|focus-visible|focus-within|checked|open):/.test(cls)) continue; /* an interaction reveal, by design */
    stuckHidden.push({ text: snip(el, 60), hider: `${hider.tagName.toLowerCase()}${hider.id ? "#" + hider.id : ""}`, style: (hider.getAttribute("style") || "").slice(0, 70), section: sectionOf(el) });
  }

  /* 27 ── people: every card that presents a person, and every photo slot. A
     picture is an <img> or a CSS background image (on the element or its
     ::before / ::after) — a face painted as a background is still a face. A
     pending card (data-person-status="pending": a named member with no verified
     profile yet) is shown with initials, which are text: it holds no <img>, no
     <svg>, no <picture>, <canvas> or <video>, and no background image. */
  const personCards = [...document.querySelectorAll("[data-person-card]")];
  const peopleFallback = !personCards.length && document.getElementById("team");
  const bgUrls = (root) =>
    [root, ...root.querySelectorAll("*")]
      .flatMap((e) => [null, "::before", "::after"].map((p) => getComputedStyle(e, p).backgroundImage))
      .flatMap((b) => [...String(b).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]));
  const people = {
    marked: personCards.length,
    fallback: Boolean(peopleFallback),
    images: [
      ...[...(peopleFallback ? peopleFallback.querySelectorAll("img") : personCards.flatMap((c) => [...c.querySelectorAll("img")]))].map((i) => srcOf(i)),
      ...(peopleFallback ? bgUrls(peopleFallback) : personCards.flatMap((c) => bgUrls(c))),
    ],
    emptySlots: [...document.querySelectorAll("[data-photo-slot]")].filter((s) => !s.querySelector("img")).length,
    cards: personCards.map((c) => ({
      name: (c.querySelector("h1,h2,h3,h4")?.textContent || "").trim(),
      href: c.getAttribute("href") || null,
      pending: c.getAttribute("data-person-status") === "pending",
      /* a link anywhere on the card: the card itself, one inside it, or one around it */
      linked: Boolean(c.closest("a[href]") || c.querySelector("a[href]")),
      pictures: c.querySelectorAll("img, svg, picture, canvas, video").length + bgUrls(c).length,
    })),
  };

  /* 31 ── which design the page carries. A stylesheet is known by what it
     styles, not by its hashed file name: the site's one design — the owner's
     engineering redesign of 2026-09-16, app/site.css — by its .bf-header /
     .bf-wrap / .bf-hero / .bf-main rules; the Techwix design it retires
     (app/techwix.css) by its .tw-root / .tw-hero / .tw-header rules; the
     retired dark design (the old app/globals.css) by its beam button, corner
     glow, content-visibility sections, grain, logo animations, FAQ items and
     [data-reveal] rules; Tailwind, which styled it, by the --tw-* properties
     it emits. Each retired design's markup is its classes in the DOM: the dark
     design's classes and attribute and the old homepage's cut About section,
     and any class of the Techwix design (every one is tw-). */
  const DESIGN_SEL = /\.bf-(header|wrap|hero|main)(?![\w-])/;
  const RETIRED_TW_SEL = /\.tw-(root|hero|header)(?![\w-])/;
  const RETIRED_SEL = /\.(beam-button|corner-glow|cv-section|grain-overlay|logo-chip-breathe|logo-jewel-aurora|faq-item)\b|\[data-reveal\b/;
  const sheets = [];
  for (const sheet of document.styleSheets) {
    const sels = [];
    let tailwind = false;
    const grab = (list) => {
      for (const r of list) {
        if (r.selectorText) sels.push(r.selectorText);
        if (!tailwind && /--tw-/.test(r.cssText || "")) tailwind = true;
        if (r.cssRules) grab(r.cssRules);
      }
    };
    try {
      grab(sheet.cssRules);
    } catch {
      continue; /* cross-origin sheet: not ours */
    }
    const text = sels.join("\n");
    sheets.push({ href: sheet.href ? sheet.href.replace(location.origin, "") : "(inline <style>)", design: DESIGN_SEL.test(text), retiredTw: RETIRED_TW_SEL.test(text), retired: RETIRED_SEL.test(text), tailwind });
  }
  const RETIRED_MARKUP = ".cv-section, .faq-item, .beam-button, .corner-glow, .grain-overlay, .logo-chip-breathe, .logo-jewel-aurora, [data-reveal], #about";
  const twClasses = (e) => [...(e.classList || [])].filter((c) => /^tw-/.test(c));
  const design = {
    sheets,
    retired: [...document.querySelectorAll(RETIRED_MARKUP)].map((e) => describe(e)),
    /* the Techwix design's markup: any element, <html> and <body> included, with a tw- class */
    techwix: [document.documentElement, ...document.querySelectorAll("[class]")].filter((e) => twClasses(e).length).map((e) => `${e.localName}.${twClasses(e).join(".")}`),
  };

  /* 32 ── the calls to action the suite follows (data-cta, components/site/Cta),
     the header's own button — every link in the header that is not the
     navigation or the logo's link home — and every place a page says "Book a
     call": its text, hidden or not, every attribute, and the document's head */
  const flatText = (el) => (el?.textContent || "").trim().replace(/\s+/g, " ");
  const ctas = [...document.querySelectorAll("[data-cta]")].map((a) => ({
    kind: a.getAttribute("data-cta"),
    text: flatText(a),
    href: a.getAttribute("href"),
    abs: a.href || "",
    tag: a.localName,
    inHeader: Boolean(a.closest("header#masthead")),
    shown: visible(a),
  }));
  const masthead = document.querySelector("header#masthead");
  const headerButtons = masthead
    ? [...masthead.querySelectorAll("a[href]")]
        .filter((a) => !a.closest("nav") && new URL(a.href, location.href).pathname !== "/")
        .map((a) => ({ text: flatText(a), href: a.getAttribute("href"), abs: a.href, cta: a.getAttribute("data-cta"), shown: visible(a) }))
    : null;
  /* 32 (2026-09-28) ── the project form where "Tell Us About Your Project"
     lands: its rendered width. It rendered 203px wide at 1440 in a panel whose
     heading touched its border — /work's card rule (.bf-project) won over the
     contact wrapper's, which had the same name — and nothing measured it. */
  const projectForm = (() => {
    const f = document.querySelector("#project .bf-form");
    if (!f) return null;
    const r = f.getBoundingClientRect();
    return { width: Math.round(r.width), shown: visible(f), box: describe(f.parentElement || f) };
  })();
  const bookCall = [];
  {
    const BOOK = /\bbook\s+a\s+call\b/i;
    const w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      if (t.parentElement?.closest("script:not([type='application/ld+json']), style")) continue;
      const m = BOOK.exec(t.textContent);
      if (m) bookCall.push({ where: `text in ${t.parentElement ? describe(t.parentElement) : "the document"}`, text: t.textContent.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, " ").trim() });
    }
    for (const el of document.querySelectorAll("*"))
      for (const at of el.attributes) {
        const m = BOOK.exec(at.value);
        if (m) bookCall.push({ where: `${at.name} on ${el.localName}`, text: at.value.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, " ").trim() });
      }
  }

  /* 33 ── the capabilities and their evidence: every [data-capability], with
     its tier chips and its honesty line as a reader sees them, and every tier
     chip that carries — or holds — a figure's data-status */
  const seenByReader = (el) => {
    if (!visible(el)) return false;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    if (r.width < 4 || r.height < 4) return false;
    if (/^inset\(\s*(50|[5-9]\d|100)%/.test(st.clipPath) || /^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/.test(st.clip)) return false;
    const L = r.left + scrollX;
    const T = r.top + scrollY;
    return L + r.width > 0 && T + r.height > 0 && L < document.documentElement.scrollWidth && T < document.documentElement.scrollHeight;
  };
  const capabilities = [...document.querySelectorAll("[data-capability]")].map((c) => ({
    id: c.getAttribute("data-capability"),
    tiers: [...c.querySelectorAll("[data-tier]")].map((t) => ({ tier: t.getAttribute("data-tier"), text: (t.innerText || t.textContent || "").replace(/\s+/g, " ").trim(), seen: seenByReader(t) })),
    honesty: [...c.querySelectorAll("[data-honesty]")].map((h) => ({ text: flatText(h), seen: seenByReader(h) })),
  }));
  const tierChips = [...document.querySelectorAll("[data-tier]")].map((t) => ({
    tier: t.getAttribute("data-tier"),
    text: (t.innerText || t.textContent || "").replace(/\s+/g, " ").trim(),
    status: t.hasAttribute("data-status") ? t.getAttribute("data-status") : t.querySelector("[data-status]") ? `inside: ${t.querySelector("[data-status]").getAttribute("data-status")}` : null,
    shown: visible(t),
    where: sectionOf(t),
  }));

  /* 18 ── the logotype scope: how many elements carry it, and how many render */
  const logos = [...document.querySelectorAll("[data-logotype]")];
  const logotypeCount = { dom: logos.length, rendered: logos.filter((e) => e.getClientRects().length > 0).length };

  /* 8 (K10) ── the strings a reader or a crawler gets OUTSIDE the visible text:
     the attributes that name or describe a rendered element, <svg> titles, the
     document title and the text-bearing meta tags (JSON-LD is read in node,
     from `jsonld`). Only strings holding a digit. */
  const META_ATTRS = ["aria-label", "aria-description", "aria-roledescription", "aria-valuetext", "alt", "title", "placeholder"];
  const metaStrings = [];
  for (const el of document.body.querySelectorAll(META_ATTRS.map((a) => `[${a}]`).join(","))) {
    if (!el.getClientRects().length) continue;
    for (const a of META_ATTRS) {
      const v = el.getAttribute(a);
      if (v && /\d/.test(v)) metaStrings.push({ where: `${a} on ${describe(el)}`, text: v });
    }
  }
  for (const t of document.querySelectorAll("svg title")) if (/\d/.test(t.textContent)) metaStrings.push({ where: "an <svg> <title>", text: t.textContent.trim() });
  if (/\d/.test(document.title)) metaStrings.push({ where: "the <title>", text: document.title });
  for (const m of document.querySelectorAll("meta[content]")) {
    const key = m.getAttribute("name") || m.getAttribute("property") || "";
    if (!/^(description|keywords|application-name|apple-mobile-web-app-title|og:|twitter:)/.test(key)) continue;
    if (/(^|:)(image|url|video|audio|type|locale|card|site|creator|width|height|secure_url)$/.test(key)) continue;
    const v = m.getAttribute("content") || "";
    if (/\d/.test(v)) metaStrings.push({ where: `meta ${key}`, text: v });
  }

  /* 25 ── scripts the page loaded */
  const scripts = performance
    .getEntriesByType("resource")
    .filter((e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name))
    .map((e) => e.name);

  return { visibleTexts, undefinedUses, fontsDeclared, fontsLoaded, fontFiles, fontPreloads, stampedInfo, images, cards: [...cardEls.values()], projectCards, jsonld, links, ids, headings, meta, metaStrings, allImages, fontFaces, fontFaceRules, stuckHidden, scripts, people, design, logotypeCount, ctas, headerButtons, projectForm, bookCall, capabilities, tierChips };
}

/* 8, 10 (K10) ── THE FIGURE GRAMMAR: which numbers in a string are figures, and
   why every other number is not. Self-contained — it runs in the browser
   (readFigures is evaluated with it) and in node (the metadata and llms
   passes), so every place a figure can appear is read by one grammar.

   `input` may carry boundary characters: U+FFFF (masked — nothing matches
   across it), U+200B (an atomic box's edge) and U+2063 (a word break between
   two text nodes, "Latency" + "45ms"). Returns character offsets into it.

   K9 (2026-09-15) added "3X" (a capital multiplier), "×2" (a leading
   multiplier), scale words ("2 million") and thousands-separated counts
   ("10,000 queries"). Spelled-out numbers are NOT figures here, deliberately:
   "Still running in six months" is the canonical line (CLAUDE.md, check 8). */
function tokenizeFigures(input) {
  const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const NUM = String.raw`\d+(?:[.,]\d+)*`;
  /* [pattern, reason, extra test] — in order, each on what the earlier ones left */
  const NOT_FIGURE = [
    [/(?:©|\(c\)|copyright)\s*\d{4}(?:\s?[-–]\s?\d{4})?/giu, "a year in the © line"],
    [new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+${MONTH}\b\.?(?:,?\s+\d{4}\b)?|\b${MONTH}\.?\s+\d{1,2}(?:st|nd|rd|th)?\b(?:,?\s+\d{4}\b)?|\b${MONTH}\.?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b`, "gu"), "a date"],
    [/(?:§§?\s*|\b(?:sections?|clauses?|articles?|art\.|paragraphs?|para\.|schedules?|annex(?:es)?|recitals?)\s+)\d+(?:[.(]\w+\)?)*(?:\s?(?:[-–,]|and|to)\s?\d+(?:[.(]\w+\)?)*)*|\b(?:regulation|directive)\s+\((?:eu|ec)\)\s+(?:no\.?\s+)?\d+\/\d+|\bact\s+\d{4}\b/giu, "a legal section or citation number"],
    [/\+\d{1,3}(?:[\s.‑-]?\(?\d{1,5}\)?){2,5}/gu, "a phone number", (t) => (t.match(/\d/g) || []).length >= 9],
    [/\b\d+(?:st|nd|rd|th)\b/gu, "an ordinal"],
    [/(?:\b(?:week|step|phase|stage|lane|part|day|round|sprint|chapter|level|tier|milestone|no\.)|#)\s?\d+(?:\s?[-–]\s?\d+)?\b/giu, "an ordinal — a sequence label"],
  ];
  /* a number is a figure when it carries a unit, %, currency, an approximation or
     bound, a multiplier, a range, a rate, a scale word or a trailing + — or is a
     thousands-separated count */
  const FIGURE = new RegExp(
    String.raw`(?<![\p{N}_])(?<!\p{L}(?![$£€]))` +
      String.raw`(?<pre>[~≈<>≤≥±+−×]\s?)?(?<cur>[$£€]\s?)?` +
      `(?<num>${NUM})` +
      String.raw`(?<range>\s?[-‐‑–—]\s?[$£€]?${NUM})?` +
      "(?<unit>" +
      [
        String.raw`\s?%`,
        String.raw`\s?×`,
        String.raw`[xX](?![\p{L}\p{N}])`,
        String.raw`\/(?:s|sec|min|h|hr|hour|d|day|wk|week|mo|month|yr|year)(?!\p{L})`,
        String.raw`\/\d+(?![\p{N}\/])`,
        String.raw`(?:\s|[-‐‑])?(?:milliseconds?|ms|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|wks?|months?|mos?|years?|yrs?|[KMGT]B)(?![\p{L}\p{N}])`,
        String.raw`\s?(?:thousand|million|billion|trillion)(?![\p{L}\p{N}])`,
        String.raw`[-‐‑]d(?![\p{L}\p{N}])`,
        String.raw`(?:s|m|h|d|k|K|M|B|bn)(?![\p{L}\p{N}])`,
      ].join("|") +
      ")?" +
      String.raw`(?<plus>\+(?!\p{N}))?`,
    "gu",
  );
  const MASK = "\uFFFF";
  let left = input;
  const figures = [];
  const not = [];
  const mask = (s, e) => (left = left.slice(0, s) + MASK.repeat(e - s) + left.slice(e));
  for (const [re, reason, keep] of NOT_FIGURE)
    for (const m of left.matchAll(re))
      if (/\d/.test(m[0]) && (!keep || keep(m[0]))) {
        not.push({ start: m.index, end: m.index + m[0].length, reason });
        mask(m.index, m.index + m[0].length);
      }
  const here = [];
  for (const m of left.matchAll(FIGURE)) {
    const g = m.groups;
    if (g.pre || g.cur || g.range || g.unit || g.plus || /^\d{1,3}(?:,\d{3})+$/.test(g.num)) here.push({ start: m.index, end: m.index + m[0].length });
  }
  for (const f of here) mask(f.start, f.end);
  figures.push(...here);
  /* what is left: every word still holding a digit */
  for (const m of left.matchAll(/[^\s\uFFFF\u200B\u2063]*\d[^\s\uFFFF\u200B\u2063]*/gu)) {
    const lead = /^[("“‘'[{`*_]*/u.exec(m[0])[0].length;
    const word = m[0].slice(lead).replace(/[)"”’'\]}.,;:!?`*_|]+$/u, "");
    const d = /\d+(?:[.,]\d+)*/u.exec(word);
    if (!d) continue;
    /* a letter against the digits (S3, 0x1F), or a word hyphened onto them from
       the left (GPT-4.1), makes it part of a name; "3-step" is still a count */
    const named = /\p{L}[-‐‑]?$/u.test(word.slice(0, d.index)) || /^\p{L}/u.test(word.slice(d.index + d[0].length));
    not.push({ start: m.index + lead, end: m.index + lead + word.length, reason: named ? "part of a name, version or identifier" : "a bare number — no unit, %, currency, ~ < > ≈ prefix, multiplier or range" });
  }
  return { figures, not };
}

/* 8 ── every figure in the visible text, standalone or inside a sentence (runs in the browser)

   Runs LAST in visit(), once every <details> is open — their answers are page
   content — because opening them would change what checks 18 and 20 see.

   Two kinds of figure, two rules:
     · a STANDALONE metric — an element whose whole text is one short figure, as
       in the metric band, the /work cards and the KPI grids — keeps the rule this
       check always had: a visible shipped/target label inside the largest box
       around it that holds no other standalone figure;
     · every other FIGURE TOKEN in the visible text — in a sentence, a list item,
       a link, a lane header, split across inline tags — must sit in an element
       with data-status="shipped|target" that holds its OWN visible chip reading
       that status and no other figure (components/FigureText.tsx), or in a
       data-figure-exempt element that states a real reason and covers exactly
       one figure.
   A chip anywhere else — beside the wrapper, or three levels up in the metric
   band — is not the figure's chip, and a chip nobody can see is not a chip.

   NOT a figure, by structure, each returned with its reason so the report prints
   it: the © line's year; a date; a legal section or citation number; a phone
   number; an ordinal (1st, "Week 2", a heading's "4.", a zero-padded 01); a
   number that is part of a name (GPT-4.1, S3); and a bare number with no unit,
   %, currency, ~ < > ≈ prefix, multiplier or range. Nothing is dropped unprinted. */
function readFigures(tokenizeFigures) {
  const csMemo = new Map();
  const cs = (el) => {
    let s = csMemo.get(el);
    if (!s) csMemo.set(el, (s = getComputedStyle(el)));
    return s;
  };
  const opMemo = new Map();
  const opacity = (el) => {
    if (!el || el.nodeType !== 1) return 1;
    if (!opMemo.has(el)) opMemo.set(el, parseFloat(cs(el).opacity) * opacity(el.parentElement));
    return opMemo.get(el);
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) < 0.05) return false;
    }
    return true;
  };
  const snip = (el, n = 50) => (el?.textContent || "").trim().replace(/\s+/g, " ").slice(0, n);
  const sectionOf = (el) => {
    const s = el?.closest?.("section[id], [id]");
    return s ? `#${s.id}` : "";
  };
  const tagOf = (el) => `${el.localName}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : ""}`;

  /* ── a chip counts only if a sighted reader can see it: not display:none,
     visibility:hidden, opacity 0, clipped to nothing (sr-only), or zero size —
     and (K8, 2026-09-15) on the page, big enough to read through whatever
     clips it, and not under something else. A chip at left:-9999px, a 3×3px
     chip with overflow:hidden and a chip under an opaque cover all passed. The
     same test applies to a standalone metric's chip and an in-sentence one. ── */
  /* the cover test hit-tests the page: nothing may dodge it with pointer-events:none */
  const pe = document.createElement("style");
  pe.textContent = "*,*::before,*::after{pointer-events:auto!important}";
  document.head.append(pe);
  const textRect = (chip) => {
    const t = document.createRange();
    t.selectNodeContents(chip);
    return t.getBoundingClientRect();
  };
  /* what sits on top of the chip's text, if anything: the chip is brought into
     view (with any scroll container around it) and hit-tested at three points
     along its text; its own boxes and its ancestors' do not count */
  const coveredBy = (chip) => {
    const x0 = scrollX;
    const y0 = scrollY;
    chip.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    const b = textRect(chip);
    let hit = "";
    for (const f of [0.5, 0.2, 0.8]) {
      const top = document.elementFromPoint(b.left + b.width * f, b.top + b.height / 2);
      if (!top || top === chip || chip.contains(top) || top.contains(chip)) continue;
      hit = tagOf(top);
      break;
    }
    window.scrollTo({ left: x0, top: y0, behavior: "instant" });
    return hit;
  };
  const hiddenWhy = (chip, wrap) => {
    const chain = [];
    for (let a = chip; a && a !== wrap.parentElement; a = a.parentElement) chain.push(a);
    const none = chain.find((a) => cs(a).display === "none");
    if (none) return none === chip ? "display:none" : `display:none on the ${none.localName} around it`;
    if (cs(chip).visibility !== "visible") return `visibility:${cs(chip).visibility}`;
    if (opacity(chip) < 0.05) return "opacity 0";
    if (chain.some((a) => /^inset\(\s*(50|[5-9]\d|100)%/.test(cs(a).clipPath) || /^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/.test(cs(a).clip)))
      return "clipped to nothing — screen-reader-only (sr-only)";
    const r = chip.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return `zero size — a ${+r.width.toFixed(1)}×${+r.height.toFixed(1)}px box`;
    const b = textRect(chip);
    if (b.width < 2 || b.height < 2 || parseFloat(cs(chip).fontSize) < 4) return "its text has no size";
    /* on the page: inside the document's own area, not pushed off an edge */
    const pw = document.documentElement.scrollWidth;
    const ph = document.documentElement.scrollHeight;
    const L = b.left + scrollX;
    const T = b.top + scrollY;
    if (L + b.width <= 0 || T + b.height <= 0 || L >= pw || T >= ph) return `off the page — its text sits at x ${Math.round(L)}, y ${Math.round(T)}, outside the ${pw}×${ph}px document`;
    /* big enough: what shows of its text through every box that clips it (its
       own included, up to the root — a box that scrolls does not clip) */
    let v = { l: b.left, t: b.top, r: b.right, b: b.bottom };
    let clipper = null;
    for (let a = chip; a && a !== document.documentElement; a = a.parentElement) {
      if (!/hidden|clip/.test(`${cs(a).overflowX} ${cs(a).overflowY}`)) continue;
      const q = a.getBoundingClientRect();
      const n = { l: Math.max(v.l, q.left), t: Math.max(v.t, q.top), r: Math.min(v.r, q.right), b: Math.min(v.b, q.bottom) };
      if ((n.r - n.l) * (n.b - n.t) < (v.r - v.l) * (v.b - v.t) - 0.5) clipper = clipper || a;
      v = n;
    }
    const vw = Math.max(0, v.r - v.l);
    const vh = Math.max(0, v.b - v.t);
    if (vw < 1 || vh < 1) return `clipped away by an overflow:hidden ${clipper ? tagOf(clipper) : "box"}`;
    if (vw * vh < 0.8 * b.width * b.height || vh < 6)
      return `too small to read — ${+vw.toFixed(1)}×${+vh.toFixed(1)}px of its ${+b.width.toFixed(1)}×${+b.height.toFixed(1)}px text shows through the ${clipper ? tagOf(clipper) : "box"} that clips it`;
    const cover = coveredBy(chip);
    if (cover) return `covered — ${cover} sits on top of it`;
    return "";
  };
  /* EDGE marks where an atomic box sat inside a run: nothing matches across it, and it prints as nothing */
  const EDGE = "\u200B";
  /* SEP is a word break between two text nodes a reader sees as two words run
     together: "Latency" + "45ms" built from spans (K9). It prints as nothing */
  const SEP = "\u2063";
  const oneLine = (s) => s.replaceAll(EDGE, "").replaceAll(SEP, "").replace(/\s+/g, " ").trim();

  /* ── standalone metrics: the check's original rule, unchanged ──────────── */
  const FIG = /^[<>≤≥~≈+−-]?\s*[$£€]?\s*\d[\d,.]*\s*(ms|s|sec|min|h|hrs?|days?|weeks?|%|x|×|k|K|M|B)?\s*\+?$|^\d+\/\d+$/;
  const UNIT = /[<>≤≥~≈$£€%×+]|\d\s*(ms|s|sec|min|h|hrs?|days?|weeks?|x|k|K|M|B)$|^\d+\/\d+$/;
  const isFigure = (el) => {
    const t = el.textContent.trim();
    return t.length <= 14 && FIG.test(t) && UNIT.test(t);
  };
  const figureEls = [...document.body.querySelectorAll("*")].filter(
    (el) => !el.closest("script, style, noscript, template, svg, title") && isFigure(el) && ![...el.children].some((c) => c.textContent.trim() === el.textContent.trim()) && visible(el),
  );
  /* K1 (2026-09-15): a chip inside a [data-status] wrapper is THAT wrapper's
     figure's chip. The first proof card's label, "Search response, 80% of
     traffic", carries its own target chip for the 80%; the old rule took the
     first chip in the card and read the <100ms as target — and still did with
     the <100ms's own shipped chip deleted. A standalone figure's chip is never
     inside another figure's wrapper. */
  const ownedBy = (chip, fig) => {
    const w = chip.closest("[data-status]");
    return !w || w.contains(fig);
  };
  const standalone = new Map();
  for (const el of figureEls) {
    /* the metric's own container: the largest ancestor holding no other figure */
    let box = el;
    while (box.parentElement && box.parentElement !== document.body && figureEls.filter((f) => box.parentElement.contains(f)).length === 1) box = box.parentElement;
    /* an explicit owner wins: the [data-metric] box around the figure (its row
       in the proof strip, on /work) holds the figure's own chip, and only a
       chip there counts */
    const owner = el.closest("[data-metric]");
    const scope = owner && box.contains(owner) ? owner : box;
    /* its chip, seen by the same test as an in-sentence chip (K8) */
    const cands = [scope, ...scope.querySelectorAll("*")].filter((e) => /^(shipped|target)$/i.test(e.textContent.trim()) && ownedBy(e, el));
    const why = cands.map((c) => hiddenWhy(c, document.body));
    const k = why.indexOf("");
    standalone.set(el, {
      label: k >= 0 ? cands[k].textContent.trim().toLowerCase() : null,
      hidden: k < 0 && cands.length ? why[0] : "",
      context: snip(box, 90),
      owner: owner ? owner.getAttribute("data-metric") : null,
    });
  }

  /* ── the visible text, as runs: one per block box. An inline element (a link,
     a <b>, a data-status span) joins the run around it, so a figure split across
     tags reads as one figure. An atomic inline (a chip, an inline-block badge) or
     a box out of the flow (absolute, fixed, floated — an sr-only span is one) is
     a run of its own, and the run around it carries on past it across an EDGE.
     Text counts when it has a box, its visibility is visible and its opacity is
     not ~0 — screen-reader-only text included: a screen reader reads it out. ── */
  const SKIP = "script, style, noscript, template, title, iframe";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const runs = [];
  let cur = null;
  /* the last text node put in any run, and its run: a touching box joins THAT run */
  let lastSeg = null;
  const begin = (el) => runs.push((cur = { el, text: "", segs: [] }));
  const put = (node, text) => {
    /* a letter from one node straight against a digit from the next: two words */
    if (node && /^\d/.test(text) && /\p{L}$/u.test(cur.text)) cur.text += SEP;
    if (node) {
      cur.segs.push({ node, start: cur.text.length, end: cur.text.length + text.length });
      if (node.nodeType === 3) lastSeg = { run: cur, node };
    }
    cur.text += text;
  };
  const shown = (node) => {
    const el = node.parentElement;
    if (cs(el).visibility !== "visible" || opacity(el) < 0.05) return false;
    const r = document.createRange();
    r.selectNodeContents(node);
    return [...r.getClientRects()].some((q) => q.width > 0 && q.height > 0);
  };
  /* K9: text a stylesheet writes (content: "45ms" in ::before / ::after) is
     visible text too. Strings and attr() only; counters are list numbering. */
  const pseudoText = (el, which) => {
    const s = getComputedStyle(el, which);
    if (!s.content || s.content === "none" || s.content === "normal" || s.display === "none" || s.visibility !== "visible" || opacity(el) < 0.05) return "";
    let out = "";
    for (const m of s.content.matchAll(/"((?:[^"\\]|\\.)*)"|attr\(\s*([\w-]+)\s*\)/g)) out += m[1] !== undefined ? m[1].replace(/\\(.)/g, "$1") : el.getAttribute(m[2]) || "";
    return /\d/.test(out) ? out : "";
  };
  const rects = (node) => {
    const r = document.createRange();
    r.selectNodeContents(node);
    return [...r.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
  };
  const firstTextRect = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) if (/\S/.test(t.textContent) && shown(t)) return rects(t)[0] || null;
    return null;
  };
  /* K9: an atomic box (inline-block, inline-flex) or a flex or grid item whose
     text sits on the same line as the text before it, touching it, reads as
     one word with it: "45" in an inline-block, then "ms". A chip is set off by
     its margin and padding, and a flex row by its gap, so they stay apart. */
  const touching = (c) => {
    if (!lastSeg) return false;
    const a = rects(lastSeg.node).at(-1);
    const b = firstTextRect(c);
    if (!a || !b) return false;
    const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    const gap = b.left - a.right;
    return overlap >= 0.5 * Math.min(a.height, b.height) && gap >= -1 && gap <= 2;
  };
  const walkEl = (c) => {
    const before = pseudoText(c, "::before");
    if (before) put(c, before);
    walk(c);
    const after = pseudoText(c, "::after");
    if (after) put(c, after);
  };
  const walk = (parent) => {
    for (let c = parent.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        if (!/\S/.test(c.textContent)) put(null, " ");
        else if (shown(c)) put(c, c.textContent);
        continue;
      }
      if (c.nodeType !== 1 || c.matches(SKIP)) continue;
      if (c.localName === "br") {
        begin(cur.el);
        continue;
      }
      const d = cs(c).display;
      if (d === "none") continue;
      const svgBox = c.namespaceURI === SVG_NS && c.localName !== "tspan" && c.localName !== "a";
      if (!svgBox && (d === "inline" || d === "contents")) {
        walkEl(c);
        continue;
      }
      const outer = cur;
      const positioned = /^(absolute|fixed)$/.test(cs(c).position) || cs(c).cssFloat !== "none";
      if (!svgBox && !positioned && touching(c)) {
        cur = lastSeg.run; /* joined: the run of the text it touches, no edge */
        walkEl(c);
        continue;
      }
      const atomic = !svgBox && (d.startsWith("inline") || positioned);
      if (atomic) put(null, EDGE);
      begin(c);
      walkEl(c);
      if (atomic) {
        cur = outer;
        put(null, EDGE);
      } else begin(outer.el);
    }
  };
  begin(document.body);
  walk(document.body);

  /* ── figure tokens, and every number that is not one: the grammar is
     tokenizeFigures, shared with the metadata and llms passes (K10); the masks
     below are the ones only the page can tell — a tel: link, a heading's
     section number, a zero-padded step marker ─────────────────────────── */
  const MASK = "\uFFFF"; /* not a letter, digit or space: nothing matches across it */
  const found = [];
  const notFigures = [];
  for (const run of runs) {
    if (!/\d/.test(run.text)) continue;
    let left = run.text;
    const mask = (s, e) => (left = left.slice(0, s) + MASK.repeat(e - s) + left.slice(e));
    const not = (s, e, reason) => {
      notFigures.push({ run, start: s, end: e, reason });
      mask(s, e);
    };
    const tel = new Map();
    for (const g of run.segs) {
      const a = g.node.parentElement.closest('a[href^="tel:" i]');
      if (!a) continue;
      const t = tel.get(a) || { s: g.start, e: g.end };
      t.e = g.end;
      tel.set(a, t);
    }
    for (const { s, e } of tel.values()) if (/\d/.test(left.slice(s, e))) not(s, e, "a phone number — a tel: link");
    const heading = run.el.closest("h1, h2, h3, h4, h5, h6") && /^(\s*)(\d+(?:\.\d+)*)[.)](?=\s)/.exec(left);
    if (heading) not(heading[1].length, heading[1].length + heading[2].length, "a section number opening a heading");
    const marker = /^(\s*)(0\d+)\s*$/.exec(left);
    if (marker) not(marker[1].length, marker[1].length + marker[2].length, "a zero-padded sequence marker (01, 02 …)");
    const t = tokenizeFigures(left);
    for (const f of t.figures) found.push({ run, start: f.start, end: f.end });
    for (const x of t.not) notFigures.push({ run, start: x.start, end: x.end, reason: x.reason });
  }

  /* the sentence a token sits in, from its run. A full stop straight after a
     digit ends nothing ("1. Who we are"). A token alone in its box — a table
     cell, a count, a step marker — is given the text around it as well. */
  const sentenceOf = (run, s, e) => {
    const t = run.text;
    const END = /(?<!\d)[.!?…](?=[\s\u200B]|$)/g;
    let a = 0;
    for (const m of t.slice(0, s).matchAll(END)) a = m.index + 1;
    END.lastIndex = e;
    const tail = END.exec(t);
    const b = tail ? tail.index + 1 : t.length;
    const out = oneLine(t.slice(a, b));
    if (out.length > oneLine(t.slice(s, e)).length + 2) return out.length > 220 ? `…${oneLine(t.slice(Math.max(a, s - 100), Math.min(b, e + 100)))}…` : out;
    for (let el = run.el.parentElement; el && el !== document.body; el = el.parentElement) {
      const around = oneLine(el.innerText ?? el.textContent);
      if (around.length > out.length + 3) return `${out} — within “${around.length > 140 ? `${around.slice(0, 140)}…` : around}”`;
    }
    return out;
  };
  const figures = found.map((f) => {
    const nodes = f.run.segs.filter((g) => g.end > f.start && g.start < f.end).map((g) => g.node);
    let common = nodes[0].parentElement;
    while (common && !nodes.every((n) => common.contains(n))) common = common.parentElement;
    return { nodes, common, text: oneLine(f.run.text.slice(f.start, f.end)), sentence: sentenceOf(f.run, f.start, f.end), section: sectionOf(common) };
  });

  /* ── an exemption states a real reason and covers exactly one figure ───── */
  const PLACEHOLDER = new Set(["reason", "todo", "tbd", "n/a", "na", "-", "x", "ok", "exempt", "none"]);
  const reasonProblem = (raw) => {
    if (!raw) return "its reason is empty";
    const r = raw.trim();
    if (!r) return "its reason is only whitespace";
    const low = r.toLowerCase().replace(/[.!…:]+$/, "");
    if (PLACEHOLDER.has(low) || /^(todo|tbd|fixme|xxx|placeholder)\b/.test(low)) return `its reason "${r}" is a placeholder`;
    if (!/\s/.test(r)) return `its reason "${r}" is a single word`;
    if (r.length < 12) return `its reason "${r}" is under 12 characters`;
    return "";
  };
  /* K2 (2026-09-15): whether a wrapper is in force is judged by the figures it
     covers — a figure is found only where its own text shows — never by the
     wrapper's box. A display:contents wrapper has no box of its own, and the
     old test (a box, then the count) skipped it: one exemption or one chip over
     two figures passed, which reopened the category exemption. */
  const hasShownText = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) if (/\S/.test(t.textContent) && shown(t)) return true;
    return false;
  };
  const exemptions = [...document.querySelectorAll("[data-figure-exempt]")].map((el) => {
    const reason = el.getAttribute("data-figure-exempt");
    const covers = figures.filter((x) => x.nodes.every((n) => el.contains(n)));
    const rendered = covers.length > 0 || hasShownText(el);
    const problems = [reasonProblem(reason)];
    if (covers.length > 1 || (rendered && covers.length === 0))
      problems.push(covers.length ? `it covers ${covers.length} figures — an exemption covers exactly one` : "it covers no figure — an exemption covers exactly one");
    return { el, reason, rendered, problem: problems.filter(Boolean).join("; "), figures: covers.map((x) => x.text), sentence: covers[0]?.sentence || oneLine(el.textContent).slice(0, 160), section: sectionOf(el) };
  });

  /* ── a data-status wrapper labels exactly one figure: one chip over two would
     let a second, unmeasured figure borrow the first one's status ────────── */
  /* a status wrapper's own words: its text less its chip's (K11) */
  const ownText = (el) => {
    const status = el.getAttribute("data-status");
    let s = "";
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      const p = t.parentElement;
      if (p !== el && p.closest("[data-status]") === el && p.textContent.trim() === status) continue;
      s += t.textContent;
    }
    return s.trim();
  };
  const statusWraps = [...document.querySelectorAll("[data-status]")].map((el) => {
    const covers = figures.filter((x) => x.nodes.every((n) => el.contains(n)));
    const problem = covers.length > 1 ? `it covers ${covers.length} figures with one chip — a chip labels exactly one` : "";
    return { el, status: el.getAttribute("data-status"), problem, rendered: covers.length > 0 || hasShownText(el), text: ownText(el), figures: covers.map((x) => x.text), sentence: covers[0]?.sentence || oneLine(el.textContent).slice(0, 160), section: sectionOf(el) };
  });

  /* ── each token's verdict ─────────────────────────────────────────────── */
  const tokens = figures.map((x) => {
    const out = { fig: x.text, sentence: x.sentence, section: x.section };
    let wrapWhy = "";
    const wrap = x.common.closest("[data-status]");
    if (wrap) {
      const status = wrap.getAttribute("data-status");
      if (status !== "shipped" && status !== "target") wrapWhy = `sits in data-status="${status}" — a status is shipped or target`;
      else {
        /* its OWN chip: inside this wrapper, not inside a nested one, not the figure */
        const chips = [...wrap.querySelectorAll("*")].filter((c) => c.closest("[data-status]") === wrap && c.textContent.trim() === status && !x.nodes.some((n) => c.contains(n)));
        const why = chips.map((c) => hiddenWhy(c, wrap));
        if (why.includes("")) return statusWraps.find((w) => w.el === wrap)?.problem ? { ...out, verdict: "status-shared" } : { ...out, verdict: "status", status };
        wrapWhy = chips.length
          ? `sits in data-status="${status}", but its chip cannot be seen: ${why[0]}`
          : `sits in data-status="${status}" with no chip reading "${status}" inside that wrapper — a chip elsewhere is not its own`;
      }
    }
    let std = null;
    for (let a = x.common; a && !std; a = a.parentElement) std = standalone.get(a) || null;
    if (std?.label) return { ...out, verdict: "standalone", label: std.label };
    const ex = exemptions.find((e) => e.el === x.common.closest("[data-figure-exempt]"));
    if (ex && !ex.problem) return { ...out, verdict: "exempt", reason: ex.reason.trim() };
    if (ex) return { ...out, verdict: "exempt-invalid" }; /* reported once, on the exemption */
    if (wrapWhy) return { ...out, verdict: "fail", why: wrapWhy };
    if (std) return { ...out, verdict: "standalone-unlabelled", context: std.context, why: std.hidden };
    return { ...out, verdict: "fail", why: "has no shipped/target label" };
  });

  pe.remove();
  return {
    /* K11: every rendered wrapper, to be found in content/figure-labels.ts; every
       rendered [data-metric] box, to be found in content/metrics.ts */
    registryWraps: [
      ...exemptions.filter((e) => e.rendered).map((e) => ({ kind: "exempt", value: e.reason, text: (e.el.textContent || "").trim(), section: e.section })),
      ...statusWraps.filter((w) => w.rendered).map((w) => ({ kind: "status", value: w.status, text: w.text, section: w.section })),
    ],
    metricsShown: [...document.querySelectorAll("[data-metric]")]
      .filter((el) => el.getClientRects().length)
      .map((el) => {
        const fig = figureEls.find((f) => el.contains(f));
        return { id: el.getAttribute("data-metric"), figure: fig ? fig.textContent.trim() : null, status: fig ? standalone.get(fig)?.label || null : null, section: sectionOf(el) };
      }),
    tokens,
    statusWraps: statusWraps.filter((w) => w.problem).map((w) => ({ status: w.status, problem: w.problem, figures: w.figures, sentence: w.sentence, section: w.section })),
    exemptions: exemptions.map((e) => ({ reason: e.reason, rendered: e.rendered, problem: e.problem, figures: e.figures, sentence: e.sentence, section: e.section })),
    notFigures: notFigures.map((n) => ({ tok: oneLine(n.run.text.slice(n.start, n.end)), reason: n.reason, sentence: sentenceOf(n.run, n.start, n.end) })),
  };
}

/* 4 ── with JavaScript off, is the text there? (runs in the browser) ───── */
function hiddenWithoutJs() {
  const out = [];
  const skipped = [];
  let total = 0;
  for (const el of document.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,td,th,a,button,label,span,div")) {
    if (el.closest("script, style, noscript, template")) continue;
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) continue;
    if (!el.getClientRects().length) continue; /* display:none at this width — by design, not by script */
    /* A button of type "button" outside any form does nothing without script, so
       it is not content: hidden without JS is progressive enhancement (the hero's
       pause control, 2026-09-24). Listed in the report, never silently skipped. A
       submit button, a link, or any text around the control is still read. */
    const control = el.closest('button[type="button"]');
    if (control && !control.form) {
      skipped.push(control.textContent.trim().replace(/\s+/g, " ").slice(0, 40));
      continue;
    }
    total++;
    let op = 1;
    let hider = null;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const o = parseFloat(getComputedStyle(a).opacity);
      op *= o;
      if (o < 0.05 && !hider) hider = a;
    }
    const hiddenVis = getComputedStyle(el).visibility === "hidden";
    if (op < 0.05 || hiddenVis) {
      out.push({
        text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 60),
        tag: el.tagName.toLowerCase(),
        hider: hider ? hider.tagName.toLowerCase() + (hider.id ? `#${hider.id}` : "") : "visibility:hidden",
        style: (hider?.getAttribute("style") || "").slice(0, 80),
        section: el.closest("section[id], [id]")?.id || "",
      });
    }
  }
  return { out, total, skipped: [...new Set(skipped)] };
}

/* 7 ── the homepage headline: the words on each rendered line, per span — and
   (2026-09-16) the lines of the WHOLE headline, across its spans: "Build what's
   next." is set as two spans, "Build" / "what's next.", and a last line of one
   word is an orphan whether or not a span boundary sits before it */
function headlineLines() {
  const h1 = document.querySelector("#hero h1") || document.querySelector("h1");
  if (!h1) return null;
  const wordsOf = (root) => {
    const words = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const re = /\S+/g;
      let m;
      while ((m = re.exec(n.textContent))) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        const rect = r.getClientRects()[0];
        if (rect) words.push({ w: m[0], top: Math.round(rect.top) });
      }
    }
    return words;
  };
  const toLines = (words) => {
    const lines = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - w.top) < 4) last.words.push(w.w);
      else lines.push({ top: w.top, words: [w.w] });
    }
    return lines.map((l) => l.words.join(" "));
  };
  const parts = h1.children.length ? [...h1.children] : [h1];
  return { text: h1.textContent.replace(/\s+/g, " ").trim(), parts: parts.map((p) => toLines(wordsOf(p))), all: toLines(wordsOf(h1)) };
}

/* 20 ── WCAG 2.x luminance and contrast */
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrastRatio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/* 20 — the one fixed or sticky box whose TEXT is measured: the site header,
   from the capture at the top of the page, where it rests over its own white
   ground (A3: its call to action, white on the brand gradient, had never been
   measured). Text in any other fixed or sticky box fails: the ground under it
   changes as the page scrolls, and no single capture is what a reader sees. */
const PINNED_ALLOW = "header#masthead";
/* 20 — how many text elements a page's contrast pass measures. The busiest
   page has about 150; a page over the cap FAILS (K5: at 700 it stopped
   silently, and text further down was never measured). */
const CONTRAST_CAP = 1500;

/* Contrast against the pixels actually behind the text, VIEWPORT BY VIEWPORT
   (K5, 2026-09-15). With every glyph made transparent, the page is captured one
   viewport at a time from the top, half a viewport apart, so every point of it
   is seen at least twice at two heights; a fixed or sticky box is painted where
   a reader sees it at that scroll. A sample point is taken from the first
   capture where it is on screen and no fixed or sticky box sits ON TOP of it —
   a fixed box UNDER the text (a fixed ground) is the ground, and is measured
   as such. The text colour (converted to sRGB by the browser, alpha and
   ancestor opacity applied) is composited over each sampled pixel.

   It replaces one full-page capture, which painted a fixed or sticky box
   wherever the current scroll offset put it: first over the text in the band
   above the last viewport (the headroom header), then — with those boxes
   hidden — under nothing at all, so text over a fixed ground was measured
   against the page behind it, and text in the header was never measured. */
async function measureContrast(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  const { els, total, pinnedBoxes } = await page.evaluate(
    ([logotype, allow, cap]) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const cx = cv.getContext("2d", { willReadFrequently: true });
      const rgba = (c) => {
        cx.clearRect(0, 0, 1, 1);
        cx.fillStyle = "#000";
        cx.fillStyle = c;
        cx.fillRect(0, 0, 1, 1);
        return [...cx.getImageData(0, 0, 1, 1).data];
      };
      const tagOf = (el) => `${el.localName}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : ""}`;
      const out = [];
      const keep = [];
      let total = 0;
      const frames = [...document.querySelectorAll("iframe")].map((f) => f.getBoundingClientRect());
      for (const el of document.body.querySelectorAll("*")) {
        if (el.closest("script, style, noscript, template, svg, [aria-hidden='true']")) continue;
        if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden") continue;
        let op = 1;
        let pinnedBox = null;
        for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
          const as = getComputedStyle(a);
          op *= parseFloat(as.opacity);
          if (as.position === "fixed" || as.position === "sticky") pinnedBox = a;
        }
        if (op < 0.05) continue;
        /* 2026-09-16 — WHEN A PINNED BOX IS MEASURABLE. The rule below exists
           because the ground under a fixed or sticky box changes as the page
           scrolls, so no one capture shows what its text sits on. That does not
           hold when an OPAQUE background travels with the text: the first
           element from the text up to and including the pinned box whose own
           background-color is fully opaque (alpha 1) IS the ground, at every
           scroll position — and it moves with the text, so the pixels under the
           text are the same wherever the page is. Any ancestor opacity below 1
           disqualifies it: then what shows through is the page behind, which
           does change. A transparent or semi-transparent pinned box still
           fails, exactly as before. */
        let opaqueGround = "";
        if (pinnedBox && op === 1)
          for (let a = el; a; a = a.parentElement) {
            const bg = getComputedStyle(a).backgroundColor;
            const px = rgba(bg);
            if (px[3] === 255) {
              opaqueGround = tagOf(a);
              break;
            }
            if (a === pinnedBox) break;
          }
        total++;
        if (out.length >= cap) continue;
        /* text scrolled out of view inside a carousel is not on screen at all */
        let clipped = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          if (!/(hidden|clip|auto|scroll)/.test(getComputedStyle(a).overflowX + getComputedStyle(a).overflowY)) continue;
          const c = a.getBoundingClientRect();
          if (r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1) clipped = true;
        }
        const clipText = s.backgroundClip === "text" || s.webkitBackgroundClip === "text";
        const fill = s.webkitTextFillColor;
        const color = rgba(fill && fill !== "rgba(0, 0, 0, 0)" && fill !== s.color ? fill : s.color);
        /* an embedded frame (Calendly) paints over whatever sits beneath it */
        const underFrame = frames.some((f) => f.width && r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top);
        keep.push(el);
        /* sample the content box only: a chip's own border is not the ground under its text */
        const inset = (side) => parseFloat(s[`border${side}Width`]) + parseFloat(s[`padding${side}`]);
        const x0 = r.left + inset("Left");
        const y0 = r.top + inset("Top");
        out.push({
          logotype: !!el.closest(logotype),
          dx: inset("Left"),
          dy: inset("Top"),
          x: x0 + scrollX,
          y: y0 + scrollY,
          w: Math.max(1, r.width - inset("Left") - inset("Right")),
          h: Math.max(1, r.height - inset("Top") - inset("Bottom")),
          color,
          op,
          pinned: pinnedBox ? tagOf(pinnedBox) : "",
          allowed: Boolean(pinnedBox && (pinnedBox.matches(allow) || opaqueGround)),
          opaqueGround,
          clipped,
          underFrame,
          clipText,
          size: parseFloat(s.fontSize),
          weight: parseInt(s.fontWeight, 10) || 400,
          text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
        });
      }
      window.__vsKeep = keep;
      const pinnedBoxes = [...document.body.querySelectorAll("*")]
        .filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position) && e.getClientRects().length)
        .map((e) => `${tagOf(e)}${e.matches(allow) ? " (allowlisted)" : ""}`);
      return { els: out, total, pinnedBoxes };
    },
    [LOGOTYPE, PINNED_ALLOW, CONTRAST_CAP],
  );
  /* In a cascade layer: a layered !important beats every unlayered !important,
     whatever its specificity — a page's `.x { color: … !important }` no longer
     keeps its text painted into the capture, to be read back as its own ground */
  const style = await page.addStyleTag({
    content:
      "@layer vs-capture{*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important;transition:none!important;pointer-events:auto!important}}",
  });
  await page.waitForTimeout(250);
  const { vh, docH } = await page.evaluate(() => ({ vh: innerHeight, docH: document.documentElement.scrollHeight }));
  const steps = [];
  for (let y = 0; ; y += Math.max(1, Math.floor(vh / 2))) {
    const s = Math.min(y, Math.max(0, docH - vh));
    if (!steps.includes(s)) steps.push(s);
    if (s >= docH - vh) break;
  }
  /* each element's sample points, in document pixels */
  const grid = els.map((e) => {
    const pts = [];
    const nx = Math.min(24, Math.max(2, Math.floor(e.w / 6)));
    const ny = Math.min(8, Math.max(2, Math.floor(e.h / 6)));
    for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < ny; iy++) pts.push([Math.floor(e.x + ((ix + 0.5) * e.w) / nx), Math.floor(e.y + ((iy + 0.5) * e.h) / ny)]);
    return pts;
  });
  const got = grid.map((g) => new Array(g.length).fill(null));
  const coveredSeen = els.map(() => 0);
  const movedSeen = els.map(() => 0);
  for (const y of steps) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, left: 0, behavior: "instant" }), y);
    await page.waitForTimeout(300);
    /* where each element is now, and what part of it a fixed or sticky box
       covers: one ON TOP of it, by a hit test in the middle of the overlap —
       a fixed box under the text is its ground, not a cover */
    const view = await page.evaluate(() => {
      const pinned = [...document.body.querySelectorAll("*")].filter((p) => {
        const s = getComputedStyle(p);
        return (s.position === "fixed" || s.position === "sticky") && s.visibility === "visible" && p.getClientRects().length;
      });
      const at = (window.__vsKeep || []).map((el) => {
        if (!el.isConnected) return null;
        const r = el.getBoundingClientRect();
        const covers = [];
        for (const p of pinned) {
          if (p.contains(el)) continue;
          const q = p.getBoundingClientRect();
          const l = Math.max(r.left, q.left);
          const t = Math.max(r.top, q.top);
          const rr = Math.min(r.right, q.right);
          const b = Math.min(r.bottom, q.bottom);
          if (rr - l < 1 || b - t < 1) continue;
          const hit = document.elementFromPoint((l + rr) / 2, (t + b) / 2);
          if (hit && (hit === p || p.contains(hit)) && !el.contains(hit)) covers.push({ x: l + scrollX, y: t + scrollY, w: rr - l, h: b - t });
        }
        return { x: r.left + scrollX, y: r.top + scrollY, covers };
      });
      return { sy: scrollY, at };
    });
    const png = PNG.sync.read(await page.screenshot());
    for (const [i, e] of els.entries()) {
      if (e.logotype || e.clipText || e.clipped || e.underFrame || (e.pinned && !e.allowed)) continue;
      /* the header's text: from the capture at the top only, where it rests */
      if (e.pinned && !e.opaqueGround && view.sy !== 0) continue;
      const v = view.at[i];
      if (!v) continue;
      /* A PINNED BOX WITH ITS OWN OPAQUE GROUND MOVES, and that is the point:
         its background travels with its text, so the pixels under the text are
         the same wherever the page is. Its samples are taken from where it is
         NOW, at each capture — the document-position test below would call
         every sticky box "moved while measuring" and measure nothing. */
      const moved = Math.abs(v.x - (e.x - e.dx)) > 1 || Math.abs(v.y - (e.y - e.dy)) > 1;
      if (moved && !(e.pinned && e.opaqueGround)) {
        movedSeen[i]++;
        continue;
      }
      const points =
        e.pinned && e.opaqueGround
          ? grid[i].map(([px, py]) => [Math.round(px - (e.x - e.dx) + v.x + e.dx), Math.round(py - (e.y - e.dy) + v.y + e.dy)])
          : grid[i];
      points.forEach(([px, py], k) => {
        if (got[i][k]) return;
        const vy = py - view.sy;
        if (px < 0 || vy < 0 || px >= png.width || vy >= png.height) return;
        if (v.covers.some((c) => px >= c.x && px < c.x + c.w && py >= c.y && py < c.y + c.h)) {
          coveredSeen[i]++;
          return;
        }
        const o = (vy * png.width + px) * 4;
        got[i][k] = [png.data[o], png.data[o + 1], png.data[o + 2]];
      });
    }
  }
  /* the page as it was: check 8 reads it next, and hit-tests its chips */
  await style.evaluate((s) => s.remove());
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  const res = { measured: 0, unmeasured: [], fails: [], pinnedBoxes, total, cap: CONTRAST_CAP, outside: [], onPinned: [], covered: [], captures: steps.length };
  for (const [i, e] of els.entries()) {
    if (e.pinned && !e.allowed) {
      res.outside.push({ text: e.text, box: e.pinned });
      continue;
    }
    if (e.pinned && e.opaqueGround) res.onPinned.push({ text: e.text, box: e.pinned, ground: e.opaqueGround });
    const why = e.logotype ? "the wordmark (WCAG 1.4.3 logotype)" : e.clipText ? "gradient text" : e.clipped ? "scrolled out of view in a container" : e.underFrame ? "under an embedded frame" : "";
    if (why) {
      res.unmeasured.push({ text: e.text, why });
      continue;
    }
    const bgs = got[i].filter(Boolean);
    if (!bgs.length) {
      if (coveredSeen[i]) res.covered.push({ text: e.text });
      else if (movedSeen[i]) res.unmeasured.push({ text: e.text, why: "moved while measuring" });
      continue; /* off the page: a skip link parked above it until focused */
    }
    const a = (e.color[3] / 255) * e.op;
    /* Judged on the 10th-percentile sample: a text box over a particle field
       touches the odd bright speck, and one speck is not what the reader sees.
       A tenth of the box being too light is. */
    const samples = bgs
      .map((bg) => {
        const fg = [0, 1, 2].map((k) => a * e.color[k] + (1 - a) * bg[k]);
        return { c: contrastRatio(lum(...fg), lum(...bg)), bg };
      })
      .sort((x, y) => x.c - y.c);
    const p10 = samples[Math.floor(samples.length * 0.1)];
    res.measured++;
    const need = e.size >= 24 || (e.size >= 18.66 && e.weight >= 700) ? 3 : 4.5;
    if (p10.c < need) res.fails.push({ text: e.text, ratio: +p10.c.toFixed(2), need, color: e.color, bg: p10.bg, pinned: e.pinned });
  }
  return res;
}

/* 6, 7 ── one route at one sweep width */
async function visitWidth(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
  const page = await ctx.newPage();
  /* as in visit and visitNoJs: a load that never comes is a finding (check 6),
     not a crash. Unhandled, one slow load in the sweep (on a machine at load
     average 21, 2026-09-15) killed the run and every result with it. The page
     is read as far as it got. */
  let loadTimeout = null;
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 }).catch((e) => {
    loadTimeout = String(e?.message || e).split("\n")[0];
  });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const clipped = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(a).overflowX)) return true;
      return false;
    };
    const offenders = [...document.body.querySelectorAll("*")]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width || (b.right <= vw + 1 && b.left >= -1)) return false;
        const st = getComputedStyle(el);
        if (st.position === "fixed") return false;
        if (!el.textContent.trim() && (el.closest("[aria-hidden='true']") || st.pointerEvents === "none")) return false; /* decorative glow */
        return !clipped(el);
      })
      .map((el) => ({ el: `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${el.textContent.trim().replace(/\s+/g, " ").slice(0, 30)}"`, right: Math.round(el.getBoundingClientRect().right) }))
      .slice(0, 3);
    const sig = [...document.body.querySelectorAll("*")].slice(0, 4000).map((el) => {
      const st = getComputedStyle(el);
      return `${st.display}|${st.flexDirection}|${st.gridTemplateColumns.split(" ").length}`;
    });
    return { overflowX: document.documentElement.scrollWidth - vw, offenders, sig };
  });
  r.headline = route === "/" ? await page.evaluate(headlineLines) : null;
  r.loadTimeout = loadTimeout;
  await ctx.close();
  return r;
}

/* 19 ── Tab through the page; each stop must look different focused vs not */
async function visitFocus(browser, route) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await readingSpeedScroll(page);
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}canvas,iframe{visibility:hidden!important}" });
  await page.waitForTimeout(600);
  const stops = [];
  const seen = new Set();
  for (let n = 0; n < 45; n++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (!el.dataset.vsFocus) el.dataset.vsFocus = String(Math.random()).slice(2);
      const r = el.getBoundingClientRect();
      let op = 1;
      for (let a = el; a && a.nodeType === 1; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
      const label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return { id: el.dataset.vsFocus, desc: `${el.tagName.toLowerCase()} "${label}"`, x: r.left, y: r.top, w: r.width, h: r.height, op };
    });
    if (!info || seen.has(info.id)) break; /* left the page, or wrapped round */
    seen.add(info.id);
    if (info.w < 1 || info.h < 1 || info.op < 0.05) {
      const recheck = await page.evaluate(async (id) => {
        const el = document.querySelector(`[data-vs-focus="${id}"]`);
        el.scrollIntoView({ block: "center" });
        await new Promise((r) => setTimeout(r, 1500));
        const r = el.getBoundingClientRect();
        let op = 1;
        for (let a = el; a && a.nodeType === 1; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
        return r.width >= 1 && r.height >= 1 && op >= 0.05;
      }, info.id);
      if (!recheck) stops.push({ ...info, visibleFocus: false, why: "focus lands on something you cannot see" });
      else stops.push({ ...info, visibleFocus: true, why: "" });
      continue;
    }
    const vp = page.viewportSize();
    const pad = 6;
    const clip = { x: Math.max(0, info.x - pad), y: Math.max(0, info.y - pad) };
    clip.width = Math.min(vp.width - clip.x, info.w + 2 * pad);
    clip.height = Math.min(vp.height - clip.y, info.h + 2 * pad);
    if (clip.width < 1 || clip.height < 1) {
      stops.push({ ...info, visibleFocus: false, why: "off screen while focused" });
      continue;
    }
    const focused = PNG.sync.read(await page.screenshot({ clip }));
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(40);
    const blurred = PNG.sync.read(await page.screenshot({ clip }));
    await page.evaluate((id) => document.querySelector(`[data-vs-focus="${id}"]`)?.focus(), info.id);
    let diff = 0;
    for (let k = 0; k < focused.data.length; k += 4) {
      if (Math.abs(focused.data[k] - blurred.data[k]) + Math.abs(focused.data[k + 1] - blurred.data[k + 1]) + Math.abs(focused.data[k + 2] - blurred.data[k + 2]) > 30) diff++;
    }
    stops.push({ ...info, visibleFocus: diff >= 8, why: diff >= 8 ? "" : "no visible change when focused" });
  }
  await ctx.close();
  return stops;
}

/* 19 (A1) ── WCAG 2.2 SC 2.4.11, Focus Not Obscured (Minimum): Shift+Tab BACK up
   the page, from its last stop. The browser scrolls a stop above the viewport
   only to the viewport's top edge, and the headroom header, pinned again by the
   upward scroll, sits over it — a FAQ question under the 80px header at / @390,
   "← All work" under the 92px one on /work/warmchats @1440 and @768 (found
   2026-09-15). Tabbing forward never shows it: focus moving down lands at the
   viewport's bottom edge. A stop fails when no part of it can be seen — hit-
   tested at 15 points, anything fixed or sticky on top counts as a cover.
   Reduced motion, so the scroll and the header's slide are instant; iframes are
   hidden, as in the forward pass (Calendly's own stops are not this site's). */
const FOCUS_BACK_WIDTHS = [1440, 768, 390];
async function visitFocusBack(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: "iframe{visibility:hidden!important}*,*::before,*::after{pointer-events:auto!important}" });
  await readingSpeedScroll(page);
  await page.waitForTimeout(800);
  const total = await page.evaluate(() => {
    const els = [...document.querySelectorAll("a[href], button, summary, input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility === "visible");
    els.at(-1)?.focus({ preventScroll: true });
    return els.length;
  });
  await page.waitForTimeout(250);
  const stops = [];
  const seen = new Set();
  for (let n = 0; n < Math.min(90, total + 3); n++) {
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(250);
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      if (!el.dataset.vsBack) el.dataset.vsBack = String(Math.random()).slice(2);
      const r = el.getBoundingClientRect();
      const covers = [...document.body.querySelectorAll("*")].filter((c) => {
        const st = getComputedStyle(c);
        return (st.position === "fixed" || st.position === "sticky") && !c.contains(el) && st.visibility === "visible";
      });
      let seenPts = 0;
      let covered = 0;
      let by = "";
      for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9])
        for (const fy of [0.15, 0.5, 0.85]) {
          const x = r.left + r.width * fx;
          const y = r.top + r.height * fy;
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
          const top = document.elementFromPoint(x, y);
          const cover = top && !el.contains(top) && !top.contains(el) ? covers.find((c) => c.contains(top)) : null;
          if (cover) {
            covered++;
            by = `${cover.localName}${cover.id ? `#${cover.id}` : ""}`;
          } else seenPts++;
        }
      const label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return { id: el.dataset.vsBack, desc: `${el.localName} "${label}"`, seen: seenPts, covered, by, top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
    if (!s || seen.has(s.id)) break;
    seen.add(s.id);
    stops.push(s);
  }
  await ctx.close();
  return stops;
}

/* 21 ── reduced motion requested: what is still moving */
async function visitReduced(browser, route) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await readingSpeedScroll(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500);
  const anims = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running")
      .map((a) => {
        const t = a.effect?.getTiming?.() || {};
        const el = a.effect?.target;
        const cls = el && typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "";
        return { name: a.animationName || a.transitionProperty || "script animation", infinite: t.iterations === Infinity, el: el ? `${el.tagName.toLowerCase()}${cls}` : "" };
      }),
  );
  const canvases = await page.$$("canvas");
  let canvasMoving = null;
  if (canvases.length) {
    const box = await canvases[0].boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      const a = await page.screenshot({ clip: box });
      await page.waitForTimeout(700);
      canvasMoving = !a.equals(await page.screenshot({ clip: box }));
    }
  }
  const n = canvases.length;
  await ctx.close();
  return { anims, canvasMoving, canvases: n };
}

/* 23 ── a full-page capture with every time-driven thing pinned */
async function stableCapture(browser, route) {
  /* reduced motion pins what CSS cannot: framer loops that honour it. Anything
     still differing is either non-deterministic or ignores reduced motion. */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await readingSpeedScroll(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500); /* count-ups (~1.1s) and reveals (<1s) finish */
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}canvas,iframe{visibility:hidden!important}" });
  await page.waitForTimeout(400);
  /* 2026-09-16, the hero's 3D scene: it never mounts under reduced motion
     (check 25 fails one that does), and a canvas is hidden here in any case —
     so the live scene cannot reach these captures, and pinning it (a bf:motion
     pause) is not needed. What the page held is recorded, so that stays seen. */
  const scene = await page.evaluate(() => ({ canvases: document.querySelectorAll("canvas").length, ready: Boolean(document.querySelector("[data-scene-ready]")) }));
  const png = PNG.sync.read(await page.screenshot({ fullPage: true }));
  png.scene = scene;
  await ctx.close();
  return png;
}
function comparePng(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { sizeDiffers: `${a.width}×${a.height} vs ${b.width}×${b.height}` };
  let n = 0;
  let minY = Infinity;
  let maxY = -1;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) {
      n++;
      const y = Math.floor(i / 4 / a.width);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { n, pct: (100 * n) / (a.width * a.height), minY, maxY };
}

/* The settle steps before a visit is read: every image decoded, every font
   loaded. BOUNDED — a wait that never ends is not a pass. On the merged state
   (2026-09-15) the image wait never returned at / @390 in two full runs, with
   the suite at 0% CPU for 38 minutes; unbounded, whatever was still loading
   hid behind a hang. Each wait gets SETTLE_MS inside the page, and the page
   twice that to answer at all. What is still loading is returned, and checks
   10 (images) and 2 (fonts) fail on it, naming it. */
const SETTLE_MS = 20000;
async function settle(page, what) {
  const inPage = page.evaluate(
    ([kind, ms]) => {
      const late = (p, name) => Promise.race([p.then(() => null, () => null), new Promise((r) => setTimeout(() => r(name), ms))]);
      if (kind === "fonts")
        return late(document.fonts.ready, "late").then((x) => {
          if (!x) return [];
          const loading = [...document.fonts].filter((f) => f.status === "loading").map((f) => `${f.family.replace(/["']/g, "")} ${f.weight}`);
          return loading.length ? loading : ["document.fonts.ready never resolved"];
        });
      return Promise.all([...document.images].map((i) => (i.complete ? null : late(i.decode(), (i.currentSrc || i.src).replace(location.origin, ""))))).then((xs) => xs.filter(Boolean));
    },
    [what, SETTLE_MS],
  );
  const answer = await Promise.race([inPage, new Promise((r) => setTimeout(() => r(null), 2 * SETTLE_MS))]);
  return answer === null ? [`(the page did not answer for ${(2 * SETTLE_MS) / 1000}s while the suite waited for its ${what})`] : answer;
}

/* ── one route at one width, JavaScript on ───────────────────────────────── */
async function visit(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, bypassCSP: true });
  await ctx.addInitScript(glHook, workerGlHook.toString()); /* check 25: this frame, every iframe, blob workers */
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const failed = [];
  page.on("console", (m) => {
    if (m.type() === "error" || (m.type() === "warning" && /hydrat/i.test(m.text()))) consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 240), src: m.location()?.url || "" });
  });
  page.on("pageerror", (e) => consoleMsgs.push({ type: "pageerror", text: String(e.message).slice(0, 240), src: "" }));
  page.on("requestfailed", (r) => failed.push({ url: r.url(), why: r.failure()?.errorText || "failed" }));
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push({ url: r.url(), why: `HTTP ${r.status()}` });
  });

  /* as in visitNoJs: a load that never comes is a finding (check 22), not a crash */
  let loadTimeout = null;
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 }).catch((e) => {
    loadTimeout = String(e?.message || e).split("\n")[0];
  });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const stalled = { images: [], fonts: [] };
  stalled.fonts.push(...(await settle(page, "fonts")));
  await readingSpeedScroll(page);
  stalled.images.push(...(await settle(page, "images")));
  stalled.fonts.push(...(await settle(page, "fonts")));
  await page.waitForTimeout(800);

  await page.waitForTimeout(1700); /* reveals that fired at the end of the scroll finish */
  const glData = await page.evaluate(glReport); /* before the contrast pass draws its own canvas */
  glData.frames = await readFrameGl(page);
  const data = await page.evaluate(collectInPage);
  data.glData = glData;
  data.stalled = stalled;
  data.loadTimeout = loadTimeout;
  /* check 5: a candidate is only "stuck" if it is still invisible after three
     more seconds IN PLACE — that rules out a reveal still in progress on a busy
     machine. Do NOT scroll it into view to re-check: that fires the very reveal
     under test. An earlier version did, and passed the Featured work heading,
     which stays invisible after a reading-speed scroll in 5 of 6 passes. */
  if (data.stuckHidden.length) {
    const still = [];
    for (const c of data.stuckHidden) {
      const hidden = await page.evaluate(async (text) => {
        const el = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,td,th,a,button,label,span")].find((e) => e.textContent.trim().replace(/\s+/g, " ").startsWith(text));
        if (!el) return false;
        await new Promise((r) => setTimeout(r, 3000));
        for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
          const st = getComputedStyle(a);
          if (parseFloat(st.opacity) < 0.05 || st.visibility === "hidden") return true;
        }
        return false;
      }, c.text);
      if (hidden) still.push(c);
    }
    data.stuckHidden = still;
  }

  /* which platform font actually painted each stamped element */
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-vs-t]" });
  data.rendered = [];
  for (let i = 0; i < nodeIds.length; i++) {
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId: nodeIds[i] }).catch(() => ({ fonts: [] }));
    const top = [...fonts].sort((a, b) => b.glyphCount - a.glyphCount)[0];
    data.rendered.push({ ...data.stampedInfo[i], painted: top?.familyName || "?", custom: !!top?.isCustomFont });
  }
  delete data.stampedInfo;

  /* 18 ── axe-core, serious and critical only */
  if (want(18)) {
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    Object.assign(
      data,
      await page.evaluate(async (logotype) => {
        const r = await window.axe.run(document, { resultTypes: ["violations"] });
        /* the logotype exemption (see LOGOTYPE): color-contrast only, wordmark nodes only */
        const inLogotype = (n) => {
          if (n.target.length !== 1 || typeof n.target[0] !== "string") return false;
          try {
            return !!document.querySelector(n.target[0])?.closest(logotype);
          } catch {
            return false;
          }
        };
        let axeExempt = 0;
        const axe = r.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => {
            const nodes = v.id !== "color-contrast" ? v.nodes : v.nodes.filter((n) => (inLogotype(n) ? (axeExempt++, false) : true));
            return { id: v.id, impact: v.impact, help: v.help, nodes: nodes.length, sample: nodes.slice(0, 2).map((n) => n.target.join(" ")) };
          })
          .filter((v) => v.nodes > 0);
        const textOf = (el) => {
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          const parts = [];
          while (w.nextNode()) if (w.currentNode.textContent.trim()) parts.push(w.currentNode.textContent.trim());
          return parts.join(" ");
        };
        return { axe, axeExempt, logotypes: [...document.querySelectorAll(logotype)].map(textOf) };
      }, LOGOTYPE),
    );
  }
  /* 20 ── last, because it repaints the page */
  if (want(20)) data.contrast = await measureContrast(page);

  /* 8 ── last, because it changes the page (readFiguresIn) */
  if (want(8)) data.figures = await readFiguresIn(page);

  data.console = consoleMsgs;
  data.failed = failed;
  await ctx.close();
  return data;
}

/* 8 ── the figures on a page already scrolled at reading speed. Last, because it
   changes the page. Every <details> is opened: its answer is page content. They
   share a `name`, and opening one closes the others, so the name goes first.
   Each is brought into view, so anything that reveals on entry inside it has
   played before the text is read. readFigures is evaluated with the grammar,
   tokenizeFigures, as its argument. */
async function readFiguresIn(page) {
  const opened = await page.evaluate(() => {
    const all = [...document.querySelectorAll("details")];
    for (const d of all) {
      d.removeAttribute("name");
      d.open = true;
    }
    return all.length;
  });
  if (opened) {
    await page.evaluate(async () => {
      for (const d of document.querySelectorAll("details")) {
        d.scrollIntoView({ block: "center" });
        await new Promise((r) => setTimeout(r, 150));
      }
    });
    await page.waitForTimeout(1700);
  }
  return page.evaluate(`(${readFigures.toString()})(${tokenizeFigures.toString()})`).catch((e) => ({ error: String(e?.message || e).slice(0, 200) }));
}

/* 8 (K9) ── the figures at a width the full visits do not cover: 768 and 1024,
   where the tablet layout can show text that neither 390 nor 1440 shows. A fresh
   page, its fonts settled, one reading-speed scroll, then readFiguresIn. */
async function visitFigures(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, bypassCSP: true });
  const page = await ctx.newPage();
  let loadTimeout = null;
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 }).catch((e) => {
    loadTimeout = String(e?.message || e).split("\n")[0];
  });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await settle(page, "fonts");
  await readingSpeedScroll(page);
  await page.waitForTimeout(2500);
  const figures = await readFiguresIn(page);
  await ctx.close();
  return { figures, loadTimeout };
}

/* 14 (FAQ) — the FAQPage structured data is the FAQ the page renders:
     · every question and answer is in the SERVED HTML — what a crawler reads,
       with scripts stripped, because the RSC payload repeats the content and
       must not count. A check that clicks and reads the DOM cannot see this;
     · the page renders the same questions, with the same answers once opened;
     · each question tells assistive technology whether it is open — read from
       Chrome's accessibility tree, before and after opening. */
async function visitFaq(browser) {
  const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
  const decode = (s) =>
    s
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  const raw = await (await fetch(`${BASE}/`)).text();
  const served = norm(
    decode(
      raw
        .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<[^>]+>/g, " "),
    ),
  );
  const ctx = await browser.newContext({ viewport: { width: WIDTHS[0], height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const ld = [];
  for (const block of await page.$$eval('script[type="application/ld+json"]', (ss) => ss.map((x) => x.textContent))) {
    let j;
    try {
      j = JSON.parse(block);
    } catch {
      continue; /* reported by check 14's parse */
    }
    for (const n of Array.isArray(j) ? j : j["@graph"] || [j])
      if ([].concat(n["@type"]).includes("FAQPage"))
        for (const q of [].concat(n.mainEntity || [])) ld.push({ q: norm(q.name), a: norm(q.acceptedAnswer?.text) });
  }
  const CONTROLS = "[data-vs-faq] summary, [data-vs-faq] button";
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Accessibility.enable");
  const expanded = async (i) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: CONTROLS });
    if (!nodeIds[i]) return undefined;
    const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { nodeId: nodeIds[i], fetchRelatives: false });
    const p = (nodes[0]?.properties || []).find((x) => x.name === "expanded");
    return p ? Boolean(p.value.value) : undefined;
  };
  let rendered = null;
  if (ld.length) {
    /* the FAQ section is the one holding a control that asks any FAQPage question */
    const questions = await page.evaluate((qs) => {
      const n = (s) => s.replace(/\s+/g, " ").trim();
      const sec = [...document.querySelectorAll("summary, button")].find((x) => qs.includes(n(x.textContent)))?.closest("section");
      if (!sec) return null;
      sec.setAttribute("data-vs-faq", "");
      return [...sec.querySelectorAll("summary, button")].map((x) => n(x.textContent));
    }, ld.map((x) => x.q));
    if (questions) {
      rendered = [];
      for (let i = 0; i < questions.length; i++) {
        const ctl = page.locator("[data-vs-faq] :is(summary, button)").nth(i);
        let a = null;
        let before;
        let after;
        try {
          await ctl.evaluate((el) => el.scrollIntoView({ block: "center" }));
          before = await expanded(i);
          await ctl.click({ timeout: 5000 });
          await page.waitForTimeout(400);
          after = await expanded(i);
          a = await ctl.evaluate((b) => {
            const n = (s) => s.replace(/\s+/g, " ").trim();
            const all = n(b.parentElement.textContent);
            const q = n(b.textContent);
            return all.startsWith(q) ? all.slice(q.length).trim() : null;
          });
        } catch {
          /* a question that cannot be opened is reported as having no answer */
        }
        rendered.push({ q: questions[i], a, before, after });
      }
    }
  }
  await ctx.close();
  return { ld, rendered, served };
}

async function visitNoJs(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  /* A page that never reaches "load" is a finding (check 4), not a crash.
     Without script, lazy images and frames load eagerly, so one resource that
     never finishes holds "load" back; unhandled, it killed the whole run on
     the merged state (2026-09-15) and nothing was reported. The page is read
     as far as it got. */
  let loadTimeout = null;
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 }).catch((e) => {
    loadTimeout = String(e?.message || e).split("\n")[0];
  });
  /* A CSS entrance runs without script and ends visible; judge the page once
     every such animation has finished, not in the middle of one. */
  /* ...waiting from outside the page: with scripts off, an in-page timer never
     fires, and the infinite loops on the page never finish. The longest entrance
     on this site is 1.6s. */
  await page.waitForTimeout(2500);
  /* ...and scroll it once at reading speed, as a reader without script would:
     sections with content-visibility: auto render — and run their entrances —
     only when they come near the viewport. Driven from outside the page, since
     page timers do not run with scripts off. */
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= docH; y += 100) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1200);
  const r = await page.evaluate(hiddenWithoutJs);
  r.loadTimeout = loadTimeout;
  await ctx.close();
  return r;
}

/* 31 (the 404) ── an unknown URL must answer 404 with the site's own page: its
   header, one h1 and a stylesheet of the one design. Fetched, not rendered:
   the status and the served markup are what a visitor and a crawler get. */
async function probeNotFound() {
  const path = `/verify-site-no-such-page-${Date.now().toString(36)}`;
  const r = await fetch(BASE + path, { redirect: "manual" });
  const html = await r.text();
  const hrefs = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (!/\brel=["']?stylesheet\b/i.test(tag)) continue;
    const m = /\bhref=["']([^"']+)["']/i.exec(tag);
    if (m) hrefs.push(m[1]);
  }
  const sheets = [];
  for (const h of hrefs) {
    const css = (await http(toBase(new URL(h, BASE).toString()))).text || "";
    sheets.push({
      href: h,
      design: /\.bf-(header|wrap|hero|main)(?![\w-])/.test(css),
      retiredTw: /\.tw-(root|hero|header)(?![\w-])/.test(css),
      retired: /\.(beam-button|corner-glow|cv-section|grain-overlay|logo-chip-breathe|logo-jewel-aurora|faq-item)\b|\[data-reveal\b/.test(css),
      tailwind: /--tw-/.test(css),
    });
  }
  /* the Techwix design's classes in the 404's markup (31), and "Book a call" anywhere in it (32) */
  const twMarkup = [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => /^tw-/.test(c));
  const book = BOOK_A_CALL.exec(decodeEntities(html));
  return { path, status: r.status, masthead: /<header\b[^>]*\bid="masthead"/i.test(html), h1: (html.match(/<h1\b/gi) || []).length, sheets, twMarkup: [...new Set(twMarkup)], bookCall: book ? decodeEntities(html).slice(Math.max(0, book.index - 40), book.index + 60).replace(/\s+/g, " ") : null };
}

/* 8 (K10) ── the llms files: /llms.txt, /llms-full.txt and any other .txt the
   first links to. An AI reads these as the site's own account of itself. */
async function fetchLlms() {
  const files = ["/llms.txt", "/llms-full.txt"];
  const first = await http(`${BASE}/llms.txt`);
  for (const m of (first.text || "").matchAll(/\]\((\/[^)\s]+\.txt)\)/g)) if (!files.includes(m[1])) files.push(m[1]);
  const out = [];
  for (const f of files) {
    const r = await http(BASE + f);
    out.push({ file: f, status: r.status || r.error, text: r.text || "" });
  }
  return out;
}

/* ── run ─────────────────────────────────────────────────────────────────── */
const started = new Date();
const sm = await http(`${BASE}/sitemap.xml`);
const smXml = sm.status === 200 ? await (await fetch(`${BASE}/sitemap.xml`)).text() : "";
const ROUTES = [...smXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (!ROUTES.length) {
  console.error(`No routes: ${BASE}/sitemap.xml returned ${sm.status}.`);
  process.exit(2);
}

/* The browser every check but 25 uses, with no GPU flags: check 23's full-page
   captures failed with "Unable to capture screenshot" when the SwiftShader
   flags below were on this one (2026-09-16), and a pixel check that cannot
   capture is a failure, not a pass. The WebGL runs get their own browser. */
const browser = await chromium.launch();
/* 25 (2026-09-16): WebGL through ANGLE's SwiftShader, as the scene's own probes
   launch it (engineering/probe-b), so the hero's scene can really draw in a
   headless browser and its positive case is tested, not assumed. The flags make
   WebGL AVAILABLE; they change nothing a page decides — every "never" profile is
   judged by what the page requests, granted or not. */
const GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

/* 29 runs first, before anything else loads the machine or the browser. One
   unthrottled load warms the server; it is not measured. */
const perfRuns = {};
const perfLoad = { before: os.loadavg()[0], after: 0 };
if (want(29)) {
  process.stderr.write("  performance: one unmeasured load to warm the server\n");
  const warm = await browser.newContext();
  await (await warm.newPage()).goto(`${BASE}/`, { waitUntil: "load", timeout: 120000 }).catch(() => {});
  await warm.close();
  for (const [name, prof] of Object.entries(PERF_PROFILES)) {
    perfRuns[name] = [];
    for (let i = 0; i < PERF_RUNS; i++) {
      process.stderr.write(`  performance ${name} ${i + 1}/${PERF_RUNS}\n`);
      perfRuns[name].push(await perfRun(browser, prof).catch((e) => ({ error: String(e?.message || e).slice(0, 200) })));
    }
  }
  perfLoad.after = os.loadavg()[0];
}
/* 29 (2026-09-16) ── every same-site script the performance runs requested, by
   what its code is: the hero's scene (three.js, or a script that asks for a
   WebGL context) is imported after load and never counts as initial
   JavaScript — and one requested before the load event is a failure */
const perfKinds = new Map();
for (const r of Object.values(perfRuns).flat())
  for (const s of r.scripts || [])
    if (isSameSite(s.url) && !perfKinds.has(s.url)) {
      const t = (await http(toBase(s.url))).text || "";
      perfKinds.set(s.url, { scene: THREE_CODE.test(t) || GL_CALL_CODE.test(t) || REACT_THREE_CODE.test(t), gz: gzipSync(Buffer.from(t)).length });
    }
let heroRun = null;
const lcpRuns = [];
if (want(28)) {
  process.stderr.write("  hero: the served HTML against the rendered hero\n");
  heroRun = await visitHero(browser).catch((e) => ({ error: String(e?.message || e).slice(0, 200) }));
  for (const prof of LCP_PROFILES) {
    process.stderr.write(`  LCP on / ${prof.label}\n`);
    lcpRuns.push(await visitLcp(browser, prof).catch((e) => ({ ...prof, error: String(e?.message || e).slice(0, 200) })));
  }
}

const visits = {};
const noJs = {};
for (const route of ROUTES)
  for (const w of WIDTHS) {
    process.stderr.write(`  visiting ${route} @${w}\n`);
    visits[`${route}@${w}`] = await visit(browser, route, w);
    if (want(4)) noJs[`${route}@${w}`] = await visitNoJs(browser, route, w);
  }
/* 8 (K9) ── the figures at the tablet widths the full visits do not cover */
const figRuns = {};
if (want(8))
  for (const route of ROUTES)
    for (const w of FIGURE_WIDTHS.filter((x) => !WIDTHS.includes(x))) {
      process.stderr.write(`  reading figures ${route} @${w}\n`);
      figRuns[`${route}@${w}`] = await visitFigures(browser, route, w).catch((e) => ({ figures: { error: String(e?.message || e).split("\n")[0].slice(0, 200) }, loadTimeout: null }));
    }
const widthRuns = {};
if (want(6) || want(7))
  for (const route of ROUTES)
    for (const w of SWEEP_WIDTHS) {
      process.stderr.write(`  sweeping ${route} @${w}\n`);
      widthRuns[`${route}@${w}`] = await visitWidth(browser, route, w);
    }
/* 25 ── the WebGL runs. The visits above carry the hook at WIDTHS; this adds
   every route at the GL_WIDTHS they did not cover, / as a phone, and / under
   reduced motion at every GL width. */
const glRuns = {};
if (want(25)) {
  /* K7/H3: every route at every GL width with the full hooks and a first input
     (the visits above carry only the frame hook); / as a phone, at 1024, as a
     touch tablet at 1180x820 and 1366x1024, with Save-Data, and under reduced
     motion */
  const plan = [];
  /* / at every GL width; every other route at the one width the visits miss
     (the visits carry the frame and blob-worker hooks, not the input) */
  for (const route of ROUTES) for (const w of GL_WIDTHS) if (route === "/" || !WIDTHS.includes(w)) plan.push([route, { width: w, label: `${route} @${w} (first input)` }]);
  plan.push(["/", { width: 390, phone: true, label: "/ @390 phone (touch, 3x DPR)" }]);
  for (const p of GL_EXTRA) plan.push(["/", p]);
  for (const w of GL_WIDTHS) plan.push(["/", { width: w, reduced: true, label: `/ @${w} reduced motion` }]);
  /* its own browser, with the SwiftShader flags: the scene must be able to draw
     here, and these flags stay off every other check's browser */
  const glBrowser = await chromium.launch({ args: GL_ARGS });
  for (const [route, prof] of plan) {
    process.stderr.write(`  webgl ${prof.label}\n`);
    glRuns[prof.label] = { route, ...prof, ...(await visitGl(glBrowser, route, prof).catch((e) => ({ gl: null, scripts: [], error: String(e?.message || e).slice(0, 160) }))) };
  }
  await glBrowser.close();
}
const focusRuns = {};
if (want(19))
  for (const route of ROUTES) {
    process.stderr.write(`  tabbing through ${route}\n`);
    /* a run that dies is a finding (check 19), not a crash of the whole suite */
    focusRuns[route] = await visitFocus(browser, route).catch((e) => ({ error: String(e?.message || e).split("\n")[0].slice(0, 200) }));
  }
const focusBackRuns = {};
if (want(19))
  for (const route of ROUTES)
    for (const w of FOCUS_BACK_WIDTHS) {
      process.stderr.write(`  tabbing backwards through ${route} @${w}\n`);
      focusBackRuns[`${route}@${w}`] = await visitFocusBack(browser, route, w).catch((e) => ({ error: String(e?.message || e).split("\n")[0].slice(0, 200) }));
    }
const reducedRuns = {};
if (want(21))
  for (const route of ROUTES) {
    process.stderr.write(`  reduced motion ${route}\n`);
    reducedRuns[route] = await visitReduced(browser, route).catch((e) => ({ error: String(e?.message || e).split("\n")[0].slice(0, 200) }));
  }
const detRuns = {};
if (want(23))
  for (const route of ROUTES) {
    process.stderr.write(`  capturing ${route} twice\n`);
    detRuns[route] = await (async () => {
      const a = await stableCapture(browser, route);
      const b = await stableCapture(browser, route);
      return { ...comparePng(a, b), canvases: Math.max(a.scene.canvases, b.scene.canvases), sceneReady: a.scene.ready || b.scene.ready };
    })().catch((e) => ({
      error: String(e?.message || e).split("\n")[0].slice(0, 200),
    }));
  }
let faqRun = null;
if (want(14)) {
  process.stderr.write("  opening every FAQ answer on /\n");
  faqRun = await visitFaq(browser).catch((e) => ({ error: String(e?.message || e).split("\n")[0].slice(0, 200) }));
}
await browser.close();
let notFoundRun = null;
if (want(31) || want(32)) {
  process.stderr.write("  an unknown URL, for the 404\n");
  notFoundRun = await probeNotFound().catch((e) => ({ error: String(e?.message || e).slice(0, 200) }));
}
let llmsRun = null;
if (want(8) || want(12) || want(32)) {
  process.stderr.write("  the llms files, for figures\n");
  llmsRun = await fetchLlms().catch((e) => ({ error: String(e?.message || e).slice(0, 200) }));
}

const results = [];
const check = (id, title, catches, fn) => {
  if (!want(id)) return;
  const findings = [];
  const info = [];
  fn(findings, info);
  results.push({ id, title, catches, status: findings.length ? "FAIL" : "PASS", findings, info });
};
const at = (k) => k.replace("@", " @");

/* 1 */
check(1, "Every var(--x) a rendered element uses is defined, or has a fallback", "the undefined --font-heading / --font-machine tokens", (F) => {
  const byName = new Map();
  for (const [k, v] of Object.entries(visits))
    for (const u of v.undefinedUses) {
      const g = byName.get(u.name) || { uses: 0, props: new Set(), where: new Set(), routes: new Set(), samples: [] };
      g.uses++;
      g.props.add(u.prop);
      g.where.add(u.where);
      g.routes.add(k.split("@")[0]);
      if (g.samples.length < 3 && !g.samples.some((s) => s.includes(u.el))) g.samples.push(`${u.el}${u.section ? ` in ${u.section}` : ""}`);
      byName.set(u.name, g);
    }
  for (const [name, g] of [...byName].sort((a, b) => b[1].uses - a[1].uses))
    F.push(`${name} — undefined, used by ${[...g.props].join(", ")} (${[...g.where].join(", ")}) ${g.uses}× on ${[...g.routes].join(" ")}; e.g. ${g.samples.join("; ")}`);
});

/* 2 */
check(2, "Every font the layout loads renders somewhere; text uses a loaded font", "four fonts loading unused while the site renders in the system face", (F, I) => {
  const declared = new Set();
  const loaded = new Set();
  for (const v of Object.values(visits)) {
    v.fontsDeclared.forEach((f) => declared.add(f));
    v.fontsLoaded.forEach((f) => loaded.add(f));
  }
  for (const f of declared) if (!loaded.has(f)) F.push(`"${f}" is declared by the page and never renders on any route at any width`);
  const lc = (s) => s.toLowerCase();
  for (const [k, v] of Object.entries(visits)) {
    for (const s of v.stalled?.fonts || []) F.push(`${at(k)}: still loading ${SETTLE_MS / 1000}s after the page settled — ${s}`);
    const sys = v.rendered.filter((r) => !r.custom);
    const fallbackOfOwn = sys.filter((r) => [...declared].some((d) => lc(d) === lc(r.declared)));
    const plainSystem = sys.filter((r) => !fallbackOfOwn.includes(r) && !ALLOW_SYSTEM.includes(r.declared));
    if (fallbackOfOwn.length) F.push(`${at(k)}: ${fallbackOfOwn.length} element(s) ask for a web face and paint a fallback — e.g. ${fallbackOfOwn.slice(0, 2).map((r) => `${r.el} wants ${r.declared}, got ${r.painted}`).join("; ")}`);
    if (plainSystem.length) {
      const by = {};
      plainSystem.forEach((r) => (by[`${r.declared} → ${r.painted}`] = (by[`${r.declared} → ${r.painted}`] || 0) + 1));
      F.push(`${at(k)}: ${plainSystem.length} of ${v.rendered.length} text elements paint in a system face (${Object.entries(by).map(([a, n]) => `${a} ×${n}`).join(", ")}); e.g. ${plainSystem.slice(0, 2).map((r) => r.el).join("; ")}`);
    }
    I.push(`${at(k)}: fonts fetched ${v.fontFiles.length}, preloaded ${v.fontPreloads.length}, web-painted ${v.rendered.length - sys.length}/${v.rendered.length}`);
  }
});

/* 4 */
check(4, "With JavaScript off, every heading and paragraph is visible", "content that starts hidden and waits for an animation to reveal it", (F, I) => {
  for (const [k, v] of Object.entries(noJs)) {
    if (v.loadTimeout) F.push(`${at(k)}: without JavaScript the page never reached "load" (${v.loadTimeout}) — something on it never finishes loading`);
    const shown = new Set(visits[k]?.visibleTexts || []);
    const scriptOnly = v.out.filter((o) => shown.has(o.text));
    const alsoHiddenWithJs = v.out.length - scriptOnly.length;
    if (alsoHiddenWithJs) I.push(`${at(k)}: ${alsoHiddenWithJs} hidden with JS on as well (hover or state reveals — not a script dependency)`);
    if (v.skipped?.length) I.push(`${at(k)}: not read, script-only controls (type="button", no form — they do nothing without JS): ${v.skipped.map((t) => `"${t}"`).join(", ")}`);
    if (!scriptOnly.length) continue;
    const by = {};
    scriptOnly.forEach((o) => {
      const key = `${o.section ? "#" + o.section : "(no section)"} — hidden by ${o.hider}${o.style ? ` style="${o.style}"` : ""}`;
      (by[key] ||= []).push(`${o.tag} "${o.text}"`);
    });
    F.push(`${at(k)}: ${scriptOnly.length} of ${v.total} text elements are readable with JS and invisible without it`);
    for (const [key, items] of Object.entries(by)) F.push(`    ${key}: ${items.length} — e.g. ${items.slice(0, 2).join("; ")}`);
  }
});

/* 8 */
check(
  8,
  "Every figure, standalone or inside a sentence, carries its own visible shipped/target label — or an exemption that says why",
  "an unlabelled number anywhere in the text — the four in-sentence figures in the architecture lanes a standalone-only check could not see; a chip beside the wrapper or up in the section passing for the figure's own; a chip nobody can see, or one chip shared by two figures; an exemption with no real reason, or one wide enough to swallow a second figure",
  (F, I) => {
    /* the registries the page is built from (K10, K11): the in-sentence labels
       and exemptions, and the metrics */
    let registry = [];
    let metricsTs = null;
    try {
      registry = loadContent("content/figure-labels.ts").figureLabels || [];
      metricsTs = loadContent("content/metrics.ts").metrics || null;
    } catch (e) {
      F.push(`content/figure-labels.ts or content/metrics.ts could not be read (${e.message}) — the wrappers and exemptions cannot be checked against them; unsure is a failure`);
    }
    /* one line per finding, however many widths show it: a width-only one says
       so, and one that occurs more than once on the page says how often */
    const rows = new Map();
    const row = (out, key, line, width) => {
      const r = rows.get(key) || { out, line, widths: new Set(), count: {} };
      r.widths.add(width);
      r.count[width] = (r.count[width] || 0) + 1;
      rows.set(key, r);
    };
    /* the full visits at WIDTHS, and the figure reads at FIGURE_WIDTHS (K9) */
    const reads = [...Object.entries(visits).map(([k, v]) => [k, v.figures, null]), ...Object.entries(figRuns).map(([k, v]) => [k, v.figures, v.loadTimeout])];
    const widthsRead = new Set(reads.map(([k]) => k.split("@")[1]));
    for (const [k, r, loadTimeout] of reads) {
      const [route, width] = k.split("@");
      if (loadTimeout) row(F, `load|${k}`, `${at(k)}: the page never reached "load" (${loadTimeout}) — its figures were read as far as it got`, width);
      if (!r || r.error) {
        row(F, `reader|${k}`, `${at(k)}: the figure reader did not run${r?.error ? ` (${r.error})` : ""} — unsure is a failure`, width);
        continue;
      }
      const n = { standalone: 0, status: 0, exempt: 0, failing: 0 };
      for (const t of r.tokens) {
        const where = `${route}${t.section ? ` ${t.section}` : ""}`;
        if (t.verdict === "standalone") {
          n.standalone++;
          row(I, `std|${route}|${t.fig}|${t.label}`, `${route}: ${t.fig} → ${t.label}`, width);
        } else if (t.verdict === "status") {
          n.status++;
          row(I, `status|${route}|${t.section}|${t.fig}|${t.sentence}`, `${route}: "${t.fig}" → ${t.status}, its own chip — in "${t.sentence}"`, width);
        } else if (t.verdict === "exempt") {
          n.exempt++; /* listed with its reason below */
        } else {
          n.failing++;
          if (t.verdict === "standalone-unlabelled")
            row(F, `std|${route}|${t.fig}|${t.context}`, `${where}: "${t.fig}" has no shipped/target label${t.why ? ` a reader can see — its chip is ${t.why}` : ""} — context: "${t.context}"`, width);
          else if (t.verdict === "fail") row(F, `fig|${route}|${t.section}|${t.fig}|${t.sentence}`, `${where}: "${t.fig}" ${t.why} — in "${t.sentence}"`, width);
          /* "exempt-invalid" and "status-shared" are reported once, on their wrapper */
        }
      }
      /* every exemption is printed, so each one stays reviewable */
      for (const e of r.exemptions) {
        const key = `ex|${route}|${e.reason}|${e.figures.join("|")}|${e.sentence}`;
        const around = e.figures.length ? ` around ${e.figures.map((f) => `"${f}"`).join(", ")}` : "";
        if (e.problem) row(F, key, `${route}${e.section ? ` ${e.section}` : ""}: data-figure-exempt="${e.reason}"${around} — ${e.problem} — in "${e.sentence}"`, width);
        else if (!e.rendered) row(I, key, `${route}: data-figure-exempt="${e.reason}" — not rendered at this width`, width);
        else row(I, key, `${route}: exempt "${e.figures[0]}" — reason: "${e.reason.trim()}" — in "${e.sentence}"`, width);
      }
      /* a data-status wrapper that covers more than one figure */
      for (const w of r.statusWraps || [])
        row(F, `sw|${route}|${w.section}|${w.figures.join("|")}|${w.sentence}`, `${route}${w.section ? ` ${w.section}` : ""}: data-status="${w.status}" around ${w.figures.map((f) => `"${f}"`).join(", ")} — ${w.problem} — in "${w.sentence}"`, width);
      /* K11 — every wrapper on the page is an entry in content/figure-labels.ts,
         word for word: an exemption with its reason, a label with its status. A
         wrapper written by hand, or a junk reason long enough to pass the reason
         test, is not one. A [data-metric] box names a metric in content/metrics.ts
         and shows its value and status. */
      for (const w of r.registryWraps || []) {
        const hit = registry.some((l) => l.text === w.text && (w.kind === "exempt" ? "exempt" in l && l.exempt === w.value : !("exempt" in l) && l.status === w.value));
        if (!hit)
          row(F, `reg|${route}|${w.kind}|${w.value}|${w.text}`, `${route}${w.section ? ` ${w.section}` : ""}: ${w.kind === "exempt" ? `data-figure-exempt="${w.value}"` : `data-status="${w.value}"`} around "${w.text}" is not an entry in content/figure-labels.ts — ${w.kind === "exempt" ? "an exemption and its reason" : "a label and its status"} come from the registry, word for word`, width);
      }
      for (const m of metricsTs ? r.metricsShown || [] : []) {
        const e = metricsTs.find((x) => x.id === m.id);
        const where = `${route}${m.section ? ` ${m.section}` : ""}`;
        if (!e) row(F, `met|${route}|${m.id}`, `${where}: data-metric="${m.id}" is not an id in content/metrics.ts`, width);
        else if (m.figure !== e.value || m.status !== e.status)
          row(F, `met|${route}|${m.id}|${m.figure}|${m.status}`, `${where}: data-metric="${m.id}" shows "${m.figure ?? "no figure"}" ${m.status ?? "with no status"} — content/metrics.ts says "${e.value}" ${e.status}`, width);
      }
      /* and every number judged not a figure, with the reason */
      for (const x of r.notFigures) row(I, `not|${route}|${x.tok}|${x.reason}|${x.sentence}`, `${route}: not a figure: "${x.tok}" — ${x.reason} — in "${x.sentence}"`, width);
      I.push(`${at(k)}: ${r.tokens.length} figure(s) — ${n.standalone} standalone, ${n.status} labelled in place, ${n.exempt} exempt, ${n.failing} failing; ${r.exemptions.length} exemption(s); ${r.notFigures.length} number(s) not figures`);
    }
    /* K10 — figures OUTSIDE the visible text: a page's attributes, meta tags
       and JSON-LD, and the llms files, read by the same grammar
       (tokenizeFigures). There is no chip in a meta tag: a figure there carries
       its status in words after it, or is a term exempted for that instance in
       content/figure-labels.ts (its reason printed), or is the one allowlisted
       string (META_ALLOW, printed) — or it fails. */
    const exemptBy = (text, f) =>
      registry.find((l) => {
        if (!("exempt" in l)) return false;
        for (let a = text.indexOf(l.text); a >= 0; a = text.indexOf(l.text, a + 1)) if (a <= f.start && f.end <= a + l.text.length) return true;
        return false;
      });
    const LABEL_WORD = /(?<![\p{L}\p{N}])(shipped|target)(?![\p{L}\p{N}])/iu;
    /* a status in words: shipped/target after the figure, before the end of its
       sentence, with no OTHER figure between (the same figure restated may be) */
    const labelledAfter = (text, figs, i) => {
      const f = figs[i];
      const same = text.slice(f.start, f.end);
      const next = figs.slice(i + 1).find((g) => text.slice(g.start, g.end) !== same);
      let end = next ? next.start : text.length;
      const stop = /[.!?](?=\s|$)/g;
      stop.lastIndex = f.end;
      const m = stop.exec(text);
      if (m && m.index < end) end = m.index + 1;
      return LABEL_WORD.test(text.slice(f.end, end));
    };
    const around = (text, f) => text.slice(Math.max(0, f.start - 60), Math.min(text.length, f.end + 60)).replace(/\s+/g, " ").trim();
    const seenMeta = new Set();
    for (const route of ROUTES) {
      const strings = [];
      for (const [k, v] of Object.entries(visits)) if (k.split("@")[0] === route) strings.push(...(v.metaStrings || []));
      const walkLd = (o, p) => {
        if (typeof o === "string") {
          if (/\d/.test(o) && !/(^|\.)(@context|@type|@id|url|item|image|logo|sameAs|mainEntityOfPage|contentUrl|thumbnailUrl|email)$/.test(p)) strings.push({ where: `JSON-LD ${p}`, text: o });
        } else if (o && typeof o === "object") for (const [key, val] of Object.entries(o)) walkLd(val, `${p}.${key}`);
      };
      for (const raw of visits[`${route}@${WIDTHS[0]}`]?.jsonld || []) {
        try {
          const j = JSON.parse(raw);
          for (const n of Array.isArray(j) ? j : j["@graph"] || [j]) walkLd(n, [].concat(n["@type"] || "node")[0]);
        } catch {
          /* check 14 reports it */
        }
      }
      for (const s of strings) {
        const key = `${route}|${s.where}|${s.text}`;
        if (seenMeta.has(key)) continue;
        seenMeta.add(key);
        const figs = tokenizeFigures(s.text).figures;
        figs.forEach((f, i) => {
          const fig = s.text.slice(f.start, f.end);
          if (META_ALLOW.some((a) => a.route === route && a.text === s.text.trim())) I.push(`${route}: allowlisted — "${fig}" in ${s.where}: "${s.text}" — the one scoped exception (CLAUDE.md, Hard rules)`);
          else if (labelledAfter(s.text, figs, i)) I.push(`${route}: "${fig}" in ${s.where} → its status in words — "${around(s.text, f)}"`);
          else {
            const ex = exemptBy(s.text, f);
            if (ex) I.push(`${route}: exempt "${fig}" in ${s.where} — content/figure-labels.ts "${ex.text}": "${ex.exempt}"`);
            else F.push(`${route}: "${fig}" in ${s.where} has no shipped/target label — "${around(s.text, f)}" — a figure outside the visible text carries its status or goes`);
          }
        });
      }
    }
    /* the llms files: a table row cell by cell — the row's Status cell labels its
       first figure, any other figure needs its own status in its cell — and prose
       paragraph by paragraph, soft line breaks joined */
    if (!llmsRun || llmsRun.error) F.push(`the llms files could not be read${llmsRun?.error ? ` (${llmsRun.error})` : ""} — unsure is a failure`);
    else
      for (const file of llmsRun) {
        if (file.status !== 200) {
          F.push(`${file.file} answered ${file.status} — its figures cannot be checked`);
          continue;
        }
        const blocks = [];
        let para = null;
        file.text.split("\n").forEach((line, n) => {
          if (/^\s*\|/.test(line)) {
            para = null;
            if (!/^\s*\|[\s:|-]+\|?\s*$/.test(line)) blocks.push({ row: true, text: line, line: n + 1 });
            return;
          }
          if (!line.trim() || /^\s*---\s*$/.test(line)) {
            para = null;
            return;
          }
          if (!para || /^\s*(#|[-*+]\s|\d+\.\s)/.test(line)) blocks.push((para = { row: false, text: "", line: n + 1, starts: [] }));
          para.starts.push(para.text ? para.text.length + 1 : 0);
          para.text += (para.text ? " " : "") + line;
          if (/^\s*#/.test(line)) para = null;
        });
        let labelled = 0;
        let exempt = 0;
        const judge = (text, figs, i, lineOf, rowLabel) => {
          const f = figs[i];
          const fig = text.slice(f.start, f.end);
          if (rowLabel || labelledAfter(text, figs, i)) return void labelled++;
          const ex = exemptBy(text, f);
          if (ex) {
            exempt++;
            I.push(`${file.file} line ${lineOf(f.start)}: exempt "${fig}" — content/figure-labels.ts "${ex.text}": "${ex.exempt}"`);
          } else F.push(`${file.file} line ${lineOf(f.start)}: "${fig}" has no shipped/target label — in "${around(text, f)}"`);
        };
        for (const b of blocks) {
          if (b.row) {
            const cells = b.text.split("|").slice(1, -1);
            const rowStatus = cells.some((c) => /^\s*`?(shipped|target)`?\s*$/i.test(c));
            let first = true;
            for (const c of cells) {
              const figs = tokenizeFigures(c).figures;
              figs.forEach((_, i) => {
                judge(c, figs, i, () => b.line, first && rowStatus);
                first = false;
              });
            }
          } else {
            const figs = tokenizeFigures(b.text).figures;
            const lineOf = (off) => b.line + b.starts.filter((s) => s <= off).length - 1;
            figs.forEach((_, i) => judge(b.text, figs, i, lineOf, false));
          }
        }
        I.push(`${file.file}: ${labelled} figure(s) with their status, ${exempt} exempt`);
      }

    for (const r of rows.values()) {
      const n = Math.max(...Object.values(r.count));
      r.out.push(`${r.line}${n > 1 ? ` (×${n})` : ""}${r.widths.size < widthsRead.size ? ` (at ${[...r.widths].join(", ")} only)` : ""}`);
    }
  },
);

/* 9 */
/* Who built it — CLAUDE.md, "Projects and attribution" (decided 2026-09-15).
   The words each kind's label must read, written HERE and not read from the
   site's own label function (components/techwix/ProjectCard.tsx), so a wrong
   label cannot pass by agreeing with itself. With content/projects.ts read, the
   whole label is known: the client after "for", the employer after "at".
   A project with `scope: "features"` (decided 2026-09-16) is feature work inside
   another company's app: "features built by Bolt Fusion for ‹client›", never
   "built by Bolt Fusion", and no screenshot. content/projects.ts is read raw,
   so a product project carries no scope at all. */
const ATTRIBUTION = {
  "case-study": { starts: "Case study: built by Bolt Fusion", full: (p) => `Case study: built by Bolt Fusion${p.client ? ` for ${p.client}` : ""}` },
  project: {
    starts: ["Delivered project: built by Bolt Fusion", "Delivered project: features built by Bolt Fusion for "],
    full: (p) => (p.scope === "features" ? `Delivered project: features built by Bolt Fusion for ${p.client}` : `Delivered project: built by Bolt Fusion${p.client ? ` for ${p.client}` : ""}`),
  },
  "in-house": { starts: "In-house product: our own, not built for a client", full: () => "In-house product: our own, not built for a client" },
  "track-record": { starts: "Track record: built by our engineer at ", full: (p) => `Track record: built by our engineer at ${p.builtAt}, not by Bolt Fusion` },
};
await (async () => {
  if (!want(9)) return;
  const F = [];
  const I = [];
  const sitemapWork = ROUTES.filter((r) => /^\/work\/.+/.test(r));
  const linkedFromIndex = new Set();
  let projectsTs = null;
  try {
    projectsTs = loadContent("content/projects.ts").projects;
    if (!Array.isArray(projectsTs)) throw new Error("it exports no projects array");
  } catch (e) {
    projectsTs = null;
    F.push(`content/projects.ts could not be read (${e.message}) — the cards on /work cannot be checked against it; unsure is a failure`);
  }
  const writeupOf = (href) => isSameSite(href) && /^\/work\/.+/.test(new URL(href).pathname);
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const img of v.images) if (!img.loaded) F.push(`${at(k)}: screenshot ${img.src} did not load`);
    if (/^\/work\/.+/.test(route)) continue; /* write-up pages: screenshots checked above, no cards */
    for (const c of v.cards) {
      if (!c.screenshotLoaded) F.push(`${at(k)}: project "${c.title}" — screenshot not loaded`);
      /* a case study — or a card that does not say its kind — links to its
         write-up; the other kinds link out, or not at all (below) */
      if (c.kind && c.kind !== "case-study") continue;
      if (!c.writeups.length) F.push(`${at(k)}: project "${c.title}" shows a screenshot but links to no write-up`);
      for (const w of c.writeups) {
        linkedFromIndex.add(new URL(w).pathname);
        const r = await http(toBase(w));
        if (r.status !== 200) F.push(`${at(k)}: project "${c.title}" write-up ${new URL(w).pathname} → ${r.status || r.error}`);
      }
      I.push(`${route}: "${c.title}" → ${c.writeups.map((w) => new URL(w).pathname).join(", ") || "no write-up"}`);
    }

    /* who built it: every card on /work, and a card marked with a kind anywhere */
    const cards = v.projectCards || [];
    if (route === "/work" && !cards.length) F.push(`${at(k)}: no project cards found — /work lists every published project`);
    const shown = new Set();
    for (const c of cards) {
      const name = `"${c.title}"`;
      const rule = ATTRIBUTION[c.kind];
      if (!rule) {
        F.push(`${at(k)}: ${name} carries no project kind (data-project-kind="${c.kind ?? ""}") — every card on /work says who built it`);
        continue;
      }
      const entry = projectsTs ? projectsTs.find((p) => p.id === c.id) : null;
      if (projectsTs && !entry) F.push(`${at(k)}: ${name} (data-project-id="${c.id ?? ""}") is not a project in content/projects.ts`);
      if (entry) {
        shown.add(entry.id);
        if (entry.kind !== c.kind) F.push(`${at(k)}: ${name} is shown as ${c.kind}; content/projects.ts says ${entry.kind}`);
        if (entry.state !== "published") F.push(`${at(k)}: ${name} is ${entry.state} in content/projects.ts, and still has a card`);
        if (c.kind === "project" && (entry.scope ?? "product") !== (c.scope ?? "product"))
          F.push(`${at(k)}: ${name} is shown as data-project-scope="${c.scope ?? ""}"; content/projects.ts says ${entry.scope ?? "product"}`);
      }
      /* feature work in a client's app — by content/projects.ts or by the card's own marker */
      const features = c.kind === "project" && (entry?.scope === "features" || c.scope === "features");
      const client = entry?.client ?? "another company";
      /* the attribution label: there, visible, directly above the name, its kind's words */
      if (!c.label) F.push(`${at(k)}: ${name} (${c.kind}) carries no attribution label [data-attribution] — a reader cannot tell who built it`);
      else {
        if (!c.label.seen) F.push(`${at(k)}: ${name} — its attribution label "${c.label.text}" is not visible`);
        if (!c.label.beforeHeading) F.push(`${at(k)}: ${name} — its attribution label is not directly above the project's name, where every card carries it`);
        const expected = entry && entry.kind === c.kind ? rule.full(entry) : null;
        const starts = [].concat(rule.starts);
        if (expected ? c.label.text !== expected : !starts.some((s) => c.label.text.startsWith(s)))
          F.push(`${at(k)}: ${name} — its label reads "${c.label.text}"; a ${c.kind} card's reads "${expected ?? starts.map((s) => `${s}…`).join('" or "')}"`);
        if (c.kind === "track-record" && /built by Bolt Fusion/i.test(c.label.text)) F.push(`${at(k)}: ${name} is an engineer's track record, and its label says "built by Bolt Fusion"`);
        if (features && /built by Bolt Fusion/i.test(c.label.text) && !/\bfeatures\b/i.test(c.label.text))
          F.push(`${at(k)}: ${name} is feature work inside ${client}'s app, and its label says "built by Bolt Fusion" without "features" — it claims the whole app`);
      }
      if (features && c.images.length)
        F.push(`${at(k)}: ${name} is feature work inside ${client}'s app and shows a screenshot (${c.images[0].src}) — the app's UI belongs to the client, and showing it needs their permission`);
      /* what we built — on a track record, the engineer's role — and the employer */
      const fact = (f, what, wanted) => {
        if (!f || !f.text) return void F.push(`${at(k)}: ${name} (${c.kind}) does not name ${what}`);
        if (!f.seen) F.push(`${at(k)}: ${name} — ${what}, "${f.text}", is not visible`);
        if (wanted && f.text !== wanted) F.push(`${at(k)}: ${name} — ${what} reads "${f.text}"; content/projects.ts says "${wanted}"`);
      };
      fact(c.role, c.kind === "track-record" ? "the engineer's role" : "what we built", entry?.role);
      if (c.kind === "track-record") {
        fact(c.builtAt, "the employer it was built at", entry?.builtAt);
        if (c.label && c.builtAt?.text && !c.label.text.includes(c.builtAt.text)) F.push(`${at(k)}: ${name} — its label does not name the employer, ${c.builtAt.text}`);
        if (c.images.length) F.push(`${at(k)}: ${name} is an engineer's track record and shows a screenshot (${c.images[0].src}) — the product belongs to someone else`);
        if (!c.links.some((l) => !isSameSite(l.href))) F.push(`${at(k)}: ${name} is a text card with no store or proof link`);
      } else if (c.builtAt) F.push(`${at(k)}: ${name} (${c.kind}) names an employer it was built at — only an engineer's track record does`);
      /* every image on the card loads */
      for (const img of c.images) if (!img.loaded) F.push(`${at(k)}: ${name} — image ${img.src} did not load`);
      /* where it links: a case study to its write-up; nothing else to one */
      const writeups = c.links.filter((l) => writeupOf(l.href));
      if (c.kind === "case-study" && !writeups.length) F.push(`${at(k)}: ${name} is a case study and links to no write-up`);
      if (c.kind !== "case-study" && writeups.length) F.push(`${at(k)}: ${name} (${c.kind}) links to ${new URL(writeups[0].href).pathname} — only a case study has a write-up`);
      for (const l of c.links) if (!isSameSite(l.href) && !l.href.startsWith("https://")) F.push(`${at(k)}: ${name} links to ${l.href}, which is not https`);
      I.push(`${route}: ${name} — ${c.kind}${features ? " (features)" : ""}: "${c.label?.text ?? "no label"}"${c.builtAt?.text ? `; built at ${c.builtAt.text}` : ""}; ${c.images.length} image(s), ${c.links.length} link(s)`);
    }
    if (route === "/work" && projectsTs)
      for (const p of projectsTs) if (p.state === "published" && !shown.has(p.id)) F.push(`${at(k)}: "${p.name}" is published in content/projects.ts and has no card on /work`);
  }
  for (const r of sitemapWork) if (!linkedFromIndex.has(r)) F.push(`${r} is published in the sitemap but no project card links to it`);
  for (const p of linkedFromIndex) if (!sitemapWork.includes(p)) F.push(`${p} is linked as a write-up but missing from the sitemap`);
  results.push({
    id: 9,
    title: "Every published project shows a loaded screenshot and a working write-up link; every card on /work says who built it",
    catches: "a project presented as shipped with nothing behind it; an employer's product presented as ours — a card with no attribution label, one that is hidden or not its kind's, a track record without its employer and role or with a screenshot; feature work in a client's app labelled as if we built the app, or shown with a screenshot",
    status: F.length ? "FAIL" : "PASS",
    findings: [...new Set(F)],
    info: [...new Set(I)],
  });
})();

/* 14 */
await (async () => {
  if (!want(14)) return;
  const F = [];
  const I = [];
  const urls = new Map();
  for (const route of ROUTES) {
    const v = visits[`${route}@${WIDTHS[0]}`];
    const nodes = [];
    v.jsonld.forEach((raw, i) => {
      try {
        const j = JSON.parse(raw);
        nodes.push(...(Array.isArray(j) ? j : j["@graph"] || [j]));
      } catch (e) {
        F.push(`${route}: JSON-LD block ${i + 1} does not parse (${e.message})`);
      }
    });
    const types = new Set(nodes.flatMap((n) => [].concat(n["@type"] || [])));
    I.push(`${route}: ${[...types].join(", ") || "no structured data"}`);
    for (const [re, need] of EXPECT_LD) if (re.test(route)) for (const t of need) if (!types.has(t)) F.push(`${route}: missing ${t}`);
    const walk = (o, path) => {
      if (typeof o === "string") {
        if (/^https?:\/\//.test(o)) urls.set(o, [...(urls.get(o) || []), `${route} ${path}`]);
        else if (/^\//.test(o) && /(url|item|image|logo|@id)$/.test(path)) F.push(`${route}: ${path} is relative ("${o}") — structured data needs absolute URLs`);
        return;
      }
      if (o && typeof o === "object") for (const [key, val] of Object.entries(o)) walk(val, path ? `${path}.${key}` : key);
    };
    nodes.forEach((n) => walk(n, `${[].concat(n["@type"] || "node")[0]}`));
    for (const n of nodes.filter((x) => [].concat(x["@type"]).includes("BreadcrumbList")))
      for (const item of n.itemListElement || []) {
        const u = typeof item.item === "string" ? item.item : item.item?.["@id"];
        let hash = "";
        try {
          hash = new URL(u, BASE).hash;
        } catch {
          /* relative or malformed: reported by the URL walk */
        }
        if (hash) F.push(`${route}: breadcrumb "${item.name}" points at an anchor (${u}), not a page`);
      }
  }
  /* FAQPage — see visitFaq. It is generated from the rendered FAQ, so a mismatch
     means a second copy crept back; an answer missing from the served HTML means
     the page stopped sending it, whatever the DOM shows after a click. */
  if (faqRun?.error) F.push(`/: the FAQ run did not finish (${faqRun.error}) — unsure is a failure`);
  else if (faqRun) {
    const { ld, rendered, served } = faqRun;
    if (!ld.length) I.push("/: no FAQPage in the structured data");
    else {
      for (const x of ld) {
        if (!served.includes(x.q)) F.push(`/: FAQPage asks "${x.q.slice(0, 60)}", which is not in the served HTML`);
        if (!served.includes(x.a)) F.push(`/: the answer to "${x.q.slice(0, 50)}" is not in the served HTML — the markup describes text a crawler cannot find on the page`);
      }
      if (!rendered) F.push(`/: none of the ${ld.length} FAQPage questions is a question the page renders`);
      else {
        const byQ = new Map(rendered.map((r) => [r.q, r.a]));
        for (const x of ld)
          if (!byQ.has(x.q)) F.push(`/: FAQPage asks "${x.q.slice(0, 60)}", which the page does not render`);
          else if (byQ.get(x.q) !== x.a) F.push(`/: FAQPage answers "${x.q.slice(0, 50)}" differently from the page`);
        const ldQ = new Set(ld.map((x) => x.q));
        for (const r of rendered) {
          if (!ldQ.has(r.q)) F.push(`/: the page renders "${r.q.slice(0, 60)}", which FAQPage leaves out`);
          if (r.before === undefined || r.after === undefined) F.push(`/: the question "${r.q.slice(0, 50)}" does not tell assistive technology whether it is open`);
          else if (r.before || !r.after) F.push(`/: the question "${r.q.slice(0, 50)}" reports expanded=${r.before} before opening and ${r.after} after`);
        }
        I.push(`/: FAQPage ${ld.length} question(s), the page ${rendered.length}; every answer checked in the served HTML`);
      }
    }
  }
  /* Person — none, on any page. The team is a headcount (the owner,
     2026-09-24: "we just show we have 15+ developer team, no details"): no one
     is named on the site, so a person card ([data-person-card]) or a Person
     node anywhere is a finding. It replaced the verified/pending roster rule of
     2026-09-15 (one Person per verified card, none for a pending one). */
  for (const route of ROUTES) {
    const v = visits[`${route}@${WIDTHS[0]}`];
    if (!v?.people) continue;
    const persons = [];
    for (const raw of v.jsonld) {
      try {
        const j = JSON.parse(raw);
        for (const n of Array.isArray(j) ? j : j["@graph"] || [j]) if ([].concat(n["@type"]).includes("Person")) persons.push(n);
      } catch {
        /* reported by the parse above */
      }
    }
    for (const p of persons) F.push(`${route}: a Person node for "${p.name || "(no name)"}" — the team is shown as a headcount (owner, 2026-09-24), and no one is named in the markup`);
    for (const c of v.people.cards || []) F.push(`${route}: a person card for "${c.name || "(no name)"}" — the team is shown as a headcount (owner, 2026-09-24), and no one is named on the page`);
    if (route === "/" || persons.length || (v.people.cards || []).length) I.push(`${route}: Person ${persons.length}, person cards ${(v.people.cards || []).length}`);
  }
  for (const [u, where] of urls) {
    if (!isSameSite(u)) {
      I.push(`not fetched (another site): ${u}`);
      continue;
    }
    const host = new URL(u).host;
    if (host !== PROD_HOST) F.push(`${u} — structured data names ${host}, not ${PROD_HOST} (${where[0]})`);
    const r = await http(toBase(u.split("#")[0]));
    if (r.status !== 200) F.push(`${u} → ${r.status || r.error} (${where[0]})`);
  }
  results.push({ id: 14, title: "Structured data parses, has the expected types, and every URL in it works", catches: "the /#recent-work breadcrumb; schema pointing at pages that 404; an FAQPage that is not the FAQ on the page, or whose answers are not in the served HTML; a person card or a Person node anywhere — the team is a headcount (owner, 2026-09-24)", status: F.length ? "FAIL" : "PASS", findings: [...new Set(F)], info: I });
})();

/* 15 */
await (async () => {
  if (!want(15)) return;
  const F = [];
  const I = [];
  const idsByRoute = Object.fromEntries(ROUTES.map((r) => [r, new Set(visits[`${r}@${WIDTHS[0]}`].ids)]));
  const external = new Set();
  const checked = new Set();
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const l of v.links) {
      const key = `${route}|${l.href}`;
      if (checked.has(key)) continue;
      checked.add(key);
      if (/^(mailto|tel|sms|javascript):/i.test(l.href)) {
        if (/^javascript:/i.test(l.href)) F.push(`${route}: ${l.el} uses a javascript: link`);
        continue;
      }
      if (l.href === "#" || l.href === "") {
        F.push(`${route}: ${l.el} has a placeholder href="${l.href}"`);
        continue;
      }
      if (!isSameSite(l.abs)) {
        external.add(new URL(l.abs).host);
        continue;
      }
      const u = new URL(l.abs);
      const target = u.pathname;
      if (u.hash) {
        const id = decodeURIComponent(u.hash.slice(1));
        let ids = idsByRoute[target];
        if (!ids) {
          const r = await http(toBase(target));
          ids = new Set([...(r.html || "").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
        }
        if (!ids.has(id)) F.push(`${route}: ${l.el} → ${target}#${id} — no element with that id`);
      }
      const r = await http(toBase(target + u.search));
      if (r.status !== 200) F.push(`${route}: ${l.el} → ${target} returns ${r.status || r.error}`);
      else if (new URL(r.final).pathname !== target) I.push(`${route}: ${target} redirects to ${new URL(r.final).pathname}`);
    }
  }
  I.push(`external hosts linked (not fetched): ${[...external].sort().join(", ") || "none"}`);
  results.push({ id: 15, title: "Every internal link returns 200 and every #anchor has a target", catches: "dead anchors after a section rename; placeholder links", status: F.length ? "FAIL" : "PASS", findings: [...new Set(F)], info: I });
})();

/* 22 */
check(22, "No console errors, page errors, hydration warnings or failed requests", "runtime breakage that renders fine in a screenshot", (F, I) => {
  const seen = new Set();
  for (const [k, v] of Object.entries(visits)) {
    if (v.loadTimeout) F.push(`${at(k)}: the page never reached "load" (${v.loadTimeout})`);
    for (const m of v.console) {
      const key = `${m.type}|${m.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const line = `${at(k)}: ${m.type} — ${m.text}${m.src ? ` [${short(m.src)}]` : ""}`;
      /* raised by another site's code in its own frame (e.g. Calendly's reCAPTCHA) */
      if (m.src && !isSameSite(m.src)) I.push(`${line} (third party)`);
      else F.push(line);
    }
    for (const f of v.failed) {
      const key = `${f.url}|${f.why}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const line = `${at(k)}: ${f.why} — ${f.url.replace(BASE, "")}`;
      if (/ERR_ABORTED/.test(f.why)) I.push(`${line} (aborted by the browser, e.g. a cancelled prefetch)`);
      else if (isSameSite(f.url)) F.push(line);
      else I.push(`${line} (third party)`);
    }
  }
});

/* 3 */
check(3, "No text is drawn with a faked weight or style", "a missing face the browser quietly synthesises — the replica's Barlow 500", (F) => {
  const num = (x) => (x === "normal" ? 400 : x === "bold" ? 700 : Number(x));
  const covers = (face, w, italic) => {
    const [lo, hi = lo] = String(face.weight).split(/\s+/).map(num);
    return w >= lo && w <= hi && (italic ? /italic|oblique/.test(face.style) : /^normal/.test(face.style));
  };
  const seen = new Set();
  for (const [k, v] of Object.entries(visits))
    for (const r of v.rendered) {
      if (!r.custom) continue; /* painted in a system face: check 2 */
      const own = v.fontFaces.filter((f) => f.family.toLowerCase() === r.declared.toLowerCase());
      if (!own.length) continue;
      const w = parseInt(r.weight, 10) || 400;
      const italic = /italic|oblique/.test(r.style);
      if (own.some((f) => covers(f, w, italic))) continue;
      const key = `${r.declared}|${w}|${italic}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const max = Math.max(...own.map((f) => num(String(f.weight).split(/\s+/).pop())));
      const min = Math.min(...own.map((f) => num(String(f.weight).split(/\s+/)[0])));
      const what = italic && !own.some((f) => /italic|oblique/.test(f.style)) ? "no italic face — the browser slants it"
        : w >= 600 && max < 600 ? `no face above ${max} — the browser fakes the bold`
        : w < min ? `the face starts at ${min}, so it renders at ${min}, heavier than asked`
        : `no face covers ${w}`;
      F.push(`${at(k)}: ${r.declared} ${w}${italic ? " italic" : ""} — ${what}; e.g. ${r.el}`);
    }
});

/* 5 */
check(5, "After one reading-speed scroll, nothing meant to be read is still invisible", "reveals that never fire — framer variants eating whileInView", (F) => {
  for (const [k, v] of Object.entries(visits)) {
    if (!v.stuckHidden.length) continue;
    F.push(`${at(k)}: ${v.stuckHidden.length} text element(s) still invisible — e.g. ${v.stuckHidden.slice(0, 3).map((x) => `"${x.text}" (${x.hider}${x.style ? ` ${x.style}` : ""}${x.section ? ` in ${x.section}` : ""})`).join("; ")}`);
  }
});

/* 6 */
check(6, "No sideways scrolling or cut-off content at any width", "content wider than the screen at a width nobody tested", (F, I) => {
  for (const [k, v] of Object.entries(widthRuns)) {
    if (v.loadTimeout) F.push(`${at(k)}: the page never reached "load" (${v.loadTimeout}) — read as far as it got`);
    if (v.overflowX > 0) F.push(`${at(k)}: the page scrolls sideways by ${v.overflowX}px`);
    if (v.offenders.length) F.push(`${at(k)}: content runs past the screen edge — ${v.offenders.map((o) => `${o.el} (right edge ${o.right}px)`).join(", ")}`);
  }
  for (const route of ROUTES)
    for (const [a, b] of EDGE_PAIRS) {
      const A = widthRuns[`${route}@${a}`];
      const B = widthRuns[`${route}@${b}`];
      if (!A || !B) continue;
      let d = 0;
      for (let i = 0; i < Math.min(A.sig.length, B.sig.length); i++) if (A.sig[i] !== B.sig[i]) d++;
      I.push(`${route}: ${d} element(s) change layout between ${a} and ${b}px`);
    }
});

/* 7 */
check(
  7,
  "The homepage headline wraps cleanly — no line of it is a single orphaned word",
  "a headline sized for one line of copy showing another: the H1 became a sentence (COPY.md §1); 2026-09-16, \"Build what's next.\" set as two spans — a last line of one word is an orphan whether or not a span ends before it",
  (F, I) => {
    for (const [k, v] of Object.entries(widthRuns)) {
      if (!k.startsWith("/@")) continue;
      const h = v.headline;
      if (!h) {
        F.push(`${at(k)}: no headline found`);
        continue;
      }
      I.push(`${at(k)}: "${h.text}" — ${h.all.join(" / ")} (${h.parts.map((lines) => lines.length).join(" + ")} line(s), by span)`);
      /* each span: a part that wraps never ends on one word */
      h.parts.forEach((lines, i) => {
        const last = lines[lines.length - 1] || "";
        if (lines.length > 1 && last.split(" ").length === 1) F.push(`${at(k)}: headline part ${i + 1} ends on a single word, "${last}"`);
      });
      /* the whole headline, across its spans: its last line is never one word */
      const last = h.all[h.all.length - 1] || "";
      if (h.all.length > 1 && last.split(" ").length === 1) F.push(`${at(k)}: the headline's last line is a single word, "${last}" — an orphan (${h.all.join(" / ")})`);
    }
  },
);

/* 10 */
check(10, "Every image loads, has alt text, and comes from this site", "a broken or unlabelled image; stock photography", (F, I) => {
  const STOCK = /unsplash|pexels|pixabay|shutterstock|istock|gettyimages|pravatar|randomuser|ui-avatars|gravatar|placehold|picsum|dicebear/i;
  const seen = new Set();
  const once = (key, line) => {
    if (seen.has(key)) return;
    seen.add(key);
    F.push(line);
  };
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const s of v.stalled?.images || []) once(`${route}|stalled|${s}`, `${at(k)}: ${short(s)} was still loading ${SETTLE_MS / 1000}s after the reading-speed scroll — it never finished`);
    for (const img of v.allImages) {
      if (!img.loaded) {
        if (img.visible) once(`${route}|load|${img.src}`, `${at(k)}: ${short(img.src)} did not load`);
        else I.push(`${at(k)}: ${short(img.src)} not loaded (not visible at this width)`);
      }
      if (img.alt === null) once(`${route}|alt|${img.src}`, `${route}: ${short(img.src)} has no alt attribute`);
      if (!img.src.startsWith("data:") && !isSameSite(img.src)) once(`${route}|host|${img.src}`, `${route}: ${short(img.src)} is served from another site`);
      if (STOCK.test(img.src)) once(`${route}|stock|${img.src}`, `${route}: ${short(img.src)} looks like stock photography or a template avatar`);
    }
  }
});

/* 11 */
check(11, "Every public page has exactly one h1", "restaurant search had none — found in passing, now asserted", (F) => {
  for (const [k, v] of Object.entries(visits)) {
    const h1 = v.headings.filter((h) => h.level === 1);
    if (h1.length === 1) continue;
    F.push(`${at(k)}: ${h1.length} h1${h1.length ? ` — ${h1.map((h) => `"${h.text}"`).join(", ")}` : `; the first heading is h${v.headings[0]?.level ?? "?"} "${v.headings[0]?.text ?? ""}"`}`);
  }
});

/* 12 */
await (async () => {
  if (!want(12)) return;
  const F = [];
  const I = [];
  /* the line, three ways: the owner's words (CANONICAL, written here), the
     site's one copy of them (content/canonical.ts), and every place the site
     describes the company — each must carry exactly these words */
  let canonTs = null;
  try {
    canonTs = loadContent("content/canonical.ts").CANONICAL_DESCRIPTION;
    if (typeof canonTs !== "string") throw new Error("it exports no CANONICAL_DESCRIPTION string");
  } catch (e) {
    F.push(`content/canonical.ts could not be read (${e.message}) — unsure is a failure`);
  }
  if (typeof canonTs === "string" && canonTs !== CANONICAL)
    F.push(`content/canonical.ts says "${canonTs}" — the owner's canonical description (2026-09-16) is "${CANONICAL}"; changing it changes this check too, on purpose`);
  I.push(`the canonical description: "${CANONICAL}"`);
  const home = visits[`/@${WIDTHS[0]}`];
  let org = null;
  for (const raw of home?.jsonld || []) {
    try {
      const j = JSON.parse(raw);
      for (const n of j["@graph"] || [j]) if ([].concat(n["@type"]).includes("Organization")) org = n;
    } catch {
      /* check 14 reports it */
    }
  }
  if (!org?.description) F.push("/: no Organization description in the structured data — it opens with the canonical description");
  else if (!org.description.startsWith(CANONICAL)) F.push(`/: the Organization description does not open with it — it says "${org.description.slice(0, 120)}"`);
  else I.push(`/: Organization description — opens with it`);
  /* every place: the ones every page must have are required; the twitter card
     is checked where the page emits one */
  const places = [
    ["the meta description on /", home?.meta.description, true],
    ["og:description on /", home?.meta.ogDescription, true],
    ["twitter:description on /", home?.meta.twitterDescription, false],
    ["the share image's alt text (og:image:alt) on /", home?.meta.ogImageAlt, true],
  ];
  if (!llmsRun || llmsRun.error) F.push(`the llms files could not be read${llmsRun?.error ? ` (${llmsRun.error})` : ""} — unsure is a failure`);
  else for (const f of llmsRun.filter((x) => ["/llms.txt", "/llms-full.txt"].includes(x.file))) places.push([f.file, f.status === 200 ? f.text : null, true, f.status]);
  for (const [where, text, required, status] of places) {
    if (text == null) {
      if (required) F.push(`${where} is missing${status ? ` (it answered ${status})` : ""} — it carries the canonical description`);
      continue;
    }
    if (!text.includes(CANONICAL)) F.push(`${where} does not carry it word for word — it says "${String(text).replace(/\s+/g, " ").slice(0, 110)}"`);
    else I.push(`${where} — carries it`);
  }
  results.push({
    id: 12,
    title: "The canonical description is word for word the same everywhere it appears — the owner's line of 2026-09-16",
    catches: "the OG image saying one thing and the metadata another; the description changed in one place only — an llms file, the share image's alt text, the structured data — or changed in content/canonical.ts without the owner's decision",
    status: F.length ? "FAIL" : "PASS",
    findings: F,
    info: I,
  });
})();

/* 13 */
await (async () => {
  if (!want(13)) return;
  const F = [];
  const I = [];
  const rb = await http(`${BASE}/robots.txt`);
  const disallow = [];
  let applies = false;
  for (const line of (rb.text || "").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const val = line.slice(i + 1).trim();
    if (key === "user-agent") applies = val === "*";
    else if (applies && key === "disallow" && val) disallow.push(val);
  }
  I.push(`robots.txt disallows: ${disallow.join(" ") || "nothing"}`);
  const blocked = (p) => disallow.some((d) => p.startsWith(d));
  for (const route of ROUTES) {
    const v = visits[`${route}@${WIDTHS[0]}`];
    const r = await http(toBase(route));
    if (r.status !== 200) F.push(`${route} is in the sitemap and returns ${r.status || r.error}`);
    if (blocked(route)) F.push(`${route} is in the sitemap and disallowed by robots.txt`);
    if (/noindex/i.test(v.meta.robots || "") || /noindex/i.test(r.robots || "")) F.push(`${route} is in the sitemap and marked noindex`);
  }
  const reachable = new Set();
  for (const v of Object.values(visits)) for (const l of v.links) if (isSameSite(l.abs)) reachable.add(new URL(l.abs).pathname);
  for (const p of reachable) {
    if (ROUTES.includes(p) || blocked(p)) continue;
    const r = await http(toBase(p));
    if (r.status !== 200 || !r.html) continue;
    const noindex = /noindex/i.test(r.robots || "") || /<meta[^>]+name="robots"[^>]+noindex/i.test(r.html);
    if (!noindex) F.push(`${p} is linked, returns 200 and is indexable, but is not in the sitemap`);
  }
  results.push({ id: 13, title: "The sitemap, the pages you can reach, and robots.txt agree", catches: "a published page missing from the sitemap; a sitemap page that is blocked or noindexed", status: F.length ? "FAIL" : "PASS", findings: F, info: I });
})();

/* 16 */
await (async () => {
  if (!want(16)) return;
  const F = [];
  const I = [];
  const icons = visits[`/@${WIDTHS[0]}`].meta.icons;
  if (!icons.some((i) => /\bicon\b/.test(i.rel) && !/apple/.test(i.rel))) F.push("/ declares no favicon");
  if (!icons.some((i) => i.rel === "apple-touch-icon")) F.push("/ declares no apple-touch-icon");
  for (const i of icons) {
    const r = await httpBin(toBase(i.href));
    if (r.status !== 200) {
      F.push(`${i.rel} ${short(i.href)} → ${r.status || r.error}`);
      continue;
    }
    if (i.rel === "apple-touch-icon") {
      const size = pngSize(r.buf);
      if (!size) F.push(`apple-touch-icon ${short(i.href)} is ${r.type || "not an image"}, not a PNG — iOS ignores it`);
      else if (size.w < 180 || size.h < 180) F.push(`apple-touch-icon is ${size.w}×${size.h}; iOS wants 180×180`);
      else I.push(`apple-touch-icon: ${size.w}×${size.h} PNG`);
    }
  }
  for (const route of ROUTES) {
    const m = visits[`${route}@${WIDTHS[0]}`].meta;
    if (!m.ogImage) {
      F.push(`${route}: no og:image`);
      continue;
    }
    const r = await httpBin(toBase(m.ogImage));
    const size = imageSize(r.buf);
    if (r.status !== 200) F.push(`${route}: og:image ${short(m.ogImage)} → ${r.status || r.error}`);
    else if (!size) F.push(`${route}: og:image ${short(m.ogImage)} is ${r.type || "an unknown format"} — could not read its size`);
    else if (size.w !== 1200 || size.h !== 630) F.push(`${route}: og:image is ${size.w}×${size.h} ${size.type}, not 1200×630`);
    if (!m.ogImageAlt) F.push(`${route}: the og:image has no alt text`);
    if (!m.twitterImage) F.push(`${route}: no twitter:image`);
  }
  results.push({ id: 16, title: "Favicon, touch icon and share image are declared, load, and have the right format", catches: "an SVG apple-touch-icon iOS ignores; a share image that 404s", status: F.length ? "FAIL" : "PASS", findings: [...new Set(F)], info: I });
})();

/* 17 */
await (async () => {
  if (!want(17)) return;
  const F = [];
  const I = [];
  /* The CMS was removed on 2026-09-11. Its routes must stay gone: an admin or
     an API that quietly comes back is a sign-in surface nobody is watching. */
  const RETIRED = ["/admin", "/admin/login", "/api/admin/content", "/api/admin/login", "/api/admin/logout", "/api/admin/upload"];
  for (const p of RETIRED) {
    const r = await fetch(`${BASE}${p}`, { redirect: "manual" }).catch(() => ({ status: 0 }));
    if (r.status !== 404) F.push(`${p} answers ${r.status} — the retired admin must return 404`);
  }
  const rb = await http(`${BASE}/robots.txt`);
  /* unsure is a failure: a robots.txt that cannot be read cannot be cleared */
  if (rb.status !== 200) F.push(`robots.txt answered ${rb.status} — cannot confirm it no longer names the admin`);
  else if (/^\s*(dis)?allow:\s*\/(admin|api)(\/|\s|$)/im.test(rb.text || "")) F.push("robots.txt still names /admin or /api — a route that does not exist needs no rule");
  const seen = new Set();
  for (const [k, v] of Object.entries(visits))
    for (const l of v.links || []) {
      if (!isSameSite(l.abs)) continue; /* another site's /admin is not ours */
      let path = "";
      try {
        path = new URL(l.abs).pathname;
      } catch {
        continue;
      }
      if (/^\/(admin|api)(\/|$)/.test(path) && !seen.has(path)) {
        seen.add(path);
        F.push(`${at(k)}: a link to ${l.href} — the admin is gone`);
      }
    }
  I.push(`${RETIRED.join(", ")} checked for 404`);
  results.push({ id: 17, title: "The retired admin stays gone: /admin and /api answer 404", catches: "an admin or an API route coming back unnoticed", status: F.length ? "FAIL" : "PASS", findings: F, info: I });
})();

/* 18 */
check(18, "axe finds no serious or critical accessibility violations", "what a screen-reader or keyboard user hits first", (F, I) => {
  const seen = new Set();
  let exempt = 0;
  for (const [k, v] of Object.entries(visits)) {
    exempt += v.axeExempt || 0;
    /* the guard that keeps the exemption to the wordmark (see LOGOTYPE) */
    for (const t of new Set(v.logotypes || []))
      if (t !== LOGOTYPE_TEXT && !seen.has(`logotype|${t}`)) {
        seen.add(`logotype|${t}`);
        F.push(`${at(k)}: an element marked data-logotype holds "${t.slice(0, 60)}", not the brand name "${LOGOTYPE_TEXT}" — the WCAG 1.4.3 logotype exemption covers the wordmark and nothing else`);
      }
  }
  /* the scope: one rendered wordmark per page at most (see LOGOTYPE) */
  const scope = new Map();
  for (const [k, v] of Object.entries(visits)) {
    const c = v.logotypeCount || { dom: 0, rendered: 0 };
    if (c.rendered > 1) F.push(`${at(k)}: ${c.rendered} rendered elements are marked data-logotype — the exemption covers the one wordmark`);
    const route = k.split("@")[0];
    scope.set(route, [...(scope.get(route) || []), `${k.split("@")[1]}: ${c.dom} marked, ${c.rendered} rendered`]);
  }
  for (const [route, counts] of scope) I.push(`${route}: data-logotype — ${counts.join("; ")}`);
  I.push(`contrast not applied to the wordmark (WCAG 2.2 SC 1.4.3, logotypes): ${exempt} node(s) across all visits`);
  for (const [k, v] of Object.entries(visits))
    for (const x of v.axe || []) {
      const key = `${k.split("@")[0]}|${x.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      F.push(`${at(k)}: ${x.impact} — ${x.id}: ${x.help} (${x.nodes} element(s), e.g. ${x.sample.join("; ")})`);
    }
});

/* 19 */
check(19, "Every keyboard stop shows a visible focus state", "CLAUDE.md: visible keyboard focus everywhere", (F, I) => {
  for (const [route, stops] of Object.entries(focusRuns)) {
    if (!Array.isArray(stops)) {
      F.push(`${route}: the keyboard run did not finish (${stops.error}) — unsure is a failure`);
      continue;
    }
    I.push(`${route}: ${stops.length} tab stop(s) checked`);
    for (const s of stops.filter((x) => !x.visibleFocus)) F.push(`${route}: ${s.desc} — ${s.why}`);
  }
  /* A1 — Shift+Tab back up the page: no stop entirely under a fixed or sticky box */
  for (const [k, stops] of Object.entries(focusBackRuns)) {
    if (!Array.isArray(stops)) {
      F.push(`${at(k)}: the Shift+Tab run did not finish (${stops.error}) — unsure is a failure`);
      continue;
    }
    const partly = stops.filter((s) => s.covered && s.seen);
    I.push(`${at(k)}: Shift+Tab — ${stops.length} stop(s), ${partly.length} partly under a fixed or sticky box${partly.length ? ` (${partly.slice(0, 3).map((s) => `${s.desc} under ${s.by}`).join("; ")})` : ""}`);
    for (const s of stops.filter((x) => !x.seen))
      F.push(
        s.covered
          ? `${at(k)}: Shift+Tab to ${s.desc} — it is entirely hidden under ${s.by} (y ${s.top}–${s.bottom}) — WCAG 2.2 SC 2.4.11, Focus Not Obscured`
          : `${at(k)}: Shift+Tab to ${s.desc} — it is off screen while focused (y ${s.top}–${s.bottom})`,
      );
  }
});

/* 20 */
check(
  20,
  "Text meets WCAG AA contrast against the pixels behind it — measured viewport by viewport, over fixed grounds too, the header's text included",
  "text over the particle field, gradients and screenshots, where the flat colour proves nothing; text over a fixed ground measured against the page behind it; the header's call to action never measured; text past a silent cap",
  (F, I) => {
    for (const [k, v] of Object.entries(visits)) {
      const c = v.contrast;
      if (!c) continue;
      const why = {};
      c.unmeasured.forEach((u) => (why[u.why] = (why[u.why] || 0) + 1));
      I.push(
        `${at(k)}: ${c.measured} measured in ${c.captures} viewport capture(s); not measurable: ${Object.entries(why).map(([w, n]) => `${w} ×${n}`).join(", ") || "none"}; fixed or sticky boxes: ${c.pinnedBoxes.join(", ") || "none"} — text in one is measured in ${PINNED_ALLOW} at the top of the page, or where the box carries its own opaque background`,
      );
      /* 2026-09-16: text in a pinned box that paints its own opaque ground IS measured, against that ground */
      for (const o of c.onPinned || []) I.push(`${at(k)}: "${o.text}" sits in ${o.box}, a fixed or sticky box whose own ground is opaque (${o.ground}) — measured against it, wherever the page is scrolled`);
      /* K5: a cap reached is text never measured */
      if (c.total > c.cap) F.push(`${at(k)}: the contrast pass stopped at its ${c.cap}-element cap — ${c.total - c.cap} text element(s) further down the page were never measured; unsure is a failure`);
      const seen = new Set();
      for (const o of c.outside) {
        if (seen.has(`out|${o.text}`)) continue;
        seen.add(`out|${o.text}`);
        F.push(`${at(k)}: "${o.text}" sits in a fixed or sticky box (${o.box}) that paints no opaque ground of its own — the page behind it shows through, and what that is changes as the page scrolls, so no one capture is what a reader sees; give the box an opaque background, or take the text out of it; unsure is a failure`);
      }
      for (const o of c.covered) F.push(`${at(k)}: "${o.text}" is under a fixed or sticky box at every scroll position — no reader can see it`);
      for (const f of [...c.fails].sort((a, b) => a.ratio - b.ratio)) {
        if (seen.has(f.text)) continue;
        seen.add(f.text);
        F.push(`${at(k)}: "${f.text}" ${f.ratio}:1, needs ${f.need}:1 — rgb(${f.color.slice(0, 3).join(",")}) at ${Math.round((f.color[3] / 255) * 100)}% over rgb(${f.bg.join(",")})${f.pinned ? ` (in ${f.pinned}, at the top of the page)` : ""}`);
      }
    }
  },
);

/* 21 */
check(21, "With reduced motion requested, nothing keeps moving", "CLAUDE.md: prefers-reduced-motion respected globally, no exceptions", (F, I) => {
  for (const [route, r] of Object.entries(reducedRuns)) {
    if (r.error) {
      F.push(`${route}: the reduced-motion run did not finish (${r.error}) — unsure is a failure`);
      continue;
    }
    const loops = r.anims.filter((a) => a.infinite);
    const late = r.anims.filter((a) => !a.infinite);
    if (loops.length) F.push(`${route}: ${loops.length} looping animation(s) still running — ${[...new Set(loops.map((a) => `${a.name} on ${a.el}`))].slice(0, 4).join(", ")}`);
    if (late.length) F.push(`${route}: ${late.length} animation(s) still running 2.5s after load — ${[...new Set(late.map((a) => `${a.name} on ${a.el}`))].slice(0, 4).join(", ")}`);
    if (r.canvasMoving) F.push(`${route}: the WebGL canvas is still animating`);
    I.push(`${route}: ${r.canvases} canvas element(s)`);
  }
});

/* 23 */
check(23, "Two captures of each page are identical once motion is pinned", "anything order- or time-dependent that makes the page differ between visits", (F, I) => {
  for (const [route, d] of Object.entries(detRuns)) {
    if (d.error) F.push(`${route}: the captures did not finish (${d.error}) — unsure is a failure`);
    else if (d.sizeDiffers) F.push(`${route}: the page is a different size on each visit (${d.sizeDiffers})`);
    else if (d.n) F.push(`${route}: ${d.n} pixel(s) differ (${d.pct.toFixed(4)}%), between y=${d.minY} and y=${d.maxY}`);
    /* the scene is pinned by reduced motion, where it never mounts (check 25), and canvases are hidden for the capture */
    if (!d.error) I.push(`${route}: captured under reduced motion — ${d.canvases ?? 0} canvas(es) in the page (hidden for the capture)${d.sceneReady ? "; a scene DREW under reduced motion — check 25 fails that" : "; no scene drawn"}`);
  }
});

/* 24 */
await (async () => {
  if (!want(24)) return;
  const title = "The repository: one lockfile, no build output tracked, tsc and eslint clean, no unused dependencies";
  const catches = "the stray package-lock.json; build files committed to git";
  if (!REPO) {
    results.push({ id: 24, title, catches, status: "SKIP", findings: [], info: ["pass --repo <path to a checkout with node_modules> to run it"] });
    return;
  }
  const F = [];
  const I = [];
  const sh = (cmd, args) => {
    try {
      return { ok: true, out: execFileSync(cmd, args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256e6 }) };
    } catch (e) {
      return { ok: false, out: `${e.stdout || ""}${e.stderr || ""}` };
    }
  };
  const files = sh("git", ["ls-files"]).out.split("\n").filter(Boolean);
  const locks = ["yarn.lock", "package-lock.json", "pnpm-lock.yaml", "bun.lockb"].filter((f) => files.includes(f));
  const pkg = JSON.parse(await readFile(path.join(REPO, "package.json"), "utf8"));
  const pm = (pkg.packageManager || "").split("@")[0];
  if (locks.length !== 1) F.push(`${locks.length} lockfiles are tracked (${locks.join(", ") || "none"}); there should be exactly one`);
  const lockFor = { yarn: "yarn.lock", npm: "package-lock.json", pnpm: "pnpm-lock.yaml", bun: "bun.lockb" }[pm];
  if (lockFor && !locks.includes(lockFor)) F.push(`packageManager is ${pm}, but ${lockFor} is not tracked`);
  const faces = files.filter((f) => /^public\//.test(f) && /\.(svg|png|jpe?g|webp|avif|gif)$/i.test(f) && /(^|[\/_.-])(avatars?|placeholders?|generated|fake|faces?)([-_.\d]|$)/i.test(f));
  if (faces.length) F.push(`placeholder or avatar image files are in the repository: ${faces.slice(0, 4).join(", ")}${faces.length > 4 ? ` and ${faces.length - 4} more` : ""}`);
  const built = files.filter((f) => /^(\.next|node_modules|out|dist|coverage)\//.test(f));
  if (built.length) F.push(`build output is tracked in git: ${built.slice(0, 4).join(", ")}${built.length > 4 ? ` and ${built.length - 4} more` : ""}`);
  const bin = (n) => path.join(REPO, "node_modules", ".bin", n);
  if (existsSync(bin("tsc"))) {
    const r = sh(bin("tsc"), ["--noEmit", "-p", REPO]);
    const n = (r.out.match(/error TS/g) || []).length;
    if (n || !r.ok) F.push(`tsc: ${n} error(s)`);
  } else I.push("tsc not installed in the checkout — skipped");
  if (existsSync(bin("eslint"))) {
    const r = sh(bin("eslint"), [".", "--format", "json"]);
    try {
      const j = JSON.parse(r.out);
      const errs = j.reduce((a, f) => a + f.errorCount, 0);
      const warns = j.reduce((a, f) => a + f.warningCount, 0);
      if (errs) F.push(`eslint: ${errs} error(s)`);
      I.push(`eslint: ${warns} warning(s)`);
    } catch {
      F.push("eslint did not produce a report");
    }
  } else I.push("eslint not installed in the checkout — skipped");
  const imports = sh("git", ["grep", "-hoE", `(from|import|require\\()[[:space:]]*\\(?["'][^"']+["']`, "--", "*.ts", "*.tsx", "*.js", "*.mjs", "*.cjs", "*.css"]).out;
  /* required by the framework, never imported by name */
  const IMPLICIT = new Set(["react-dom"]);
  for (const dep of Object.keys(pkg.dependencies || {})) {
    if (IMPLICIT.has(dep)) continue;
    const esc = dep.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    if (!new RegExp(`["']${esc}(/[^"']*)?["']`).test(imports)) F.push(`dependency "${dep}" is imported nowhere`);
  }
  results.push({ id: 24, title, catches, status: F.length ? "FAIL" : "PASS", findings: F, info: I });
})();

/* 25 */
await (async () => {
  if (!want(25)) return;
  const F = [];
  const I = [];
  /* every run that carried the WebGL hook: the suite's visits and the WebGL runs */
  const runs = [
    ...Object.entries(visits).map(([k, v]) => ({ label: `${k.split("@")[0]} @${k.split("@")[1]}`, route: k.split("@")[0], width: Number(k.split("@")[1]), ...(v.glData || { gl: null, scripts: [] }) })),
    ...Object.values(glRuns),
  ];
  const kinds = new Map();
  const kind = async (url) => {
    if (!kinds.has(url)) {
      const t = (await http(toBase(url))).text || "";
      kinds.set(url, { three: THREE_CODE.test(t), r3f: REACT_THREE_CODE.test(t), gl: GL_CALL_CODE.test(t), gz: gzipSync(Buffer.from(t)).length });
    }
    return kinds.get(url);
  };
  const kb = (b) => `${(b / 1024).toFixed(1)}KB`;
  /* THE SCENE CHUNK (2026-09-16): every same-site script the allowed profile
     requests on / that no other profile of / requests — what the one allowed
     profile adds is the scene's own code, whatever the bundler names it — and
     every script that is three.js or asks for a WebGL context. */
  const home = runs.filter((r) => r.route === "/" && Array.isArray(r.scripts));
  const urlsOf = (r) => (r.scripts || []).filter((s) => isSameSite(s.url)).map((s) => s.url);
  const otherUrls = new Set(home.filter((r) => !glAllowed(r)).flatMap(urlsOf));
  const sceneOnly = new Set(home.filter(glAllowed).flatMap(urlsOf).filter((u) => !otherUrls.has(u)));
  const sceneUrls = new Set();
  let allowedRuns = 0;
  for (const run of runs) {
    if (!Array.isArray(run.gl)) {
      F.push(`${run.label}: the WebGL hook did not report${run.error ? ` (${run.error})` : ""} — unsure is a failure`);
      continue;
    }
    /* K7/H3: allowed only with a FINE pointer, no touch, no Save-Data */
    const allowed = glAllowed(run);
    if (allowed) allowedRuns++;
    const why =
      run.route !== "/" ? "WebGL belongs to the homepage hero and nowhere else"
      : run.reduced ? "never under reduced motion"
      : run.saveData ? "never with Save-Data on"
      : run.phone || run.touch || (run.pointer && run.pointer !== "fine") ? `never on a touch device — a ${run.pointer || "coarse"} pointer at ${run.width}px gets the poster`
      : run.width < 1025 ? `never at ${run.width}px: phones and tablets get the poster`
      : "only at >=1025px with a fine pointer, no touch, no Save-Data and no reduced motion";
    /* a profile that does not emulate what it claims proves nothing */
    if (run.touch && run.pointer !== "coarse") F.push(`${run.label}: the tablet profile reports a ${run.pointer} pointer, not a coarse one — unsure is a failure`);
    if (run.saveData && !run.saveDataSeen) F.push(`${run.label}: the page does not see Save-Data (navigator.connection.saveData is false) — unsure is a failure`);
    if ("input" in run && !run.input) F.push(`${run.label}: no spot free of controls for the first pointer input — the input-triggered path went untested; unsure is a failure`);
    /* the desktop profile must BE the allowed one, or the positive case is never tested */
    if (run.route === "/" && run.width >= 1025 && !run.reduced && !run.phone && !run.touch && !run.saveData && run.pointer !== "fine")
      F.push(`${run.label}: the desktop profile reports a ${run.pointer} pointer, not a fine one — the scene's own profile went untested; unsure is a failure`);
    /* every context: this frame's, a worker's (reported into it), and each
       frame's the page made; a third party's frame is listed, not judged */
    const reqs = [...run.gl.map((g) => ({ ...g, where: g.where || "the page" }))];
    const mirrored = new Set(run.gl.map((g) => g.id).filter(Boolean));
    for (const f of run.frames || []) {
      if (!f.ours) {
        if (f.gl?.length) I.push(`${run.label}: ${f.gl.length} WebGL request(s) in a third-party frame ${f.url} — not this site's code`);
        continue;
      }
      if (!Array.isArray(f.gl)) {
        /* removed before it could be read: a frame that inherits the page's
           origin mirrored every request into the page's own log as it made it
           (glHook), so those are already in run.gl. Any other unread frame —
           still attached, or on another origin the page itself made — is unsure. */
        if (f.detached && f.inherits) I.push(`${run.label}: the frame ${f.url} was removed before it could be read — it shared the page's origin, so any WebGL request it made is in the page's own log`);
        else F.push(`${run.label}: the frame ${f.url} could not be read — unsure is a failure`);
      } else reqs.push(...f.gl.filter((g) => !mirrored.has(g.id)).map((g) => ({ ...g, where: g.where ? `${g.where} in the frame ${f.url}` : `the frame ${f.url}` })));
    }
    if (reqs.length && !allowed)
      F.push(`${run.label}: ${reqs.length} WebGL context request(s) — ${[...new Set(reqs.map((g) => `${g.type} in ${g.where}${g.stack ? ` from ${g.stack}` : ""}`))].slice(0, 8).join("; ")} — ${why}`);
    const found = [];
    for (const sc of (run.scripts || []).filter((x) => isSameSite(x.url))) {
      const k = await kind(sc.url);
      if (k.r3f) F.push(`${run.label}: requests ${short(sc.url)}, a @react-three chunk — the scene is three.js core, never React Three Fiber (SPEC §7)`);
      const scene = k.three || k.gl || sceneOnly.has(sc.url);
      if (!scene) continue;
      found.push(`${short(sc.url)} ${kb(k.gz)} gzipped at ${Math.round(sc.start)}ms${k.three ? " (three.js)" : k.gl ? " (asks for WebGL)" : " (only in this profile)"}`);
      if (!allowed) F.push(`${run.label}: requests ${short(sc.url)}, ${k.three ? "a three.js chunk" : "a chunk of the WebGL scene"} (${kb(k.gz)} gzipped) — ${why}`);
      else {
        sceneUrls.add(sc.url);
        if (!run.loadEnd || sc.start < run.loadEnd) F.push(`${run.label}: the scene chunk ${short(sc.url)} is requested at ${Math.round(sc.start)}ms, before the load event ended (${Math.round(run.loadEnd)}ms) — the scene is imported after load, never initial JavaScript`);
      }
    }
    /* THE POSITIVE CASE (2026-09-16): where WebGL is allowed, the scene runs —
       a context the browser grants, its canvas inside [data-hero-field], and
       the field marked data-scene-ready once it has drawn. Every "never" rule
       above passes on a scene that is silently dead; this is the one that
       fails it. */
    if (allowed) {
      if (!reqs.length) F.push(`${run.label}: no WebGL context was created — at >=1025px with a fine pointer the hero's scene runs, and one that never starts is silently dead`);
      else if (!reqs.some((g) => g.granted)) F.push(`${run.label}: ${reqs.length} WebGL context request(s), none granted by the browser — the scene could not be tested; unsure is a failure`);
      if (!run.field) F.push(`${run.label}: there is no [data-hero-field] on / — the scene has nowhere to draw`);
      else {
        if (!run.fieldCanvases) F.push(`${run.label}: no canvas inside [data-hero-field] — the scene draws in the field, over the poster`);
        if (!run.sceneReady) F.push(`${run.label}: [data-hero-field] never got data-scene-ready — the scene did not draw its first frame`);
      }
    }
    I.push(
      `${run.label}: ${reqs.length} WebGL request(s)${reqs.length ? ` (${reqs.filter((g) => g.granted).length} granted)` : ""} (page, workers and ${(run.frames || []).length} frame(s)), ${run.canvases} canvas element(s)${run.fieldCanvases ? `, ${run.fieldCanvases} in the field` : ""}${run.sceneReady ? ", data-scene-ready" : ""}, ${(run.scripts || []).length} script(s), a ${run.pointer} pointer${run.saveDataSeen ? ", Save-Data on" : ""}${"input" in run ? ", after a first input" : ""}${allowed ? " — the allowed profile" : ""}${found.length ? `; scene ${found.join(", ")}` : ", no scene chunk"}`,
    );
  }
  if (!allowedRuns) F.push("no run of / at >=1025px with a fine pointer, no touch, no Save-Data and no reduced motion was made — the scene's positive case went untested; unsure is a failure");
  /* the scene chunk's weight: every scene script the allowed profile requested, once each */
  if (sceneUrls.size) {
    let total = 0;
    const parts = [];
    for (const u of sceneUrls) {
      const k = await kind(u);
      total += k.gz;
      parts.push(`${short(u)} ${kb(k.gz)}`);
    }
    if (total > SCENE_MAX_GZ) F.push(`the scene chunk is ${kb(total)} gzipped (${parts.join(", ")}) — the budget is ${kb(SCENE_MAX_GZ)} for the script that asks for the context and the three.js code it imports`);
    I.push(`the scene chunk: ${kb(total)} gzipped in ${sceneUrls.size} file(s) — ${parts.join(", ")}; the budget is ${kb(SCENE_MAX_GZ)}`);
  }
  /* Every font a page preloads is one THAT page renders — read per route, from
     the preload links present once the page has settled (a prefetched route's
     payload can add some), against the page's own @font-face rules and faces. */
  const w8 = (w) => String(w || "400").split(/\s+/).map((x) => (x === "normal" ? "400" : x === "bold" ? "700" : x)).join(" ");
  for (const route of ROUTES) {
    const vs = Object.entries(visits).filter(([k]) => k.split("@")[0] === route).map(([, v]) => v);
    /* the same rule is read at every width: once each */
    const rules = [...new Map(vs.flatMap((v) => v.fontFaceRules).map((r) => [`${r.family}|${r.weight}|${r.style}|${r.src}`, r])).values()];
    const loaded = new Set(vs.flatMap((v) => v.fontFaces.filter((f) => f.status === "loaded").map((f) => `${f.family.toLowerCase()}|${w8(f.weight)}|${f.style}`)));
    for (const href of new Set(vs.flatMap((v) => v.fontPreloads))) {
      const file = String(href).split("/").pop();
      const faces = rules.filter((r) => r.src.includes(file));
      if (!faces.length) {
        F.push(`${route}: preloads ${file}, which no @font-face on this page uses — a download for nothing`);
        continue;
      }
      const used = faces.filter((r) => loaded.has(`${r.family.toLowerCase()}|${w8(r.weight)}|${r.style || "normal"}`));
      if (!used.length) F.push(`${route}: preloads ${file} (${faces[0].family} ${faces.map((r) => w8(r.weight)).join("/")}), which nothing on this page renders`);
      else I.push(`${route}: preloads ${file} — ${used.map((r) => `${r.family} ${w8(r.weight)}`).join(", ")}, rendered`);
    }
  }
  results.push({
    id: 25,
    title: "WebGL only in the homepage hero's scene — at >=1025px with a fine pointer, no touch, no Save-Data, no reduced motion — and there it runs; three.js nowhere else; the scene chunk at most 180KB gzipped, after load; every preloaded font is one its page renders",
    catches: "a canvas or three.js on a phone, a touch tablet, at 1024, with Save-Data, under reduced motion or on another page; a scene that is silently dead at 1440; a scene chunk over 180KB, or requested before the load event; a preloaded font nothing uses — Instrument Sans once, then the other design's faces on / through the 404's root layout and on the inner pages through a prefetch of /",
    status: F.length ? "FAIL" : "PASS",
    findings: [...new Set(F)],
    info: I,
  });
})();

/* 27 */
check(27, "No template, placeholder or generated faces — a person's picture is a real photograph", "the ten template avatars d64ef52 restored as 'placeholder illustrations'", (F, I) => {
  /* A file named for what it is: avatar-*, placeholder, generated, fake, a face drawing. */
  const FAKE = /(^|[\/_.-])(avatars?|placeholders?|generated|fake|faces?|illustrations?|default-user|user-default)([-_.\d]|$)/i;
  const PHOTO = /\.(jpe?g|png|webp|avif)$/i;
  const file = (src) => decodeURIComponent(src).replace(/^.*[?&]url=/, "").replace(/[?&#].*$/, "");
  const seen = new Set();
  const once = (key, line) => {
    if (seen.has(key)) return;
    seen.add(key);
    F.push(line);
  };
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const img of v.allImages) if (FAKE.test(file(img.src))) once(`${route}|name|${file(img.src)}`, `${route}: ${short(file(img.src))} is named as a placeholder or avatar`);
    for (const src of v.people.images) {
      const f = file(src);
      if (!PHOTO.test(f)) once(`${route}|photo|${f}`, `${route}: ${short(f)} sits in a person card and is not a photograph`);
    }
    if (v.people.emptySlots) once(`${route}|slots`, `${at(k)}: ${v.people.emptySlots} empty photo frame(s) — the slot should not render without a photograph`);
    /* a pending member is shown with initials — text — never a photo or a drawing (decided 2026-09-15) */
    for (const c of v.people.cards || [])
      if (c.pending && c.pictures) once(`${route}|pending|${c.name}`, `${at(k)}: the pending card "${c.name}" holds ${c.pictures} picture(s) — a member without a verified profile is shown with initials, never a photo or a drawing`);
    const pending = (v.people.cards || []).filter((c) => c.pending).length;
    if (v.people.fallback) I.push(`${at(k)}: no [data-person-card] markers; checked the images inside #team`);
    else if (v.people.marked) I.push(`${at(k)}: ${v.people.marked} person card(s), ${pending} pending, ${v.people.images.length} picture(s)`);
  }
});

/* 26 */
check(26, "Headings step down one level at a time; title, description, canonical and robots are right", "a skipped heading level; a page with no description or the wrong canonical", (F) => {
  for (const route of ROUTES) {
    const v = visits[`${route}@${WIDTHS[0]}`];
    let prev = 0;
    let skips = 0;
    for (const h of v.headings) {
      if (prev && h.level > prev + 1 && skips++ < 3) F.push(`${route}: h${prev} → h${h.level} skips a level at "${h.text}"`);
      prev = h.level;
    }
    const t = v.meta.title || "";
    if (route === "/" ? !t.includes("Bolt Fusion Tech") : !t.endsWith(" | Bolt Fusion Tech")) F.push(`${route}: the title "${t}" does not follow "%s | Bolt Fusion Tech"`);
    const d = v.meta.description || "";
    if (!d) F.push(`${route}: no meta description`);
    else if (d.length < 50 || d.length > 160) F.push(`${route}: the meta description is ${d.length} characters (50–160)`);
    if (!v.meta.canonical) F.push(`${route}: no canonical link`);
    else {
      const c = new URL(v.meta.canonical);
      if (baseUrl.host === PROD_HOST && c.origin !== PROD_ORIGIN) F.push(`${route}: the canonical points at ${c.origin}`);
      if (c.pathname.replace(/\/$/, "") !== route.replace(/\/$/, "")) F.push(`${route}: the canonical path is ${c.pathname}`);
    }
    if (/noindex|nofollow/i.test(v.meta.robots || "")) F.push(`${route}: meta robots is "${v.meta.robots}"`);
  }
});

/* 30 — content parity: the inventory is a test, not a document.
   scripts/content-inventory.json, per route, a list of items; each item's
   needles are matched against the page's SERVED HTML (scripts stripped,
   entities decoded, whitespace ignored). An item is
     required  every needle is there;
     cut       no needle is there (with its reason, `cut`);
     retired   no longer checked either way (with its reason, `retired`) —
               printed, so the decision stays visible.
   Options on an item (2026-09-16): `scope` — "header", "footer" or "main"
   matches only inside that part of the page (a link cut from the navigation
   may still be a word in the page); `match: "word"` matches whole words, with
   the text's spaces kept ("Expo" is not "export"); `ignoreCase`.
   `sets` holds item lists that routes include ({ "include": "name" }), and
   `awaiting` holds the inventory of a page not yet published — printed, and
   required the moment the page is in the sitemap, where it must move into
   `routes`. Adding a route is data only. */
await (async () => {
  if (!want(30)) return;
  const title = "Every inventoried piece of content is on its page, and nothing cut comes back";
  const catches =
    "a redesign losing content silently; a cut or retired claim coming back — the old canonical line, an unconfirmed technology (Kubernetes, Kafka, RabbitMQ), a stack item the evidence dropped (Expo, Supabase, Whisper, FastAPI), an internal repository's name, \"Book a call\"";
  const F = [];
  const I = [];
  let inv;
  try {
    inv = JSON.parse(await readFile(new URL("./content-inventory.json", import.meta.url), "utf8"));
  } catch (e) {
    results.push({ id: 30, title, catches, status: "FAIL", findings: [`scripts/content-inventory.json could not be read (${e.message})`], info: [] });
    return;
  }
  const SCOPES = {
    page: null,
    header: /<header\b[^>]*\bid="masthead"[^>]*>[\s\S]*?<\/header>/i,
    footer: /<footer\b[^>]*>[\s\S]*?<\/footer>/i,
    main: /<main\b[^>]*>[\s\S]*?<\/main>/i,
  };
  const STATUSES = new Set(["required", "cut", "retired"]);
  const sets = inv.sets || {};
  const expand = (rows, where) =>
    (Array.isArray(rows) ? rows : []).flatMap((r) => {
      if (r && typeof r === "object" && "include" in r) {
        if (!Array.isArray(sets[r.include])) {
          F.push(`${where}: includes the set "${r.include}", which the inventory does not define — unsure is a failure`);
          return [];
        }
        return sets[r.include];
      }
      return [r];
    });
  const listed = Object.keys(inv.routes || {});
  const awaiting = inv.awaiting || {};
  for (const r of ROUTES) if (!listed.includes(r) && !(r in awaiting)) F.push(`${r} is in the sitemap but has no inventory — every public page needs one before it ships`);
  for (const [r, a] of Object.entries(awaiting)) {
    const rows = expand(a.rows, `awaiting ${r}`);
    const needles = rows.reduce((n, row) => n + (row.needles || []).length, 0);
    if (listed.includes(r)) F.push(`${r} is inventoried under both "routes" and "awaiting" — one page, one inventory`);
    else if (ROUTES.includes(r)) F.push(`${r} is in the sitemap and its inventory is still under "awaiting" — move its ${rows.length} item(s) into "routes", so its content is checked`);
    else I.push(`${r}: awaiting ${a.by || "its page"} — ${rows.length} item(s), ${needles} needle(s), required once it is published: ${rows.map((x) => x.item).join("; ")}`);
  }
  for (const r of listed) if (!ROUTES.includes(r)) F.push(`${r} is inventoried but no longer in the sitemap — a page with content has gone`);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  for (const route of listed.filter((r) => ROUTES.includes(r))) {
    const res = await fetch(BASE + route).catch(() => null);
    if (!res || res.status !== 200) {
      F.push(`${route}: answered ${res ? res.status : "nothing"} — cannot check its content`);
      continue;
    }
    const html = await res.text();
    const region = {};
    for (const [name, re] of Object.entries(SCOPES)) {
      const part = re ? (html.match(re) || [null])[0] : html;
      region[name] = part == null ? null : { squashed: servedSquashed(part), words: servedWords(part) };
    }
    let req = 0;
    let present = 0;
    let cutN = 0;
    let retiredN = 0;
    for (const row of expand(inv.routes[route], route)) {
      const name = row.item || "(an item with no name)";
      if (!STATUSES.has(row.status)) {
        F.push(`${route}: "${name}" has status "${row.status}" — an item is required, cut or retired; unsure is a failure`);
        continue;
      }
      if (row.status === "retired") {
        retiredN++;
        if (!String(row.retired || "").trim()) F.push(`${route}: "${name}" is retired with no reason — a retirement says why`);
        else I.push(`${route}: retired — "${name}": ${row.retired}`);
        continue;
      }
      if (row.status === "cut" && !String(row.cut || "").trim()) F.push(`${route}: "${name}" is cut with no reason — a cut says why`);
      const scope = row.scope || "page";
      const mode = row.match || "substring";
      if (!(scope in SCOPES) || (mode !== "substring" && mode !== "word")) {
        F.push(`${route}: "${name}" has scope "${scope}" and match "${mode}" — the scopes are page, header, footer and main, the matches substring and word; unsure is a failure`);
        continue;
      }
      const text = region[scope];
      if (!text) {
        F.push(`${route}: "${name}" is scoped to the ${scope}, and the served HTML has none — cannot check it; unsure is a failure`);
        continue;
      }
      const within = scope === "page" ? "" : ` (in the ${scope})`;
      for (const needle of row.needles || []) {
        const hit =
          mode === "word"
            ? new RegExp(`(?<![\\p{L}\\p{N}])${esc(needle)}(?![\\p{L}\\p{N}])`, row.ignoreCase ? "iu" : "u").test(text.words)
            : row.ignoreCase
              ? text.squashed.toLowerCase().includes(squash(needle).toLowerCase())
              : text.squashed.includes(squash(needle));
        if (row.status === "cut") {
          cutN++;
          if (hit) F.push(`${route}: "${name}" was cut${row.cut ? ` (${row.cut})` : ""}, but "${needle.slice(0, 60)}" is back${within}`);
        } else {
          req++;
          if (hit) present++;
          else F.push(`${route}: "${name}" is missing — "${needle.slice(0, 70)}" is not in the served HTML${within}`);
        }
      }
    }
    I.push(`${route}: ${present}/${req} required needles present, ${cutN} cut needle(s) checked absent, ${retiredN} retired item(s)`);
  }
  results.push({ id: 30, title, catches, status: F.length ? "FAIL" : "PASS", findings: F, info: I });
})();

/* 28 */
check(
  28,
  "The hero is HTML — the headline, the support line, the body and both calls to action — and the poster, never the canvas, is the LCP element, beside the headline and still showing under the scene; the proof strip in the engineering stories is content/metrics.ts",
  "a hero that says something only after a script runs; a canvas, a headline or anything else taking LCP from the poster; a poster that is lazy, unsized or not high priority, hidden or faded once the scene is ready, or behind the headline; a proof figure whose status, label or source is not what content/metrics.ts says",
  (F, I) => {
    /* (a) every hero role, in the served HTML with scripts stripped — and the
       owner's words for the headline, the support line and both calls to action */
    const h = heroRun;
    if (!h || h.error) F.push(`/: the hero could not be read${h?.error ? ` (${h.error})` : ""} — unsure is a failure`);
    else {
      if (!h.servedHero) F.push(`/: the served HTML has no hero section${h.heroId ? ` #${h.heroId}` : ""} — it is built by script`);
      const role = (r) => h.roles.filter((x) => x.role === r);
      const headline = role("headline")[0];
      if (headline && headline.text !== HERO.headline) F.push(`/: the headline reads "${headline.text}" — the owner's is "${HERO.headline}"`);
      const support = role("support line")[0];
      if (!support) F.push("/: no support line follows the headline in the hero");
      else if (support.text !== HERO.support) F.push(`/: the support line reads "${support.text}" — the owner's is "${HERO.support}"`);
      if (!role("body").length) F.push("/: no body paragraph follows the support line in the hero");
      const links = role("call to action");
      for (const want of HERO.ctas) {
        const hit = links.find((l) => l.text === want.text);
        if (!hit) {
          F.push(`/: the hero has no call to action reading "${want.text}" after its body — it has ${links.map((l) => `"${l.text}"`).join(", ") || "none"}`);
          continue;
        }
        const u = new URL(hit.href, BASE);
        if (u.pathname !== want.path || u.hash !== want.hash) F.push(`/: the hero's "${want.text}" goes to ${hit.href} — it goes to ${want.path}${want.hash}`);
      }
      for (const r of h.roles) {
        if (!h.sText.includes(r.text)) F.push(`/: the ${r.role} "${r.text.slice(0, 70)}" is not in the served HTML's hero — it arrives by script`);
        else if (r.href && !h.sLinks.some((l) => l.href === r.href && l.text === r.text)) F.push(`/: the ${r.role} "${r.text}" is not a link to ${r.href} in the served HTML`);
        else I.push(`/: served — ${r.role}: "${r.text.slice(0, 80)}"${r.href ? ` -> ${r.href}` : ""}`);
      }
      /* the proof strip, in the engineering stories (#recent-work) since
         2026-09-16: every row's figure, label, status and source link, served */
      if (!h.work) F.push("/: there is no #recent-work section — the proof strip lives in the engineering stories (SPEC §5)");
      else if (!h.servedWork) F.push("/: the served HTML has no #recent-work section — it is built by script");
      if (h.work && !h.proofList) F.push("/: #recent-work holds no list of [data-metric] rows — the proof strip is missing");
      if (h.proofList && !h.proof.length) F.push("/: the proof strip in #recent-work has no figures");
      for (const p of h.proof) {
        const miss = [!p.figure && "figure", !p.label && "label", !p.status && "shipped/target status", !p.link && "source link"].filter(Boolean);
        if (miss.length) F.push(`/: proof figure ${p.i} ("${p.text.slice(0, 60)}") has no ${miss.join(", no ")}`);
        if (!h.sItems.includes(p.text)) F.push(`/: proof figure ${p.i} ("${p.text.slice(0, 60)}") is not in the served HTML as the page shows it — it arrives or changes by script`);
        else if (p.link && !h.sProofLinks.some((l) => l.href === p.link.href && l.text === p.link.text)) F.push(`/: proof figure ${p.i}'s source link (${p.link.href}) is not in the served HTML`);
        else I.push(`/: served — proof ${p.i}${p.metric ? ` [${p.metric}]` : ""}: ${p.figure} · "${p.label}" · ${p.status} · "${p.link?.text}" -> ${p.link?.href}`);
      }
      /* K1: each proof card says what content/metrics.ts says — its figure,
         label, status and source — and names its metric, so its chip has an
         explicit owner. A card that reads "target" for a shipped metric fails
         here even when check 8 is satisfied by some chip. */
      let metricsTs = null;
      try {
        metricsTs = loadContent("content/metrics.ts").metrics;
        if (!Array.isArray(metricsTs) || !metricsTs.length) throw new Error("it exports no metrics");
      } catch (e) {
        F.push(`/: content/metrics.ts could not be read (${e.message}) — the proof strip cannot be compared with it; unsure is a failure`);
        metricsTs = null;
      }
      if (metricsTs) {
        for (const p of h.proof) {
          const m = (p.metric && metricsTs.find((x) => x.id === p.metric)) || metricsTs.find((x) => x.value === p.figure);
          if (!m) {
            F.push(`/: proof figure ${p.i} (${p.figure}${p.metric ? `, data-metric="${p.metric}"` : ""}) is not an entry in content/metrics.ts`);
            continue;
          }
          if (!p.metric) F.push(`/: proof figure ${p.i} (${p.figure}) sits in no [data-metric] row — its chip has no explicit owner`);
          else if (p.metric !== m.id) F.push(`/: proof figure ${p.i} names data-metric="${p.metric}", which content/metrics.ts does not have`);
          if (p.status !== m.status) F.push(`/: proof figure ${p.i} (${m.id}, ${m.value}) reads its status as "${p.status ?? "none"}" — content/metrics.ts says "${m.status}"`);
          const diffs = [];
          if (p.figure !== m.value) diffs.push(`the figure reads "${p.figure}", metrics.ts "${m.value}"`);
          if (p.label !== m.label) diffs.push(`the label reads "${p.label}", metrics.ts "${m.label}"`);
          if (m.href && p.link?.href !== m.href) diffs.push(`the source links to ${p.link?.href ?? "nothing"}, metrics.ts ${m.href}`);
          if (m.source && (p.link?.text ?? "") !== m.source) diffs.push(`the source reads "${p.link?.text ?? ""}", metrics.ts "${m.source}"`);
          if (diffs.length) F.push(`/: proof figure ${p.i} (${m.id}) disagrees with content/metrics.ts — ${diffs.join("; ")}`);
        }
        for (const m of metricsTs) if (!h.proof.some((p) => p.metric === m.id || p.figure === m.value)) F.push(`/: content/metrics.ts "${m.id}" (${m.value}) is not in the proof strip in #recent-work`);
        I.push(`/: the proof strip (#recent-work) compared with content/metrics.ts — ${metricsTs.length} metric(s)`);
      }
      /* (c) the poster's own attributes, as served */
      if (h.posters.length !== 1) F.push(`/: the served HTML has ${h.posters.length} img[data-hero-poster] — there is exactly one poster`);
      for (const p of h.posters) {
        if (!(Number(p.width) > 0 && Number(p.height) > 0)) F.push(`/: the poster has no width and height (width="${p.width}", height="${p.height}") — its box is not reserved before it loads`);
        if (String(p.fetchpriority).toLowerCase() !== "high") F.push(`/: the poster's fetchpriority is "${p.fetchpriority}" — the LCP image is fetchpriority="high"`);
        if (String(p.loading).toLowerCase() === "lazy") F.push('/: the poster is loading="lazy" — the LCP image never waits for layout');
        I.push(`/: served poster — width="${p.width}" height="${p.height}" fetchpriority="${p.fetchpriority}" loading="${p.loading ?? "(eager, unset)"}"`);
      }
    }
    /* (b) the final LCP entry is the poster, by identity */
    for (const r of lcpRuns) {
      if (r.error) {
        F.push(`/ ${r.label}: the LCP run failed (${r.error}) — unsure is a failure`);
        continue;
      }
      const last = r.entries[r.entries.length - 1];
      if (!last) {
        F.push(`/ ${r.label}: no largest-contentful-paint entry was reported — unsure is a failure`);
        continue;
      }
      const isPoster = last.poster || (Boolean(last.url) && last.url === r.posterSrc);
      const file = (last.url || "").split("/").pop();
      const line = `/ ${r.label}: ${last.desc}${file ? ` (${file})` : ""}, entry size ${last.size}px², at ${last.t}ms${r.posterBox ? `; the poster renders ${r.posterBox}` : ""}; ${r.entries.length} entr${r.entries.length === 1 ? "y" : "ies"}`;
      if (isPoster) I.push(line);
      else F.push(`${line} — the final LCP element must be the poster img[data-hero-poster]${last.tag === "canvas" ? ", never the canvas" : ""}`);
      /* (d) H2/K6: the poster after the settle — see visitLcp. Where the scene
         runs, it is read once the scene has drawn: the canvas fades in over the
         poster, and the poster stays rendered, opaque and the field's box. */
      const st = r.state;
      if (!st) {
        F.push(`/ ${r.label}: there is no img[data-hero-poster] on the settled page`);
        continue;
      }
      if (!st.rendered) F.push(`/ ${r.label}: after the settle the poster is not rendered (${st.why}) — an LCP entry is never withdrawn, so only this reading can see it`);
      if (st.opacity < 0.99) F.push(`/ ${r.label}: after the settle the poster is at opacity ${st.opacity.toFixed(2)} — it stays opaque; a canvas fades in over it, it never fades out`);
      if (!st.boxEqual) F.push(`/ ${r.label}: the poster's box (${st.pBox}) is not the field's (${st.fBox}) — the poster fills [data-hero-field]`);
      if (st.coveredBy) F.push(`/ ${r.label}: after the settle ${st.coveredBy} sits on top of the poster — only a canvas with the field's box may`);
      if (st.h1Overlap) F.push(`/ ${r.label}: the poster sits behind the headline — ${st.h1Overlap}px² of it under the h1; the field is beside the headline, never behind it`);
      /* SPEC §7: beside the text at >=1025px, above it below that */
      if (r.width >= 1025 && st.beside === false) F.push(`/ ${r.label}: the poster is not beside the headline — at >=1025px the field is the column to the right of the text (${st.where})`);
      if (r.width < 1025 && st.above === false) F.push(`/ ${r.label}: the poster is not above the headline — below 1025px the field sits above the text (${st.where})`);
      for (const c of st.badCanvases) F.push(`/ ${r.label}: a canvas ${c} — any canvas sits inside [data-hero-field] with the field's box`);
      I.push(
        `/ ${r.label}: settled poster — rendered, opacity ${st.opacity.toFixed(2)}, box ${st.pBox} = field ${st.fBox}, nothing on top, clear of the h1${r.width >= 1025 ? ", beside it" : ", above it"}; ${st.sceneReady ? `read with the scene drawn over it (${st.fieldCanvases} canvas in the field)` : "no scene drawn"}; file ${st.natural}w at DPR ${st.dpr}, stretched ${st.upscale}x to cover the field`,
      );
    }
  },
);

/* 29 */
check(
  29,
  "The performance budget on /: mobile lab LCP at most 1.5s and blocking at most 150ms, desktop LCP at most 0.5s, CLS under 0.005, initial JavaScript at most 260KB gzipped — the hero's scene loads after load and is not initial JavaScript",
  "a homepage grown heavier or slower: font preloads competing with the LCP poster on a phone link, a large synchronous script or import, a layout shift; the 3D scene imported statically, so three.js lands in the initial JavaScript",
  (F, I) => {
    const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
    I.push(`machine load average (1 min): ${perfLoad.before.toFixed(2)} before the runs, ${perfLoad.after.toFixed(2)} after — the timings need a quiet machine`);
    if (!Object.keys(perfRuns).length) F.push("no performance runs were made — unsure is a failure");
    for (const [name, all] of Object.entries(perfRuns)) {
      const prof = PERF_PROFILES[name];
      const bad = all.filter((r) => r.error);
      if (bad.length) F.push(`${prof.label}: ${bad.length} of ${all.length} run(s) failed (${bad[0].error}) — unsure is a failure`);
      const runs = all.filter((r) => !r.error);
      if (!runs.length) continue;
      const m = (k) => med(runs.map((r) => r[k]));
      const each = (k, f) => runs.map((r) => f(r[k])).join(", ");
      const ms = (x) => `${Math.round(x)}`;
      const k1 = (x) => (x / 1024).toFixed(1);
      const c3 = (x) => x.toFixed(3);
      const lcp = m("lcp");
      const tbt = m("tbt");
      const cls = m("cls");
      const js = m("jsInitial");
      const els = [...new Set(runs.map((r) => `${r.lcpEl}${r.lcpPoster ? " [data-hero-poster]" : ""}`))].join(" / ");
      I.push(
        `${prof.label}, median of ${runs.length}: LCP ${ms(lcp)}ms (runs ${each("lcp", ms)}; ${els}) · FCP ${ms(m("fcp"))}ms · blocking ${ms(tbt)}ms (runs ${each("tbt", ms)}; ${m("longtasks")} long task(s)) · CLS ${c3(cls)} (runs ${each("cls", c3)}) · load ${ms(m("load"))}ms · initial JS ${k1(js)}KB gzipped transferred in ${m("jsInitialFiles")} file(s) (runs ${each("jsInitial", k1)}) · all JS by the end ${k1(m("jsAll"))}KB transferred, ${k1(m("jsDecoded"))}KB decoded`,
      );
      const lcpMax = name === "mobile" ? BUDGET.mobileLcp : BUDGET.desktopLcp;
      if (lcp > lcpMax) F.push(`${prof.label}: LCP ${ms(lcp)}ms, over the ${lcpMax}ms budget (runs ${each("lcp", ms)}; ${els})`);
      if (name === "mobile" && tbt > BUDGET.mobileTbt) F.push(`${prof.label}: blocking time ${ms(tbt)}ms, over the ${BUDGET.mobileTbt}ms budget (runs ${each("tbt", ms)})`);
      if (cls >= BUDGET.cls) F.push(`${prof.label}: CLS ${c3(cls)} — the budget is 0.00, and ${BUDGET.cls} or more fails (runs ${each("cls", c3)})`);
      if (js > BUDGET.initialJs) F.push(`${prof.label}: initial JavaScript ${k1(js)}KB gzipped transferred, over the ${BUDGET.initialJs / 1024}KB budget (runs ${each("jsInitial", k1)})`);
      /* THE SCENE AND THE BUDGET (2026-09-16). Initial JavaScript is what is
         requested by the end of the load event (perfRun); the hero's scene
         chunk — three.js, or a script that asks for a WebGL context — is
         imported after load, so it is NOT counted, and that exclusion is
         allowed only because it holds: a scene chunk requested before the load
         event ended is a failure here (and in check 25), whatever the total. */
      const early = new Map();
      const late = new Map();
      for (const r of runs)
        for (const s of r.scripts || []) {
          const k = perfKinds.get(s.url);
          if (!k?.scene) continue;
          (s.start <= r.load ? early : late).set(s.url, { ...k, start: s.start, load: r.load });
        }
      for (const [u, k] of early) F.push(`${prof.label}: the scene chunk ${short(u)} (${k1(k.gz)}KB gzipped) is requested at ${ms(k.start)}ms, before the load event ended (${ms(k.load)}ms) — it would be initial JavaScript; the scene is imported after load (check 25)`);
      I.push(
        late.size
          ? `${prof.label}: scene chunk(s) requested after load, so not initial JavaScript: ${[...late].map(([u, k]) => `${short(u)} ${k1(k.gz)}KB gzipped at ${ms(k.start)}ms (load ${ms(k.load)}ms)`).join(", ")}`
          : `${prof.label}: no scene chunk requested in the ${ms(4000)}ms after load — the scene runs only at >=1025px with a fine pointer, after load`,
      );
    }
  },
);

/* 31 — one design. It guarded the split while two designs coexisted; the owner
   retired the site's old dark design on 2026-09-15, and on 2026-09-16 the
   Techwix clone's design with it: the one design is now the engineering
   redesign, app/site.css (its `bf-` rules), in Barlow and Jost, on every page
   and the 404. Nothing of either retired design comes back — not their
   stylesheets, faces, classes or packages, nor Tailwind. three.js returns for
   the hero's scene alone: under components/field/, imported dynamically. */
check(
  31,
  "One design: every page and the 404 load app/site.css's design and only Barlow and Jost; nothing of the retired designs — the Techwix clone's stylesheet, tw- classes and components, the dark design's stylesheet, faces, classes and packages — and three.js only in the hero's scene",
  "a retired design coming back on any page or in the source — the Techwix stylesheet, a tw- class or a components/techwix import; the dark design's stylesheet, its faces, its classes, [data-reveal], Tailwind or framer-motion — or a second design growing beside the one; three.js outside components/field/ or imported statically, so it lands in the initial JavaScript; a 404 that falls out of the site's layout or answers 200",
  (F, I) => {
    const OURS = /^(barlow|jost)$/i;
    const RETIRED_FACES = /^(inter|satoshi|commit\s*mono)$/i;
    const face = (fam) => String(fam || "").replace(/["']/g, "").replace(/\s+Fallback$/i, "").trim();
    const why = (fam) => (RETIRED_FACES.test(fam) ? "a face of the retired design" : "not one of the site's two faces");
    /* font file names are hashed: a file is known by the @font-face rule that points at it, on any page */
    const familyOf = new Map();
    for (const v of Object.values(visits)) for (const r of v.fontFaceRules) for (const m of r.src.matchAll(/url\(["']?([^"')]+)/g)) familyOf.set(m[1].split("/").pop(), face(r.family));
    for (const [k, v] of Object.entries(visits)) {
      const ours = v.design.sheets.filter((x) => x.design);
      const retiredTw = v.design.sheets.filter((x) => x.retiredTw);
      const retired = v.design.sheets.filter((x) => x.retired);
      const tw = v.design.sheets.filter((x) => x.tailwind);
      if (!ours.length) F.push(`${at(k)}: loads no stylesheet of the site's design (no .bf-header / .bf-wrap / .bf-hero / .bf-main rules — app/site.css) — every page is in the one design`);
      if (retiredTw.length) F.push(`${at(k)}: loads a stylesheet of the retired Techwix design (.tw-root / .tw-hero / .tw-header rules) — ${retiredTw.map((x) => x.href).join(", ")}; the owner's redesign retires app/techwix.css`);
      if (v.design.techwix?.length) F.push(`${at(k)}: ${v.design.techwix.length} element(s) carry the retired Techwix design's tw- classes — e.g. ${[...new Set(v.design.techwix)].slice(0, 4).join("; ")}`);
      if (retired.length) F.push(`${at(k)}: loads a stylesheet of the retired design — ${retired.map((x) => x.href).join(", ")}`);
      if (tw.length) F.push(`${at(k)}: loads Tailwind's output — ${tw.map((x) => x.href).join(", ")}; the design is plain CSS in app/site.css`);
      for (const f of ["Barlow", "Jost"]) if (!v.fontsLoaded.includes(f)) F.push(`${at(k)}: ${f} is not loaded — the site's faces are Barlow and Jost`);
      for (const fam of new Set([...v.fontsDeclared, ...v.fontFaceRules.map((r) => r.family)].map(face)))
        if (!OURS.test(fam)) F.push(`${at(k)}: declares the face "${fam}" — ${why(fam)}`);
      const files = [...new Set(v.fontFiles.map((f) => f.split("/").pop()))].map((f) => ({ f, fam: familyOf.get(f) || "" }));
      for (const x of files)
        if (!OURS.test(x.fam)) F.push(`${at(k)}: requests the font file ${x.f} (${x.fam || "no @font-face on any page names it"}) — ${x.fam ? why(x.fam) : "unsure is a failure"}`);
      if (v.design.retired.length) F.push(`${at(k)}: ${v.design.retired.length} element(s) carry the retired design's classes or attribute — e.g. ${v.design.retired.slice(0, 3).join("; ")}`);
      I.push(`${at(k)}: stylesheets ${v.design.sheets.map((x) => `${x.href}${x.design ? " [design]" : ""}${x.retiredTw ? " [retired: Techwix]" : ""}${x.retired ? " [retired]" : ""}${x.tailwind ? " [tailwind]" : ""}`).join(", ") || "none"}; font files: ${[...new Set(files.map((x) => x.fam || "?"))].join(", ") || "none"}`);
    }

    /* the 404: an unknown URL answers 404 with the site's own page */
    const nf = notFoundRun;
    if (!nf || nf.error) F.push(`the 404 probe did not run${nf?.error ? ` (${nf.error})` : ""} — unsure is a failure`);
    else {
      if (nf.status !== 404) F.push(`${nf.path} answers ${nf.status} — an unknown URL answers 404`);
      if (!nf.masthead) F.push(`${nf.path}: the 404 has no site header — it fell out of the site's layout`);
      if (nf.h1 !== 1) F.push(`${nf.path}: the 404 has ${nf.h1} h1`);
      if (!nf.sheets.some((s) => s.design)) F.push(`${nf.path}: the 404 loads no stylesheet of the site's design`);
      for (const s of nf.sheets) {
        if (s.retiredTw) F.push(`${nf.path}: the 404 loads a stylesheet of the retired Techwix design — ${s.href}`);
        if (s.retired) F.push(`${nf.path}: the 404 loads a stylesheet of the retired design — ${s.href}`);
        if (s.tailwind) F.push(`${nf.path}: the 404 loads Tailwind's output — ${s.href}`);
      }
      if (nf.twMarkup?.length) F.push(`${nf.path}: the 404's markup carries the retired Techwix design's tw- classes — ${nf.twMarkup.slice(0, 4).join(", ")}`);
      I.push(`${nf.path}: ${nf.status}; site header ${nf.masthead ? "present" : "missing"}; ${nf.h1} h1; stylesheets ${nf.sheets.map((s) => `${s.href}${s.design ? " [design]" : ""}${s.retiredTw ? " [retired: Techwix]" : ""}`).join(", ") || "none"}`);
    }

    /* the repository (with --repo): the retired designs' files and source, and three.js's one place */
    if (!REPO) I.push("repository: not scanned — pass --repo to check the tracked files for the retired designs' faces, classes and packages, and where three.js is imported");
    else {
      let files = [];
      try {
        files = execFileSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" }).split("\n").filter(Boolean);
      } catch (e) {
        F.push(`repository: git ls-files failed (${String(e?.message || e).split("\n")[0]}) — unsure is a failure`);
      }
      const fonts = files.filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));
      for (const f of fonts) if (!/barlow|jost/i.test(path.basename(f))) F.push(`repository: tracks the font file ${f} — the site's faces are Barlow and Jost`);
      /* the Techwix design's files: its stylesheet and its pieces (2026-09-16) */
      const twFiles = files.filter((f) => f === "app/techwix.css" || f.startsWith("components/techwix/"));
      if (twFiles.length) F.push(`repository: tracks ${twFiles.length} file(s) of the retired Techwix design — ${twFiles.slice(0, 4).join(", ")}${twFiles.length > 4 ? ` and ${twFiles.length - 4} more` : ""}; every page moves onto app/site.css and they are deleted`);
      /* K12 (2026-09-15): the package rule saw only `from "pkg"`. It now sees a
         dynamic import(), require(), a side-effect import and a subpath
         ("framer-motion/dom", "tailwindcss/preflight"); Tailwind by @tailwind,
         @config and @plugin too. three.js left this list on 2026-09-16: it has
         its own rule below. */
      const PKG = String.raw`(?:framer-motion|motion|@react-three\/[\w.-]+)`;
      const TW = String.raw`(?:tailwindcss|@tailwindcss\/[\w.-]+)`;
      const IMPORTED = (pkg) => new RegExp(String.raw`(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+|\bexport\s+\*\s+from\s*)["'\`]${pkg}(?:\/[^"'\`]*)?["'\`]`);
      const RETIRED_SRC = [
        [/\b(beam-button|corner-glow|cv-section|grain-overlay|logo-chip-breathe|logo-jewel-aurora|faq-item)\b/, "a class of the retired design"],
        [/\bdata-reveal\b/, "the retired reveal attribute"],
        [IMPORTED(PKG), "a package of the retired design"],
        [/next\/font\/local/, "a local font — the site's faces come from next/font/google"],
        [new RegExp(String.raw`@import\s+(?:url\(\s*)?["']?${TW}(?:\/[^"')\s;]*)?|@tailwind\s+[\w-]+|@config\s+["'][^"']*tailwind|@plugin\s+["']@tailwindcss|${IMPORTED(TW).source}`), "Tailwind — the design is plain CSS"],
      ];
      /* every tracked source file but the suite's own (it names all of these) */
      const src = files.filter((f) => !/^(scripts|node_modules|public)\//.test(f) && /\.(tsx?|jsx?|css|scss|mjs|cjs)$/.test(f));
      for (const f of files.filter((x) => /(^|\/)(tailwind|postcss)\.config\.[cm]?[jt]s$/.test(x))) F.push(`repository: tracks ${f} — the retired design's build config (Tailwind went on 2026-09-15)`);
      /* and the manifest itself: a retired package listed is one coming back */
      let manifest = null;
      try {
        manifest = JSON.parse(readFileSync(path.join(REPO, "package.json"), "utf8"));
      } catch (e) {
        F.push(`repository: package.json could not be read (${String(e?.message || e).split("\n")[0]}) — unsure is a failure`);
      }
      const RETIRED_PKG = /^(framer-motion|motion|@react-three\/.+|tailwindcss|@tailwindcss\/.+)$/;
      for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"])
        for (const name of Object.keys(manifest?.[field] || {})) if (RETIRED_PKG.test(name)) F.push(`repository: package.json lists "${name}" in ${field} — a package of the retired design`);
      /* every module specifier in a file, and how it is imported: a type-only
         import is erased; a dynamic import() is its own chunk, loaded when it
         runs; anything else is part of the importing module */
      const specsOf = (text) => {
        const out = [];
        for (const m of text.matchAll(/\bimport\s+(type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?["'`]([^"'`]+)["'`]/g)) out.push({ spec: m[2], how: m[1] ? "type" : "static" });
        for (const m of text.matchAll(/\bexport\s+(type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+["'`]([^"'`]+)["'`]/g)) out.push({ spec: m[2], how: m[1] ? "type" : "static" });
        for (const m of text.matchAll(/\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) out.push({ spec: m[1], how: "dynamic" });
        for (const m of text.matchAll(/\brequire\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) out.push({ spec: m[1], how: "static" });
        return out;
      };
      const tracked = new Set(files);
      const resolve = (from, spec) => {
        const base = spec.startsWith("@/") ? spec.slice(2) : /^\.\.?\//.test(spec) ? path.posix.join(path.posix.dirname(from), spec) : null;
        if (base == null) return null;
        for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", "/index.ts", "/index.tsx", "/index.js"]) if (tracked.has(base + ext)) return base + ext;
        return base;
      };
      const texts = new Map();
      for (const f of src) {
        let text = "";
        try {
          text = readFileSync(path.join(REPO, f), "utf8");
        } catch {
          continue; /* deleted in the working tree but still in the index */
        }
        texts.set(f, text);
        for (const [re, what] of RETIRED_SRC) {
          const m = re.exec(text);
          if (m) F.push(`repository: ${f} holds ${what} — "${m[0]}"`);
        }
        for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']next\/font\/google["']/g))
          for (const name of m[1].split(",").map((s) => s.trim()).filter(Boolean))
            if (!/^(Barlow|Jost)$/.test(name)) F.push(`repository: ${f} loads ${name} from next/font/google — the site's faces are Barlow and Jost`);
        /* the Techwix pieces and stylesheet, imported from outside them */
        if (!f.startsWith("components/techwix/"))
          for (const s of specsOf(text)) {
            const to = resolve(f, s.spec) || "";
            if (s.how !== "type" && (to.startsWith("components/techwix/") || /(^|\/)techwix\.css$/.test(to) || /(^|\/)techwix\.css$/.test(s.spec)))
              F.push(`repository: ${f} imports "${s.spec}" — a piece of the retired Techwix design`);
          }
      }
      /* three.js: ONLY under components/field/, in a module that nothing
         imports statically — HeroScene imports it dynamically, after load
         (SPEC §7; CLAUDE.md, "The hero field"). A static import anywhere puts
         three.js in the initial JavaScript of every page that renders it. */
      const THREE_SPEC = /^(?:three|@types\/three)(?:\/|$)/;
      const threeFiles = [...texts].filter(([, t]) => specsOf(t).some((s) => s.how !== "type" && THREE_SPEC.test(s.spec))).map(([f]) => f);
      for (const f of threeFiles) {
        if (!f.startsWith("components/field/")) F.push(`repository: ${f} imports three.js — it belongs to the hero's scene under components/field/ and nowhere else`);
        for (const [g, t] of texts) {
          if (g === f) continue;
          for (const s of specsOf(t)) {
            if (resolve(g, s.spec) !== f && resolve(g, s.spec) + ".ts" !== f && resolve(g, s.spec) + ".tsx" !== f) continue;
            if (s.how === "static") F.push(`repository: ${g} imports ${f} statically ("${s.spec}") — ${f} imports three.js, so it is imported dynamically, from components/field/HeroScene.tsx, after load`);
            else if (s.how === "dynamic" && g !== "components/field/HeroScene.tsx") F.push(`repository: ${g} imports ${f} dynamically — the scene is imported from components/field/HeroScene.tsx alone`);
          }
        }
      }
      I.push(`repository: ${src.length} source file(s) and ${fonts.length} font file(s) scanned; three.js imported by ${threeFiles.join(", ") || "nothing"}`);
    }
  },
);

/* 32 — "Schedule a Call" (owner, 2026-09-16; SPEC §1 and §8). It replaced
   "Book a call", everywhere, title case: the header's button, and every call
   to action the suite follows by its data-cta — schedule, explore, project —
   reads its words exactly and goes where they say. */
await (async () => {
  if (!want(32)) return;
  const F = [];
  const I = [];
  const said = new Set();
  const once = (key, line) => {
    if (said.has(key)) return;
    said.add(key);
    F.push(line);
  };
  const snip = (s, m) => s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, " ").trim();
  /* (a) "Book a call" nowhere, in any case: each page's served HTML — its
     text, every attribute, the head, the JSON-LD and the page data — each page
     as rendered (text hidden or not, every attribute), the 404 and the llms
     files. "Book a similar build", "Book a strategy call" and "Book a
     technical call" are other phrases. */
  for (const route of ROUTES) {
    const r = await http(toBase(route));
    if (r.status !== 200) {
      F.push(`${route}: answered ${r.status || r.error} — cannot check it; unsure is a failure`);
      continue;
    }
    const html = decodeEntities(r.html || r.text || "");
    const m = BOOK_A_CALL.exec(html);
    if (m) once(`served|${route}`, `${route}: the served HTML says "${snip(html, m)}" — "Book a call" is retired everywhere (owner, 2026-09-16): the words are "Schedule a Call"`);
  }
  for (const [k, v] of Object.entries(visits)) for (const b of v.bookCall || []) once(`dom|${k.split("@")[0]}|${b.where}`, `${at(k)}: ${b.where} says "${b.text}" — "Book a call" is retired everywhere`);
  if (!notFoundRun || notFoundRun.error) F.push(`the 404 probe did not run${notFoundRun?.error ? ` (${notFoundRun.error})` : ""} — unsure is a failure`);
  else if (notFoundRun.bookCall) F.push(`${notFoundRun.path}: the 404 says "${notFoundRun.bookCall}" — "Book a call" is retired everywhere`);
  if (!llmsRun || llmsRun.error) F.push(`the llms files could not be read${llmsRun?.error ? ` (${llmsRun.error})` : ""} — unsure is a failure`);
  else
    for (const f of llmsRun) {
      if (f.status !== 200) F.push(`${f.file} answered ${f.status} — cannot check it; unsure is a failure`);
      const m = BOOK_A_CALL.exec(f.text);
      if (m) F.push(`${f.file} says "${snip(f.text, m)}" — "Book a call" is retired everywhere`);
    }
  /* where a link goes, as a path and a hash */
  const goesTo = (abs, w) => {
    try {
      const u = new URL(abs, BASE);
      return (u.pathname.replace(/\/$/, "") || "/") === w.path && u.hash === w.hash;
    } catch {
      return false;
    }
  };
  /* (b) the header's primary button, on every page at every width: every link
     in header#masthead that is not the navigation or the logo's link home */
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    if (!v.headerButtons) {
      F.push(`${at(k)}: there is no header#masthead — the header's Schedule a Call cannot be found`);
      continue;
    }
    if (!v.headerButtons.length) F.push(`${at(k)}: the header has no primary button — it carries "${CTA_WORDS.schedule.text}" on every page`);
    for (const b of v.headerButtons) {
      if (b.text !== CTA_WORDS.schedule.text) once(`hdr|${route}|${b.text}`, `${at(k)}: the header's primary button reads "${b.text}" — it reads exactly "${CTA_WORDS.schedule.text}"`);
      if (!goesTo(b.abs, CTA_WORDS.schedule)) once(`hdrto|${route}|${b.href}`, `${at(k)}: the header's primary button goes to ${b.href} — it goes to /contact#schedule`);
      if (b.cta !== "schedule") once(`hdrcta|${route}|${b.cta}`, `${at(k)}: the header's primary button is not marked data-cta="schedule" (it has ${b.cta ? `"${b.cta}"` : "none"})`);
    }
  }
  /* (c) every [data-cta]: its kind's words, exactly, and its kind's destination */
  const count = {};
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const c of v.ctas || []) {
      const w = CTA_WORDS[c.kind];
      count[c.kind] = (count[c.kind] || 0) + 1;
      if (!w) {
        once(`kind|${route}|${c.kind}`, `${at(k)}: data-cta="${c.kind}" on "${c.text}" — the kinds are schedule, explore and project; unsure is a failure`);
        continue;
      }
      if (c.text !== w.text) once(`text|${route}|${c.kind}|${c.text}`, `${at(k)}: a [data-cta="${c.kind}"] reads "${c.text}" — every one reads "${w.text}"`);
      if (!goesTo(c.abs, w)) once(`to|${route}|${c.kind}|${c.href}`, `${at(k)}: the [data-cta="${c.kind}"] "${c.text}" goes to ${c.href} — it goes to ${w.path}${w.hash}`);
    }
  }
  /* (d) on /: all three are there */
  for (const w of WIDTHS) {
    const v = visits[`/@${w}`];
    if (!v) continue;
    for (const kind of Object.keys(CTA_WORDS)) if (!(v.ctas || []).some((c) => c.kind === kind)) F.push(`/ @${w}: no [data-cta="${kind}"] — / carries "${CTA_WORDS[kind].text}"`);
  }
  /* (e) where they land: /contact answers 200 and holds #schedule and #project */
  const contact = await http(toBase("/contact"));
  if (contact.status !== 200) F.push(`/contact answers ${contact.status || contact.error} — every Schedule a Call goes nowhere`);
  else for (const id of ["schedule", "project"]) if (!new RegExp(`\\sid="${id}"`).test(contact.html || "")) F.push(`/contact has no element with id="${id}" — /contact#${id} goes nowhere`);
  /* (f) the project form is usable where it lands (2026-09-28): at 1440 it is
     at least PROJECT_FORM_MIN wide. It rendered 203px wide there — a class
     collision with /work's card, which no check measured. */
  const cv = visits["/contact@1440"];
  if (ROUTES.includes("/contact") && WIDTHS.includes(1440)) {
    if (!cv) F.push("/contact @1440 was not visited — the project form's width cannot be read; unsure is a failure");
    else if (!cv.projectForm) F.push("/contact @1440: there is no #project .bf-form — Tell Us About Your Project lands on no form");
    else if (!cv.projectForm.shown) F.push("/contact @1440: the project form (#project .bf-form) is not visible");
    else if (cv.projectForm.width < PROJECT_FORM_MIN)
      F.push(`/contact @1440: the project form (#project .bf-form) is ${cv.projectForm.width}px wide — at 1440 it is at least ${PROJECT_FORM_MIN}px, or the step where a visitor writes to us reads as broken (in ${cv.projectForm.box})`);
    else I.push(`/contact @1440: the project form is ${cv.projectForm.width}px wide (at least ${PROJECT_FORM_MIN}px)`);
  }
  I.push(`calls to action followed: ${Object.entries(count).map(([kind, n]) => `${kind} ×${n}`).join(", ") || "none"}; "Book a call" searched in ${ROUTES.length} served page(s), every rendered visit, the 404 and the llms files`);
  results.push({
    id: 32,
    title: "\"Schedule a Call\" everywhere: no page says \"Book a call\"; the header's button and every schedule call to action read \"Schedule a Call\" and go to /contact#schedule; / carries Explore Our Capabilities and Tell Us About Your Project; the project form on /contact is at least 480px wide at 1440",
    catches: "the retired \"Book a call\" coming back — on a button, in an attribute, in the JSON-LD or the llms files; a call to action relabelled, or pointing somewhere else; a Schedule a Call that lands on nothing; the project form on /contact collapsed to a sliver (it rendered 203px wide at 1440)",
    status: F.length ? "FAIL" : "PASS",
    findings: F,
    info: I,
  });
})();

/* 33 — the honesty contract (SPEC §0.1 and §8b.7, binding). Every capability
   the site shows carries its evidence tier where a reader can see it; robotics
   is Lab and says so, in the owner's words, visibly; and a tier chip is never
   a figure's label — it carries no data-status, which check 8 reads as one. */
check(
  33,
  "The honesty contract: every capability shows its evidence tier; robotics shows its Lab chip and its honesty line, verbatim and visible; no tier chip carries data-status",
  "a capability shown with no evidence tier; robotics' honesty line removed, hidden or reworded, or its Lab chip gone; a tier chip carrying data-status, so check 8 would read it as a figure's shipped/target label",
  (F, I) => {
    const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
    const said = new Set();
    const once = (key, line) => {
      if (said.has(key)) return;
      said.add(key);
      F.push(line);
    };
    for (const [k, v] of Object.entries(visits)) {
      const route = k.split("@")[0];
      const caps = v.capabilities || [];
      const robotics = caps.filter((c) => c.id === "robotics");
      if ((route === "/" || route === "/capabilities") && !robotics.length) F.push(`${at(k)}: no [data-capability="robotics"] — ${route} shows the robotics capability, with its Lab chip and its honesty line`);
      for (const c of caps)
        if (!c.tiers.some((t) => t.seen)) F.push(`${at(k)}: [data-capability="${c.id}"] shows no evidence tier${c.tiers.length ? ` — its ${c.tiers.length} tier chip(s) cannot be seen` : " ([data-tier])"}`);
      for (const c of robotics) {
        const lab = c.tiers.filter((t) => t.tier === "lab");
        if (!lab.length) F.push(`${at(k)}: the robotics capability has no Lab tier chip ([data-tier="lab"]) — robotics is Lab`);
        else if (!lab.some((t) => t.seen)) F.push(`${at(k)}: the robotics capability's Lab chip cannot be seen`);
        const other = c.tiers.filter((t) => t.tier !== "lab").map((t) => t.tier);
        if (other.length) F.push(`${at(k)}: the robotics capability carries the tier(s) ${[...new Set(other)].join(", ")} — it has no delivery evidence, and is Lab alone`);
        const exact = c.honesty.filter((x) => norm(x.text) === norm(ROBOTICS_HONESTY));
        if (!c.honesty.length) F.push(`${at(k)}: the robotics capability has no honesty line ([data-honesty]) — SPEC §8b.7 requires it, verbatim`);
        else if (!exact.length) F.push(`${at(k)}: the robotics honesty line reads "${c.honesty[0].text.slice(0, 140)}" — SPEC §8b.7's words are "${ROBOTICS_HONESTY}"`);
        else if (!exact.some((x) => x.seen)) F.push(`${at(k)}: the robotics honesty line is in the page but a reader cannot see it — it is shown, never hidden`);
      }
      for (const t of v.tierChips || []) {
        if (t.status) once(`st|${route}|${t.tier}|${t.status}`, `${at(k)}: a tier chip ([data-tier="${t.tier}"]${t.where ? ` in ${t.where}` : ""}) carries data-status (${t.status}) — a tier is never a figure's label, and check 8 reads data-status as one`);
        if (!(t.tier in TIER_LABELS)) once(`tier|${route}|${t.tier}`, `${at(k)}: a tier chip says data-tier="${t.tier}" — the tiers are proven, core, capable and lab`);
        else if (t.shown && !new RegExp(`(^|[^\\p{L}])${TIER_LABELS[t.tier]}([^\\p{L}]|$)`, "u").test(t.text)) once(`lbl|${route}|${t.tier}|${t.text}`, `${at(k)}: a [data-tier="${t.tier}"] chip reads "${t.text}" — it says "${TIER_LABELS[t.tier]}"`);
      }
      I.push(`${at(k)}: ${caps.length} capability section(s)${caps.length ? ` (${caps.map((c) => `${c.id}: ${c.tiers.filter((t) => t.seen).map((t) => t.tier).join("+") || "no tier seen"}`).join(", ")})` : ""}; ${(v.tierChips || []).length} tier chip(s)${robotics.length ? `; the robotics honesty line ${robotics.some((c) => c.honesty.some((x) => x.seen && norm(x.text) === norm(ROBOTICS_HONESTY))) ? "shown, verbatim" : "NOT shown verbatim"}` : ""}`);
    }
  },
);

/* ── report ──────────────────────────────────────────────────────────────── */
results.sort((a, b) => a.id - b.id);
const LIMIT = 14;
console.log(`\nverify-site  ${BASE}  ${ROUTES.length} routes × ${WIDTHS.join("/")}  ${started.toISOString()}\n`);
for (const r of results) {
  console.log(`${String(r.id).padStart(2)}  ${r.status}  ${r.title}`);
  console.log(`        catches: ${r.catches}`);
  for (const f of r.findings.slice(0, LIMIT)) console.log(`        ✗ ${f}`);
  if (r.findings.length > LIMIT) console.log(`        … and ${r.findings.length - LIMIT} more (see --json)`);
  if (process.env.VERBOSE) for (const i of r.info) console.log(`        · ${i}`);
  console.log("");
}
const failed = results.filter((r) => r.status === "FAIL");
const skipped = results.filter((r) => r.status === "SKIP");
console.log(`${results.length - failed.length - skipped.length} passed, ${failed.length} failed${failed.length ? `: ${failed.map((r) => r.id).join(", ")}` : ""}${skipped.length ? `, ${skipped.length} skipped: ${skipped.map((r) => r.id).join(", ")}` : ""}`);
if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify({ base: BASE, routes: ROUTES, widths: WIDTHS, started, results, visits, noJs }, null, 1));
process.exit(failed.length ? 1 : 0);
