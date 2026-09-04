# Bolt Fusion Tech — Landing Page Rebuild
**Master plan · v1 · Ready for Claude Code**

---

## 0. The one-line strategy

Stop building a marketing page. Build a **due-diligence machine** — a page that pre-answers the exact checklist an offshore-software buyer is already running, before they think to ask.

You are the only agency in your category that already has all three pillars: published real architecture, named engineers with public profiles, and explicit IP/NDA terms. Nobody else combines them. Lean all the way in.

**Positioning line:** *The offshore team that shows you everything before you sign.*

---

## 1. Diagnosis

You do not have a content problem. Your three-lane retrieval architecture and WarmChats case study are better than what most $200/hr agencies publish.

You have a **packaging problem**:

| Issue | Impact |
|---|---|
| 4 template avatar files with Eastern European names on Bangladeshi engineers | "This company might be fake" |
| 3 anonymous testimonials (initials, no company, no logo) | Actively lowers trust |
| 4 stock photos | Loudest single "template" signal on the site |
| Restaurant project told twice (section 3 and section 7) | Wastes your best asset |
| 7 work items, only 1 clickable | Reads as padding |
| 9 industry cards linking to `#contact` | Research shows this pattern fails |
| H1 "Build. Scale. Transform." | Fails the 10-second relevance test |
| "Lower hiring cost" as headline | Attracts rate negotiators, not scope negotiators |
| Everything on one page | ~13 potential ranking pages collapsed to anchors |

---

## 2. Research the plan is built on

1. **Ten seconds decides it.** NN/g: visitors who can't tell what a company does and for whom within ten seconds leave. Specificity signals relevance.
2. **Nobody reads.** Users read 20–28% of words, scanning headings and bullets. → Your architecture section must become an interactive artifact, not prose.
3. **Industry navigation fails.** NN/g finds audience/sector-based navigation often fails to engage. → Cut the 9 cards.
4. **Three evaluators, not one.** Engineer wants specs, finance wants ROI, procurement wants compliance.
5. **Offshore buyers run a checklist.** Due-diligence guides tell buyers to demand named developer placement before signing, verify LinkedIn headcount, check IP assignment and handover clauses, and request a paid trial sprint. The top red flag: a sales call run by someone who doesn't write code.
6. **2026 design reality.** Kinetic typography almost never ships — it fights screen readers and destroys Core Web Vitals. 3D/WebGL drains performance budgets. Token systems are table stakes.
7. **Don't go brutalist.** Neubrutalism works for creative agencies, fails in B2B contexts where polish signals trustworthiness. (Your REBELLION project is brutalist. Your own site must not be.)
8. **AI readability is the 2026 story.** Valid structured data ≈2.3× more likely to appear in AI Overviews; clear structural signals up to 40% higher visibility in AI answers. No major provider has confirmed production use of `llms.txt` — treat it as cheap optionality, schema as the reliable part.

---

## 3. The offer change

Add a **2-week paid pilot** as the primary CTA.

```
Two weeks. Fixed price. Full IP. No obligation.
Week 1 — architecture + a working vertical slice of your real product
Week 2 — iterate, harden, handover document
You keep the code either way.
```

Buyer-side checklists explicitly recommend requesting a trial sprint. Offering it unprompted flips the dynamic and removes the largest barrier to a first contract with an unknown offshore vendor.

---

## 4. Design direction

### 4.1 The concept: **trace rail**

Your subject matter is observability — routing, latency, cost per query, spans. The design comes from that vernacular, not from generic dark SaaS.

A 1px vertical rule runs down the left of the content column for the entire page, with a tick at each section. Sections hang off it like spans off a timeline axis in a trace viewer. Everything is left-aligned; trace views never centre. The hero is a **latency waterfall** — the same motif that becomes the 3D scene.

```
│
├─  We build AI systems that are
│   still running in six months.
│
│   [ Start a 2-week pilot ]   [ Book a technical call ]
│
│   ┌────────────────────────────────────────────────────┐
│   │  "sushi"              ████████            62ms  $0 │
│   │  "romantic italian"   ██████████████████  840ms    │
│   │  "sushi"              ██                  11ms  ⟳  │
│   └────────────────────────────────────────────────────┘
│
├─  live at warmchats.com    UK · MY · BD    10 engineers
│
```

### 4.2 Color — 7 tokens

```
--ink          #0B1015   page base — deep blue-black, not neutral black
--strata       #131A22   raised surfaces, lane bands
--rule         #24303B   hairlines, the trace rail, lane dividers
--type         #E6EDF3   primary text
--type-quiet   #7D8B99   secondary text
--fast         #37C4A8   teal — cached/keyword lane, shipped metrics, sub-100ms
--paid         #E8A33D   amber — AI lane, cost, target metrics
--fault        #E5484D   errors only
```

**Why two accents, not one:** they encode the single most important fact about your business — the free/fast path versus the paid/slow path. Colour carries information here, it isn't decoration. That is the justification; without it, two accents would be noise.

### 4.3 Type

| Role | Licensed route | Free route |
|---|---|---|
| Display + UI | ABC Diatype | Instrument Sans |
| Machine values | Söhne Mono | Commit Mono |

Scale: `76 / 50 / 33 / 22 / 17 / 15 / 13`
Body line length: max 68ch. Line-height 1.55 body, 1.05 display.

**Mono discipline:** mono appears only where the content is genuinely machine output — query strings, `ms`, `$`, model names, stack items, latency figures. Never for decorative eyebrow labels. Mono-for-every-small-label is a template tell; mono-for-real-telemetry is a design decision.

### 4.4 Explicitly banned typographic defaults

- Tracked-out ALL-CAPS eyebrow labels above headings
- Meta strings joined with middle dots (`A · B · C`) as chrome
- `→` appended to link and button text
- One word in a headline coloured or italicised for emphasis
- `01 / 02 / 03` numbering except where content is genuinely a sequence (the process section and the pilot timeline qualify; nothing else does)
- Identical rounded cards with identical shadows for every content type

### 4.5 Spacing, radius, grid

```
Space:  8 / 16 / 24 / 40 / 64 / 96 / 160
Radius: 3 (inputs) / 6 (cards) / 0 (lane bands — they're data, not cards)
Grid:   12 col, 1200px max, 24px gutter, content starts 40px right of the rail
```

---

## 5. Motion system

**Boldness is spent in exactly one place: the hero Query Engine.** Everything else is quiet.

### 5.1 The signature — "The Query Engine"

A live WebGL latency waterfall in the hero. Not decoration — **your actual shipped architecture, rendered.**

- Three lanes recede in depth: keyword (teal), AI (amber), cache (teal, dim)
- Query particles stream in, hit a classifier node, and split — ~80% snap down the keyword lane, ~20% arc into the AI lane and visibly slow, some loop into the cache ring and return in milliseconds
- Particles carry faint mono labels: `"sushi"`, `"romantic italian near me"`
- A live HUD counts latency, cost, and lane distribution
- **A text input lets the visitor type their own query and watch it route.** On submit, one deliberate 400ms camera dolly toward the chosen lane

Why this and not an abstract rotating shape: every agency has an abstract shape. Nobody has a 3D visualisation *of a system they actually shipped*. It demonstrates capability by existing.

### 5.2 Performance budget — hard limits

| Constraint | Limit |
|---|---|
| 3D bundle, gzipped | ≤180KB, dynamically imported |
| LCP element | Static WebP poster — **not** the canvas |
| Canvas init | After LCP fires, inside `requestIdleCallback` |
| Frame rate | 60fps desktop, `dpr` capped at 1.75 |
| Offscreen | `IntersectionObserver` pauses the render loop |
| Degradation | Drop to 1,000 particles if frame time >20ms sustained 2s |
| Mobile | **No WebGL.** Ship the 2D SVG waterfall |
| `prefers-reduced-motion` | Static poster, no canvas, no exceptions |

Fallback ladder: WebGL2 → interactive 2D SVG waterfall → static poster. All three must look intentional.

### 5.3 Everything else

Motion elsewhere responds to user action only — it shows what changed:

- Accordion open/close, 240ms
- Input focus: accent rule draws in, 200ms
- Form submit → success state, same verb ("Send" → "Sent")
- Copy-on-click for stack tags, mono confirmation
- Metric band counts up **once**, on first entry — this is the single non-triggered reveal on the page

**Not doing:** fade-and-slide-up on every section, hover lift on every card, parallax, scroll-jacking, kinetic type, WebGL anywhere but the hero, page-transition animations, custom cursors, magnetic buttons. These are scattered effects; one orchestrated moment beats twenty of them.

---

## 6. Page structure — 10 sections

| # | Section | Purpose |
|---|---|---|
| 1 | Hero + Query Engine | Pass the 10-second test; the memorable moment |
| 2 | Trust rail | Live product, locations, headcount, Clutch |
| 3 | Architecture (merged) | The proof. Interactive 2D waterfall + labelled metrics |
| 4 | Work — 3 projects | All three clickable to real case studies |
| 5 | The engineers | Named, photographed, LinkedIn — kills the #1 red flag |
| 6 | How we work + price | Process, engagement models, published bands |
| 7 | The pilot | The de-risked entry offer |
| 8 | Three doors | Engineer / finance / procurement paths |
| 9 | Objections | Server-rendered, FAQPage schema |
| 10 | Contact | Real form with budget band; Calendly deferred |

**Deleted:** 9 industry cards, all testimonials, both marquees, 4 stock photos, 4 work items, duplicate AI section. **14 → 10.**

Section 3 absorbs the old sections 3 and 7. The full restaurant write-up moves to `/work/restaurant-search`.

---

## 7. AI visibility layer

- JSON-LD: `Organization`, `Service`, `FAQPage`, `Article`, `BreadcrumbList`, `Person`
- **Entity consistency audit** — founding year, description, headcount identical across site, LinkedIn, Clutch. Contradictions cause LLMs to drop or dilute the source.
- `llms.txt` at root listing key pages
- `llms-full.txt` with case studies in Markdown
- Semantic HTML, clean heading hierarchy, no h-level skips

Schema is the part that reliably pays. `llms.txt` is cheap optionality.

---

## 8. Dynamic layer (Phase 2 — after the sprint)

**Payload CMS 3**, inside the same Next.js repo, Postgres, self-hosted.

**Collections:** `team_members` · `projects` · `metrics` (enforced `shipped|target` field) · `services` · `testimonials` (with `verified` flag) · `faqs` · `posts` · `clients` · `leads` · `media` · `users`

**Globals:** `navigation` · `site_settings` · `seo_defaults` · `homepage` (ordered section blocks)

**Section builder:** fixed component library. Editors can reorder, show/hide, and edit copy. They cannot invent layouts or override tokens.

**Also:** draft → preview → publish, versioning + rollback, roles (Admin / Editor), leads inbox with CSV export, ISR revalidation webhooks.

> **Critical:** build every section reading from typed files in `/content` during the sprint. Those files become Payload collections in Phase 2. Skip this and you build the whole page twice.

---

## 9. Build sprint — 3 days

**Honest scope.** Three days gets a complete, deployed, fast landing page with the 3D hero. It does not get you the CMS, two new case studies, or photography. Those are weeks 2–4.

### Prerequisites

**Resolved (see §12):**
- [x] Which projects — WarmChats and restaurant search. Two, not three.
- [x] Price bands — pilot price only, no bands in v1
- [x] Fonts — Instrument Sans via next/font/google; Commit Mono vendored from
      eigilnikolajsen/commit-mono under SIL OFL 1.1, licence file kept beside it

**Still open — these block launch, not just Session 4:**
- [ ] 10 real team photos — section 5 currently renders ten empty frames under
      the headline "You'll meet them before you sign", which reads as a false claim
- [ ] Role, years and stack for all 10 — COPY.md §5 requires all three
- [ ] LinkedIn for Nadim, Arifur Rahman, Tareq, Joinal
- [ ] Pilot price + deliverable

All of it goes in `content/team.ts` and section 5 picks it up with no component change.

> **Team data hygiene.** Before triage, `mo-face.svg` was the photo for Nazirul,
> Talha and Sabbir simultaneously, and Nadim's and Tareq's profile links pointed at
> X accounts belonging to strangers. Verify every replacement URL resolves to the
> right person before it goes in.

> **OPAL.** `opal-fashion-tech.png` is AI-generated — garbled wordmark, "SIGH NOW"
> CTA, invented product names. It must not ship in any section.

> **Calendly.** `calendly.com/bolttechfusion` is live and correct. The earlier
> instruction to "fix" it to `boltfusiontech` was wrong — that handle 404s. If the
> brand mismatch matters, rename the handle inside Calendly first, then update the code.

### Day 1 — foundation

| Hrs | Session | Output |
|---|---|---|
| 0–1 | Triage | Delete 4 template avatars, 4 stock photos, 3 testimonials, 2 marquees, 9 industry cards, 4 work items. Fix Calendly handle. Commit. |
| 1–3 | Tokens | Tailwind config from §4, fonts, trace-rail layout primitive, `/content` typed schemas |
| 3–6 | Sections 1, 2, 4, 5 | Static, real content, no placeholders |
| 6–8 | Section 3 | Waterfall SVG + metric band with shipped/target labels |

**End of day 1:** page renders top to bottom, real content, correct design system.

### Day 2 — complete and ship v1

| Hrs | Session | Output |
|---|---|---|
| 0–3 | Sections 6–10 | Process + pricing, pilot, three doors, objections (SSR'd), contact form + validation + notification |
| 3–5 | AI/SEO layer | All JSON-LD, `llms.txt`, `llms-full.txt`, entity consistency pass, meta |
| 5–7 | Polish | Image `sizes`/AVIF, defer Calendly, keyboard nav, focus states, contrast audit |
| 7–8 | **Ship** | Lighthouse, deploy. Site is live with the 2D SVG hero. |

### Day 3 — the Query Engine

| Hrs | Session | Output |
|---|---|---|
| 0–6 | WebGL scene | R3F, instanced particles, lane shader, HUD, query input, camera dolly |
| 6–7 | Guardrails | Poster/LCP, idle init, IntersectionObserver pause, mobile block, reduced-motion, degradation |
| 7–8 | Re-audit + ship | Lighthouse must stay 95+. If it doesn't, the fallback ships. |

**Why this ordering:** end of day 2 you have a complete, deployable, fast site. Day 3 is pure upside. If the 3D overruns, you ship anyway — you are never left with a half-finished hero and no fallback.

### Claude Code discipline

- One branch per session; review the diff before merging
- Never stack two sessions unreviewed — it will rewrite approved copy
- Feed references, not adjectives
- Keep `PLAN.md`, `CLAUDE.md`, `COPY.md` in the repo and reference them by filename in prompts

---

## 10. After the sprint

| Week | Work |
|---|---|
| 2 | Case studies for the other 2 projects |
| 2–3 | Payload install, collections, migrate `/content` |
| 3 | Admin panel: nav global, section builder, leads inbox, roles |
| 3–4 | `/services/*`, 3 industry pages, `/insights` |
| Ongoing | One real named testimonial, Clutch profile, LinkedIn headcount match, blog 1–2×/month |

---

## 11. Success metrics

| Metric | Target |
|---|---|
| Scroll depth to §3 | >60% — if lower, the hero still fails the 10-second test |
| Query Engine interaction rate | >25% of hero viewers |
| Pilot CTA vs call CTA | Track the split; pilot should win |
| LCP | <2.0s |
| Lighthouse | 95+ across all four |
| Qualified inbound | Baseline now, compare at 60 days |

---

## 12. Decisions — resolved

| Decision | Call | Why |
|---|---|---|
| Third project | **Dropped — ship two** | OPAL's only asset is an AI-generated mockup with no write-up. Two substantiated projects beat three with an empty frame. Add a third when a real screenshot and write-up both exist |
| Pricing | **Pilot price only** | Full transparency signal, no risk of underpricing bands prematurely. Full bands → /how-we-work in Phase 2 |
| Industry pages | **Cut all nine** | Sector nav underperforms; no evidence behind Pharma, Telecom, Smart Factory. Revisit in Phase 2 with 3 real pages anchored to 3 case studies |
| Pilot price | **Open — see below** | The only number that must come from you |

### Setting the pilot price

Price it as a scoping investment, not a profit centre. It should be an obvious yes
for a buyer who is nervous about an unknown offshore vendor.

- Basis: two weeks of one senior engineer, plus a few days of architecture input
- Position it near your true cost — the conversion it buys is worth more than the margin
- Round, memorable, no decimals
- Publish it. A price with a fixed scope beats "contact us" every time
- Fixed scope is what protects you: one vertical slice, defined at kickoff, written down

Whatever you land on, it goes in COPY.md §7 and nowhere else.
