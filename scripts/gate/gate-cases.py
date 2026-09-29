#!/usr/bin/env python3
"""
THE MISUSE CASES — RUN 2 of the gate (2026-09-16, the engineering redesign).

One file holds both halves of every case: the throwaway patch that breaks one
rule, and the finding its check must print. The gate applies every patch to a
COPY of HEAD, builds it once, runs the suite, and requires each case's check to
FAIL with that case's own finding (gate-expect.mjs). The suite's --only list is
DERIVED from this table (`only`), so a case can never run without its check —
validate-next.sh's hand-written list once omitted check 9, and its case could
not fail.

  python3 gate-cases.py only                 the --only list, from the table
  python3 gate-cases.py probe-only           scripts/probe-scene.mjs's --only
                                             list, from PROBE_CASES
  python3 gate-cases.py apply <root> <json>  patch <root>; write the table with
                                             each case's status to <json>

PROBE_CASES (2026-09-29) are the hero scene's: rules that live in pixels over
time, which scripts/probe-scene.mjs checks and the suite cannot. Their check
is `probe:<name>`, read from the probe's --json report, and the gate runs the
probe on the clean HEAD (RUN 1, the control) and on the misuse build (RUN 2)
beside the suite. Their patches go into the same misuse build as every other
case's, so each patch leaves the scene's t = 0 frame alone (the poster and the
first frames it is compared with stay what they are) and each finding names
its own cause — a case must not pass on another case's damage.

A case is
  applied   its patch went in;
  waiting   its target does not exist yet, and the case names the wave that
            brings it (needs: "scene" | "pages") — the gate prints it and cannot
            pass until it runs;
  retired   the rule it tested cannot exist any more (with the reason) —
            printed on every run.
A patch whose anchor is missing and that names no wave ABORTS the gate: a case
that silently stops applying is a case that proves nothing.

Every anchor must occur EXACTLY once (CLAUDE.md, "Scripted edits to shared
files"). Each case's patch is staged and written only if all of it applies.

Cases marked reanchor="pages" anchor on inner-page files the pages wave is
rewriting (/work, /privacy-policy, components/techwix): they apply today and
must be re-anchored when that wave merges.
"""
import base64
import json
import os
import re
import sys

ROOT = "."


class Missing(Exception):
    pass


class Stage:
    """a case's edits, in memory until every one of them applied"""

    def __init__(self):
        self.files = {}

    def read(self, p):
        if p in self.files:
            return self.files[p]
        full = os.path.join(ROOT, p)
        if not os.path.exists(full):
            raise Missing(f"{p} does not exist")
        return open(full, encoding="utf8").read()

    def exists(self, p):
        return p in self.files or os.path.exists(os.path.join(ROOT, p))

    def write(self, p, s):
        self.files[p] = s

    def rep(self, p, a, b):
        s = self.read(p)
        n = s.count(a)
        if n != 1:
            raise Missing(f"{p}: the anchor occurs {n} times, expected 1: {a[:80]!r}")
        self.write(p, s.replace(a, b))

    def rep_first_of(self, p, anchors, make):
        """the first anchor that occurs exactly once; `make(anchor)` is its replacement"""
        s = self.read(p)
        for a in anchors:
            if s.count(a) == 1:
                self.write(p, s.replace(a, make(a)))
                return
        raise Missing(f"{p}: none of {len(anchors)} anchors occurs exactly once")

    def rex(self, p, pat, repl):
        s = self.read(p)
        n = len(re.findall(pat, s))
        if n != 1:
            raise Missing(f"{p}: the pattern matches {n} times, expected 1: {pat}")
        self.write(p, re.sub(pat, repl, s, count=1))

    def append(self, p, text):
        self.write(p, self.read(p) + text)

    def mount(self, name, source):
        """a throwaway client component in components/site, mounted on the homepage"""
        self.write(f"components/site/{name}.tsx", source)
        self.rep("app/page.tsx", 'import SiteShell from "@/components/site/SiteShell";\n', f'import SiteShell from "@/components/site/SiteShell";\nimport {name} from "@/components/site/{name}";\n')
        self.rep("app/page.tsx", '      <SiteShell ground="graphite">\n', f'      <SiteShell ground="graphite">\n        <{name} />\n')

    def flush(self):
        for p, s in self.files.items():
            full = os.path.join(ROOT, p)
            os.makedirs(os.path.dirname(full) or ".", exist_ok=True)
            open(full, "w", encoding="utf8").write(s)


def client(body):
    return '"use client";\n/* THROWAWAY misuse for the gate (scripts/gate/gate-cases.py) — never committed. */\nimport { useEffect } from "react";\n' + body


# ── the patches ─────────────────────────────────────────────────────────────


def p_vanishing_frame(s):
    s.mount("VsVanishingFrame", client(
        "export default function VsVanishingFrame() {\n  useEffect(() => {\n    const f = document.createElement(\"iframe\");\n    document.body.appendChild(f);\n"
        "    const w = f.contentWindow as (Window & typeof globalThis) | null;\n    if (w) {\n      const c = w.document.createElement(\"canvas\");\n      w.document.body?.appendChild(c);\n"
        "      c.getContext(\"webgl2\") || c.getContext(\"webgl\");\n    }\n    f.remove();\n  }, []);\n  return null;\n}\n"))


def p_logotype(s):
    # re-anchored 2026-09-28: onto the panel's body, beside the calendar — the
    # calendar's blurb it anchored on was cut that day (same meaning: a
    # data-logotype on /contact text that is not the wordmark)
    s.rep("app/contact/page.tsx", '              <p className="bf-lead">{c.body}</p>\n', '              <p data-logotype className="bf-lead">{c.body}</p>\n')


def p_faq_ld(s):
    s.rep("app/page.tsx", "content.faq.items : []", "content.faq.items.slice(1).map((f, i) => (i === 0 ? { ...f, a: `${f.a} Changed.` } : f)) : []")


def p_faq_client_only(s):
    s.write("components/site/home/VsClientOnly.tsx", '"use client";\nimport { useEffect, useState } from "react";\nexport default function VsClientOnly({ children }: { children: React.ReactNode }) {\n  const [on, setOn] = useState(false);\n  useEffect(() => setOn(true), []);\n  return on ? <>{children}</> : null;\n}\n')
    s.rep("components/site/home/Faq.tsx", 'import type { SiteContent } from "@/content/site-schema";\n', 'import type { SiteContent } from "@/content/site-schema";\nimport VsClientOnly from "./VsClientOnly";\n')
    # re-anchored 2026-09-28: the answer renders through <FigureText> (its figures are labelled where they sit)
    s.rep("components/site/home/Faq.tsx", '                <FigureText text={item.a} />\n', '                <VsClientOnly>\n                  <FigureText text={item.a} />\n                </VsClientOnly>\n')


def p_person_card(s):
    """a named member's card put back where the team is shown — /about's Team
    section, and the homepage's headcount, in how we work with you since
    2026-09-28 (the Team section left / that day; re-anchored, same meaning)"""
    s.rep("components/site/home/Team.tsx", '            <p className="bf-lead">{team.subtext}</p>\n',
          '            <p className="bf-lead">{team.subtext}</p>\n            <ul>\n              <li>\n                <div data-person-card data-person-status="pending">\n                  <h3>Nadim</h3>\n                </div>\n              </li>\n            </ul>\n')
    s.rep("components/site/home/HowWeWork.tsx", '            <p className="bf-hww__where">{where.lead}</p>\n',
          '            <p className="bf-hww__where">{where.lead}</p>\n            <ul>\n              <li>\n                <div data-person-card data-person-status="pending">\n                  <h3>Nadim</h3>\n                </div>\n              </li>\n            </ul>\n')


def p_admin(s):
    s.write("app/admin/page.tsx", "export default function Admin() {\n  return <main>admin</main>;\n}\n")


def p_cache_lane(s):
    arch = s.read("content/architecture.ts")
    start = arch.find('    {\n      id: "cache",')
    if start < 0 or arch.count('    {\n      id: "cache",') != 1:
        raise Missing('content/architecture.ts: the "cache" lane entry is not there exactly once')
    end = arch.index("    },\n", start) + len("    },\n")
    s.write("content/architecture.ts", arch[:start] + arch[end:])


NOTE = '      <p className="bf-proof__note">{note}</p>'


def p_note_figures(s):
    """8: in the proof strip's note (#recent-work) — an unlabelled 45ms, an empty
    reason; K2 display:contents twice; K8 a chip off the page and one covered;
    K9 a split 51ms, 3X, a figure shown only at 768-1024; K11 a junk reason"""
    s.rep("components/site/ProofStrip.tsx", NOTE,
          '      <p className="bf-proof__note">Every figure here, served in 45ms, comes from a system we shipped. {note} <span data-figure-exempt="">A pilot runs 3 weeks.</span>'
          ' <span style={{ display: "contents" }} data-figure-exempt="A reason long enough to pass every reason test">served in 41ms, 97% of the time</span>.'
          ' <span style={{ display: "contents" }} data-status="shipped">served in 42ms, 96% of the time<span className="bf-figchip">shipped</span></span>.'
          ' <span data-status="shipped">43ms<span className="bf-figchip" style={{ position: "absolute", left: -9999 }}>shipped</span></span>.'
          ' <span data-status="target" style={{ position: "relative" }}>44ms<span className="bf-figchip">target</span><span style={{ position: "absolute", right: 0, top: -4, width: 70, height: 28, background: "#07090d" }} /></span>.'
          ' Latency <span style={{ display: "inline-block" }}>51</span>ms. It runs 3X faster.'
          ' <span className="vs-mid">Answered in 55ms.</span>'
          ' <span data-figure-exempt="asdf asdf asdf asdf qwer">Kickoff in 5 days</span>.</p>')
    s.append("app/site.css", "\n/* throwaway misuse CSS: K9 */\n.vs-mid { display: none; } @media (min-width: 768px) and (max-width: 1024px) { .vs-mid { display: inline; } }\n")


def p_gl_390(s):
    s.mount("VsGlProbe", client('export default function VsGlProbe() {\n  useEffect(() => {\n    if (!window.matchMedia("(max-width: 767px)").matches) return;\n    const c = document.createElement("canvas");\n    if (!c.getContext("webgl2")) c.getContext("webgl");\n  }, []);\n  return null;\n}\n'))


def p_poster_lazy(s):
    s.rep("components/site/home/Hero.tsx", '                  fetchPriority="high"\n', '                  fetchPriority="high"\n                  loading="lazy"\n')


def p_poster_small(s):
    s.rep("components/site/home/Hero.tsx", '                  className="bf-hero__poster"\n', '                  className="bf-hero__poster vs-small"\n')
    s.append("app/site.css", "\n/* throwaway misuse CSS: the poster shrunk, below 1025 only */\n@media (max-width: 1024px) { .bf-hero__poster.vs-small { width: 48px !important; height: 40px !important; } }\n")


def p_heavy_script(s):
    blob = base64.b64encode(os.urandom(420 * 1024)).decode()
    s.write("public/vs-heavy.js", '(function(){var s="%s";var t=performance.now();while(performance.now()-t<400){}window.__vsHeavy=s.length;})();\n' % blob)
    s.rex("app/layout.tsx", r"(\n[ \t]*)(<body\b[^>]*>)", r'\1<head>\1  <script src="/vs-heavy.js" />\1</head>\1\2')


def p_inter_work(s):
    anchors = ['import type { Metadata } from "next";\n']
    s.rep_first_of("app/work/page.tsx", anchors, lambda a: a + 'import { Inter } from "next/font/google";\nexport const vsInter = Inter({ subsets: ["latin"] });\n')


def p_k4_privacy(s):
    s.rep("app/privacy-policy/page.tsx", '<article className="bf-prose bf-prose--legal" aria-labelledby="privacy-title">', '<article className="bf-prose bf-prose--legal cv-section" aria-labelledby="privacy-title">')


def p_k4_work(s):
    s.rep("app/work/page.tsx", '<ul className="bf-work">', '<ul className="bf-work" data-reveal="">')


def p_k4_404(s):
    s.write("app/[...vs404]/page.tsx", "export default function VsCatchAll() {\n  return (\n    <main>\n      <h1>Not a page</h1>\n    </main>\n  );\n}\n")


def p_k5_bottom(s):
    s.rep("components/site/Footer.tsx", '        <a href="#masthead" className="bf-footer__top">', '        <p style={{ color: "#1c2140" }}>Low contrast near the bottom of the page.</p>\n        <a href="#masthead" className="bf-footer__top">')


def p_k5_cap(s):
    s.rep("app/privacy-policy/page.tsx", '<p className="bf-prose__foot">', '<div style={{ columns: 6, fontSize: 12 }}>{Array.from({ length: 1600 }, (_, i) => <p key={i}>ab</p>)}</div>\n            <p className="bf-prose__foot">')


def p_k5_fixed_ground(s):
    s.rep("components/site/home/Faq.tsx", "          ))}\n        </div>\n      </div>\n    </section>",
          '          ))}\n        </div>\n        <div style={{ position: "relative", contain: "paint", marginTop: 24, padding: 24 }}>\n          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, background: "#4c4d56" }} />\n'
          '          <p style={{ position: "relative", color: "#3a3b44" }}>Text over a fixed ground.</p>\n        </div>\n      </div>\n    </section>')


def p_k5_fixed_box(s):
    """20: two fixed boxes. An OPAQUE one (white) is measured against its own
    ground since check 20's extension (2026-09-16), so its grey text fails on
    contrast; a TRANSPARENT one fails because nothing fixed is behind it."""
    s.rep("app/page.tsx", "      </SiteShell>\n", '        <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60, background: "#ffffff", padding: "8px 12px", borderRadius: 8 }}>Chat with us today</div>\n'
          '        <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 60, padding: "8px 12px", color: "#eceff4" }}>Talk to an engineer</div>\n      </SiteShell>\n')


def p_a3(s):
    s.append("app/site.css", "\n/* throwaway misuse CSS: A3, the header's call to action at low contrast */\n.bf-header__cta { color: #2f7de0 !important; -webkit-text-fill-color: #2f7de0 !important; }\n")


def p_k1(s):
    s.rep("components/site/ProofStrip.tsx", "              <StatusChip status={m.status} />\n",
          '              {m.id === "search-response" ? null : <StatusChip status={m.id === "haiku-routing" ? "target" : m.status} />}\n')


def p_k10_title(s):
    s.rep("components/site/home/Hero.tsx", '<div className="bf-hero__field" aria-hidden="true" data-hero-field>', '<div className="bf-hero__field" aria-hidden="true" data-hero-field title="Rendered in 16ms">')


def p_k10_llms(s):
    s.append("public/llms-full.txt", "\nThe cache lane answers in 12ms.\n")


def p_k6(s):
    s.append("app/site.css", "\n/* throwaway misuse CSS: K6, the field behind the headline at >=1025 */\n@media (min-width: 1025px) { .bf-hero__inner { position: relative; } .bf-hero__media { position: absolute; inset: 0; z-index: 0; } .bf-hero__stage { height: 100%; } .bf-hero__field { height: 100%; max-width: none; margin-left: 0; } .bf-hero__text { position: relative; z-index: 1; } }\n")


def p_h2(s):
    s.mount("VsPosterHide", client('export default function VsPosterHide() {\n  useEffect(() => {\n    const t = setTimeout(() => {\n      const p = document.querySelector<HTMLImageElement>("img[data-hero-poster]");\n      if (p) p.style.opacity = "0";\n    }, 400);\n    return () => clearTimeout(t);\n  }, []);\n  return null;\n}\n'))


def p_k7(s):
    """a worker at 768-900; a coarse-pointer tablet from 1300 (the 1366x1024
    run), with `webgl`; and a context on the first pointer move at 1000-1024
    with a fine pointer (the 1024 run). Since the scene is allowed at 1440 with
    a fine pointer (2026-09-16), the first-input case moved from 1440 to 1024:
    it still proves a renderer that waits for input is caught."""
    s.mount("VsGlMore", client(
        "export default function VsGlMore() {\n  useEffect(() => {\n"
        '    if (window.matchMedia("(min-width: 768px) and (max-width: 900px)").matches)\n'
        "      new Worker(URL.createObjectURL(new Blob([\"const c = new OffscreenCanvas(4, 4); c.getContext('webgl');\"], { type: \"text/javascript\" })));\n"
        '    if (window.matchMedia("(pointer: coarse) and (min-width: 1300px)").matches) document.createElement("canvas").getContext("webgl");\n'
        "    const onMove = () => {\n"
        '      if (window.matchMedia("(pointer: fine) and (min-width: 1000px) and (max-width: 1024px)").matches) document.createElement("canvas").getContext("webgl");\n'
        "    };\n    window.addEventListener(\"pointermove\", onMove, { once: true });\n    return () => window.removeEventListener(\"pointermove\", onMove);\n  }, []);\n  return null;\n}\n"))


def p_a1(s):
    s.rep("app/site.css", "  scroll-padding-top: calc(var(--bf-header-h) + 16px);\n", "  scroll-padding-top: 0;\n")
    if s.exists("app/techwix.css"):
        s.rep("app/techwix.css", "  scroll-padding-top: calc(var(--header-h) + 12px);\n", "  scroll-padding-top: 0;\n")


def p_k12_dynamic(s):
    s.rep("components/site/StatusChip.tsx", 'import type { MetricStatus } from "@/content/schema";\n', 'import type { MetricStatus } from "@/content/schema";\n/* const lazyMotion = () => import("framer-motion/dom"); */\n')


def p_k12_package(s):
    s.rep("package.json", '    "react-dom": "19.2.3",\n', '    "react-dom": "19.2.3",\n    "framer-motion": "12.23.24",\n')


def p_k12_tailwind(s):
    s.append("app/site.css", "\n/* @tailwind utilities; */\n")


def p_feature_label(s):
    s.rep("components/site/ProjectCard.tsx", "        ? `Delivered project: features built by Bolt Fusion for ${p.client}`\n",
          '        ? p.id === "bazzile"\n          ? `Delivered project: built by Bolt Fusion for ${p.client}`\n          : `Delivered project: features built by Bolt Fusion for ${p.client}`\n')


# ── new for the redesign (2026-09-16), one per new rule ─────────────────────


def p_book_a_call(s):
    s.rep("components/site/Header.tsx", "            {navigation.cta.label}\n          </a>\n          <MobileDrawer", "            Book a call\n          </a>\n          <MobileDrawer")


def p_scene_coarse(s):
    s.rep("components/field/HeroScene.tsx", 'const DESKTOP = "(pointer: fine) and (min-width: 1025px)";', 'const DESKTOP = "(min-width: 1025px)";')


def p_scene_static(s):
    s.rep("components/field/HeroScene.tsx", 'import type { SceneHandle } from "./scene";\n', 'import type { SceneHandle } from "./scene";\nimport * as vsSceneStatic from "./scene";\n')
    s.rep("components/field/HeroScene.tsx", '      const mod = await import("./scene").catch(() => null);\n', "      const mod = vsSceneStatic;\n")


def p_scene_lcp_only(s):
    """25: the hero scene waits for an LCP entry alone again — the reader's
    first input before the first paint, and no entry ever comes (the
    engineering review, 2026-09-29: 5 of 5 trials, no scene)"""
    s.rep("components/field/HeroScene.tsx", "      gate ??= Promise.all([lcpSeen(), loaded()]);\n",
          '      gate ??= Promise.all([new Promise<void>((r) => new PerformanceObserver((l) => void (l.getEntries().length && r())).observe({ type: "largest-contentful-paint", buffered: true })), loaded()]); // THROWAWAY misuse\n')


def p_nav_smooth(s):
    """34: <html> without data-scroll-behavior — Next leaves smooth scrolling
    on through a route change, and the new page scrolls up from the old
    offset (the engineering review, 2026-09-29)"""
    s.rep("app/layout.tsx", '      data-scroll-behavior="smooth"\n', "")


def p_toggle_local(s):
    """34: the pause control back on a state of its own, with aria-pressed —
    the page stays paused across Back and Forward, and the remounted control
    says "Pause motion" (the engineering review, 2026-09-29)"""
    f = "components/site/MotionToggle.tsx"
    s.rep(f, 'import { useSyncExternalStore } from "react";\n', 'import { useState, useSyncExternalStore } from "react";\n')
    s.rep(f, "  const paused = useSyncExternalStore(subscribeMotion, isPaused, () => false);\n", "  const [paused, setPaused] = useState(false); // THROWAWAY misuse\n")
    s.rep(f, "    const next = !isPaused();\n", "    const next = !paused;\n    setPaused(next);\n")
    s.rep(f, '    <button type="button" className="bf-motion-toggle" onClick={toggle}', '    <button type="button" className="bf-motion-toggle" aria-pressed={paused} onClick={toggle}')


def p_scene_hides_poster(s):
    s.rep("components/field/HeroScene.tsx", '        canvas.style.opacity = "1";\n',
          '        canvas.style.opacity = "1";\n        const vsPoster = field.querySelector<HTMLImageElement>("img[data-hero-poster]");\n        if (vsPoster && window.innerWidth >= 1280) vsPoster.style.display = "none";\n')


def p_honesty(s):
    # re-anchored 2026-09-28: the six capability sections became one ledger on /
    # (components/site/home/WhatWeEngineer.tsx), which renders the honesty line
    s.rep("components/site/home/WhatWeEngineer.tsx", "        {c.honesty ? (\n", "        {false && c.honesty ? (\n")


def p_tier_status(s):
    s.rep("components/site/TierChip.tsx", '<span className="bf-tier" data-tier={tier}>', '<span className="bf-tier" data-tier={tier} data-status="shipped">')


def p_kubernetes(s):
    # the stack's list renders on /engineering since 2026-09-28 (it left /), and
    # /engineering's inventory includes the evidence cuts, so check 30 still sees it
    s.rep("components/site/home/TechnicalDepth.tsx", "                  ))}\n                </ul>", '                  ))}\n                  {layer.id === "infrastructure" ? <li>Kubernetes</li> : null}\n                </ul>')


def p_contact_form(s):
    """32 (2026-09-28): the /contact project form collapsed to its content's
    width — the shape of the bug found that day, when /work's card rule
    (.bf-project) won over the contact wrapper of the same name and the form
    rendered 203px wide at 1440"""
    s.append("app/site.css", "\n/* throwaway misuse CSS: the /contact project form collapsed (the .bf-project collision's shape) */\n#project > .bf-wrap { display: flex !important; flex-direction: column; align-items: flex-start; }\n")


def p_fallback_face(s):
    """2 (2026-09-28): text that the site's faces cannot draw, so the browser
    paints it in a system fallback — Jost has no CJK glyphs. Check 2 reads only
    text the browser renders since that day (an element in a closed <details>
    is never painted); this proves it still sees the text it does render."""
    s.rep("components/site/home/Faq.tsx", '        <div className="bf-faq__list">\n',
          '        <p className="bf-lead">\u6f22\u5b57\u306e\u6587\u5b57\u5217\u3092\u8868\u793a\u3059\u308b</p>\n        <div className="bf-faq__list">\n')


# ── new for the TTouch Clothing projects (2026-09-29), one per new rule ─────


def p_story_label(s):
    """9: the client-story band's label no longer says Bolt Fusion built it"""
    s.rep("components/site/home/Stories.tsx", "            {attribution(members[0])}\n", "            Built by TTouch Clothing\n")


def p_story_hidden(s):
    """9: the client-story band's label hidden from a reader"""
    s.rep("components/site/home/Stories.tsx", '          <p className="bf-attr" data-attribution>\n', '          <p className="bf-attr sr-only" data-attribution>\n')


def p_story_members(s):
    """9: the band names our own OPAL as TTouch Clothing's, and leaves out
    Delivery Lens BD"""
    s.rep("components/site/home/Stories.tsx", "        {members.map((p) => {\n", '        {[...members.slice(1), ...projects.filter((x) => x.id === "opal")].map((p) => {\n')


def p_canonical(s):
    s.rep("public/llms-full.txt", "> We engineer intelligent software, business systems, automation, and connected technologies — from idea to production.",
          "> We engineer intelligent software, business systems, automation, and connected technologies — from idea to launch.")


# ── new with the Signal motion system (2026-09-28): motion a script writes, and
#    CLS while reading ─────────────────────────────────────────────────────────


def p_script_motion(s):
    """21: an rAF loop that ignores reduced motion, writing an inline transform"""
    s.mount("VsScriptMotion", client(
        "export default function VsScriptMotion() {\n  useEffect(() => {\n    const el = document.createElement(\"div\");\n    el.className = \"vs-spin\";\n"
        '    el.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none";\n    document.body.append(el);\n'
        "    let n = 0;\n    let id = 0;\n    const tick = () => {\n      el.style.transform = `translateX(${n % 2}px)`;\n      if (++n < 180) id = requestAnimationFrame(tick);\n    };\n"
        "    id = requestAnimationFrame(tick);\n    return () => {\n      cancelAnimationFrame(id);\n      el.remove();\n    };\n  }, []);\n  return null;\n}\n"))


def p_script_motion_var(s):
    """21: an rAF loop that ignores reduced motion, moving a box through a CSS
    custom property its transform reads — no inline transform ever changes"""
    s.mount("VsScriptMotionVar", client(
        "export default function VsScriptMotionVar() {\n  useEffect(() => {\n    const el = document.createElement(\"div\");\n    el.className = \"vs-var\";\n"
        '    el.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;transform:translateX(var(--vs-x,0px))";\n    document.body.append(el);\n'
        "    let n = 0;\n    let id = 0;\n    const tick = () => {\n      el.style.setProperty(\"--vs-x\", `${n % 2}px`);\n      if (++n < 180) id = requestAnimationFrame(tick);\n    };\n"
        "    id = requestAnimationFrame(tick);\n    return () => {\n      cancelAnimationFrame(id);\n      el.remove();\n    };\n  }, []);\n  return null;\n}\n"))


def p_script_motion_attr(s):
    """21: an rAF loop that ignores reduced motion, drawing a line on through
    its stroke-dashoffset ATTRIBUTE — no inline style ever changes"""
    s.mount("VsScriptMotionAttr", client(
        "export default function VsScriptMotionAttr() {\n  useEffect(() => {\n    const ns = \"http://www.w3.org/2000/svg\";\n    const svg = document.createElementNS(ns, \"svg\");\n"
        '    svg.setAttribute("style", "position:fixed;left:0;top:0;width:2px;height:2px;pointer-events:none");\n    const line = document.createElementNS(ns, "line");\n'
        '    line.setAttribute("class", "vs-draw");\n    for (const [k, v] of [["x1", "0"], ["y1", "1"], ["x2", "2"], ["y2", "1"], ["stroke", "#000"], ["stroke-dasharray", "2"]]) line.setAttribute(k, v);\n'
        "    svg.append(line);\n    document.body.append(svg);\n"
        "    let n = 0;\n    let id = 0;\n    const tick = () => {\n      line.setAttribute(\"stroke-dashoffset\", String(n % 2));\n      if (++n < 180) id = requestAnimationFrame(tick);\n    };\n"
        "    id = requestAnimationFrame(tick);\n    return () => {\n      cancelAnimationFrame(id);\n      svg.remove();\n    };\n  }, []);\n  return null;\n}\n"))


def p_scroll_shift(s):
    """29: a 120px block inserted above #faq once #faq reaches the middle of
    the viewport — a layout shift only a reader who scrolls ever meets"""
    s.mount("VsScrollShift", client(
        "export default function VsScrollShift() {\n  useEffect(() => {\n    const faq = document.getElementById(\"faq\");\n    if (!faq) return;\n"
        "    const io = new IntersectionObserver(\n      (es) => {\n        if (!es.some((e) => e.isIntersecting)) return;\n        io.disconnect();\n"
        '        const d = document.createElement("div");\n        d.className = "vs-shift";\n        d.style.height = "120px";\n        faq.before(d);\n'
        '      },\n      { rootMargin: "0px 0px -50% 0px" },\n    );\n    io.observe(faq);\n    return () => io.disconnect();\n  }, []);\n  return null;\n}\n'))


# ── new for the Signal motion system (2026-09-28), one per new rule ────────

LOADER = "components/motion/MotionLoader.tsx"


def p_gsap_static(s):
    """29 and 31: the loader imports ScrollTrigger statically — gsap in every
    page's initial JavaScript, requested before the load event"""
    s.rep(LOADER, 'import { useEffect } from "react";\n', 'import { useEffect } from "react";\nimport { ScrollTrigger as vsStaticTrigger } from "gsap/ScrollTrigger";\n\n(globalThis as unknown as Record<string, unknown>).__vsStaticTrigger = vsStaticTrigger;\n')


def p_scene_gsap(s):
    """25 and 31: the hero scene imports gsap — its chunk carries GSAP. By the
    dist path, which nothing else imports, so Turbopack bundles it INTO the
    scene's chunk whether this build imports the scene dynamically or (with
    scene-static) statically; a scene importing plain "gsap" shares the
    loader's chunk instead, which check 25 sees in the scene's chunk list"""
    s.append("components/field/scene.ts", '\n/* THROWAWAY misuse for the gate (scripts/gate/gate-cases.py) — never committed. */\nimport { gsap as vsSceneGsap } from "gsap/dist/gsap";\nexport const vsSceneGsapVersion = vsSceneGsap.version;\n')


def p_signal_second_loader(s):
    """31: a second module imports gsap dynamically — a second gate"""
    s.append("components/motion/signal.ts", '\n/* THROWAWAY misuse for the gate (scripts/gate/gate-cases.py) — never committed. */\nexport const vsSecondLoader = () => import("gsap/Observer");\n')


def p_gsap_coarse(s):
    """25: the loader's gate drops the fine pointer — a touch tablet gets gsap"""
    s.rep(LOADER, 'const FINE = "(pointer: fine)";\n', 'const FINE = "(min-width: 0px)";\n')


def p_gsap_reduced(s):
    """21: the loader's gate drops reduced motion — gsap requested, and the
    traces run, under reduced motion"""
    s.rep(LOADER, 'const CALM = "(prefers-reduced-motion: no-preference)";\n', 'const CALM = "(min-width: 0px)";\n')


# ── new at the merge (2026-09-29): robotics honesty, the Lab drawing ───────


DIAGRAMS = "components/site/diagrams.tsx"


def p_lab_flow(s):
    """33: the Lab drawing's four connections back as flow lines — a cyan
    .dg-flow over each, with its cyan arrowhead, flowing on a phone and a
    touch tablet (the drawing as it was until the merge)"""
    s.rep(DIAGRAMS, '    <Svg id="machine-loop" capability={c} flow={false}>\n', '    <Svg id="machine-loop" capability={c}>\n')
    for d in ("M136 86H182", "M298 86H344", "M402 112V232", "M344 258H298"):
        s.rep(DIAGRAMS, f'      <Wire id="machine-loop" d="{d}" dashed flow={{false}} />\n', f'      <Wire id="machine-loop" d="{d}" />\n')


def p_lab_cyan_head(s):
    """33: cyan arrowheads on the Lab drawing's steel edges — no flow line at
    all, only the colour of data flow where it points"""
    s.append("app/site.css", "\n/* throwaway misuse CSS: the Lab drawing's arrowheads in the flow colour */\n.bf-dg--machine-loop .dg-arrowhead { fill: var(--bf-flow); }\n")


def p_lab_dash_motion(s):
    """33: the Lab drawing's steel dashes marching on touch screens — a flow
    drawn in steel, with no cyan anywhere"""
    s.append("app/site.css", "\n/* throwaway misuse CSS: the Lab drawing's edges animated on a coarse pointer */\n@media (pointer: coarse) and (prefers-reduced-motion: no-preference) {\n  .bf-dg--machine-loop .dg-edge { animation: bf-flow 1.6s linear infinite; }\n}\n")


def p_signal_dead(s):
    """25: the engine's matchMedia never matches on the homepage — gsap loads,
    and the Signal never starts there. On / only since 2026-09-29: the build
    it shares carries hook-blink, whose check (35) reads the Signal's traces
    on /engineering, where the engine must still run for that case to fail
    on its own damage"""
    s.rep("components/motion/signal.ts", "  mm.add(gate, (ctx) => {\n", '  mm.add(location.pathname === "/" ? "(min-width: 99999px)" : gate, (ctx) => {\n')


def p_hook_blink(s):
    """35: a hook settles back to the server's hollow drawing — every payoff a
    blink again (the design review, 2026-09-29)"""
    s.rep("components/motion/signal.ts", "          traces.forEach((t) => t.made.forEach((m) => m.remove()));\n          lightHook(host);\n        };\n",
          "          traces.forEach((t) => t.made.forEach((m) => m.remove()));\n          unlightHook(host); // THROWAWAY misuse: back to the hollow drawing\n          lit.delete(host);\n        };\n")


def p_scene_share(s):
    """25: a three.js module whose import loads the Signal's gsap chunk beside
    it — what a scene importing plain "gsap" builds to, since Turbopack gives a
    module two imports share a chunk of its own. Stood in by a throwaway
    module carrying three.js's signature rather than by scene.ts, because
    scene-static (same build) turns the scene's own import static and leaves
    no chunk list to read."""
    s.write("components/site/VsSceneShareMod.ts", '/* THROWAWAY misuse for the gate (scripts/gate/gate-cases.py) — never committed. Carries three.js\'s signature (check 25\'s THREE_CODE) and imports gsap. */\nimport { gsap } from "gsap";\n\n(globalThis as unknown as Record<string, unknown>).__vsSceneShare = ["WebGLRenderer", gsap.version];\n')
    s.mount("VsSceneShare", client(
        "export default function VsSceneShare() {\n  useEffect(() => {\n    const t = setTimeout(() => void import(\"./VsSceneShareMod\"), 1500);\n    return () => clearTimeout(t);\n  }, []);\n  return null;\n}\n"))


# ── the table: [key, the case, its check, the finding it must print (a JS
#    regex), its patch (None: the finding comes from the named case's patch),
#    options] ─────────────────────────────────────────────────────────────────
CASES = [
    # kept from the 2026-09-15 gate, re-anchored on the redesign's files
    ["vanishing-frame", "a WebGL context in a frame that removes itself", 25, r"WebGL context request\(s\) — (?:[^;]*; )*webgl2? in a child frame", p_vanishing_frame, {}],
    ["logotype", "logotype on the contact panel's body (/contact)", 18, r'data-logotype holds "', p_logotype, {}],
    ["faq-drop", "FAQPage drops a question", 14, r"which FAQPage leaves out", p_faq_ld, {}],
    ["faq-answer", "FAQPage changes an answer", 14, r'FAQPage answers ".*" differently from the page', None, {"from": "faq-drop"}],
    ["faq-client", "FAQ answers rendered only in the browser", 14, r"is not in the served HTML — the markup describes", p_faq_client_only, {}],
    ["person-card", "a named member's card back in the Team section", 14, r'^/: a person card for "Nadim" — the team is shown as a headcount', p_person_card, {}],
    ["person-card-30", "a named member back in the Team section — the inventory", 30, r'^/: "Team: the named roster .*" was cut .*, but "Nadim" is back', None, {"from": "person-card"}],
    ["admin", "/admin page re-added", 17, r"^/admin answers 200", p_admin, {}],
    ["cache-lane", "the Cache lane deleted (the restaurant story's lanes)", 30, r"Architecture: three lanes.*is missing", p_cache_lane, {}],
    ["fig-45ms", "an unlabelled in-sentence figure (45ms)", 8, r'"45ms" has no shipped/target label', p_note_figures, {}],
    ["exempt-empty", "an exemption with an empty reason", 8, r'data-figure-exempt="".*its reason is empty', None, {"from": "fig-45ms"}],
    ["gl-390", "a WebGL context created at 390", 25, r"^/ @390\b[^:]*: \d+ WebGL context request\(s\) — (?:[^;]*; )*webgl2? in the page", p_gl_390, {}],
    ["poster-lazy", 'the poster set to loading="lazy"', 28, r'the poster is loading="lazy"', p_poster_lazy, {}],
    ["poster-small", "the poster shrunk below the headline's area (below 1025)", 28, r"the final LCP element must be the poster", p_poster_small, {}],
    ["heavy-script", "a large synchronous script on /", 29, r"initial JavaScript .*over the 260KB budget", p_heavy_script, {}],
    ["inter-work", "a retired face (Inter) imported on /work", 31, r"loads Inter from next/font/google", p_inter_work, {"reanchor": "pages"}],
    ["k4-privacy", "K4: a retired class on /privacy-policy", 31, r"^/privacy-policy @\d+: \d+ element\(s\) carry the retired design's classes or attribute — e\.g\. article", p_k4_privacy, {"reanchor": "pages"}],
    ["k4-work", "K4: [data-reveal] on /work", 31, r"^/work @\d+: \d+ element\(s\) carry the retired design's classes or attribute — e\.g\. ul", p_k4_work, {"reanchor": "pages"}],
    ["k4-404", "K4: a 404 that answers 200", 31, r"answers 200 — an unknown URL answers 404", p_k4_404, {}],
    ["k5-bottom", "K5: low contrast near the page's bottom", 20, r'"Low contrast near the bottom of the page\.?" [\d.]+:1, needs 4\.5:1', p_k5_bottom, {}],
    ["k5-cap", "K5: text past the contrast cap", 20, r"^/privacy-policy @\d+: the contrast pass stopped at its \d+-element cap", p_k5_cap, {"reanchor": "pages"}],
    ["k5-fixed-ground", "K5: low contrast over a fixed ground", 20, r'"Text over a fixed ground\." [\d.]+:1, needs 4\.5:1', p_k5_fixed_ground, {}],
    ["k5-fixed-box", "K5: low contrast in an opaque fixed box, measured against its own ground", 20, r'"Chat with us today" [\d.]+:1, needs 4\.5:1 — .* over rgb\(255,255,255\)', p_k5_fixed_box, {}],
    ["k5-fixed-clear", "K5: text in a transparent fixed box", 20, r'"Talk to an engineer" sits in a fixed or sticky box \(div[^)]*\) that paints no opaque ground of its own', None, {"from": "k5-fixed-box"}],
    ["a3", "A3: the header's call to action at low contrast", 20, r":1, needs [\d.]+:1 — .*\(in header#masthead[^,]*, at the top of the page\)", p_a3, {}],
    ["k1-borrowed", "K1: a chip taken from another figure (<100ms)", 8, r'#recent-work: "<100ms" has no shipped/target label', p_k1, {}],
    ["k1-status", "K1: a proof status unlike content/metrics.ts", 28, r'proof figure 3 \(haiku-routing, ~90%\) reads its status as "target" — content/metrics\.ts says "shipped"', None, {"from": "k1-borrowed"}],
    ["k2-exempt", "K2: display:contents exemption over two figures", 8, r'data-figure-exempt="A reason long enough to pass every reason test" around "41ms", "97%" — it covers 2 figures', None, {"from": "fig-45ms"}],
    ["k2-status", "K2: display:contents status over two figures", 8, r'data-status="shipped" around "42ms", "96%" — it covers 2 figures with one chip', None, {"from": "fig-45ms"}],
    ["k8-offpage", "K8: a chip off the page", 8, r'"43ms" sits in data-status="shipped", but its chip cannot be seen: off the page', None, {"from": "fig-45ms"}],
    ["k8-covered", "K8: a chip under a cover", 8, r'"44ms" sits in data-status="target", but its chip cannot be seen: covered', None, {"from": "fig-45ms"}],
    ["k9-split", "K9: a figure split across an inline-block (51ms)", 8, r'#recent-work: "51ms" has no shipped/target label', None, {"from": "fig-45ms"}],
    ["k9-3x", "K9: a capital multiplier (3X)", 8, r'"3X" has no shipped/target label', None, {"from": "fig-45ms"}],
    ["k9-mid", "K9: a figure shown only at 768-1024", 8, r'"55ms" has no shipped/target label.*\(at 768, 1024 only\)', None, {"from": "fig-45ms"}],
    ["k10-title", "K10: a figure in a title attribute", 8, r'"16ms" in title on div.* has no shipped/target label', p_k10_title, {}],
    ["k10-llms", "K10: an unlabelled figure in llms-full.txt", 8, r'^/llms-full\.txt line \d+: "12ms" has no shipped/target label', p_k10_llms, {}],
    ["k11-junk", "K11: an exemption with a junk reason", 8, r'data-figure-exempt="asdf asdf asdf asdf qwer" around "Kickoff in 5 days" is not an entry in content/figure-labels\.ts', None, {"from": "fig-45ms"}],
    ["k6-behind", "K6: the poster behind the h1 at >=1025", 28, r"@1025: the poster sits behind the headline", p_k6, {}],
    ["h2-hidden", "H2: the poster faded out after load (390)", 28, r"@390: after the settle the poster is at opacity 0\.00", p_h2, {}],
    ["k7-worker", "K7: WebGL in a worker at 768", 25, r"^/ @768 \(first input\): \d+ WebGL context request.*in a worker", p_k7, {}],
    ["h3-tablet", "H3: WebGL on a coarse-pointer tablet (1366x1024)", 25, r"^/ @1366x1024 tablet \(touch, coarse pointer\): \d+ WebGL context request\(s\) — (?:[^;]*; )*webgl in the page", None, {"from": "k7-worker"}],
    ["k7-input", "K7: WebGL on the first pointer move (at 1024 — the scene is allowed at 1440 since 2026-09-16)", 25, r"^/ @1024: \d+ WebGL context request", None, {"from": "k7-worker"}],
    ["a1", "A1: focus under the sticky header (no scroll padding)", 19, r"Shift\+Tab to .* entirely hidden under header#masthead", p_a1, {}],
    ["k12-dynamic", "K12: a dynamic subpath import of framer-motion", 31, r"repository: components/site/StatusChip\.tsx holds a package of the retired design", p_k12_dynamic, {}],
    ["k12-package", "K12: a retired package in package.json", 31, r'repository: package\.json lists "framer-motion"', p_k12_package, {}],
    ["k12-tailwind", "K12: @tailwind in a stylesheet", 31, r"repository: app/site\.css holds Tailwind", p_k12_tailwind, {}],
    ["feature-label", "a feature-work label that overclaims (Bazzile)", 9, r'"Bazzile" is feature work inside Bazzile Technology SA\'s app, and its label says "built by Bolt Fusion" without "features"', p_feature_label, {"reanchor": "pages"}],
    # new for the redesign (2026-09-16), one per new rule
    ["book-a-call", 'a "Book a call" label on the header button', 32, r"the header's primary button reads \"Book a call\" — it reads exactly \"Schedule a Call\"", p_book_a_call, {}],
    ["scene-coarse", "HeroScene allowed on a coarse pointer — a touch tablet gets WebGL (1180x820)", 25, r"^/ @1180x820 tablet \(touch, coarse pointer\): \d+ WebGL context request\(s\) — (?:[^;]*; )*webgl2 in the page", p_scene_coarse, {"needs": "scene"}],
    ["scene-lcp-only", "the hero scene waits for an LCP entry alone — an input before the first paint, and it never starts (1440)", 25, r"^/ @1440 input before first paint: no WebGL context was created", p_scene_lcp_only, {}],
    ["scene-static", "the scene chunk imported statically — three.js in the initial JavaScript", 29, r"the scene chunk .* is requested at \d+ms, before the load event ended", p_scene_static, {"needs": "scene"}],
    ["scene-static-390", "the scene chunk imported statically — three.js requested at 390", 25, r"^/ @390\b[^:]*: requests .*a three\.js chunk", None, {"from": "scene-static", "needs": "scene"}],
    ["scene-hides-poster", "the poster display:none once the scene is ready (1440)", 28, r"@1440: after the settle the poster is not rendered \(display:none", p_scene_hides_poster, {"needs": "scene"}],
    ["honesty", "the robotics honesty line removed", 33, r"the robotics capability has no honesty line", p_honesty, {}],
    ["honesty-30", "the robotics honesty line removed — the inventory", 30, r"\"Capabilities: the six, and robotics' honesty line\" is missing — \"We engineer software for machines", None, {"from": "honesty"}],
    ["tier-status", "a data-status on a tier chip", 33, r"a tier chip \(\[data-tier=\"[a-z]+\"\][^)]*\) carries data-status", p_tier_status, {}],
    ["kubernetes", "Kubernetes added to the technical-depth list", 30, r"was cut .* but \"Kubernetes\" is back", p_kubernetes, {}],
    ["canonical", "the canonical line changed in one place only (llms-full.txt)", 12, r"^/llms-full\.txt does not carry it word for word", p_canonical, {}],
    # new for the 2026-09-28 redesign, one per new rule
    ["fallback-face", "text drawn in a system fallback face (CJK glyphs Jost does not have), on /", 2, r"^/ @\d+: \d+ element\(s\) ask for a web face and paint a fallback", p_fallback_face, {}],
    ["contact-form", "the /contact project form collapsed to its content's width (the .bf-project collision)", 32, r"^/contact @1440: the project form \(#project \.bf-form\) is \d+px wide — at 1440 it is at least 480px", p_contact_form, {}],
    # new with the Signal motion system (2026-09-28): script motion, CLS while reading
    ["script-motion", "an rAF loop that ignores reduced motion (a script-written transform)", 21, r"^/: \d+ element\(s\) animated by script under reduced motion — e\.g\. (?:[^;]*, )?div\.vs-spin", p_script_motion, {}],
    ["script-motion-var", "an rAF loop that ignores reduced motion, through a CSS custom property its transform reads", 21, r"^/: \d+ element\(s\) animated by script through a CSS custom property under reduced motion — e\.g\. (?:[^;]*, )?div\.vs-var \(\d+ changes to --vs-x\)", p_script_motion_var, {}],
    ["script-motion-attr", "an rAF loop that ignores reduced motion, through an SVG stroke-dashoffset attribute", 21, r"^/: \d+ element\(s\) animated by script through an SVG attribute under reduced motion — e\.g\. (?:[^;]*, )?line\.vs-draw \(\d+ changes to stroke-dashoffset\)", p_script_motion_attr, {}],
    ["scroll-shift", "a block inserted above #faq as a reader nears it — CLS while scrolling", 29, r"CLS [\d.]+ during a reading-speed scroll", p_scroll_shift, {}],
    # new for the Signal motion system (2026-09-28), one per new rule
    ["gsap-static", "gsap imported statically by the loader — ScrollTrigger in the initial JavaScript", 29, r"the GSAP chunk .* \((?:[^)]*, )?ScrollTrigger[,)].* is requested at \d+ms, before the load event ended", p_gsap_static, {}],
    ["gsap-static-31", "gsap imported statically by the loader — the repository", 31, r'repository: components/motion/MotionLoader\.tsx imports "gsap/ScrollTrigger" statically', None, {"from": "gsap-static"}],
    ["scene-gsap", "the hero scene imports gsap — a three.js chunk carrying GSAP", 25, r"is the hero scene's (?:three\.js )?chunk and carries GSAP", p_scene_gsap, {}],
    ["scene-share", "a three.js chunk whose import loads the Signal's gsap chunk beside it", 25, r"the hero scene's import loads the GSAP chunk .*gsap core.* together with", p_scene_share, {}],
    ["scene-gsap-31", "the hero scene imports gsap — the repository", 31, r'repository: components/field/scene\.ts imports "gsap/dist/gsap" — gsap belongs to the Signal', None, {"from": "scene-gsap"}],
    ["signal-second-loader", "a second module imports gsap dynamically", 31, r'repository: components/motion/signal\.ts imports "gsap/Observer" dynamically — gsap is imported by components/motion/MotionLoader\.tsx alone', p_signal_second_loader, {}],
    ["gsap-coarse", "the Signal's gate without the fine pointer — gsap on a touch tablet (1180x820)", 25, r"^/ @1180x820 tablet \(touch, coarse pointer\): requests the GSAP chunk", p_gsap_coarse, {}],
    ["signal-dead", "the Signal's engine never starts — gsap loads for nothing (1440)", 25, r"^/ @1440[^:]*: the Signal never started", p_signal_dead, {}],
    ["gsap-reduced", "the Signal's gate without reduced motion — gsap requested under reduced motion", 21, r"^/[^:]*: \d+ GSAP script\(s\) requested under reduced motion — .*the Signal engine", p_gsap_reduced, {}],
    # new at the merge (2026-09-29): robotics honesty — the Lab drawing shows no cyan and never flows, on any profile
    ["lab-flow", "the Lab drawing's connections back as cyan flow lines", 33, r"^/capabilities @\d+: the Lab drawing \(bf-dg--machine-loop[^)]*\) carries \d+ flow line\(s\) \(\.dg-flow\)", p_lab_flow, {}],
    ["lab-flow-phone", "the Lab drawing's connections back as cyan flow lines — flowing on a phone", 33, r"^/capabilities @390 phone \(touch\): the Lab drawing animates — (?:[^;]*; )*path\.dg-flow \(bf-flow\)", None, {"from": "lab-flow"}],
    ["lab-cyan-head", "cyan arrowheads on the Lab drawing's steel edges, no flow line", 33, r"^/capabilities @\d+: the Lab drawing \(bf-dg--machine-loop[^)]*\) is painted cyan — (?:[^;]*; )*path\.dg-arrowhead fill ", p_lab_cyan_head, {}],
    ["lab-dash-motion", "the Lab drawing's steel dashes animated on touch screens, no cyan", 33, r"^/capabilities @1180x820 tablet \(touch, coarse pointer\): the Lab drawing animates — (?:[^;]*; )*path\.dg-edge(?:\.dg-edge--dashed)? \(bf-flow\)", p_lab_dash_motion, {}],
    # new at the fix pass (2026-09-29): a client-side navigation starts at the top, and its reveals run
    ["nav-smooth", "no data-scroll-behavior on <html> — a client-side navigation smooth-scrolls the new page up from the old offset", 34, r"^@1440: the new page's first frame is at scrollY [1-9]\d*", p_nav_smooth, {}],
    ["toggle-local", "the pause control keeps its own state — paused across Back and Forward, it reads \"Pause motion\"", 34, r'^@390: after Back and Forward the page is paused \(html\[data-motion="paused"\]\) and its pause control reads "Pause motion"', p_toggle_local, {}],
    ["toggle-pressed", "the pause control says its state twice — aria-pressed beside a changing label", 34, r'^@390: the pause control carries aria-pressed="false" beside a label that changes', None, {"from": "toggle-local"}],
    ["hook-blink", "the Signal's hooks settle back to the hollow drawing — the payoff a blink", 35, r"^/engineering @1440 a fresh load: read down at reading speed, 0 of \d+ stations of the Signal's hooks are lit at rest", p_hook_blink, {}],
    ["hook-blink-untraced", "the Signal's hooks settle back to the hollow drawing — the line not left traced", 35, r"^/engineering @1440 a fresh load: the hook\(s\) rail, cta did not settle traced", None, {"from": "hook-blink"}],
    ["nav-reveals", "no data-scroll-behavior on <html> — the new page's reveals judged at the old offset, and skipped", 34, r"^@(?:1440|390): after the navigation, \d+ of \d+ reveals ran as / was read down, against \d+ of \d+ on a fresh load", None, {"from": "nav-smooth"}],
    # new for the TTouch Clothing projects (2026-09-29), one per new rule
    ["story-label", "the homepage's client-story band labelled \"Built by TTouch Clothing\"", 9, r'^/ @\d+: the client story "ttouch-clothing" — its label reads "Built by TTouch Clothing"; it reads "Delivered project: built by Bolt Fusion for TTouch Clothing"', p_story_label, {}],
    ["story-hidden", "the client-story band's label hidden (sr-only)", 9, r'^/ @\d+: the client story "ttouch-clothing" — its label ".*" is not visible', p_story_hidden, {}],
    ["story-foreign", "the client-story band names our own OPAL as TTouch Clothing's", 9, r'^/ @\d+: the client story "ttouch-clothing" names "OPAL", which is not a published product project of TTouch Clothing', p_story_members, {}],
    ["story-missing", "the client-story band leaves out one of TTouch Clothing's systems", 9, r'^/ @\d+: the client story "ttouch-clothing" leaves out "Delivery Lens BD", a published product project of TTouch Clothing', None, {"from": "story-foreign"}],
]
# retired cases: [key, the case, its old check, the reason] — none today; a case
# goes here only when the rule it tested cannot exist any more
RETIRED = [
    ["person", "Person node with an empty jobTitle", 14, "the team is a headcount (owner, 2026-09-24): no Person node is emitted anywhere, so there is none to empty — check 14 now fails any Person node (the person-card case)"],
]



# ── the hero scene's patches (PROBE_CASES): each fails one probe-scene check ─


def p_scene_gap(s):
    """explode: the stack opened 0.3 a plate — the band at full open"""
    s.rep("components/field/scene.ts", "const EXPLODE_GAP = 0.13;", "const EXPLODE_GAP = 0.3;")


def p_scene_nohold(s):
    """reload: the exploded view starts where the scroll is at mount, so a
    page loaded mid-scroll draws an opened stack as its first frame"""
    s.rep("components/field/scene.ts", "  let explode = 0; // the exploded view", "  let explode = Math.min(1, window.scrollY / 393); // THROWAWAY misuse: the exploded view")


def p_scene_nopause(s):
    """explode and charge: Pause motion ignored — the loop keeps running"""
    s.rep("components/field/scene.ts", "      paused = p;\n", "      paused = p && false; // THROWAWAY misuse\n")


def p_scene_pop(s):
    """watchdog: the comets dropped in one frame instead of faded"""
    s.rep("components/field/scene.ts", "      cometK = Math.max(0, cometK - dt / FADE_S);", "      cometK = 0; // THROWAWAY misuse")


def p_scene_cadence(s):
    """cadence: the watchdog judging the display's cadence again, on every
    browser — a steady 30Hz (a laptop on battery) reads as a slow GPU, and
    the comets and the outer tier go (the design review, 2026-09-29)"""
    s.rep("components/field/scene.ts", "      const dropping = !gpuSeen && avgMs > SLOW_FRAME_MS && uneven();\n", "      const dropping = avgMs > SLOW_FRAME_MS; // THROWAWAY misuse: the cadence alone, as until 2026-09-29\n")


def p_scene_gpu_blind(s):
    """watchdog: the GPU clock read and never judged — a GPU too slow for the
    scene, at a smooth cadence, never degrades it"""
    s.rep("components/field/scene.ts", "      const gpuSlow = gpuSeen && avgGpu > WORK_MS;\n", "      const gpuSlow = false; // THROWAWAY misuse\n")


def p_charge_amber(s):
    """charge: the seams mix toward amber — which keeps blue > green > red
    at the charge's 24%, and lowers the blue"""
    s.rep("components/field/scene.ts", "vec3( 0.62, 0.8, 1.0 ), uCharge );", "vec3( 0.98, 0.75, 0.14 ), uCharge ); // THROWAWAY misuse")


def p_charge_jump(s):
    """charge: it snaps on instead of easing"""
    s.rep("components/field/scene.ts", "const CHARGE_EASE = 5;", "const CHARGE_EASE = 80;")


def p_scene_cross_core(s):
    """overlap: the inner tier sways 52 degrees — the web and the AI swing
    in front of the core. t = 0 is the sway's centre, so the poster holds"""
    s.rep("components/field/scene.ts", "const INNER: Tier = { radius: 1.75, y: 2.25, swing: 0.3,", "const INNER: Tier = { radius: 1.75, y: 2.25, swing: 0.9,")


def p_scene_cross_lab(s):
    """overlap: the outer tier sways 52 degrees against the inner — the Lab
    robot meets the AI"""
    s.rep("components/field/scene.ts", "const OUTER: Tier = { radius: 2.25, y: 0.36, swing: 0.22,", "const OUTER: Tier = { radius: 2.25, y: 0.36, swing: -0.9,")


def p_poster_cover(s):
    """poster: covering its field again — the 16:9 field at 768 cuts the
    frame's top and bottom (the adversarial review, 2026-09-29)"""
    s.rep("app/site.css", "  object-fit: contain;\n  object-position: 50% 50%;\n", "  object-fit: cover;\n  object-position: 50% 50%;\n")


def p_poster_stale(s):
    """identity: the desktop sources serve the v1 poster — a frame of
    another scene, which the canvas no longer matches"""
    for ext in ("avif", "webp"):
        s.rep("components/site/home/Hero.tsx", f'srcSet="/hero/scene-poster-v2-660-1x.{ext} 660w, /hero/scene-poster-v2-1320.{ext} 1320w"', f'srcSet="/hero/scene-poster-v1-660.{ext} 660w, /hero/scene-poster-v1-1320.{ext} 1320w"')


# the hero scene's cases (2026-09-29): the same shape, the check a
# scripts/probe-scene.mjs check, `probe:<name>`. One per rule the probe holds
# that the suite cannot see (CLAUDE.md, "The hero field").
PROBE_CASES = [
    ["scene-gap", "the exploded view opened 0.3 a plate — the stack reaches the frame's edge", "probe:explode", r"^@660 fully open, [^:]*: the edge band is \d+ off the ground", p_scene_gap, {}],
    ["scene-nohold", "the exploded view starts from the scroll at mount — a mid-scroll reload opens before the fade", "probe:reload", r"^loaded mid-scroll, the first frame is not the poster", p_scene_nohold, {}],
    ["scene-nopause", "Pause motion ignored by the scene — the stack follows the scroll while paused", "probe:explode", r"^paused, the stack still moved with the scroll \([1-9]\d* draw calls", p_scene_nopause, {}],
    ["scene-nopause-charge", "Pause motion ignored by the scene — the charge answers a hover while paused", "probe:charge", r"^paused, the scene still answered the hover \([1-9]\d* draw calls", None, {"from": "scene-nopause"}],
    ["scene-pop", "the watchdog drops the comets in one frame", "probe:watchdog", r"^the comets: \d+% of it went in one 0\.2s step at [\d.]+s — it vanished instead of fading", p_scene_pop, {}],
    ["scene-gpu-blind", "the watchdog never judges the GPU's clocked time — a slow GPU at a smooth cadence keeps everything", "probe:watchdog", r"^a GPU clocked at 30ms a frame, at a smooth 60Hz cadence with cheap script work: the drawing buffer never stepped down in 4s", p_scene_gpu_blind, {}],
    # the cadence check's control (with no GPU clock, an uneven cadence DOES
    # degrade) has no case of its own: a patch that stops it degrading cannot
    # share a build with scene-cadence, which makes every slow cadence
    # degrade. It fails its check itself ("proves nothing") if it ever stops.
    ["scene-cadence", "the watchdog judges the display's cadence again — a steady 30Hz strips the scene", "probe:cadence", r"^30Hz, GPU clocked at 1\.5ms a frame: the drawing buffer stepped down to 825x700", p_scene_cadence, {}],
    ["scene-cadence-safari", "the watchdog judges the display's cadence again — with no GPU clock (Safari)", "probe:cadence", r"^30Hz, no GPU clock \(Safari\): the drawing buffer stepped down to 825x700", None, {"from": "scene-cadence"}],
    ["charge-amber", "the charge mixes toward amber (the order of the channels holds, the blue falls)", "probe:charge", r"^hover: the charged seams are rgb [\d,]+ against [\d,]+ at rest — blue -\d+\.\d as red rises [\d.]+ — the charge is a brighter blue, never amber", p_charge_amber, {}],
    ["charge-jump", "the charge snaps on instead of easing", "probe:charge", r"^hover: \d+% of the charge came in the first 0\.1s — it eases in, it does not jump", p_charge_jump, {}],
    ["scene-cross-core", "the inner tier sways 52° — modules swing in front of the core", "probe:overlap", r'^assembled: "(?:web|ai)" comes within -?[\d.]+px of the core, in front of it — a module crosses the core', p_scene_cross_core, {}],
    ["scene-cross-lab", "the outer tier sways 52° against the inner — a live module crosses the Lab robot", "probe:overlap", r'^assembled: "\w+" and "\w+" come within -?[\d.]+px of each other — a live module crosses the Lab robot', p_scene_cross_lab, {}],
    ["poster-cover", "the poster covers its field again — the frame cut at 768", "probe:poster", r"^@768, the drift's (?:from|to) end: the field's 16px band is not the ground — .*\(\S+, cover, transform", p_poster_cover, {}],
    ["poster-stale", "the desktop sources serve the v1 poster — not this scene's first frame", "probe:identity", r"^@660 DPR 2: the canvas's t = 0 frame differs from the poster the browser draws under it \(scene-poster-v1-1320", p_poster_stale, {}],
]


# ── RUN 3: bad content the BUILD must refuse, each with the schema's own
#    words in the build log (a build that fails for another reason — a font
#    download, the disk — is unsure, and a failure) ───────────────────────────


def b_a(s):
    """(a) a figure KPI with no status: the restaurant case study's first KPI"""
    t = s.read("content/site.ts")
    old = '        status: "shipped",\n'
    if old not in t:
        raise Missing("content/site.ts: no KPI status")
    s.write("content/site.ts", t.replace(old, "", 1))


def b_b(s):
    """(b) a capability KPI with a status: "Multi-tenant" given one"""
    s.rep("content/site.ts", '        hint: "Isolated rows per tenant",\n', '        hint: "Isolated rows per tenant",\n        status: "shipped",\n')


def b_c(s):
    """(c) an exemption with an empty reason"""
    s.rep("content/figure-labels.ts", '{ text: "30-second TTL", exempt: "How long the homepage\'s cache lane keeps a result in Redis: a configured TTL, not a performance claim" },', '{ text: "30-second TTL", exempt: "" },')


def b_d(s):
    """(d) a capability with an evidence tier outside proven, core, capable and
    lab — `as never` so TypeScript lets it through and the refusal is the
    schema's (content/engineering-schema.ts, evidenceTierSchema)"""
    s.rep("content/engineering.ts", '        { tier: "capable", scope: "Full ERP" },\n', '        { tier: "experimental" as never, scope: "Full ERP" },\n')


def b_e(s):
    """(e) a named roster put back in the team (owner, 2026-09-24: a headcount,
    no details) — the team object is strict. Spread from `{}` so TypeScript
    lets it through (it refuses the plain key too) and the refusal is the
    schema's (content/site-schema.ts, `team: z.strictObject`)"""
    s.rep("content/site.ts", '    sizeLabel: "developers",\n', '    sizeLabel: "developers",\n    ...({ roster: [{ id: "nadim", status: "pending", name: "Nadim" }] } as {}),\n')


def b_f(s):
    """(f) the hero's first-call line turned into a new promise (2026-09-28:
    the microcopy is one whole sentence of /about's terms, word for word —
    DECISIONS item 3, no reply time, no price, no call length)"""
    s.rep("content/site.ts", '    microcopy: "Your first call is with the engineer who writes the code.",\n', '    microcopy: "We reply within one working day.",\n')


def b_g(s):
    """(g) feature work named on the hero's proof line (2026-09-28: the line
    names only work that is ours — Bazzile is features inside Bazzile
    Technology SA's app, never "built by Bolt Fusion")"""
    s.rep("content/site.ts", '      projects: ["warmchats", "balanzify", "go-style-business"],\n', '      projects: ["warmchats", "bazzile", "go-style-business"],\n')


def b_h(s):
    """(h) a client story that is not a set: pointed at a client with one
    published product project (2026-09-29: a story needs at least two)"""
    s.rep("content/projects.ts", '        id: "ttouch-clothing",\n        client: "TTouch Clothing",\n', '        id: "ttouch-clothing",\n        client: "Balanzify Inc.",\n')


def b_i(s):
    """(i) a client story whose title's count is not its member count — "Five
    systems" over four cards (2026-09-29: the count is the data's)"""
    s.rep("content/projects.ts", '        title: "Four systems for TTouch Clothing",\n', '        title: "Five systems for TTouch Clothing",\n')


def b_j(s):
    """(j) a client story that says its set is live while a member is not:
    Delivery Lens BD set to in production (2026-09-29)"""
    s.rep("content/projects.ts", '      client: "TTouch Clothing",\n      status: "live",\n      stack: ["Next.js", "Node.js"],\n', '      client: "TTouch Clothing",\n      status: "in-production",\n      stack: ["Next.js", "Node.js"],\n')


BAD = [
    ["a", "a figure KPI with no status", "content/site.ts", b_a, [r"needs a status"]],
    ["b", "a capability KPI with a status", "content/site.ts", b_b, [r"not a metric"]],
    ["c", "an exemption with an empty reason", "content/figure-labels.ts", b_c, [r"exemption's reason"]],
    ["d", "a capability whose evidence tier is not proven, core, capable or lab", "content/engineering.ts", b_d, [r"engineering\.ts failed validation", r"expected one of"]],
    ["e", "a named team roster put back", "content/site.ts", b_e, [r"[Uu]nrecognized key.*roster"]],
    # new for the 2026-09-28 redesign, one per new build-time rule
    ["f", "the hero's first-call line turned into a new promise", "content/site.ts", b_f, [r"is not approved copy"]],
    ["g", "feature work (Bazzile) named on the hero's proof line", "content/site.ts", b_g, [r"hero\.proof: .{1,2}bazzile.{1,2} is feature work in another company's app"]],
    # new for the TTouch Clothing projects (2026-09-29), one per new build-time rule
    ["h", "a client story with one member (Balanzify Inc.)", "content/projects.ts", b_h, [r"a client story is a set — it needs at least two published product projects for .{1,2}Balanzify Inc\..{1,2}, and has 1"]],
    ["i", "a client story whose title says five over four members", "content/projects.ts", b_i, [r"its title says .{1,2}five.{1,2}, and .{1,2}TTouch Clothing.{1,2} has four published product projects"]],
    ["j", "a client story that says it is live while a member is in production", "content/projects.ts", b_j, [r"its intro says the set is live, and Delivery Lens BD is not"]],
]


def bad(root, label):
    global ROOT
    ROOT = root
    row = next(b for b in BAD if b[0] == label)
    st = Stage()
    row[3](st)
    st.flush()


def only():
    ids = sorted({c[2] for c in CASES})
    return ",".join(str(i) for i in ids)


def probe_only():
    return ",".join(sorted({c[2].split(":", 1)[1] for c in PROBE_CASES}))


def apply(root, out):
    global ROOT
    ROOT = root
    status = {}
    for key, name, check, expect, patch, opt in CASES + PROBE_CASES:
        if patch is None:
            continue
        st = Stage()
        try:
            patch(st)
        except Missing as e:
            if opt.get("needs"):
                status[key] = ("waiting", f"waiting on the {opt['needs']} merge — {e}")
                continue
            print(f"ABORT: the case \"{name}\" cannot be applied, and names no wave that brings its target — {e}")
            sys.exit(3)
        st.flush()
        status[key] = ("applied", ", ".join(sorted(st.files)))
    rows = []
    for key, name, check, expect, patch, opt in CASES + PROBE_CASES:
        src = key if patch else opt["from"]
        s, detail = status[src]
        rows.append({"key": key, "name": name, "check": check, "expect": expect, "status": s, "detail": detail, "reanchor": opt.get("reanchor"), "needs": opt.get("needs")})
    for key, name, check, reason in RETIRED:
        rows.append({"key": key, "name": name, "check": check, "expect": None, "status": "retired", "detail": reason})
    json.dump(rows, open(out, "w"), indent=1)
    applied = [r for r in rows if r["status"] == "applied"]
    waiting = [r for r in rows if r["status"] == "waiting"]
    print(f"  {len({r['detail'] for r in applied if r['status'] == 'applied'})} patch set(s) applied for {len(applied)} case(s); {len(waiting)} waiting; {len(RETIRED)} retired")
    for r in waiting:
        print(f"  WAITING  {r['name']} — {r['detail']}")


if __name__ == "__main__":
    if sys.argv[1:2] == ["only"]:
        print(only())
    elif sys.argv[1:2] == ["probe-only"]:
        print(probe_only())
    elif sys.argv[1:2] == ["apply"]:
        apply(sys.argv[2], sys.argv[3])
    elif sys.argv[1:2] == ["bad-list"]:
        for label, name, path, _, pats in BAD:
            print("\t".join([label, path, name, *pats]))
    elif sys.argv[1:2] == ["bad"]:
        bad(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
