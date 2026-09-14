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
framer-motion · three.js through @react-three/fiber (hero only) · deployed on
Vercel. There is no CMS and no database: the content is typed files in `/content`.

- Package manager: yarn 4 (`packageManager` in package.json), `nodeLinker:
  node-modules` — Turbopack does not support Plug'n'Play. `yarn.lock` is the
  only lockfile.
- There is no CI. `yarn verify:site` (below) is the check to run before pushing.

## Routes

| route | what it is | content from |
|---|---|---|
| `/` | homepage, in the Techwix clone's design (`app/(home)`); sections in `site.sectionOrder` | `/content` — `site.ts` for the sections, `metrics.ts` for the hero's proof strip, `architecture.ts`, `process.ts` and `services.ts` for Architecture and How we work · static |
| `/work` | index of the write-ups | `/content` |
| `/work/warmchats` | WarmChats case study — `components/case-studies/WarmChatsCaseStudy.tsx` | **hardcoded in the component** |
| `/work/restaurant-search` | restaurant search case study — `components/CaseStudy.tsx` | `/content/site.ts`, `caseStudy` block |
| `/privacy-policy` | privacy policy | hardcoded |

Also generated: `/opengraph-image`, `/robots.txt`, `/sitemap.xml`. Static:
`public/llms.txt`, `public/llms-full.txt`.

**Two root layouts, one per design.** `app/(home)/layout.tsx` is the homepage's
root: it alone loads `app/(home)/techwix.css` and the Barlow and Jost faces.
`app/(site)/layout.tsx` is every other page's root, in the site's own design:
`app/globals.css`, Inter, Satoshi and Commit Mono, and the reveal controller.
Neither design's stylesheet or fonts load on the other's pages, and the inner
pages render pixel-identically to how they did under a single `app/layout.tsx`.
Both share `lib/root-metadata.ts`. With no layout at the top of `app/`, Next's
404 has no layout to sit in, and an unknown URL got Next's bare error shell —
unstyled, with no `metadataBase`. `experimental.globalNotFound` (next.config.ts)
makes it render `app/global-not-found.tsx` instead: the site's own root (the
same faces, `app/globals.css`, the same body) around Next's built-in 404, as it
rendered under the single layout. A `not-found.tsx` inside `app/(site)` does
not work here: in Next 16.1 it does not catch `notFound()` for its own root
layout.

## Content — one layer, in `/content`

Every word on the site that is not hardcoded in a component lives in a typed
file in `/content`, parsed with Zod when the module loads, so a malformed entry
fails `next build` with the file named:

- `site.ts` (schema `site-schema.ts`) — navigation, the hero, the homepage
  sections except Architecture and How we work, the restaurant case study
  (`caseStudy`), FAQ, team and footer. It is
  server-only and deep-frozen: pages pass it to `<SiteContentProvider>`, and
  client components read their slice with `useSiteContent()`. Never re-export
  `./site` from the `/content` barrel — client components import that barrel.
  Two blocks in it, `about` and `services`, are validated but rendered by
  nothing: the homepage rebuild cut both sections (COPY.md, "Removed from the
  homepage"), and editing them changes nothing. (`aiExcellence` and `process`,
  the two blocks that were in the same state before, were deleted with it.)
- `metrics.ts`, `projects.ts`, `services.ts`, `process.ts`, `pilot.ts`,
  `architecture.ts` (schemas in `schema.ts`) — read by `/work`, the homepage
  (`components/techwix/*`: the proof strip, Architecture, How we work) and
  `lib/structured-data.ts`.

There is one FAQ (`faq.items`) and one team (`team.roster`); their structured
data is generated from the same items the sections render (`fix/faq-one-source`,
`feat/team-verified-six`). `site.sectionOrder` must list every section exactly
once — a bad order fails the build. To hide a section, set
`site.sectionVisibility[id]` to `false`.

**The CMS was removed on 2026-09-11** (`chore/remove-cms`): the admin UI, login,
Neon store, Blob uploads, admin API, `proxy.ts` and seven dependencies. The admin
was never configured in production, so nothing was ever saved through it, and
its first save would have silently shadowed every later code change to those
fields. A content change is now a code change: edit the file, and the build
validates it.

## Design language, as built

**Two designs while the rebuild is half done.** The homepage is in the Techwix
clone's design (*The homepage*, below). Every other page is in the site's own
dark design, described first. Restyling the inner pages, and whether their fonts
follow the homepage's, is open.

Dark, rounded cards, no photography. **Not tokenised:** colours are Tailwind
utilities and a few inline values, not CSS variables.

- Ground `#000` (body); raised surfaces `#0d0d0d`; the WarmChats page `#0a0a0a`.
- Text is white at opacity steps — `white/80`, `/65`, `/55`. **Nothing that
  must be read goes below `white/55`** on the dark ground: 22–48% measured
  3.0–4.5:1 and failed AA (verify-site checks 18 and 20). Hairlines `white/10`
  and `white/[0.07]`.
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

### The homepage

The Techwix clone's design, with the site's real content and none of the
theme's photographs, logos, icon font, SVG art or copy. Every measured value —
colours, the title ramp, the buttons, the header's headroom contract, the hero
panel, the case-study row, the contact panel, the footer fill — comes from the
clone study on the retired `techwix-replica` branch; its pixel-matching rules do
not apply here. All of it is plain CSS in `app/(home)/techwix.css`, which only
the homepage loads; there is no Tailwind on the homepage.

- Bands alternate white and `#f7f7f9`; navy panels: the hero `#01013f` (35px
  radius), the team `#010742`, the contact panel `#091577`, the footer `#010717`.
  Brand `#086ad8`, ink `#0e0e0e`, body text `#4c4d56`. Content capped at 1300px.
- Barlow 500 / 600 / 700 for headings, Jost 400 / 500 / 600 for text, loaded with
  `next/font/google` in `app/(home)/layout.tsx` only; the body's line-height is
  the clone's unitless 1.73. The title ramp: 70/78 major and 48/54 section at
  ≥1025px, 48/60 and 36/52 below.
- Status chips keep the site's meaning: teal-cyan = shipped, amber = target —
  `#0b6f78` on `#e2f3f4` and `#9a4a06` on `#fdf0dc` on light bands, light teal
  and amber outlines on navy. Nothing else borrows those two colours.
- The architecture lanes use `<FigureText>` exactly as the other pages do. Its
  chip is styled for the homepage from `techwix.css` (`.tw-root [data-status] >
  span:last-child`), and `--font-machine` maps to Jost there, because Commit Mono
  is not loaded on the homepage. Do not add homepage variants to the component.
- Buttons: Jost 600, 5px radius; the primary is the clone's gradient, darkened so
  its lightest stop clears 4.65:1 against white.
- The header is white and sticky, with the full nav from 1200px and a drawer below
  it (focus trapped, Escape closes, `aria-expanded` on the burger).
- The logo is our mark in a dark tile beside the wordmark in Barlow and Jost
  (`components/techwix/Logo.tsx`); the mark's drawing is `components/LogoMarkSvg.tsx`,
  shared with `<LogoMark>` on the other pages.
- Visible focus: a 3px outline, brand blue on light bands and light blue on navy.

## Type

The homepage uses Barlow and Jost only (*The homepage*, above). Every other page
uses three faces. The tokens that name them are in `app/globals.css`.

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

- **Reveals, outside the homepage** (`lib/reveal.ts`, `components/RevealController.tsx`, REVEAL in
  `app/globals.css`). The server HTML is always visible: an element that
  animates in carries `data-reveal` and CSS variables, never `opacity:0`. On
  first paint every reveal plays a CSS entrance — no script needed, and it ends
  visible. After hydration the controller hides only what is still below the
  viewport, reveals it on entry (-40px bottom margin), and reveals at once
  anything a flick or a jump carried past. Under reduced motion nothing hides and
  nothing moves. Use `reveal({ x, y, duration, delay })`; never add a framer
  `initial={{ opacity: 0 }}`.
- **Homepage reveal:** the clone's own. Elements marked `data-tw-reveal` that
  are still below the fold after hydration get `.animated` and
  `techwix--slide-up` (3rem and a fade, 1.25s, `fill-mode: none`) when they enter
  the viewport (`components/techwix/RevealObserver.tsx`). Nothing is hidden in
  the server HTML, and nothing moves under reduced motion. The hero has no
  entrance: it renders in place, and the H1 is never hidden. The header's
  headroom slide is a 0.25s transform (`HeadroomController.tsx`).
- **framer-motion remains** only in `<LogoMark>` (`components/Logo.tsx`), on the
  pages outside the homepage; the homepage ships none. The FAQ uses none of it:
  each item is a `<details name="faq">` with a CSS open/close (in
  `app/(home)/techwix.css`).
- **Hero field (homepage):** step 3 ships the poster only —
  `public/hero/field-poster-{660,1320}.{avif,webp}`, a real frame of the field,
  as a plain `<img>` in a `<picture>` (the LCP element; the image optimizer is
  not on that path). Below 1025px or on a coarse pointer it drifts slowly — a
  CSS transform, so no layout shift; under reduced motion it is still. There is
  no canvas and no WebGL on any page. `components/HeroParticleField.tsx` (the
  old three.js / @react-three nebula) is still in the tree and imported by
  nothing; the raw WebGL2 renderer replaces it in step 4, which also removes
  those three dependencies — see *The hero field* under Hard rules.
- **Reduced motion:** nothing loops. The poster's drift, the homepage reveal,
  the header's slide, the drawer's slide and the FAQ's open/close each have a
  reduced-motion guard, as does every CSS loop in `app/globals.css`
  (`.beam-button` included). verify-site checks 21 and 23.

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
  The answers are in the served HTML: each item is a `<details name="faq">`,
  opened by the browser one at a time, with or without script, and the open
  state is native to `<summary>`. Check 14 reads the answers from the served
  HTML — not from the DOM after a click — and the open state from the
  accessibility tree.
- `robots.txt` disallows only `/tokens` and `/rebuild`, routes that no longer
  exist. The sitemap lists the five public routes.
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
- **A person is listed only with a verified LinkedIn profile — enforced at
  load, not by convention.** A team member's `profileUrl` is required and must
  be a `linkedin.com/in/` URL. The site content is parsed when it loads, so a
  member without one fails the build, and no link can be built from a handle. Role, experience and stack stay empty until real data exists — never
  examples. Person structured data comes from the same roster, emitting only
  the fields that exist. *Holds* with `feat/team-verified-six` (checks 14, 27).
- **Reveals render visible in the server HTML.** Fade-on-scroll is allowed; an
  element the server sends at `opacity:0` is not. *Holds* with
  `fix/reveal-visible-html` (checks 4 and 5).
- **The hero field — the one place WebGL is allowed, and never in the way.**
  Decided 2026-09-11 for the homepage rebuild; *holds* once
  `redesign/techwix-home` lands. Step 3 (the poster, no canvas yet) is built:
  the poster `<img data-hero-poster>` is the final LCP entry at 390, 768, 1024,
  1025 and 1440, measured with a buffered `PerformanceObserver` on a fresh,
  unscrolled load; the field is the right half of the panel at ≥1025px and sits
  above the text below that.
  - The LCP element is a static poster `<img>` made from a real frame of the
    field, never the canvas. The canvas fades in over it and cannot shift layout.
  - Everything the hero says is server HTML. The field carries no information
    and is `aria-hidden`.
  - The fallback ships first; WebGL is progressive enhancement, imported only
    after the first LCP entry and `load`, inside `requestIdleCallback`.
  - **One draw call, no per-particle objects, no per-frame allocation.** This
    rule used to read "`InstancedMesh` only". Its intent was one draw call and
    no per-particle objects. A single `POINTS` draw in raw WebGL2 meets that
    better than instanced quads — one vertex per particle instead of four, for
    the same curl-noise shader — and weighs about 5KB gzipped against the 218KB
    three.js / @react-three/fiber chunk it replaces. Do not bring three.js back
    for the field.
  - DPR capped at 1.75; down to 1,000 particles after two seconds of frames over
    20ms; paused offscreen and when the tab is hidden.
  - Never mounted on mobile — only on `(pointer: fine) and (min-width: 1025px)`
    with Save-Data off. Phones get the poster and a CSS drift; under reduced
    motion, the poster alone.
  - **It sits beside the headline, never behind it.** On the old black hero it
    sat behind the headline, and keeping the white type legible took five
    overlay layers — two colour glows, a radial wash, a vignette and a fade to
    black — which wiped the particles out. On the rebuild's navy panel the field
    takes the right half and the headline sits on flat navy, so contrast holds
    by construction and nothing covers the field. Putting it behind the
    headline again means rebuilding those five layers.
- **No tracked-out ALL-CAPS labels, no single headline word coloured for
  emphasis, no meta strings joined with middle dots, mono for machine output
  only.** *Holds* with `design/rules-decided`.
- **Every metric carries a shipped or target label.** No unlabelled numbers. A
  figure counts wherever it sits, inside a sentence too (decided 2026-09-11):
  four unlabelled figures in the architecture lanes survived because check 8
  only saw standalone figures. Check 8 now reads every figure in the visible
  text: each carries its own chip, or is a spec or term exempted per instance
  with its own reason — never by category.
  Enforced at build time in `/content/metrics.ts`, by the site-content schema
  for the case-study KPIs, by the KPI type in the WarmChats component, and by
  `content/figure-labels.ts` for in-sentence labels and exemptions. *Holds* on
  the inner pages except the "80% of traffic" figures, which await the owner;
  the homepage is labelled with its rebuild (verify-site check 8).
  **One scoped exception, decided 2026-09-11:** the restaurant-search meta
  description says "keeping most traffic under 100ms" with no label. The figure
  is `search-response` in `/content/metrics.ts`, labelled shipped everywhere the
  site shows it, and a meta description is not a page claim. The exception is
  that one string in `app/work/restaurant-search/page.tsx` and nothing else: any
  other figure in metadata, and every figure on a page, carries a label or goes.
- **A published project links to its write-up.** Enforced by both schemas in
  `/content` (`state: published | awaiting-asset`). There is no fallback link: a project
  without a write-up is shown with no link at all. *Holds* (check 9).
- **Content lives in `/content`, not in JSX.** *Holds*, except the
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

The FAQ is `<details name="faq">` — decided 2026-09-11. **Do not turn it back
into a button accordion, and do not add `aria-expanded`.** Native semantics beat
hand-written ARIA: `<summary>` reports open and closed to assistive technology
itself, so there is no attribute to keep in sync, and a hand-kept one is a second
source that can drift. The answers are in the served HTML, which the FAQPage
structured data depends on, and the browser opens them with or without script —
a button accordion does nothing without it. One open at a time comes from the
shared `name`. verify-site check 14 reads the answers from the served HTML (with
Next's embedded page data stripped: a check that passes because the framework
repeated the content proves nothing) and the open state from the accessibility
tree, so a regression to click-mounted answers fails it.

## Verify before pushing

`yarn verify:site` runs `scripts/verify-site.mjs`, a black-box suite, against
production; `--base http://localhost:3000` runs it against a local build. It
asserts what must hold whatever the content says; each check names the bug it
exists to catch. `--repo .` adds the repository checks. Check 17 keeps the retired admin gone:
`/admin`, `/admin/login` and the four `/api/admin/*` routes must answer 404,
robots.txt must not name them, and no page may link to them.

**Check 8 reads sentences.** Every figure in the visible text (opened `<details>` too) sits in a
`data-status` wrapper holding that one figure and its OWN visible chip, or a `data-figure-exempt`
holding one figure with a real reason (not empty, a placeholder or one word; 12+ characters), both
from `content/figure-labels.ts`. Standalone metric cards keep their in-card label rule.

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
It covers the element marked `data-logotype` — the wordmark, now in
`components/techwix/Logo.tsx`, the only wordmark on the site — for checks
18 and 20 only, and check 18 fails if that element ever holds anything but "Bolt
Fusion Tech". It is not a small-text exemption and must not become one.

## Performance targets

Lighthouse 95+ in all four categories · LCP under 2.0s · no layout shift from
any animation. Nothing measures these yet.

## A figure labelled shipped with nothing behind it — found 2026-09-12

**What happened.** The restaurant-search cost figure `~$0.001` entered the repo
on 2026-05-02 (`3ef2b95`) as a budget: the write-up says "~$0.001 per search
(budgeted)" and "Budgeted hybrid retrieval", and that the architecture "caps
model spend at roughly" that figure. On 2026-09-05 (`7c62d28`, the rebuild)
COPY.md's metric table gave it the label `shipped` with no source recorded, and
from there it reached `/content/metrics.ts`, the homepage metric band, the
`/work` card, `llms.txt` ("Both figures are `shipped`") and the `llms-full.txt`
table — live from the rebuild's deploy until this fix, while the case study on
the same site still called it budgeted. `fix/kpi-status-labels` then copied the
`shipped` label onto the case-study KPI card whose own hint reads "Budgeted
hybrid retrieval". The AI lane's "roughly 20% of traffic" came in the same
2026-05-02 commit and never carried a label or a source. The figure was four
months old; the `shipped` label on it, about a week.

**How it was found.** By tracing history — `git log -S` across every branch, the
docs and the restaurant-system repos — when the owner asked where each figure
came from. No check caught it, and none could have: check 8 asks whether a
figure HAS a label, never whether the label is TRUE. A `shipped` label with
nothing behind it passes every check the suite has.

**Decided by the owner, 2026-09-12.** Both are budgets and read `target`
everywhere: the metric band, the `/work` card, both llms files, COPY.md, and a
target chip beside each in-sentence instance (`content/figure-labels.ts`). The
earliest evidence wins over a later unsourced claim. Where prose says "caps model
spend at roughly", the words stay — they are already honest — and the chip beside
them says `target`. A capability is not a metric: the "Multi-tenant" and
"Observable" KPI cards carry no status chip at all, because chipping a capability
dilutes what the chip means. (The owner had approved them as `shipped` on an
earlier report; that approval is withdrawn.)

**What would have caught it:** a rule that a `shipped` label requires a recorded
source — the measurement, dashboard, log query or document that shows the figure
on a system that shipped.

**Backlog — a schema requirement, not yet built:** `status: "shipped"` must carry
a `sourceRef`, and the build fails without one. It covers every place a status
is set: `/content/metrics.ts`, the case-study KPIs, the WarmChats KPIs, and the
in-sentence labels in `content/figure-labels.ts` (which already refuse a label
without a `source` string — the same idea, not yet a checked reference).

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
| The Team section | **The six people with a verified LinkedIn**, shown with name, handle and link. Role, stack and years stay empty until real data exists — thin cards because the data is thin. COPY.md §5 amended: a member without a verified profile is not listed | `feat/team-verified-six` |
| The logo wordmark's contrast | **The check was wrong, not the mark.** WCAG 1.4.3 exempts logotypes; the exemption is scoped to the wordmark and guarded | `tooling/verify-site` |
| FAQ vs FAQPage structured data | **The rendered five are canonical**, and the markup is generated from them: one source, not a corrected second copy | `fix/faq-one-source` |
| COPY.md §4 layout note | **Superseded.** The section is a carousel; two cards on a two-column grid is a separate decision, not made | `docs/copy-md-decisions` |
| The "under 100ms" meta description | **Stays unlabelled**: a scoped exception to the label rule, recorded under Hard rules | `chore/low-findings` |
| FAQ answers missing from the served HTML | **Fixed in the same branch as the one-source fix:** the answers are in `<details>`, and check 14 reads them from the served HTML | `fix/faq-one-source` |
| COPY.md §2, "Ten engineers" | **Six**, with the reason recorded, so a copy pass cannot restore ten while the site shows six | `docs/copy-md-decisions` |
| The CMS | **Removed**: content, schema and validation moved to `/content`; admin, store, API and seven dependencies deleted (see Content) | `chore/remove-cms` |
| Unused CSS — `.ai-rise`, `animate-mesh`, `blob-*`; since the homepage left `app/globals.css`, also its FAQ block (`.faq-item`), `.cv-section` and `.grain-overlay` | Next batch. Left in place on purpose in step 3: the inner pages had to stay pixel-identical, and `app/globals.css` is theirs | — |

## Decided 2026-09-11, the homepage rebuild

| question | decision | where |
|---|---|---|
| The design | **The clone's design becomes the homepage**, with every piece of real proof kept (reverses decision (a)); none of the Techwix theme's photos, logos, icon font or copy | `redesign/techwix-home` |
| Sections | **Six that argue:** hero with a proof strip, the two write-ups, architecture, how we work, team, questions and contact | `redesign/techwix-home` |
| About and Services | **Cut.** Generic reassurance and a "we do everything" card grid; recorded in COPY.md so a copy pass does not restore them | `redesign/techwix-home` |
| The particle renderer | **Raw WebGL2, one points draw** — see *The hero field* under Hard rules | `redesign/techwix-home` |
| Figures inside sentences | **Labelled, like every figure**; check 8 extended to see them | `redesign/techwix-home` |
| Order of work | **CMS removal first**, then check 30 (content parity), then the homepage without WebGL, then the renderer | `chore/remove-cms`, `test/content-parity` |

## Reference documents

- `COPY.md` — copy approved during the September rebuild. The canonical company
  description comes from it; the live hero does not (see above).
- `PLAN.md` — the rebuild plan, including the trace-rail design system that
  `7c62d28` reverted. History, not specification.
