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
 *             --probe-writes      check 17 also sends unauthenticated PUT/POST to the admin API
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
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
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
const PROBE_WRITES = argv.includes("--probe-writes");
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

  /* 8 ── metrics carry a visible shipped/target label ───────────────────── */
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
  const metrics = figureEls.map((el) => {
    /* the metric's own container: the largest ancestor holding no other figure */
    let box = el;
    while (box.parentElement && box.parentElement !== document.body && figureEls.filter((f) => box.parentElement.contains(f)).length === 1) box = box.parentElement;
    const label = isLabel(box) ? box : [...box.querySelectorAll("*")].find(isLabel);
    return {
      figure: el.textContent.trim(),
      label: label ? label.textContent.trim().toLowerCase() : null,
      context: snip(box, 90),
      section: sectionOf(el),
    };
  });

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
      if (r instanceof CSSFontFaceRule) fontFaceRules.push({ family: r.style.getPropertyValue("font-family").replace(/["']/g, "").trim(), src: r.style.getPropertyValue("src") });
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
  };

  /* 25 ── scripts the page loaded */
  const scripts = performance
    .getEntriesByType("resource")
    .filter((e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name))
    .map((e) => e.name);

  return { visibleTexts, undefinedUses, fontsDeclared, fontsLoaded, fontFiles, fontPreloads, stampedInfo, metrics, images, cards: [...cardEls.values()], jsonld, links, ids, headings, meta, allImages, fontFaces, fontFaceRules, stuckHidden, scripts, people };
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
  const els = await page.evaluate(() => {
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
      out.push({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, color, op, pinned, clipped, underFrame, clipText, size: parseFloat(s.fontSize), weight: parseInt(s.fontWeight, 10) || 400, text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 40) });
      if (out.length >= 700) break;
    }
    window.__vsKeep = keep;
    return out;
  });
  await page.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}" });
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
  const res = { measured: 0, unmeasured: [], fails: [] };
  for (const [idx, e] of els.entries()) {
    const n = now[idx];
    const moved = !n || Math.abs(n.x - e.x) > 1 || Math.abs(n.y - e.y) > 1;
    if (e.clipText || e.pinned || e.clipped || e.underFrame || moved) {
      const why = e.clipText ? "gradient text" : e.pinned ? "fixed or sticky" : e.clipped ? "scrolled out of view in a container" : e.underFrame ? "under an embedded frame" : "moved while measuring";
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
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
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

/* ── one route at one width, JavaScript on ───────────────────────────────── */
async function visit(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, bypassCSP: true });
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

  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await readingSpeedScroll(page);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null)))));
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForTimeout(800);

  await page.waitForTimeout(1700); /* reveals that fired at the end of the scroll finish */
  const data = await page.evaluate(collectInPage);
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
    data.axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { resultTypes: ["violations"] });
      return r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }));
    });
  }
  /* 20 ── last, because it repaints the page */
  if (want(20)) data.contrast = await measureContrast(page);

  data.console = consoleMsgs;
  data.failed = failed;
  await ctx.close();
  return data;
}

async function visitNoJs(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
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
  await ctx.close();
  return r;
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
const visits = {};
const noJs = {};
for (const route of ROUTES)
  for (const w of WIDTHS) {
    process.stderr.write(`  visiting ${route} @${w}\n`);
    visits[`${route}@${w}`] = await visit(browser, route, w);
    if (want(4)) noJs[`${route}@${w}`] = await visitNoJs(browser, route, w);
  }
const widthRuns = {};
if (want(6) || want(7))
  for (const route of ROUTES)
    for (const w of SWEEP_WIDTHS) {
      process.stderr.write(`  sweeping ${route} @${w}\n`);
      widthRuns[`${route}@${w}`] = await visitWidth(browser, route, w);
    }
const focusRuns = {};
if (want(19))
  for (const route of ROUTES) {
    process.stderr.write(`  tabbing through ${route}\n`);
    focusRuns[route] = await visitFocus(browser, route);
  }
const reducedRuns = {};
if (want(21))
  for (const route of ROUTES) {
    process.stderr.write(`  reduced motion ${route}\n`);
    reducedRuns[route] = await visitReduced(browser, route);
  }
const detRuns = {};
if (want(23))
  for (const route of ROUTES) {
    process.stderr.write(`  capturing ${route} twice\n`);
    detRuns[route] = comparePng(await stableCapture(browser, route), await stableCapture(browser, route));
  }
await browser.close();

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
check(8, "Every rendered metric shows a visible shipped/target label", "an unlabelled number — CLAUDE.md: every metric carries a shipped or target label", (F, I) => {
  const seen = new Set();
  for (const [k, v] of Object.entries(visits)) {
    const route = k.split("@")[0];
    for (const m of v.metrics) {
      const key = `${route}|${m.figure}|${m.context}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (m.label) I.push(`${route}: ${m.figure} → ${m.label}`);
      else F.push(`${route}${m.section ? " " + m.section : ""}: "${m.figure}" has no shipped/target label — context: "${m.context}"`);
    }
  }
});

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
  results.push({ id: 14, title: "Structured data parses, has the expected types, and every URL in it works", catches: "the /#recent-work breadcrumb; schema pointing at pages that 404", status: F.length ? "FAIL" : "PASS", findings: [...new Set(F)], info: I });
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
  const a = await http(`${BASE}/admin`);
  const finalPath = a.final ? new URL(a.final).pathname : "";
  I.push(`/admin, signed out: ${a.status} at ${short(a.final || "")}`);
  if (a.status === 200 && !finalPath.startsWith("/admin/login") && !/type="password"/i.test(a.html || "")) F.push("/admin shows a signed-out visitor something other than the sign-in page");
  if (!(/noindex/i.test(a.robots || "") || /<meta[^>]+name="robots"[^>]+noindex/i.test(a.html || ""))) F.push("/admin is not marked noindex");
  const g = await fetch(`${BASE}/api/admin/content`).catch(() => ({ status: 0 }));
  if (g.status === 503) I.push("the admin API answers 503 “Admin not configured” — the admin is switched off on this deployment");
  else if (g.status !== 401 && g.status !== 403) F.push(`GET /api/admin/content with no session → ${g.status}, expected 401`);
  if (PROBE_WRITES) {
    /* Both bodies are invalid on purpose: if the auth guard ever failed, the
       request would still be rejected before anything is written. */
    const p = await fetch(`${BASE}/api/admin/content`, { method: "PUT", headers: { "content-type": "application/json" }, body: "not json — verify-site probe" }).catch(() => ({ status: 0 }));
    if (p.status < 400) F.push(`PUT /api/admin/content with no session → ${p.status}: accepted`);
    else I.push(`PUT /api/admin/content with no session → ${p.status}`);
    const u = await fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: "verify-site-probe.txt", callbackUrl: `${BASE}/api/admin/upload`, clientPayload: null, multipart: false } }) }).catch(() => ({ status: 0 }));
    if (u.status < 400) F.push(`POST /api/admin/upload asking for an upload token with no session → ${u.status}: a token was issued`);
    else I.push(`POST /api/admin/upload asking for an upload token with no session → ${u.status}`);
  } else I.push("write probes skipped — pass --probe-writes to send unauthenticated PUT/POST to the admin API");
  const rb = await http(`${BASE}/robots.txt`);
  for (const p of ["/admin", "/api/"]) if (!new RegExp(`Disallow:\\s*${p}`, "i").test(rb.text || "")) F.push(`robots.txt does not disallow ${p}`);
  results.push({ id: 17, title: "The admin is noindexed and refuses anyone signed out", catches: "an editor or a write endpoint reachable without a session", status: F.length ? "FAIL" : "PASS", findings: F, info: I });
})();

/* 18 */
check(18, "axe finds no serious or critical accessibility violations", "what a screen-reader or keyboard user hits first", (F) => {
  const seen = new Set();
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
    I.push(`${at(k)}: ${v.contrast.measured} measured; not measurable: ${Object.entries(why).map(([w, n]) => `${w} ×${n}`).join(", ") || "none"}`);
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
    if (d.sizeDiffers) F.push(`${route}: the page is a different size on each visit (${d.sizeDiffers})`);
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
  for (const [k, v] of Object.entries(visits)) {
    let three = false;
    for (const u of v.scripts.filter((s) => isSameSite(s))) {
      const r = await http(toBase(u));
      if (r.text && /THREE\.WebGLRenderer|WebGLRenderer|three\.module/.test(r.text)) {
        three = true;
        break;
      }
    }
    if (k.split("@")[0] !== "/" && three) F.push(`${at(k)}: loads three.js — WebGL belongs to the homepage hero only`);
    if (k.split("@")[0] === "/") I.push(`${at(k)}: three.js ${three ? "loaded" : "not loaded"}`);
  }
  const loaded = new Set();
  for (const v of Object.values(visits)) v.fontsLoaded.forEach((f) => loaded.add(f.toLowerCase()));
  const home = visits[`/@${WIDTHS[0]}`];
  for (const href of new Set(Object.values(visits).flatMap((v) => v.fontPreloads))) {
    const file = href.split("/").pop();
    const face = home.fontFaceRules.find((r) => r.src.includes(file));
    if (!face) I.push(`preloaded ${file}: no @font-face found for it`);
    else if (!loaded.has(face.family.toLowerCase())) F.push(`${file} (${face.family}) is preloaded on every page and never used`);
  }
  results.push({ id: 25, title: "three.js loads only on the homepage; no font is preloaded that nothing uses", catches: "the 3D bundle leaking onto other routes; Instrument Sans preloaded and unused", status: F.length ? "FAIL" : "PASS", findings: F, info: I });
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
