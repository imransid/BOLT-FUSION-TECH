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
`team.ts`, `services.ts`, `process.ts`, `pilot.ts`, `architecture.ts`,
`faqs.ts`). Parsed with Zod at module load, so a malformed entry fails the
build. Read by `/work`, the homepage metric band (`Architecture.tsx`),
`HowWeWork.tsx` and `lib/structured-data.ts`.

**2. The CMS site content.** Schema `lib/site-content-schema.ts`, code defaults
`lib/default-site-content.ts` (parsed at module load — invalid defaults fail
the build), edited at `/admin`, stored in Neon as ONE override document that is
deep-merged onto the defaults when read. Read by every other homepage section
and by the restaurant case study.

How the CMS behaves. Each of these has already caused a bug:

- **Stored values win, and arrays replace.** A stored array replaces the
  default array whole; it is not merged item by item.
- **An admin save writes the whole document.** After one save, every value
  comes from the database and editing `default-site-content.ts` changes nothing
  on the live site. On 2026-09-11 live rendered exactly the code defaults
  (diffed against a build with an empty store): either nothing has been saved,
  or the stored copy equals the defaults. Telling those apart needs
  `DATABASE_URL`, which no local env file holds.
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
- Text is white at opacity steps — `white/80`, `/60`, `/50`, `/40`. Hairlines
  `white/10` and `white/[0.07]`.
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

- **Reveal on scroll.** framer-motion `whileInView` (once): opacity 0 → 1 with
  a 14–40px slide, in ten components — AboutMe, Architecture, CTA, CaseStudy,
  FAQ, Footer, HowWeWork, RecentWorks, Services, WarmChats. The server HTML
  renders these at `opacity:0`, so with JavaScript off most of both case
  studies is invisible (verify-site check 4). A fix is proposed, not built.
- **Hero entrance:** framer `animate` on mount, staggered.
- **FAQ accordion and the mobile menu:** `AnimatePresence`.
- **Hero background:** a WebGL curl-noise particle nebula
  (`components/HeroParticleField.tsx`). One `THREE.Points` cloud of ~28k
  particles (9k on coarse pointers), dynamically imported with `ssr: false`,
  skipped for `prefers-reduced-motion` and without WebGL, render loop stopped
  off-screen and when the tab is hidden, dpr capped at 1.75. It is the only
  WebGL on the site.
- **Reduced motion:** honoured by the particle field and the CSS utilities.
  The framer reveals call `useReducedMotion` only in CaseStudy, WarmChats, Team
  and Logo.

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
- `robots.txt` disallows `/admin/` and `/api/` (and `/tokens`, `/rebuild`,
  routes that no longer exist). The sitemap lists the five public routes.
- The OG image is `app/opengraph-image.tsx`. The apple-touch-icon is
  `public/apple-touch-icon.png`, declared in the layout: an explicit `icons`
  object suppresses Next's `app/apple-icon` convention.

## Hard rules — in force

- **Zero stock photography.** Screenshots, real photographs or SVG diagrams.
- **No fake faces, ever.** A team card with no real photograph renders no
  photograph — never a template avatar, a stock face or a generated one.
- **Every metric carries a shipped or target label.** No unlabelled numbers.
  Enforced at build time in `/content/metrics.ts`, by the CMS schema for the
  case-study KPIs, and by the KPI type in the WarmChats component.
- **A published project links to its write-up.** Enforced in both layers
  (`state: published | awaiting-asset`). There is no fallback link: a project
  without a write-up is shown with no link at all.
- **Content lives in `/content` or the CMS, not in JSX** — except the
  WarmChats case study and the privacy policy, which are hardcoded.
- Semantic HTML, exactly one `h1` per page, no skipped heading levels, visible
  keyboard focus. verify-site checks 11, 19 and 26.
- Body text at most 68ch wide (applied in three places; not audited).

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

## Performance targets

Lighthouse 95+ in all four categories · LCP under 2.0s · no layout shift from
any animation. Nothing measures these yet.

## Open: the rule or the design?

Each row is a rule the previous CLAUDE.md stated that the live design breaks.
**Undecided. Do not "fix" either side until the owner decides.**

| rule | where the live site breaks it |
|---|---|
| No tracked-out ALL-CAPS labels | 31 instances in 8 components: CaseStudy (11), WarmChats (7), Hero (3), HowWeWork (3), Team (3), Logo (2), Navbar (1), RecentWorks (1) |
| No fade-and-slide-up on every section | framer `whileInView` in the ten components listed under Motion |
| No particle backgrounds | the hero's WebGL nebula |
| No single headline word coloured for emphasis | hero line 2 — "lower hiring cost" in amber (`hero.headlineLine2Accent`) |
| No meta strings joined with middle dots as chrome | featured-work stack lines ("Real Estate · AI Automation · Microservices"), case-study badges ("Case study · Systems architecture"), the WarmChats stack line, the OG image's "WEB · MOBILE · AI" |
| Mono for machine output only | the logo's "TECH" (hardcodes `ui-monospace` inline), the featured-work stack lines, Team labels, case-study eyebrows |
| Hero copy from COPY.md | COPY.md's approved hero is "We build AI systems that are still running in six months."; the live hero is "Build. Scale. Transform. / With elite engineers and lower hiring cost." from the CMS defaults |

Lesser, same question: gradient washes used as decoration (the hero headline's
gradient text, gradients in CTA and Team), and one card shadow repeated across
sections.

## Reference documents

- `COPY.md` — copy approved during the September rebuild. The canonical company
  description comes from it; the live hero does not (see above).
- `PLAN.md` — the rebuild plan, including the trace-rail design system that
  `7c62d28` reverted. History, not specification.
