# Bolt Fusion Tech — site

**This file describes the code as it is.** It is not a design proposal. If you
change the design, change this file in the same commit.

Its previous version specified a design system — eight colour tokens, a spacing
and type scale, the "trace rail", the hero "Query Engine", most of a set of 3D
rules — that commit `7c62d28` deliberately reverted. None of it existed in the
code, and a session reading it would have "fixed" the live site toward
something that was removed. `PLAN.md` still describes that plan: read it as
history, not as a specification.

Where a rule and the live design disagree and nobody has decided which goes,
the disagreement is listed under **Open: the rule or the design?** at the end.
Do not resolve those by editing either side.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Zod 4 ·
framer-motion · three.js through @react-three/fiber (hero only) · Neon Postgres
(CMS store) · Vercel Blob (admin uploads) · deployed on Vercel.

- Package manager: yarn 4 (`packageManager` in package.json), `nodeLinker:
  node-modules` — Turbopack does not support Plug'n'Play. `yarn.lock` is the
  only lockfile.
- There is no CI. `yarn verify:site` (below) is the check to run before pushing.
- `gsap` is listed in `dependencies` and imported nowhere.

## Routes

| route | what it is | content from |
|---|---|---|
| `/` | homepage, sections in CMS order (`site.sectionOrder`) | CMS, plus `/content` for the metric band and How we work · ISR, `revalidate = 60` |
| `/work` | index of the write-ups | `/content` |
| `/work/warmchats` | WarmChats case study — `components/case-studies/WarmChatsCaseStudy.tsx` | **hardcoded in the component** |
| `/work/restaurant-search` | restaurant search case study — `components/CaseStudy.tsx` | CMS `caseStudy` block |
| `/privacy-policy` | privacy policy | hardcoded |
| `/admin`, `/admin/login` | the CMS editor, noindex | — |
| `/api/admin/*` | content GET/PUT, login, logout, upload | — |

Also generated: `/opengraph-image`, `/robots.txt`, `/sitemap.xml`. Static:
`public/llms.txt`, `public/llms-full.txt`.

## Two content layers — know which one you are editing

**1. Typed files in `/content`** (`schema.ts`, `metrics.ts`, `projects.ts`,
`team.ts`, `services.ts`, `process.ts`, `pilot.ts`, `architecture.ts`).
Parsed with Zod at module load, so a malformed entry fails the build. Read by
`/work`, the homepage metric band (`Architecture.tsx`), `HowWeWork.tsx` and
`lib/structured-data.ts`. There is no FAQ here: the FAQ exists once, in the site
content below, and its structured data is generated from it
(`fix/faq-one-source`). Person structured data still reads `content/team.ts`
while the Team section renders the site content — the same two-source shape,
removed when the Team section is rebuilt.

**2. The CMS site content.** Schema `lib/site-content-schema.ts`, code defaults
`lib/default-site-content.ts` (parsed at module load — invalid defaults fail
the build), edited at `/admin`, stored in Neon as ONE override document that is
deep-merged onto the defaults when read. Read by every other homepage section
and by the restaurant case study.

**Decided 2026-09-11: the CMS is removed**, in its own PR after this batch
merges. The first admin save would silently shadow every code change to these
fields, this batch included. The default content, schema and Zod validation move
into `/content`; the admin UI, login, storage, API and their seven dependencies
go. Until that PR lands, the behaviour below is what exists.

How the CMS behaves. Each of these has already caused a bug:

- **Stored values win, and arrays replace.** A stored array replaces the
  default array whole; it is not merged item by item.
- **An admin save writes the whole document.** After one save, every value
  comes from the database and editing `default-site-content.ts` changes nothing
  on the live site.
- **In production the admin is switched off.** No session secret is
  configured: `/admin` redirects to `/admin/login?reason=config` and every
  `/api/admin/*` call answers `503 Admin not configured`. Nothing has been saved
  through it, and live renders exactly the code defaults (diffed against a build
  with an empty store, 2026-09-11). **Until the admin is configured,
  `lib/default-site-content.ts` is the live content.**
- **A stored document that fails validation is dropped.** `safeBuild` then
  serves the code defaults for the whole site and logs
  `[site-content] stored document failed validation; serving defaults`. So a
  new required field makes every existing stored document invalid. **Every
  newly required field needs an entry in `migrateStored()`**
  (`lib/load-site-content.ts`) that derives it from what the document already
  says — never by inventing a value.
- Production writes need `DATABASE_URL`. Without it the store is a local file
  (`data/site-content.json`, gitignored) that refuses writes in production.
- Writes use optimistic concurrency (a version number) and keep a history for
  undo. Admin auth: `ADMIN_PASSWORD` / `SITE_ADMIN_PASSWORD` plus a session
  secret, rate-limited login, a same-origin check on every write.

## Design language, as built

Dark, rounded cards, no photography. **Not tokenised:** colours are Tailwind
utilities and a few inline values, not CSS variables.

- Ground `#000` (body); raised surfaces `#0d0d0d`; the WarmChats page `#0a0a0a`.
- Text is white at opacity steps — `white/80`, `/65`, `/55`. **Nothing that
  must be read goes below `white/55`** on the dark ground: 22–48% measured
  3.0–4.5:1 and failed AA (verify-site checks 18 and 20). Hairlines `white/10`
  and `white/[0.07]`.
- The navbar shows the full nav from `xl` (1280px) and the burger below it: the
  nav needs ~1,100px, and at `md` it cut off "Book a call" on portrait tablets.
- Two accents that carry meaning: **cyan** (`cyan-200`) = shipped, measured;
  **amber** (`amber-200`, `amber-300`) = target, and the primary call to
  action. Red (`red-300`) is for errors only.
- Radii: `rounded-full` pills, `rounded-2xl` and `rounded-[30px]` cards,
  `rounded-[10px]` controls.
- Cards carry large soft drop shadows set inline (for example
  `16px 24px 20px 8px rgba(0,0,0,0.4)`), repeated per component, not shared.
- Widths: sections `max-w-[1600px]` or `1400px`; the case study `1180px`; text
  columns `640px` / `720px`.
- `app/globals.css` utilities: `.beam-button`, `.corner-glow`, the logo
  animations (`logo-chip-breathe`, `logo-aurora-drift`), `.cv-section`.
  `.grain-overlay` is still defined and no longer used.

## Type

Three faces. The tokens that name them are in `app/globals.css`.

| face | token | used for |
|---|---|---|
| Satoshi (variable, `public/fonts`) | `--font-heading` — set inline, `style={{ fontFamily: "var(--font-heading)" }}` | headings |
| Inter (`next/font/google`) | `--font-sans` — Tailwind `font-sans`, and `<body>` | body and UI |
| Commit Mono (variable, `public/fonts`, SIL OFL licence beside it) | `--font-machine` (inline) and `--font-mono` (Tailwind `font-mono`) | machine values |

The `next/font` variables live on `<html>`, which is `:root`, where the tokens
are declared. Move them to `<body>` and every token stops resolving; delete the
tokens and the whole site renders in the system font. Both have happened.
verify-site checks 1 and 2 catch both.

## Motion, as built

- **Reveals** (`lib/reveal.ts`, `components/RevealController.tsx`, REVEAL in
  `app/globals.css`). The server HTML is always visible: an element that
  animates in carries `data-reveal` and CSS variables, never `opacity:0`. On
  first paint every reveal plays a CSS entrance — no script needed, and it ends
  visible. After hydration the controller hides only what is still below the
  viewport, reveals it on entry (-40px bottom margin), and reveals at once
  anything a flick or a jump carried past. Under reduced motion nothing hides and
  nothing moves. Use `reveal({ x, y, duration, delay })`; never add a framer
  `initial={{ opacity: 0 }}`.
- **Hero entrance:** the same CSS entrance, staggered by delay; the H1 is never hidden.
- **framer-motion remains** for the FAQ accordion and the mobile menu
  (`AnimatePresence`), Team's scroll parallax, and the hero's scroll arrow.
- **Hero background:** a WebGL curl-noise particle nebula
  (`components/HeroParticleField.tsx`) — the one place WebGL is allowed. One
  `THREE.Points` cloud of ~28k
  particles (9k on coarse pointers), dynamically imported with `ssr: false`,
  skipped for `prefers-reduced-motion` and without WebGL, render loop stopped
  off-screen and when the tab is hidden, dpr capped at 1.75. It is the only
  WebGL on the site.
- **Reduced motion:** nothing loops. The particle field is skipped, every CSS
  loop has a reduced-motion guard (`.beam-button` included), the hero arrow uses
  `useReducedMotion`, the CTA's status dot is `motion-safe:`. verify-site
  checks 21 and 23.

## SEO and AI visibility

- Metadata: the root layout plus per-page metadata; title template
  `%s | Bolt Fusion Tech`.
- **Canonical description**, word for word wherever the company is described —
  meta description, OG image, Organization JSON-LD, `llms.txt`: *"We build AI
  systems that are still running in six months."* (COPY.md, "Company
  description — canonical"). verify-site check 12 enforces it.
- JSON-LD from `lib/structured-data.ts`. The homepage graph: Organization,
  WebSite, Service, FAQPage, Person (only engineers with a verified LinkedIn),
  BreadcrumbList. `/work` and both case studies emit their own; each case study
  is BreadcrumbList + Article. Breadcrumbs point at pages, never at anchors.
- **FAQPage is generated from the FAQ the page renders** — the same `faq.items`
  the section is given, and only when the section renders. There is no second
  copy to keep in sync. verify-site check 14 compares them question for
  question and answer for answer.
- `robots.txt` disallows `/admin/` and `/api/` (and `/tokens`, `/rebuild`,
  routes that no longer exist). The sitemap lists the five public routes.
- The OG image is `app/opengraph-image.tsx`. The apple-touch-icon is
  `public/apple-touch-icon.png`, declared in the layout: an explicit `icons`
  object suppresses Next's `app/apple-icon` convention.

## Hard rules

Each rule is followed by whether the live site keeps it. "Broken" means the
rule stands and the site is wrong — except where the conflict is listed as open
at the end, which means nobody has decided yet.

- **Zero stock photography.** Screenshots, real photographs or SVG diagrams.
  *Holds* (verify-site check 10).
- **No fake faces, ever** — never a template avatar, a stock face or a
  generated one, not even as a placeholder. A section ships without the photo
  slot until real photographs exist. *Holds* with `fix/team-no-template-avatars`
  (verify-site check 27).
- **Reveals render visible in the server HTML.** Fade-on-scroll is allowed; an
  element the server sends at `opacity:0` is not. *Holds* with
  `fix/reveal-visible-html` (checks 4 and 5).
- **No tracked-out ALL-CAPS labels, no single headline word coloured for
  emphasis, no meta strings joined with middle dots, mono for machine output
  only.** *Holds* with `design/rules-decided`.
- **Every metric carries a shipped or target label.** No unlabelled numbers.
  Enforced at build time in `/content/metrics.ts`, by the CMS schema for the
  case-study KPIs, and by the KPI type in the WarmChats component. *Holds* once
  the WarmChats KPIs are labelled (verify-site check 8).
- **A published project links to its write-up.** Enforced in both layers
  (`state: published | awaiting-asset`). There is no fallback link: a project
  without a write-up is shown with no link at all. *Holds* (check 9).
- **Content lives in `/content` or the CMS, not in JSX.** *Holds*, except the
  WarmChats case study and the privacy policy, which are hardcoded.
- **Semantic HTML: exactly one `h1` per page, no skipped heading levels.**
  *Holds* with `fix/case-study-headings` (checks 11 and 26).
- **Visible keyboard focus everywhere.** *Holds* with `fix/featured-card-focus`. Watch for
  this one: an inline `box-shadow` overrides every Tailwind `ring`, so a card
  that sets its shadow inline needs an outline for focus (check 19).
- Body text at most 68ch wide. *Not audited.*

## Writing voice

Plain verbs, sentence case, active voice. A CTA says what happens: "Start a
pilot", not "Submit". Errors explain what went wrong and how to fix it. No
filler. Never claim a metric without a source label.

## Do not touch

`/app/work/warmchats` — copy approved, structure locked. The lock yields to the
hard rule that every metric carries a shipped or target label: the approved
copy predates the rule, and the rule wins.

## Verify before pushing

`yarn verify:site` runs `scripts/verify-site.mjs`, a black-box suite, against
production; `--base http://localhost:3000` runs it against a local build. It
asserts what must hold whatever the content says; each check names the bug it
exists to catch. `--repo .` adds the repository checks; `--probe-writes` sends
unauthenticated writes to the admin API (harmless while the guard holds).

**Anything triggered by entering the viewport** — lazy images, web-font loads,
reveals, count-ups — must be measured on a fresh page scrolled at reading
speed. Measured on a page that has already been scrolled, or never scrolled, it
reports the absence of the behaviour as a fact about the site.

**Run it against the merged result**, not a single branch or the stack: build
`main` with every open branch merged in order, then run the whole suite. Three
contrast failures on the featured-work cards (3.92, 3.95 and 4.1:1) existed only
in the merged state — the real fonts and the pill's bottom padding together moved
the text into the light half of the card gradient. Neither branch alone showed it.

**The one contrast exemption is the wordmark** — WCAG 2.2 SC 1.4.3, "Logotypes".
It covers the element marked `data-logotype` in `components/Logo.tsx`, for checks
18 and 20 only, and check 18 fails if that element ever holds anything but "Bolt
Fusion Tech". It is not a small-text exemption and must not become one.

## Performance targets

Lighthouse 95+ in all four categories · LCP under 2.0s · no layout shift from
any animation. Nothing measures these yet.

## Decided 2026-09-11: the rule or the design

Each of these was a rule the live design broke. The owner decided; the code is
being brought into line in the order below. Until a fix lands, the rule stands
and the site is wrong.

| rule | decision | where the fix is |
|---|---|---|
| No fake faces, ever — not as a placeholder | **Rule stands.** The ten template avatars `d64ef52` restored as "renamed placeholder illustrations" are removed; Team is text-forward (COPY.md §5) until real photographs exist | `fix/team-no-template-avatars` |
| No fade-and-slide-up on every section | **Rule removed.** Fade-on-scroll is allowed. The defect was never the reveal; it was the server HTML shipping at `opacity:0`. Reveals now render visible in the HTML (see Motion) | `fix/reveal-visible-html` |
| No tracked-out ALL-CAPS labels | **Rule stands.** All 31 go | `design/rules-decided` |
| No particle backgrounds | **Rule rewritten:** WebGL, and the particle field, belong to the hero and nowhere else — which is what exists | — |
| No single headline word coloured for emphasis | **Rule stands.** "lower hiring cost" goes with the hero copy | `design/rules-decided` |
| No meta strings joined with middle dots as chrome | **Rule stands,** the OG image included | `design/rules-decided` |
| Mono for machine output only | **Rule stands.** The logo's "TECH", stack lines and Team labels move to the body face | `design/rules-decided` |
| Hero copy from COPY.md | **COPY.md's approved hero wins** | `design/rules-decided` |

Still open: gradient washes used as decoration (the hero headline's gradient
text, gradients in CTA and Team), and one card shadow repeated across sections.

## Decided 2026-09-11, second round

| question | decision | where |
|---|---|---|
| The Team section | **The six people with a verified LinkedIn**, each with role, stack and years. COPY.md §5 amended: a member without a verified profile is not listed | its own PR, once the owner supplies the data |
| The logo wordmark's contrast | **The check was wrong, not the mark.** WCAG 1.4.3 exempts logotypes; the exemption is scoped to the wordmark and guarded | `tooling/verify-site` |
| FAQ vs FAQPage structured data | **The rendered five are canonical**, and the markup is generated from them: one source, not a corrected second copy | `fix/faq-one-source` |
| COPY.md §4 layout note | **Superseded.** The section is a carousel; two cards on a two-column grid is a separate decision, not made | `docs/copy-md-decisions` |
| The CMS | **Removed**, in its own PR after this batch merges (see Two content layers) | not started |
| Unused CSS — `.ai-rise`, `animate-mesh`, `blob-*` | Next batch | — |

## Reference documents

- `COPY.md` — copy approved during the September rebuild. The canonical company
  description comes from it; the live hero does not (see above).
- `PLAN.md` — the rebuild plan, including the trace-rail design system that
  `7c62d28` reverted. History, not specification.
