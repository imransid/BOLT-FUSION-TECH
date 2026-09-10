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
import { writeFile } from "node:fs/promises";

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
const PROD_HOST = "boltfusiontech.com";

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
          return { status: r.status, final: r.url, type, html: type.includes("html") ? await r.text() : null };
        })
        .catch((e) => ({ status: 0, error: String(e?.cause?.code || e?.message || e) })),
    );
  }
  return httpCache.get(url);
}

async function readingSpeedScroll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 150) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
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

  return { visibleTexts, undefinedUses, fontsDeclared, fontsLoaded, fontFiles, fontPreloads, stampedInfo, metrics, images, cards: [...cardEls.values()], jsonld, links, ids };
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

/* ── one route at one width, JavaScript on ───────────────────────────────── */
async function visit(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
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

  const data = await page.evaluate(collectInPage);

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
  data.console = consoleMsgs;
  data.failed = failed;
  await ctx.close();
  return data;
}

async function visitNoJs(browser, route, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
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
      F.push(`${at(k)}: ${m.type} — ${m.text}${m.src ? ` [${m.src.replace(BASE, "")}]` : ""}`);
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
console.log(`${results.length - failed.length} passed, ${failed.length} failed${failed.length ? `: ${failed.map((r) => r.id).join(", ")}` : ""}`);
if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify({ base: BASE, routes: ROUTES, widths: WIDTHS, started, results, visits, noJs }, null, 1));
process.exit(failed.length ? 1 : 0);
