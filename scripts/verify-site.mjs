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

/* 25 — WebGL. It is never created at these phone and tablet widths, nor under
   reduced motion at any width. Step 3 ships the poster and no canvas, so there
   is none on / at all: WEBGL_ON_HOME is false. Step 4 sets it to true, and then
   check 25 allows exactly one thing — a context on / at >=1025px with a fine
   pointer and no reduced motion, from a renderer chunk of at most
   RENDERER_MAX_GZ gzipped that is requested after the load event. */
const GL_WIDTHS = [390, 768, 1440];

/* 8 (K9) — check 8 also reads every page at these widths, beyond WIDTHS: a
   figure shown only by the 768–1024 layout was never read. */
const FIGURE_WIDTHS = [768, 1024];
const WEBGL_ON_HOME = false;
const RENDERER_MAX_GZ = 15 * 1024;

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

/* 28 — where the poster must be the LCP element */
const LCP_PROFILES = [
  { width: 390, label: "@390" },
  { width: 390, phone: true, label: "@390 phone (touch, 3x DPR)" },
  { width: 768, label: "@768" },
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
const servedSquashed = (html) =>
  squash(
    decodeEntities(
      html
        .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, "")
        /* an image's alt text is content — it describes the screenshot — so it is
           lifted out of the tag before the tags are dropped */
        .replace(/<img\b[^>]*?\balt="([^"]*)"[^>]*>/gi, " $1 ")
        .replace(/<[^>]+>/g, " "),
    ),
  );

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
function glHook() {
  const log = [];
  Object.defineProperty(window, "__vsGl", { value: log });
  for (const C of [window.HTMLCanvasElement, window.OffscreenCanvas]) {
    if (!C) continue;
    const orig = C.prototype.getContext;
    C.prototype.getContext = function (type, ...rest) {
      if (/webgl/i.test(String(type)))
        log.push({ type: String(type), at: Math.round(performance.now()), stack: String(new Error().stack || "").split("\n").slice(2, 4).map((x) => x.trim()).join(" <- ").slice(0, 160) });
      return orig.call(this, type, ...rest);
    };
  }
}
/* what the hook recorded, and every script the page requested with its start
   time against the load event: a renderer must never be initial JavaScript */
function glReport() {
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    gl: window.__vsGl || null,
    canvases: document.querySelectorAll("canvas").length,
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
    viewport: { width: prof.width, height: prof.width < 768 ? 844 : 900 },
    reducedMotion: prof.reduced ? "reduce" : "no-preference",
    ...(prof.phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}),
  });
  await ctx.addInitScript(glHook);
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000);
  const r = await page.evaluate(glReport);
  await ctx.close();
  return r;
}

/* 28 (a, c) ── the hero as a crawler gets it: the SERVED HTML, scripts, styles
   and templates stripped, parsed in the page and compared with the hero the
   browser renders. The roles are read from the rendered hero — the h1, the
   first paragraph after it, the first link after that, and every list item
   holding a figure — and each must be in the served hero, word for word. */
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
    const h1 = document.querySelector("h1");
    const hero = h1?.closest("section");
    if (!hero) return { error: "no <h1> inside a <section> on / — the hero cannot be found" };
    const sHero = hero.id ? served.getElementById(hero.id) : served.querySelector("h1")?.closest("section");
    const follows = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const items = [...hero.querySelectorAll("li")].filter((li) => /\d/.test(li.textContent));
    const inItem = (el) => items.some((li) => li.contains(el));
    const subtext = [...hero.querySelectorAll("p")].find((p) => follows(h1, p) && !inItem(p) && n(p.textContent));
    const cta = [...hero.querySelectorAll("a[href]")].find((a) => follows(subtext || h1, a) && !inItem(a) && n(a.textContent));
    const roles = [{ role: "headline", text: n(h1.textContent) }];
    if (subtext) roles.push({ role: "subtext", text: n(subtext.textContent) });
    if (cta) roles.push({ role: "call to action", text: n(cta.textContent), href: cta.getAttribute("href") });
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
      sItems: sHero ? [...sHero.querySelectorAll("li")].map((li) => n(li.textContent)) : [],
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
  const r = await page.evaluate(() => {
    const p = document.querySelector("img[data-hero-poster]");
    const b = p?.getBoundingClientRect();
    return { entries: window.__vsLcp || [], posterSrc: p ? p.currentSrc : null, posterBox: b ? `${Math.round(b.width)}x${Math.round(b.height)}` : null };
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
    const initial = js.filter((e) => e.startTime <= loadEnd);
    const sent = (list) => list.reduce((a, e) => a + (e.transferSize || e.encodedBodySize), 0);
    return {
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
     actually rendered them — getComputedStyle only says what was asked for */
  let stamped = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("script, style, noscript, template, svg")) continue;
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
    if (!visible(el)) continue;
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
    let c = img.parentElement;
    while (c && c !== document.body && !c.querySelector("h2, h3")) c = c.parentElement;
    if (!c || c === document.body || cardEls.has(c)) continue;
    const h = c.querySelector("h2, h3");
    cardEls.set(c, {
      title: snip(h, 60),
      screenshotLoaded: [...c.querySelectorAll("img")].filter((i) => /\/projects\//.test(srcOf(i))).every((i) => i.complete && i.naturalWidth > 0),
      writeups: [...new Set([...(c.closest("a[href]") ? [c.closest("a[href]")] : []), ...c.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => new URL(h).pathname.startsWith("/work/")))],
    });
  }

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

  /* 27 ── people: every card that presents a person, and every photo slot */
  const personCards = [...document.querySelectorAll("[data-person-card]")];
  const peopleFallback = !personCards.length && document.getElementById("team");
  const people = {
    marked: personCards.length,
    fallback: Boolean(peopleFallback),
    images: [...(peopleFallback ? peopleFallback.querySelectorAll("img") : personCards.flatMap((c) => [...c.querySelectorAll("img")]))].map((i) => srcOf(i)),
    emptySlots: [...document.querySelectorAll("[data-photo-slot]")].filter((s) => !s.querySelector("img")).length,
    cards: personCards.map((c) => ({ name: (c.querySelector("h1,h2,h3,h4")?.textContent || "").trim(), href: c.getAttribute("href") || null })),
  };

  /* 31 ── which design the page carries. A stylesheet is known by what it
     styles, not by its hashed file name: the site's one design
     (app/techwix.css) by its .tw-root / .tw-hero / .tw-header rules; the
     retired dark design (the old app/globals.css) by its beam button, corner
     glow, content-visibility sections, grain, logo animations, FAQ items and
     [data-reveal] rules; Tailwind, which styled it, by the --tw-* properties
     it emits. The retired design's markup is the same classes and attribute
     in the DOM, and the old homepage's cut About section. */
  const TECHWIX_SEL = /\.tw-(root|hero|header)\b/;
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
    sheets.push({ href: sheet.href ? sheet.href.replace(location.origin, "") : "(inline <style>)", techwix: TECHWIX_SEL.test(text), retired: RETIRED_SEL.test(text), tailwind });
  }
  const RETIRED_MARKUP = ".cv-section, .faq-item, .beam-button, .corner-glow, .grain-overlay, .logo-chip-breathe, .logo-jewel-aurora, [data-reveal], #about";
  const design = { sheets, retired: [...document.querySelectorAll(RETIRED_MARKUP)].map((e) => describe(e)) };

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

  return { visibleTexts, undefinedUses, fontsDeclared, fontsLoaded, fontFiles, fontPreloads, stampedInfo, images, cards: [...cardEls.values()], jsonld, links, ids, headings, meta, metaStrings, allImages, fontFaces, fontFaceRules, stuckHidden, scripts, people, design, logotypeCount };
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
  const isLabel = (e) => /^(shipped|target)$/i.test(e.textContent.trim()) && visible(e);
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
  const statusWraps = [...document.querySelectorAll("[data-status]")].map((el) => {
    const covers = figures.filter((x) => x.nodes.every((n) => el.contains(n)));
    const problem = covers.length > 1 ? `it covers ${covers.length} figures with one chip — a chip labels exactly one` : "";
    return { el, status: el.getAttribute("data-status"), problem, figures: covers.map((x) => x.text), sentence: covers[0]?.sentence || oneLine(el.textContent).slice(0, 160), section: sectionOf(el) };
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
    tokens,
    statusWraps: statusWraps.filter((w) => w.problem).map((w) => ({ status: w.status, problem: w.problem, figures: w.figures, sentence: w.sentence, section: w.section })),
    exemptions: exemptions.map((e) => ({ reason: e.reason, rendered: e.rendered, problem: e.problem, figures: e.figures, sentence: e.sentence, section: e.section })),
    notFigures: notFigures.map((n) => ({ tok: oneLine(n.run.text.slice(n.start, n.end)), reason: n.reason, sentence: sentenceOf(n.run, n.start, n.end) })),
  };
}

/* 4 ── with JavaScript off, is the text there? (runs in the browser) ───── */
function hiddenWithoutJs() {
  const out = [];
  let total = 0;
  for (const el of document.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,td,th,a,button,label,span,div")) {
    if (el.closest("script, style, noscript, template")) continue;
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) continue;
    if (!el.getClientRects().length) continue; /* display:none at this width — by design, not by script */
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
  return { out, total };
}

/* 7 ── the homepage headline: the words on each rendered line, per span */
function headlineLines() {
  const h1 = document.querySelector("#hero h1") || document.querySelector("h1");
  if (!h1) return null;
  const parts = h1.children.length ? [...h1.children] : [h1];
  return parts.map((p) => {
    const words = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
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
    const lines = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - w.top) < 4) last.words.push(w.w);
      else lines.push({ top: w.top, words: [w.w] });
    }
    return lines.map((l) => l.words.join(" "));
  });
}

/* 20 ── WCAG 2.x luminance and contrast */
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrastRatio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/* Contrast against the pixels actually behind the text. One full-page capture
   with every glyph made transparent gives the real ground — particle field,
   gradient or photograph — under each text box; the text colour (converted to
   sRGB by the browser, alpha and ancestor opacity applied) is composited over
   each sampled pixel and the WORST sample is the element's ratio. */
async function measureContrast(page) {
  const els = await page.evaluate((logotype) => {
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
    const out = [];
    const keep = [];
    const frames = [...document.querySelectorAll("iframe")].map((f) => f.getBoundingClientRect());
    for (const el of document.body.querySelectorAll("*")) {
      if (el.closest("script, style, noscript, template, svg, [aria-hidden='true']")) continue;
      if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden") continue;
      let op = 1;
      let pinned = false;
      for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
        const as = getComputedStyle(a);
        op *= parseFloat(as.opacity);
        if (as.position === "fixed" || as.position === "sticky") pinned = true;
      }
      if (op < 0.05) continue;
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
      const cx = r.left + inset("Left"), cy = r.top + inset("Top");
      const cw = Math.max(1, r.width - inset("Left") - inset("Right")), ch = Math.max(1, r.height - inset("Top") - inset("Bottom"));
      out.push({ logotype: !!el.closest(logotype), dx: inset("Left"), dy: inset("Top"), x: cx + scrollX, y: cy + scrollY, w: cw, h: ch, color, op, pinned, clipped, underFrame, clipText, size: parseFloat(s.fontSize), weight: parseInt(s.fontWeight, 10) || 400, text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 40) });
      if (out.length >= 700) break;
    }
    window.__vsKeep = keep;
    return out;
  }, LOGOTYPE);
  /* A full-page capture paints a fixed or sticky box where the CURRENT scroll
     offset puts it, not where a reader ever sees it over that part of the page.
     Found 2026-09-15: at the bottom of a page the headroom header is slid up
     just out of view, and the capture painted it over the text in the band just
     above the last viewport — its white bar, its logo tile and its blue button
     became the "ground" under body text on four pages, while no reader can see
     that header there. Text INSIDE such a box is already unmeasured (pinned,
     above); the box itself is hidden for the capture, so what is sampled under
     the page's text is the page's own ground. No text leaves the measurement,
     and every box hidden is named in the check's info. */
  const hiddenForCapture = await page.evaluate(() => {
    const out = [];
    for (const el of document.body.querySelectorAll("*")) {
      const p = getComputedStyle(el).position;
      if ((p === "fixed" || p === "sticky") && !el.parentElement?.closest("[data-vs-pinned]")) {
        el.setAttribute("data-vs-pinned", "");
        if (el.getClientRects().length) out.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}`);
      }
    }
    return out;
  });
  const captureStyle = await page.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}[data-vs-pinned]{visibility:hidden!important}" });
  await page.waitForTimeout(250);
  const png = PNG.sync.read(await page.screenshot({ fullPage: true }));
  /* where each element is now: anything that moved or was replaced between the
     measurement and the capture is not under the pixels we sampled */
  const now = await page.evaluate(() =>
    (window.__vsKeep || []).map((el) => {
      if (!el.isConnected) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY };
    }),
  );
  /* the page as it was: check 8 reads it next, and hit-tests its chips */
  await captureStyle.evaluate((e) => e.remove());
  await page.evaluate(() => document.querySelectorAll("[data-vs-pinned]").forEach((e) => e.removeAttribute("data-vs-pinned")));
  const res = { measured: 0, unmeasured: [], fails: [], hiddenForCapture };
  for (const [idx, e] of els.entries()) {
    const n = now[idx];
    const moved = !n || Math.abs(n.x - e.x) > e.dx + 1 || Math.abs(n.y - e.y) > e.dy + 1;
    if (e.logotype || e.clipText || e.pinned || e.clipped || e.underFrame || moved) {
      const why = e.logotype ? "the wordmark (WCAG 1.4.3 logotype)" : e.clipText ? "gradient text" : e.pinned ? "fixed or sticky" : e.clipped ? "scrolled out of view in a container" : e.underFrame ? "under an embedded frame" : "moved while measuring";
      res.unmeasured.push({ text: e.text, why });
      continue;
    }
    const a = (e.color[3] / 255) * e.op;
    /* Judged on the 10th-percentile sample: a text box over a particle field
       touches the odd bright speck, and one speck is not what the reader sees.
       A tenth of the box being too light is. */
    const samples = [];
    const nx = Math.min(24, Math.max(2, Math.floor(e.w / 6)));
    const ny = Math.min(8, Math.max(2, Math.floor(e.h / 6)));
    for (let ix = 0; ix < nx; ix++)
      for (let iy = 0; iy < ny; iy++) {
        const px = Math.floor(e.x + ((ix + 0.5) * e.w) / nx);
        const py = Math.floor(e.y + ((iy + 0.5) * e.h) / ny);
        if (px < 0 || py < 0 || px >= png.width || py >= png.height) continue;
        const o = (py * png.width + px) * 4;
        const bg = [png.data[o], png.data[o + 1], png.data[o + 2]];
        const fg = [0, 1, 2].map((k) => a * e.color[k] + (1 - a) * bg[k]);
        samples.push({ c: contrastRatio(lum(...fg), lum(...bg)), bg });
      }
    if (!samples.length) continue;
    samples.sort((x, y) => x.c - y.c);
    const p10 = samples[Math.floor(samples.length * 0.1)];
    const worst = p10.c;
    const worstBg = p10.bg;
    res.measured++;
    const need = e.size >= 24 || (e.size >= 18.66 && e.weight >= 700) ? 3 : 4.5;
    if (worst < need) res.fails.push({ text: e.text, ratio: +worst.toFixed(2), need, color: e.color, bg: worstBg });
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
  const png = PNG.sync.read(await page.screenshot({ fullPage: true }));
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
  await ctx.addInitScript(glHook); /* check 25 */
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
      design: /\.tw-(root|hero|header)\b/.test(css),
      retired: /\.(beam-button|corner-glow|cv-section|grain-overlay|logo-chip-breathe|logo-jewel-aurora|faq-item)\b|\[data-reveal\b/.test(css),
      tailwind: /--tw-/.test(css),
    });
  }
  return { path, status: r.status, masthead: /<header\b[^>]*\bid="masthead"/i.test(html), h1: (html.match(/<h1\b/gi) || []).length, sheets };
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

const browser = await chromium.launch();

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
  const plan = [];
  for (const route of ROUTES) for (const w of GL_WIDTHS) if (!WIDTHS.includes(w)) plan.push([route, { width: w, label: `${route} @${w}` }]);
  plan.push(["/", { width: 390, phone: true, label: "/ @390 phone (touch, 3x DPR)" }]);
  for (const w of GL_WIDTHS) plan.push(["/", { width: w, reduced: true, label: `/ @${w} reduced motion` }]);
  for (const [route, prof] of plan) {
    process.stderr.write(`  webgl ${prof.label}\n`);
    glRuns[prof.label] = { route, ...prof, ...(await visitGl(browser, route, prof).catch((e) => ({ gl: null, scripts: [], error: String(e?.message || e).slice(0, 160) }))) };
  }
}
const focusRuns = {};
if (want(19))
  for (const route of ROUTES) {
    process.stderr.write(`  tabbing through ${route}\n`);
    /* a run that dies is a finding (check 19), not a crash of the whole suite */
    focusRuns[route] = await visitFocus(browser, route).catch((e) => ({ error: String(e?.message || e).split("\n")[0].slice(0, 200) }));
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
    detRuns[route] = await (async () => comparePng(await stableCapture(browser, route), await stableCapture(browser, route)))().catch((e) => ({
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
if (want(31)) {
  process.stderr.write("  an unknown URL, for the 404\n");
  notFoundRun = await probeNotFound().catch((e) => ({ error: String(e?.message || e).slice(0, 200) }));
}
let llmsRun = null;
if (want(8)) {
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
    let registry = [];
    try {
      registry = loadContent("content/figure-labels.ts").figureLabels || [];
    } catch (e) {
      F.push(`content/figure-labels.ts could not be read (${e.message}) — exemptions outside the visible text cannot be checked; unsure is a failure`);
    }
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
await (async () => {
  if (!want(9)) return;
  const F = [];
  const I = [];
  const sitemapWork = ROUTES.filter((r) => /^\/work\/.+/.test(r));
  const linkedFromIndex = new Set();
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const img of v.images) if (!img.loaded) F.push(`${at(k)}: screenshot ${img.src} did not load`);
    if (/^\/work\/.+/.test(route)) continue; /* write-up pages: screenshots checked above, no cards */
    for (const c of v.cards) {
      if (!c.screenshotLoaded) F.push(`${at(k)}: project "${c.title}" — screenshot not loaded`);
      if (!c.writeups.length) F.push(`${at(k)}: project "${c.title}" shows a screenshot but links to no write-up`);
      for (const w of c.writeups) {
        linkedFromIndex.add(new URL(w).pathname);
        const r = await http(toBase(w));
        if (r.status !== 200) F.push(`${at(k)}: project "${c.title}" write-up ${new URL(w).pathname} → ${r.status || r.error}`);
      }
      I.push(`${route}: "${c.title}" → ${c.writeups.map((w) => new URL(w).pathname).join(", ") || "no write-up"}`);
    }
  }
  for (const r of sitemapWork) if (!linkedFromIndex.has(r)) F.push(`${r} is published in the sitemap but no project card links to it`);
  for (const p of linkedFromIndex) if (!sitemapWork.includes(p)) F.push(`${p} is linked as a write-up but missing from the sitemap`);
  results.push({ id: 9, title: "Every published project shows a loaded screenshot and a working write-up link", catches: "a project presented as shipped with nothing behind it", status: F.length ? "FAIL" : "PASS", findings: [...new Set(F)], info: [...new Set(I)] });
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
  /* Person — built from the roster the Team section renders: one node per person
     card, carrying that card's name and profile link, and no empty field */
  {
    const v = visits[`/@${WIDTHS[0]}`];
    if (v?.people) {
      const persons = [];
      for (const raw of v.jsonld) {
        try {
          const j = JSON.parse(raw);
          for (const n of Array.isArray(j) ? j : j["@graph"] || [j]) if ([].concat(n["@type"]).includes("Person")) persons.push(n);
        } catch {
          /* reported by the parse above */
        }
      }
      const cards = v.people.cards || [];
      const key = (name, url) => `${name}|${url}`;
      const cardKeys = new Set(cards.filter((c) => c.href).map((c) => key(c.name, c.href)));
      const ldKeys = new Set(persons.map((p) => key(p.name, [].concat(p.sameAs || [])[0])));
      for (const p of persons) {
        const url = [].concat(p.sameAs || [])[0];
        if (!cardKeys.has(key(p.name, url))) F.push(`/: Person "${p.name}" (${url || "no sameAs"}) is not a person card on the page`);
        for (const [k, val] of Object.entries(p))
          if (val === null || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0))
            F.push(`/: Person "${p.name}" carries an empty ${k} — emit only the fields that exist`);
      }
      for (const c of cards) {
        if (!c.href) F.push(`/: the person card "${c.name}" has no profile link — COPY.md §5 lists only people with a verified LinkedIn`);
        else if (!ldKeys.has(key(c.name, c.href))) F.push(`/: the person card "${c.name}" has no Person node in the structured data`);
      }
      I.push(`/: Person ${persons.length}, person cards ${cards.length}`);
    }
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
  results.push({ id: 14, title: "Structured data parses, has the expected types, and every URL in it works", catches: "the /#recent-work breadcrumb; schema pointing at pages that 404; an FAQPage that is not the FAQ on the page, or whose answers are not in the served HTML; Person nodes that are not the people on the page", status: F.length ? "FAIL" : "PASS", findings: [...new Set(F)], info: I });
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
check(7, "The homepage headline wraps cleanly — no line of it is a single orphaned word", "a headline sized for one line of copy showing another: the H1 became a sentence (COPY.md §1)", (F, I) => {
  for (const [k, v] of Object.entries(widthRuns)) {
    if (!k.startsWith("/@")) continue;
    if (!v.headline) {
      F.push(`${at(k)}: no headline found`);
      continue;
    }
    I.push(`${at(k)}: ${v.headline.map((lines) => lines.length).join(" + ")} line(s)`);
    v.headline.forEach((lines, i) => {
      const last = lines[lines.length - 1] || "";
      if (lines.length > 1 && last.split(" ").length === 1) F.push(`${at(k)}: headline part ${i + 1} ends on a single word, "${last}"`);
    });
  }
});

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
  const canon = org?.description ? org.description.split(/(?<=\.)\s/)[0].trim() : null;
  if (!canon) F.push("no Organization description on / to take the canonical line from");
  else {
    I.push(`canonical line (first sentence of the Organization description): "${canon}"`);
    const places = { "meta description on /": home.meta.description, "og:description on /": home.meta.ogDescription, "OG image alt text": home.meta.ogImageAlt };
    for (const f of ["/llms.txt"]) {
      const r = await http(BASE + f);
      if (r.status !== 200) F.push(`${f} returns ${r.status || r.error}`);
      else places[f] = r.text;
    }
    for (const [where, text] of Object.entries(places)) if (text != null && !text.includes(canon)) F.push(`${where} does not contain it — it says "${String(text).slice(0, 90)}"`);
  }
  results.push({ id: 12, title: "The canonical description is word for word the same everywhere it appears", catches: "the OG image saying one thing and the metadata another", status: F.length ? "FAIL" : "PASS", findings: F, info: I });
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
});

/* 20 */
check(20, "Text meets WCAG AA contrast against the pixels behind it", "text over the particle field, gradients and screenshots, where the flat colour proves nothing", (F, I) => {
  for (const [k, v] of Object.entries(visits)) {
    if (!v.contrast) continue;
    const why = {};
    v.contrast.unmeasured.forEach((u) => (why[u.why] = (why[u.why] || 0) + 1));
    I.push(`${at(k)}: ${v.contrast.measured} measured; not measurable: ${Object.entries(why).map(([w, n]) => `${w} ×${n}`).join(", ") || "none"}; fixed or sticky boxes hidden for the capture: ${(v.contrast.hiddenForCapture || []).join(", ") || "none"}`);
    const seen = new Set();
    for (const f of [...v.contrast.fails].sort((a, b) => a.ratio - b.ratio)) {
      if (seen.has(f.text)) continue;
      seen.add(f.text);
      F.push(`${at(k)}: "${f.text}" ${f.ratio}:1, needs ${f.need}:1 — rgb(${f.color.slice(0, 3).join(",")}) at ${Math.round((f.color[3] / 255) * 100)}% over rgb(${f.bg.join(",")})`);
    }
  }
});

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
check(23, "Two captures of each page are identical once motion is pinned", "anything order- or time-dependent that makes the page differ between visits", (F) => {
  for (const [route, d] of Object.entries(detRuns)) {
    if (d.error) F.push(`${route}: the captures did not finish (${d.error}) — unsure is a failure`);
    else if (d.sizeDiffers) F.push(`${route}: the page is a different size on each visit (${d.sizeDiffers})`);
    else if (d.n) F.push(`${route}: ${d.n} pixel(s) differ (${d.pct.toFixed(4)}%), between y=${d.minY} and y=${d.maxY}`);
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
  const THREE = /WebGLRenderer|three\.module|__THREE__|@react-three/;
  const RENDERER = /getContext\(\s*["'`](?:webgl2?|experimental-webgl)["'`]|WebGL2RenderingContext/;
  const kinds = new Map();
  const kind = async (url) => {
    if (!kinds.has(url)) {
      const t = (await http(toBase(url))).text || "";
      kinds.set(url, { three: THREE.test(t), renderer: RENDERER.test(t), gz: gzipSync(Buffer.from(t)).length });
    }
    return kinds.get(url);
  };
  const kb = (b) => `${(b / 1024).toFixed(1)}KB`;
  for (const run of runs) {
    if (!Array.isArray(run.gl)) {
      F.push(`${run.label}: the WebGL hook did not report${run.error ? ` (${run.error})` : ""} — unsure is a failure`);
      continue;
    }
    const allowed = WEBGL_ON_HOME && run.route === "/" && run.width >= 1025 && !run.reduced && !run.phone;
    const why =
      run.route !== "/" ? "WebGL belongs to the homepage hero and nowhere else"
      : run.reduced ? "never under reduced motion"
      : run.phone || run.width < 1025 ? `never at ${run.width}px: phones and tablets get the poster`
      : "step 3 ships no WebGL on / at all";
    if (run.gl.length && !allowed)
      F.push(`${run.label}: ${run.gl.length} WebGL context request(s) (${[...new Set(run.gl.map((g) => g.type))].join(", ")}) — ${why}; the first from ${run.gl[0].stack || "an unknown caller"}`);
    const found = [];
    for (const sc of (run.scripts || []).filter((x) => isSameSite(x.url))) {
      const k = await kind(sc.url);
      if (k.three) F.push(`${run.label}: requests ${short(sc.url)}, a three.js / @react-three chunk — the field is raw WebGL2, and three.js does not come back`);
      if (!k.renderer) continue;
      found.push(`${short(sc.url)} ${kb(k.gz)} gzipped at ${Math.round(sc.start)}ms`);
      if (!allowed) F.push(`${run.label}: requests ${short(sc.url)}, a WebGL renderer chunk (${kb(k.gz)} gzipped) — ${why}`);
      else {
        if (k.gz > RENDERER_MAX_GZ) F.push(`${run.label}: the renderer chunk ${short(sc.url)} is ${kb(k.gz)} gzipped — the budget is ${kb(RENDERER_MAX_GZ)}`);
        if (!run.loadEnd || sc.start < run.loadEnd) F.push(`${run.label}: the renderer chunk ${short(sc.url)} is requested at ${Math.round(sc.start)}ms, before the load event ended (${Math.round(run.loadEnd)}ms) — it is never initial JavaScript`);
      }
    }
    I.push(`${run.label}: ${run.gl.length} WebGL request(s), ${run.canvases} canvas element(s), ${(run.scripts || []).length} script(s)${found.length ? `; renderer ${found.join(", ")}` : ", no renderer chunk"}`);
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
    title: "No WebGL at 390 or 768 or under reduced motion — and in step 3 none on / at all; no three.js; every preloaded font is one its page renders",
    catches: "a canvas mounted on a phone, a tablet or under reduced motion; the 3D bundle coming back; a renderer chunk over 15KB or in the initial JavaScript; a preloaded font nothing uses — Instrument Sans once, then the other design's faces on / through the 404's root layout and on the inner pages through a prefetch of /",
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
    if (v.people.fallback) I.push(`${at(k)}: no [data-person-card] markers; checked the images inside #team`);
    else if (v.people.marked) I.push(`${at(k)}: ${v.people.marked} person card(s), ${v.people.images.length} picture(s)`);
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

/* 30 — content parity: the inventory is a test, not a document */
await (async () => {
  if (!want(30)) return;
  const F = [];
  const I = [];
  let inv;
  try {
    inv = JSON.parse(await readFile(new URL("./content-inventory.json", import.meta.url), "utf8"));
  } catch (e) {
    results.push({ id: 30, title: "Every inventoried piece of content is on its page", catches: "a redesign losing content silently", status: "FAIL", findings: [`scripts/content-inventory.json could not be read (${e.message})`], info: [] });
    return;
  }
  const listed = Object.keys(inv.routes);
  for (const r of ROUTES) if (!listed.includes(r)) F.push(`${r} is in the sitemap but has no inventory — every public page needs one before it ships`);
  for (const r of listed) if (!ROUTES.includes(r)) F.push(`${r} is inventoried but no longer in the sitemap — a page with content has gone`);
  for (const route of listed.filter((r) => ROUTES.includes(r))) {
    const res = await fetch(BASE + route).catch(() => null);
    if (!res || res.status !== 200) { F.push(`${route}: answered ${res ? res.status : "nothing"} — cannot check its content`); continue; }
    const text = servedSquashed(await res.text());
    let req = 0, present = 0;
    for (const row of inv.routes[route]) {
      for (const needle of row.needles) {
        const hit = text.includes(squash(needle));
        if (row.status === "cut") { if (hit) F.push(`${route}: "${row.item}" was cut${row.cut ? ` (${row.cut})` : ""}, but "${needle.slice(0, 60)}" is back`); }
        else { req++; if (hit) present++; else F.push(`${route}: "${row.item}" is missing — "${needle.slice(0, 70)}" is not in the served HTML`); }
      }
    }
    I.push(`${route}: ${present}/${req} required needles present across ${inv.routes[route].length} items`);
  }
  results.push({ id: 30, title: "Every inventoried piece of content is on its page", catches: "a redesign losing content silently", status: F.length ? "FAIL" : "PASS", findings: F, info: I });
})();

/* 28 */
check(
  28,
  "The hero is HTML, and the poster — never the canvas — is the LCP element",
  "a hero that says something only after a script runs; a canvas, a headline or anything else taking LCP from the poster; a poster that is lazy, unsized or not high priority",
  (F, I) => {
    /* (a) every hero role, in the served HTML with scripts stripped */
    const h = heroRun;
    if (!h || h.error) F.push(`/: the hero could not be read${h?.error ? ` (${h.error})` : ""} — unsure is a failure`);
    else {
      if (!h.servedHero) F.push(`/: the served HTML has no hero section${h.heroId ? ` #${h.heroId}` : ""} — it is built by script`);
      const role = (r) => h.roles.find((x) => x.role === r);
      if (!role("subtext")) F.push("/: no subtext paragraph follows the headline in the hero");
      if (!role("call to action")) F.push("/: no call to action follows the subtext in the hero");
      for (const r of h.roles) {
        if (!h.sText.includes(r.text)) F.push(`/: the ${r.role} "${r.text.slice(0, 70)}" is not in the served HTML's hero — it arrives by script`);
        else if (r.href && !h.sLinks.some((l) => l.href === r.href && l.text === r.text)) F.push(`/: the ${r.role} is not a link to ${r.href} in the served HTML`);
        else I.push(`/: served — ${r.role}: "${r.text.slice(0, 80)}"${r.href ? ` -> ${r.href}` : ""}`);
      }
      if (!h.proof.length) F.push("/: the hero has no proof-strip figures");
      for (const p of h.proof) {
        const miss = [!p.figure && "figure", !p.label && "label", !p.status && "shipped/target status", !p.link && "source link"].filter(Boolean);
        if (miss.length) F.push(`/: proof figure ${p.i} ("${p.text.slice(0, 60)}") has no ${miss.join(", no ")}`);
        if (!h.sItems.includes(p.text)) F.push(`/: proof figure ${p.i} ("${p.text.slice(0, 60)}") is not in the served HTML as the page shows it — it arrives or changes by script`);
        else if (p.link && !h.sLinks.some((l) => l.href === p.link.href && l.text === p.link.text)) F.push(`/: proof figure ${p.i}'s source link (${p.link.href}) is not in the served HTML`);
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
        for (const m of metricsTs) if (!h.proof.some((p) => p.metric === m.id || p.figure === m.value)) F.push(`/: content/metrics.ts "${m.id}" (${m.value}) is not in the hero's proof strip`);
        I.push(`/: the proof strip compared with content/metrics.ts — ${metricsTs.length} metric(s)`);
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
    }
  },
);

/* 29 */
check(
  29,
  "The performance budget on /: mobile lab LCP at most 1.5s and blocking at most 150ms, desktop LCP at most 0.5s, CLS under 0.005, initial JavaScript at most 260KB gzipped",
  "a homepage grown heavier or slower: font preloads competing with the LCP poster on a phone link, a large synchronous script or import, a layout shift",
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
    }
  },
);

/* 31 — one design. It guarded the split while two designs coexisted; the owner
   retired the site's old dark design on 2026-09-15, and it now guards the one:
   every page, the 404 included, is app/techwix.css in Barlow and Jost, and
   nothing of the retired design comes back — not its stylesheet, its faces,
   its classes, its reveal attribute, Tailwind or its packages. */
check(
  31,
  "One design: every page and the 404 load the site's stylesheet and only Barlow and Jost; no Inter, Satoshi or Commit Mono, and no stylesheet, class, attribute or package of the retired design anywhere",
  "the retired dark design coming back on any page or in the source — its stylesheet, its faces, its classes, [data-reveal], Tailwind, framer-motion or three.js — or a second design growing beside the one; a 404 that falls out of the site's layout or answers 200",
  (F, I) => {
    const OURS = /^(barlow|jost)$/i;
    const RETIRED_FACES = /^(inter|satoshi|commit\s*mono)$/i;
    const face = (fam) => String(fam || "").replace(/["']/g, "").replace(/\s+Fallback$/i, "").trim();
    const why = (fam) => (RETIRED_FACES.test(fam) ? "a face of the retired design" : "not one of the site's two faces");
    /* font file names are hashed: a file is known by the @font-face rule that points at it, on any page */
    const familyOf = new Map();
    for (const v of Object.values(visits)) for (const r of v.fontFaceRules) for (const m of r.src.matchAll(/url\(["']?([^"')]+)/g)) familyOf.set(m[1].split("/").pop(), face(r.family));
    for (const [k, v] of Object.entries(visits)) {
      const ours = v.design.sheets.filter((x) => x.techwix);
      const retired = v.design.sheets.filter((x) => x.retired);
      const tw = v.design.sheets.filter((x) => x.tailwind);
      if (!ours.length) F.push(`${at(k)}: loads no stylesheet of the site's design (no .tw-root / .tw-hero / .tw-header rules) — every page is in the one design`);
      if (retired.length) F.push(`${at(k)}: loads a stylesheet of the retired design — ${retired.map((x) => x.href).join(", ")}`);
      if (tw.length) F.push(`${at(k)}: loads Tailwind's output — ${tw.map((x) => x.href).join(", ")}; the design is plain CSS in app/techwix.css`);
      for (const f of ["Barlow", "Jost"]) if (!v.fontsLoaded.includes(f)) F.push(`${at(k)}: ${f} is not loaded — the site's faces are Barlow and Jost`);
      for (const fam of new Set([...v.fontsDeclared, ...v.fontFaceRules.map((r) => r.family)].map(face)))
        if (!OURS.test(fam)) F.push(`${at(k)}: declares the face "${fam}" — ${why(fam)}`);
      const files = [...new Set(v.fontFiles.map((f) => f.split("/").pop()))].map((f) => ({ f, fam: familyOf.get(f) || "" }));
      for (const x of files)
        if (!OURS.test(x.fam)) F.push(`${at(k)}: requests the font file ${x.f} (${x.fam || "no @font-face on any page names it"}) — ${x.fam ? why(x.fam) : "unsure is a failure"}`);
      if (v.design.retired.length) F.push(`${at(k)}: ${v.design.retired.length} element(s) carry the retired design's classes or attribute — e.g. ${v.design.retired.slice(0, 3).join("; ")}`);
      I.push(`${at(k)}: stylesheets ${v.design.sheets.map((x) => `${x.href}${x.techwix ? " [design]" : ""}${x.retired ? " [retired]" : ""}${x.tailwind ? " [tailwind]" : ""}`).join(", ") || "none"}; font files: ${[...new Set(files.map((x) => x.fam || "?"))].join(", ") || "none"}`);
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
        if (s.retired) F.push(`${nf.path}: the 404 loads a stylesheet of the retired design — ${s.href}`);
        if (s.tailwind) F.push(`${nf.path}: the 404 loads Tailwind's output — ${s.href}`);
      }
      I.push(`${nf.path}: ${nf.status}; site header ${nf.masthead ? "present" : "missing"}; ${nf.h1} h1; stylesheets ${nf.sheets.map((s) => `${s.href}${s.design ? " [design]" : ""}`).join(", ") || "none"}`);
    }

    /* the repository (with --repo): the retired design's files and source */
    if (!REPO) I.push("repository: not scanned — pass --repo to check the tracked files for the retired design's faces, classes and packages");
    else {
      let files = [];
      try {
        files = execFileSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" }).split("\n").filter(Boolean);
      } catch (e) {
        F.push(`repository: git ls-files failed (${String(e?.message || e).split("\n")[0]}) — unsure is a failure`);
      }
      const fonts = files.filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));
      for (const f of fonts) if (!/barlow|jost/i.test(path.basename(f))) F.push(`repository: tracks the font file ${f} — the site's faces are Barlow and Jost`);
      const RETIRED_SRC = [
        [/\b(beam-button|corner-glow|cv-section|grain-overlay|logo-chip-breathe|logo-jewel-aurora|faq-item)\b/, "a class of the retired design"],
        [/\bdata-reveal\b/, "the retired reveal attribute"],
        [/from\s+["'](framer-motion|three|@react-three\/[\w-]+)["']/, "a package of the retired design"],
        [/next\/font\/local/, "a local font — the site's faces come from next/font/google"],
        [/@import\s+["']tailwindcss["']/, "Tailwind — the design is plain CSS"],
      ];
      const src = files.filter((f) => /^(app|components|lib|content)\//.test(f) && /\.(tsx?|css|mjs|js)$/.test(f));
      for (const f of src) {
        let text = "";
        try {
          text = readFileSync(path.join(REPO, f), "utf8");
        } catch {
          continue; /* deleted in the working tree but still in the index */
        }
        for (const [re, what] of RETIRED_SRC) {
          const m = re.exec(text);
          if (m) F.push(`repository: ${f} holds ${what} — "${m[0]}"`);
        }
        for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']next\/font\/google["']/g))
          for (const name of m[1].split(",").map((s) => s.trim()).filter(Boolean))
            if (!/^(Barlow|Jost)$/.test(name)) F.push(`repository: ${f} loads ${name} from next/font/google — the site's faces are Barlow and Jost`);
      }
      I.push(`repository: ${src.length} source file(s) and ${fonts.length} font file(s) scanned`);
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
