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

Next.js 16 (App Router) · React 19 · TypeScript · Zod 4 · plain CSS, one
stylesheet (`app/techwix.css`) · Barlow and Jost through `next/font/google` ·
deployed on Vercel. There is no CMS and no database: the content is typed files
in `/content`. There is no animation library, no three.js and no Tailwind: all
three went with the old design on 2026-09-15 (*Design language*, below).

- Package manager: yarn 4 (`packageManager` in package.json), `nodeLinker:
  node-modules` — Turbopack does not support Plug'n'Play. `yarn.lock` is the
  only lockfile.
- Runtime dependencies: `next`, `react`, `react-dom`, `server-only`, `zod`.
  Verify-site check 24 fails a dependency nothing imports.
- There is no CI. `yarn verify:site` (below) is the check to run before pushing.

## Routes

| route | what it is | content from |
|---|---|---|
| `/` | homepage (`app/page.tsx`); sections in `site.sectionOrder` | `/content` — `site.ts` for the sections, `metrics.ts` for the hero's proof strip, `architecture.ts`, `process.ts` and `services.ts` for Architecture and How we work · static |
| `/work` | every approved project, labelled by who built it: the write-ups, Bolt Fusion projects, in-house products and our engineers' track record (`app/work/page.tsx`; *Projects and attribution*) | `/content/projects.ts` |
| `/work/warmchats` | WarmChats case study — `components/case-studies/WarmChatsCaseStudy.tsx` | **hardcoded in the component** |
| `/work/restaurant-search` | restaurant search case study — `components/CaseStudy.tsx` | `/content/site.ts`, `caseStudy` block |
| `/privacy-policy` | privacy policy | hardcoded |

Also generated: `/opengraph-image`, `/robots.txt`, `/sitemap.xml`. Static:
`public/llms.txt`, `public/llms-full.txt`.

**One root layout.** `app/layout.tsx` wraps every page and the 404. It loads
`app/techwix.css` and the Barlow and Jost faces, and holds the site-wide
metadata: the title template, the canonical description, icons and robots.
The homepage renders the site's header and footer itself; every other page
renders inside `components/techwix/PageShell.tsx` — the same header and footer
around the page's `<main>`, and the reveal. On an inner page the header's
anchors point at the homepage (`/#services`), its logo at `/`, and back to top
at the header; `current` marks the page's own link (`aria-current`).

**The 404 is the standard `app/not-found.tsx`,** inside the root layout: an
unknown URL answers 404 with the site's header, a banner and the footer, and
Next adds `noindex`. Its words are the ones the site's 404 always showed —
"404" and "This page could not be found." — and its button is the privacy
policy's own "← Back to boltfusiontech.com". Verify-site check 31 fetches an
unknown URL and asserts the status, the header, one h1 and the stylesheet.

Until 2026-09-15 there were two root layouts, `app/(home)` and `app/(site)`, one
per design, and the 404 was `app/global-not-found.tsx` behind
`experimental.globalNotFound`, importing Next's built-in page from a
Next-internal module. All of it went with the old design; `next.config.ts` has
no experimental flags.

Links are plain `<a>`, except a literal link to `/`, which eslint's
`no-html-link-for-pages` wants as `<Link>` (check 24): those are
`<Link prefetch={false}>`.

## Content — one layer, in `/content`

Every word on the site that is not hardcoded in a component lives in a typed
file in `/content`, parsed with Zod when the module loads, so a malformed entry
fails `next build` with the file named:

- `site.ts` (schema `site-schema.ts`) — navigation, the hero, the homepage
  sections except Architecture and How we work, the restaurant case study
  (`caseStudy`), FAQ, team and footer. It is server-only and deep-frozen:
  server components read it and pass each client component only its slice as
  props. Never re-export `./site` from the `/content` barrel — client
  components import that barrel.
  The homepage rebuild cut About and Services (COPY.md, "Removed from the
  homepage"); their blocks and schema entries were deleted, as `aiExcellence`
  and `process` were before them; the old hero's scroll hints, trust points and
  accent word and the carousel's swipe hint went on 2026-09-15. Nothing in it is
  validated but unrendered.
- `metrics.ts`, `projects.ts`, `services.ts`, `process.ts`, `pilot.ts`,
  `architecture.ts` (schemas in `schema.ts`) — read by `/work`, the homepage
  (`components/techwix/*`: the proof strip, Architecture, How we work) and
  `lib/structured-data.ts`.
- `figure-labels.ts` — the in-sentence labels and exemptions (*Hard rules*).

There is one FAQ (`faq.items`) and one team (`team.roster`); their structured
data is generated from the same items the sections render (`fix/faq-one-source`,
`feat/team-verified-six`, `feat/team-ten`). How to fill a team member in — each
field, its format, and what turns a pending member into a verified one — is
written above the roster in `content/site.ts`; the build validates all of it. `site.sectionOrder` must list every section exactly
once — a bad order fails the build. To hide a section, set
`site.sectionVisibility[id]` to `false`.

**The CMS was removed on 2026-09-11** (`chore/remove-cms`): the admin UI, login,
Neon store, Blob uploads, admin API, `proxy.ts` and seven dependencies. The admin
was never configured in production, so nothing was ever saved through it, and
its first save would have silently shadowed every later code change to those
fields. A content change is now a code change: edit the file, and the build
validates it.

## Projects and attribution (decided 2026-09-15)

Every project the site shows says who built it. `content/projects.ts` gives each
one a `kind`, and the kind decides what its card shows. The owner decided the
list on 2026-09-15; the words and facts are his portfolio's
(imran-khan-chi.vercel.app) and nothing else — no metric, client, role or date it
does not state.

| kind | what it is | the label on its card | links | image |
|---|---|---|---|---|
| `case-study` | a Bolt Fusion project with a write-up here: WarmChats, restaurant search | "Case study: built by Bolt Fusion [for ‹client›]" | its write-up (required), and the live product | a real screenshot |
| `project` | a Bolt Fusion delivery: FanLock, Balanzify, Go Style Business | "Delivered project: built by Bolt Fusion [for ‹client›]" | the live product, or none | a real screenshot of the live site |
| `in-house` | a product we built for ourselves: OPAL | "In-house product: our own, not built for a client" | the live product, or none | a real screenshot of the live site |
| `track-record` | work one of our engineers shipped at a previous employer: Go Smart (Brain Station 23), NIdle Finishing (Intellier) | "Track record: built by our engineer at ‹employer›, not by Bolt Fusion" | store listings and public proof | **none** — the product is someone else's |

- **Never present an employer's product as ours.** A track-record project names
  its employer (`builtAt`) and the engineer's role (`role`), and the schema
  (`content/schema.ts`) refuses one without them — or with a client, a
  screenshot or metrics. It is never called our client and carries no
  confidential detail.
- **A product another company owns is "built by Bolt Fusion for …", never
  ours:** WarmChats belongs to WarmChats, Inc., Balanzify to Balanzify Inc.
  (`client`).
- **The label sits directly above the project's name on every card,** the
  case-study rows included, in the brand blue — never a shipped/target colour.
  Verify-site check 9 holds its own copy of the four labels and fails a card on
  /work whose label is missing, hidden, somewhere else or not its kind's; a
  track-record card without its employer and role, or with a screenshot; a card
  not in `projects.ts`, or a published project with no card; a card image that
  does not load; and a card that is not a case study linking to a write-up.
- **Screenshots are real captures of the live sites,** Playwright at 1440×900,
  saved as webp in `public/projects/`, of a view with no faces in it: FanLock's
  "Fight leaks" section (its hero shows a face), Balanzify's migration page (its
  homepage dashboard shows customer avatars), Go Style Business's sign-in page
  (its only public page) and OPAL's shop (its hero collage shows faces). Never a
  mockup: `public/projects/opal-fashion-tech.png` is AI-generated and banned
  (PLAN.md).
- **/work is four sections,** one per kind, in `projectSections` order. The
  track-record section says what it means: "Work our engineers shipped at
  previous employers — credited to them, not claimed as ours." Every grid fills
  its rows: three across from 1025px, two across from 768px, one on phones; a
  set that divides by neither is one column, and a card alone lays its
  screenshot beside its text.
- **The homepage keeps its two case studies.** "See all work (N projects)" counts
  the published projects that are ours, from the data; the track record is not
  counted.
- `llms.txt` and `llms-full.txt` credit every project as its card does.

**Excluded, and why — never add them:**
- the Jumatechs apps (Myrep, IQ Test, Cleva, Bidesh App): Jumatechs is the
  owner's current employer;
- Bangladesh RAB: built by Intellier, and RAB has been under US Treasury
  sanctions since December 2021;
- Team Pharma and JTI Sheikh.

Check 30 fails if any of them appears on `/` or `/work`.

**Held back, waiting on the owner:**
- **Playzone** is in `projects.ts` as `awaiting-asset`, not rendered. On
  2026-09-16 its only link, playzone-update.vercel.app, redirected to a sign-in
  page for "Playerzone" ("a platform for players to connect with coaches and
  other players") — not the multiplayer classic-games platform, with no
  signups, that the portfolio describes.
- **Bazzile and GodConnect Online** are not listed: neither the portfolio nor
  the CV names the employer they were built at, and a track-record entry cannot
  exist without one. If Bazzile is added, its "70,000 downloads in France in
  twelve months" is Bazzile's figure, not ours: shown only with a per-instance
  `data-figure-exempt` reason and its source (Journal de l'Agence) beside it.

## Design language, as built

**One design — decided by the owner on 2026-09-15.** The whole site is in the
Techwix clone's design, with the site's real content: the homepage, /work, both
write-ups, the privacy policy and the 404. The old dark design is gone, code and
all: `app/globals.css` (the beam button, corner glow, grain, logo animations,
`.cv-section`, the `[data-reveal]` system, the old FAQ block), its three faces
(Inter, Satoshi, Commit Mono — the files and the licence), `lib/reveal.ts` and
`components/RevealController.tsx`, framer-motion, `<LogoMark>`'s animated chip
(`components/Logo.tsx`), the `SiteContentProvider` context, Tailwind and
`postcss.config.mjs`. Verify-site check 31 fails if any of it comes back, on a
page or in the source.

None of the theme's photographs, logos, icon font, SVG art or copy ship. Every
measured value — colours, the title ramp, the buttons, the header's headroom
contract, the hero panel, the case-study row, the contact panel, the footer
fill — comes from the clone study on the retired `techwix-replica` branch; its
pixel-matching rules do not apply here. All of it is plain CSS in
`app/techwix.css`: the homepage's sections first, the inner pages' pieces at the
end ("INNER PAGES").

- **Tokens** (`:root` in `app/techwix.css`): brand `#086ad8`, ink `#0e0e0e`, body
  text `#4c4d56`, light surface `#f7f7f9`, hairline `#e1e1e1`; navy panels — the
  hero and every page banner `#01013f` (35px radius), the team `#010742`, the
  contact and call-to-action panels `#091577`, the footer `#010717`. Content
  capped at 1300px; the side gutter `clamp(15px, 4vw, 50px)`.
- **Breakpoints** are the clone's: `≤767`, `768–1024`, `≥1025`, plus the
  header's own `1200` (desktop nav ↔ drawer).
- **Bands** alternate white and `#f7f7f9`, 120px of padding at ≥1025, 90 below,
  72 on phones.
- **Status chips** keep the site's meaning: teal = shipped, amber = target —
  `#0b6f78` on `#e2f3f4` and `#9a4a06` on `#fdf0dc` on light bands, light teal
  and amber outlines on navy (`.tw-on-dark`). Nothing else uses those two
  colours: tags, taglines, pills and icons are the brand blue.
- **In-sentence chips.** `<FigureText>` (`components/FigureText.tsx`) puts
  `.tw-figchip` straight after the figure inside its `data-status` wrapper;
  `app/techwix.css` styles it, following the band. Do not add page variants to
  the component.
- **Buttons:** Jost 600, 5px radius; the primary is the clone's gradient,
  darkened so its lightest stop clears 4.65:1 against white; `light` and
  `secondary` on navy, `outline` on light bands.
- **The header** is white and sticky, with the full nav from 1200px and a drawer
  below it (focus trapped, Escape closes, `aria-expanded` on the burger). The
  drawer is in the server HTML, hidden, so the burger's `aria-controls` names an
  element before any script runs, and moves to `<body>` after mount; its list is
  a `<nav aria-label="Primary">`, the navigation landmark below 1200px (A4, A5).
  Without JavaScript the burger cannot open it: below 1200px a reader without
  script navigates by the footer and the page's own links. The page scrolls
  with `scroll-padding-top` of the header's height plus 12px, so a focused
  element or an anchor's target is never under it (A1).
- **Skip link:** "Skip to content", the first stop on every page, off screen
  until focused, to `main#main` (`app/layout.tsx`). Every page's `<main>` —
  the homepage's and `PageShell`'s — carries `id="main"`.
- **The proof strip:** each figure's chip sits beside it, in the figure's own
  row, which names its metric (`data-metric`, the id in `content/metrics.ts`);
  a label with a figure of its own ("Search response, 80% of traffic") keeps
  that figure's chip. /work's figures are built the same way (K1).
- **The logo** is our mark in a dark tile beside the wordmark in Barlow and Jost
  (`components/techwix/Logo.tsx`); the mark's drawing is
  `components/LogoMarkSvg.tsx`, which the footer, the WarmChats sign-off and the
  share image also draw. It was drawn for a dark tile.
- **Visible focus:** a 3px outline, brand blue on light bands and light blue on
  navy.

### The inner pages

Each is assembled from pieces built once in `components/techwix`, so no page is
styled by hand:

| piece | what it is |
|---|---|
| `PageShell` | the site's header and footer around the page's `<main>`, and the reveal |
| `PageBanner` | the hero's rounded navy panel holding the page's one h1 on the title ramp; an optional back link, eyebrow, lead, buttons, and a screenshot beside the text at ≥1025px (below it under that), never behind it |
| `SectionHeading` | an eyebrow (the clone's Barlow 500 subtitle), the h2 on the ramp's section size, an intro |
| `Summary` | an executive summary beside the clone's gradient delimiter |
| `KpiGrid`, `KpiCard` | a figure with its own chip beside it — ahead of any chip in the hint, so the card's first status is the figure's — its label and hint; a capability ("Multi-tenant") is a word in ink with no chip |
| `LaneCard` | the homepage's lane card with a marker row (a number, then traffic and latency or a tag) and a footer line |
| `Tags`, `Bullets` | lists whose every item goes through `<FigureText>` |
| `Shot` | a screenshot in a fixed frame, covering it from the top, its caption below and never over it |
| `CtaPanel` | the homepage's navy contact panel, as a page's closing call to action on a light band |

A page is a navy banner, then sections on alternating bands, then the navy
call-to-action panel, then the footer. The privacy policy is legal prose
(`.tw-prose`) on a white band. The copy of every inner page is unchanged
(COPY.md), and `/work/warmchats` keeps its words and its section order.

## Type

Barlow and Jost only, from `next/font/google` in `app/layout.tsx`: Barlow
500 / 600 / 700 for headings, the logo and figures, Jost 400 / 500 / 600 for
text and buttons. All normal — no italic anywhere. `<b>` and `<strong>` are 600:
the browser's `bold` would ask Jost for a 700 it does not load (check 3). The
tokens `--font-heading` (Barlow) and `--font-body` (Jost) are declared at `:root`
in `app/techwix.css`; the body is Jost 16px on the clone's unitless 1.73.

The title ramp: 70/78 major and 48/54 section at ≥1025px, 48/60 and 36/52 below;
24/34 sub and 20/30 small at every width. The type is on the span inside the
heading (`.title-*`), the heading wrapper has line-height 0.

**All six faces are preloaded,** because every page paints each in its first
viewport at 390, 768 and 1440 — the header's logo alone sets Barlow 500 and 700
and Jost 500, every h1 is Barlow 600. A preload lands on every page the one
layout wraps, so a face that stops being painted above the fold on any page
gets `preload: false`; check 25 fails a preload its page never renders.
**The tradeoff, measured by the hero-perf review (2026-09-15):** the four font
preloads cost about 140ms of first contentful paint in the mobile lab profile,
and gain about 20ms of LCP. They are kept because LCP is the budgeted metric
(check 29) and the poster is the LCP element either way; FCP is not budgeted. A
change that makes FCP matter — a budget on it, or a first paint that has to be
the text — reopens this. (Recorded, not re-measured, in the fix pass.)

The `next/font` variables live on `<html>`, which is `:root`, where the tokens
are declared. Move them to `<body>` and every token stops resolving; delete the
tokens and the whole site renders in the system font. Both have happened.
Verify-site checks 1 and 2 catch both.

The share image (`app/opengraph-image.tsx`) renders outside CSS, in satori,
which reads TTF, OTF or WOFF and not the WOFF2 files next/font serves. It uses
Barlow 500 and 600 as TrueType files in `assets/fonts`, with their SIL OFL
licence beside them, read at build time.

## Motion, as built

- **The reveal** — one system, on every page: `components/techwix/RevealObserver.tsx`,
  rendered by the homepage and by `PageShell`. Elements marked `data-tw-reveal`
  that are still below the fold after hydration get `.animated` and
  `techwix--slide-up` (3rem and a fade, 1.25s, `fill-mode: none`) when they
  enter the viewport. Nothing is hidden in the server HTML, and nothing moves
  under reduced motion. Page banners and the hero have no entrance: they render
  in place, and no h1 is ever hidden. **Until 2026-09-15 it animated nothing:**
  the attribute's value names the animation, React renders a bare
  `data-tw-reveal` as `"true"`, and every element got the class `animated true`.
  The observer now reads `"true"` and `""` as the default. No check caught it —
  every check reads a page at rest, where a reveal that never runs and one that
  has finished look the same. **Focus ends a reveal** (A2): a keyboard user
  tabbing into a card below the fold would otherwise see it fade in from
  opacity 0 around the focused control; on `focusin` the observer stops
  watching that element and finishes any animation already running on it.
- **The header's headroom** slide is a 0.25s transform (`HeadroomController.tsx`).
- **No animation library.** framer-motion was removed on 2026-09-15. The FAQ
  uses none: each item is a `<details name="faq">` with a CSS open/close.
- **Hero field (homepage): the poster only** —
  `public/hero/field-poster-{660,1320}.{avif,webp}`, a real frame of the field,
  as a plain `<img>` in a `<picture>` (the LCP element; the image optimizer is
  not on that path). Below 1025px or on a coarse pointer it drifts slowly — a
  CSS transform, so no layout shift; under reduced motion it is still. The
  owner chose "static image first" on 2026-09-15: the old three.js /
  @react-three nebula (`components/HeroParticleField.tsx`) was deleted with
  `three`, `@react-three/fiber`, `@react-three/drei` and `@types/three`, and the
  raw WebGL2 renderer comes later as its own change, kept outside the repo. There
  is no canvas and no WebGL on any page (verify-site check 25, `WEBGL_ON_HOME`
  false) — see *The hero field* under Hard rules.
- **Reduced motion:** nothing loops. The poster's drift, the reveal, the
  header's slide, the drawer's slide, the FAQ's open/close and the screenshot
  hover zooms (the homepage's case cards, /work's rows) each have a
  reduced-motion guard. verify-site checks 21 and 23.

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
  `/work` is named "Case studies" in every breadcrumb — its own and the
  write-ups' — as the navigation names it, and each Article's headline is its
  page's h1, from the same source the page renders (A7, 2026-09-15).
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
- The OG image is `app/opengraph-image.tsx`, in the site's design — the hero's
  navy, a brand-blue rule, Barlow and our mark — with its words unchanged. The
  two write-ups use their own screenshots. The apple-touch-icon is
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
  (verify-site check 27, which since 2026-09-15 also counts CSS background
  images as pictures and fails any picture on a pending card).
- **A person is linked, and marked up as Person, only with a verified LinkedIn
  profile. A named team member without one is shown as 'profile pending', with
  initials, never a photo or a borrowed handle. Decided 2026-09-15.** Enforced
  at load, not by convention: a member is `status: "verified"` — a
  `linkedin.com/in/` `profileUrl` and a handle, both required — or
  `status: "pending"`, which refuses a `profileUrl`, a handle and a photo. Both
  member schemas are strict, so a stray or retired key fails the build too,
  and no link can be built from a handle. A pending card is the name, an
  initials monogram (text, in the corner where a verified card carries its
  arrow) and "Profile coming soon", with no link. Role, years, stack and photo
  stay out until real data exists — never examples; a photo is a verified
  member's own photograph under `/team/`, and a years value ("8 years" is a
  figure) needs its exemption in `content/figure-labels.ts`, which the build
  names. Person structured data comes from the same roster, verified members
  only (`personLd` filters, so no caller can emit a pending one), emitting only
  the fields that exist. *Holds* with `feat/team-ten` (checks 14, 27, 30).
- **Reveals render visible in the server HTML.** Fade-on-scroll is allowed; an
  element the server sends at `opacity:0` is not. *Holds*: the reveal's
  `fill-mode: none` has no hidden resting state (checks 4 and 5).
- **The hero field — the one place WebGL is allowed, and never in the way.**
  Decided 2026-09-11 for the homepage rebuild. Step 3 (the poster, no canvas
  yet) is built: the poster `<img data-hero-poster>` is the final LCP entry,
  measured with a buffered `PerformanceObserver` on a fresh, unscrolled load —
  verify-site check 28 asserts it by identity at 390 (also as a phone), 768,
  1024, 1025, 1280 (also at DPR 2) and 1440 on every run, and then, settled,
  that the poster is still rendered, opaque, the field's box, on top of
  everything in the field but a canvas with the field's box, and clear of the
  h1 (an LCP entry is never withdrawn, so the identity alone cannot see a
  poster hidden, faded, covered or moved after it painted). The field is the
  right half of the panel at ≥1025px — 560px tall, centred on the text column,
  so the poster is drawn exactly 660px wide and `sizes` says so (H4: at the
  column's full height, 832px at 1025, the browser fetched a file about 1.5x too
  small at every DPR) — and sits above the text below that.
  - **A re-rendered poster gets a new file name.** `/hero/*` is served
    `public, max-age=31536000, immutable` (`next.config.ts`, un-hashed /public
    assets): a browser that has the old file never asks again. Step 4 re-renders
    the poster; it ships as `field-poster-v2-*` or similar, never over the old
    name.
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
    motion, the poster alone. Check 25 hooks `getContext` before any page
    script — in the page, in every frame, and inside every dedicated worker —
    sends a first pointer move, tap or click, wheel turn and key, and fails any
    WebGL context at 390, 768 or 1024, as a phone, as a touch tablet (1180x820
    and 1366x1024, a coarse pointer), with Save-Data on, or under reduced
    motion — and, until the renderer lands, any on `/` at all. Width alone is
    never the gate: an iPad in landscape is 1180 or 1366 wide.
  - **It sits beside the headline, never behind it.** On the old black hero it
    sat behind the headline, and keeping the white type legible took five
    overlay layers — two colour glows, a radial wash, a vignette and a fade to
    black — which wiped the particles out. On the rebuild's navy panel the field
    takes the right half and the headline sits on flat navy, so contrast holds
    by construction and nothing covers the field. Putting it behind the
    headline again means rebuilding those five layers.
- **No tracked-out ALL-CAPS labels, no single headline word coloured for
  emphasis, no meta strings joined with middle dots, mono for machine output
  only.** *Holds* with `design/rules-decided`; the site now loads no mono face
  at all.
- **Every metric carries a shipped or target label.** No unlabelled numbers. A
  figure counts wherever it sits, inside a sentence too (decided 2026-09-11):
  four unlabelled figures in the architecture lanes survived because check 8
  only saw standalone figures. Check 8 now reads every figure in the visible
  text: each carries its own chip, or is a spec or term exempted per instance
  with its own reason — never by category.
  Enforced at build time in `/content/metrics.ts`, by the site-content schema
  for the case-study KPIs, by the KPI type in the WarmChats component, and by
  `content/figure-labels.ts` for in-sentence labels and exemptions. *Holds* on
  every page (verify-site check 8), with no exception since the 2026-09-15
  relabel of "80% of traffic".
  **One scoped exception, decided 2026-09-11:** the restaurant-search meta
  description says "keeping most traffic under 100ms" with no label. The figure
  is `search-response` in `/content/metrics.ts`, labelled shipped everywhere the
  site shows it, and a meta description is not a page claim. The exception is
  that one string in `app/work/restaurant-search/page.tsx` and nothing else: any
  other figure in metadata, and every figure on a page, carries a label or goes.
  Check 8 enforces it (since 2026-09-15): it reads every rendered element's
  `aria-label`, `alt`, `title` and the like, `<svg>` titles, the document
  title, the text-bearing meta tags, every JSON-LD string, and the llms files,
  with the same grammar as the visible text. There a figure carries its status
  in words after it (`` `target` ``), or is a term exempted for that instance in
  `content/figure-labels.ts`, or is this one string (`META_ALLOW` in the suite,
  which prints every place it allows it — the meta, og and twitter descriptions
  and the Article's description) — or it fails.
- **A published project links to its write-up.** Enforced by both schemas in
  `/content` (`state: published | awaiting-asset`). There is no fallback link: a project
  without a write-up is shown with no link at all. *Holds* (check 9). Since 2026-09-15
  this is the case-study rule: the other kinds link to their live product or show no
  link, and never to a write-up (*Projects and attribution*).
- **Content lives in `/content`, not in JSX.** *Holds*, except the
  WarmChats case study and the privacy policy, which are hardcoded.
- **Semantic HTML: exactly one `h1` per page, no skipped heading levels.**
  *Holds* with `fix/case-study-headings` (checks 11 and 26). Every page's h1 is
  in its banner (the homepage's in the hero); the header and footer carry none.
- **Visible keyboard focus everywhere.** *Holds*: the 3px outline in
  `app/techwix.css` (`:where(a, button, summary, [tabindex]):focus-visible`).
  A component that sets `outline: none` needs a replacement that shows (check 19).
- Body text at most 68ch wide. *Not audited.*

## Writing voice

Plain verbs, sentence case, active voice. A CTA says what happens: "Start a
pilot", not "Submit". Errors explain what went wrong and how to fix it. No
filler. Never claim a metric without a source label.

## Do not touch

`/work/warmchats` (`components/case-studies/WarmChatsCaseStudy.tsx`) — copy
approved, structure locked. Restyled on 2026-09-15 with every word and the
section order kept. The lock yields to the hard rule that every metric carries
a shipped or target label: the approved copy predates the rule, and the rule
wins.

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

**Check 8 reads sentences.** Every figure in the visible text (opened `<details>` too), read at
1440, 390, 768 and 1024, sits in a `data-status` wrapper holding that one figure and its OWN
visible chip, or a `data-figure-exempt` holding one figure with a real reason (not empty, a
placeholder or one word; 12+ characters) — and either wrapper is an entry in
`content/figure-labels.ts` word for word, its reason or status included: a wrapper written by hand,
or a junk reason long enough to pass the reason test, fails (K11). Standalone metric cards keep
their in-card label rule, but a chip inside another figure's `data-status` wrapper is never theirs,
and a `[data-metric]` box — the proof strip's rows, /work's figures — holds its figure's own chip
and names its metric in `content/metrics.ts`, value and status included (K1: the first proof card's
label carries a target chip for its 80%, and the `<100ms` read as target, even with its own shipped
chip deleted). A wrapper is judged by the figures it covers, never by its own box (K2: a
`display:contents` wrapper has no box and skipped the one-figure rule). A chip counts only if a
reader can see it: on the page, at least 80% of its text showing through whatever clips it, and
nothing else on top of its text (K8). The grammar (`tokenizeFigures`) joins a figure split across
touching boxes ("45" in an inline-block, then "ms"; a flex row with no gap), separates a word run
against a figure from spans ("Latency" + "45ms"), reads `::before` / `::after` text, and knows "3X",
"×2", scale words ("2 million") and thousands-separated counts ("10,000") (K9). The same grammar
reads what is not visible text — attributes, meta tags, JSON-LD and the llms files (K10; *Hard
rules*, the scoped exception). **Known limit: spelled-out numbers are not figures** ("six months",
"two-week"). "Still running in six months" is the canonical line; a spelled-out metric is caught by
review, not by this check.

**Check 30 is the content contract.** `scripts/content-inventory.json` lists every
page's content; a required needle missing from the served HTML fails, and so does
a cut item coming back. A restyle that moves text into different nodes splits
the needle at the boundary (`8716ba5`); it never deletes a required word.

**Checks added or changed in step 3:**
- **25, rewritten** — no WebGL at 390 or 768, as a phone, or under reduced
  motion at any width, and until the renderer lands none on `/` at all: a
  `getContext` hook is installed before any page script, on every visit and on
  dedicated runs (extended in the review fix pass, below: workers, every frame,
  a first input, 1024, touch tablets and Save-Data). No three.js or @react-three chunk on any page. Ready for the
  renderer behind `WEBGL_ON_HOME`: a renderer chunk (any script asking for a
  WebGL context) is at most 15KB gzipped, requested after the load event, and
  never at 390 or 768 or under reduced motion. Its font check reads every route:
  each font a page preloads must be a face that page renders.
- **28, new** — the hero is HTML, and the poster is the LCP element. The
  headline, subtext, call to action and every proof-strip figure with its
  label, status and source link are in the served HTML with scripts stripped;
  the final `largest-contentful-paint` entry is `img[data-hero-poster]`, by
  identity, at 390 (also as a phone), 768, 1024, 1025, 1280 (also at DPR 2) and
  1440 — the last four added in the review fix pass (below) — and a canvas or
  anything else fails; the poster has `width`, `height` and
  `fetchpriority="high"` and is never `loading="lazy"`.
- **29, new** — the performance budget (*Performance targets*, below).
- **31, rewritten 2026-09-15 — one design.** It guarded the split while two
  designs coexisted; it now guards the one. Every page loads a stylesheet of
  the site's design (known by its `.tw-root` / `.tw-hero` / `.tw-header` rules,
  not its hashed name), loads Barlow and Jost, and declares, requests and
  renders no other face — no Inter, Satoshi or Commit Mono. No page loads a
  stylesheet of the retired design (its beam button, glows, grain, logo
  animations, `.cv-section`, `.faq-item`, `[data-reveal]`) or Tailwind's output
  (`--tw-*`), and no element carries those classes or the attribute. An
  unknown URL answers 404 with the site's header, one h1 and the stylesheet.
  With `--repo`, the tracked files hold no font but Barlow's and Jost's, and no
  source file holds a retired class, `data-reveal`, framer-motion, three.js,
  `next/font/local`, Tailwind, or a `next/font/google` face but Barlow and Jost.
- **20, capture corrected 2026-09-15, then rewritten** — the full-page capture it
  sampled painted a fixed or sticky box where the current scroll offset put it.
  At the bottom of a page the headroom header is slid up just out of view, and
  the capture painted it over the text in the band above the last viewport: its
  white bar, logo tile and blue button became the "ground" under body text on
  four inner pages, where no reader ever sees the header. Hiding those boxes for
  the capture fixed that and broke the reverse — text over a fixed ground was
  measured against the page behind it, and the header's text was never
  measured. The review fix pass replaced the full-page capture with captures
  viewport by viewport (below).
- **18, extended** — prints how many elements carry `data-logotype` on each
  page, and fails a page that renders more than one.
- **10, 2, 4 and 22, extended** — a visit's settle waits (every image decoded,
  every font loaded) are bounded at 20s, and an image or font still loading
  after that is a finding naming it (10, 2); a page that never reaches `load`
  is a finding (4 without JavaScript, 22 with) instead of a crash. On the
  merged state one optimizer request —
  `/_next/image?url=/projects/case-fnb-smart-search.png&w=640&q=75` — never got
  an answer at `/` @390 in the suite's sequence (four runs of four; never in a
  fresh browser); unbounded, the suite hung or died instead of reporting it.
  **Reproduced 2026-09-15, outside the suite:** on a `next start` that had lived
  through a load spike (load average 30–40), that URL asked for with a browser's
  `Accept: image/avif,…` gave no answer in 60s, while every other width of the
  same image, and every other image, answered in milliseconds. On a freshly
  started server it answered 200 AVIF in 0.22s. It is one optimizer request
  stuck in the long-running process, and every later request for that variant
  waits on it; restart the server before a run. Vercel's optimizer is not this
  code path.
- **6, 14, 19, 21 and 23, hardened 2026-09-15** — a run that dies (a load that
  never comes, a timeout under load) is a finding in its own check, "unsure is a
  failure", instead of an uncaught error that ends the whole suite with no
  results.
- **14, 27 and 30, the team of ten (2026-09-15)** — 14: every verified person
  card has its Person node and every Person its verified card, as before; a
  card marked `data-person-status="pending"` must carry no link (on it, in it
  or around it) and have no Person node, and a card with no link that is not
  marked pending still fails. 27: a picture in a person card is an `<img>` or a
  CSS background image (the element's, its `::before` or `::after`), and a
  pending card holds none at all — no `<img>`, `<svg>`, `<picture>`, `<canvas>`,
  `<video>` or background — because initials are text. 30: the four pending
  names are required needles; the stat's needle is "verified profiles" (its
  numbers are counted, so the needle carries none), and the subtext's reads
  "Each verified card opens…", every word of the old needle kept.

**Checks changed in the review fix pass (2026-09-15).** Four reviewers found holes in the suite;
each was reproduced on a served fixture — a real page with one edit — and closed: the fixture that
used to pass now fails, and the site still passes. Every rule has a misuse case in the gate's RUN 2.
- **8** — see *Check 8 reads sentences* above, and *Hard rules* for the figures outside the visible
  text: K1, K2, K8, K9, K10, K11. It reads every page at 768 and 1024 as well.
- **19, extended (A1)** — it also tabs BACKWARDS, Shift+Tab from each page's last stop at 1440, 768
  and 390, and fails a stop entirely under a fixed or sticky box (WCAG 2.2 SC 2.4.11, Focus Not
  Obscured). The browser scrolls a stop above the viewport only to the viewport's top edge, where the
  headroom header, pinned again by the upward scroll, sits over it; forward tabbing never shows it.
  The fix is `scroll-padding-top` on `html` — the header's height (80px below 1200, 92px from it)
  plus room for the focus ring.
- **20, rewritten (K5, A3)** — measured viewport by viewport from the top, half a viewport apart; a
  fixed or sticky box is painted where a reader sees it at that scroll, a sample is taken where
  nothing fixed or sticky sits ON TOP of it, and a fixed box UNDER the text is its ground. The
  header's text is measured from the capture at the top of the page (its call to action had never
  been measured; it is 5.01:1, which passed by chance); text in any other fixed or sticky box fails,
  since no one capture shows the ground under it; so does a page with more than 1,500 text elements
  (the old cap was 700, and silent). The one full-page capture it replaces painted fixed and sticky
  boxes where the current scroll put them, and then — hidden — measured text over a fixed ground
  against the page behind it.
- **25, extended (K7, H3)** — the `getContext` hook runs in every frame and inside every dedicated
  worker (a blob worker's source is prefixed as its Blob is built, a fetched one's on the wire, and
  each reports on a `BroadcastChannel`); a same-site frame's contexts count, a third party's are
  listed. Each WebGL run sends a first pointer move, a tap or click, a wheel turn and two keys before
  it reads. Runs added: / at 1024, as a touch tablet at 1180x820 and 1366x1024 (a coarse pointer,
  asserted), and with Save-Data (asserted); `allowed`, once the renderer lands, needs a FINE pointer,
  no touch and no Save-Data as well as >=1025px. Every frame read is bounded: a lazy iframe caught
  mid-navigation hung the suite for half an hour before it was.
- **25, a frame that removes itself (2026-09-15)** — a child frame that shares the page's
  origin writes each WebGL request into the page's own log as it makes it, so a frame
  removed before the check can read it cannot take the request with it. An unread frame
  passes only when it was removed and shared the page's origin; any other is unsure, a failure.
- **31, extended (K12)** — with `--repo`, the source scan sees a retired package however it is
  loaded (`from`, a dynamic `import()`, `require()`, a side-effect import, `export * from`) and at
  any subpath (`framer-motion/dom`, `three/examples/…`); Tailwind by `@import "tailwindcss…"`,
  `@tailwind`, `@config` and `@plugin` as well as its packages; it scans every tracked source file
  but `scripts/` and `public/` (the suite names all of these), fails a tracked `tailwind.config.*` or
  `postcss.config.*`, and fails a retired package listed anywhere in `package.json`.
- **28, extended (K1, K6, H1, H2)** — the LCP runs add 1024, 1025, 1280 and 1280 at DPR 2, and each
  then reads the settled poster (see *The hero field*); every proof card's figure, label, status and
  source must be what `content/metrics.ts` says, its chip in its `[data-metric]` row. It prints how
  far the chosen file is stretched to cover the frame (H4), without failing on it.

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
It covers the element marked `data-logotype` — the wordmark in
`components/techwix/Logo.tsx`, the only wordmark on the site — for checks
18 and 20 only, and check 18 fails if that element ever holds anything but "Bolt
Fusion Tech". It is not a small-text exemption and must not become one.
Every page renders the wordmark in the header, and again in the mobile drawer,
which is `hidden` until opened, so one is rendered at a time. Anywhere else the
brand name is plain text, unmarked, and meets contrast (the footer, the WarmChats
sign-off). Check 18 prints the count per page and fails a page that renders more
than one.

## Performance targets

The budget, from the approved rebuild plan, is measured on `/` by verify-site
check 29, the way the Phase 1 baseline was: the median of three runs, each in a
fresh context, with no input and no scroll.

| | budget |
|---|---|
| LCP, mobile lab (390 wide, 4× CPU, 150ms RTT, 1.6Mbps down) | at most 1.5s |
| blocking time, mobile lab (each long task's time over 50ms, navigation to load + 4s) | at most 150ms |
| LCP, desktop (1440, unthrottled) | at most 0.5s |
| CLS | 0.00 — printed to three places, failing at 0.005 |
| initial JavaScript (requested by the end of the load event, gzipped, as transferred) | at most 260KB |
| the renderer chunk (step 4) | at most 15KB gzipped, never on mobile — check 25 |

The timings need a quiet machine; the check prints the load average beside
them. Not measured by anything: INP (≤ 200ms in the plan) and Lighthouse 95+ in
all four categories.

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

**Decided by the owner, 2026-09-15.** The keyword lane's "~80% of traffic" is
`target` too: it is the complement of the ~20%, it came in the same 2026-05-02
commit with no source, and its only `shipped` was COPY.md's metric table. All
five instances carry a target chip, the metric label "Search response, 80% of
traffic" included. The `<100ms` beside that label stays `shipped`.

**What would have caught it:** a rule that a `shipped` label requires a recorded
source — the measurement, dashboard, log query or document that shows the figure
on a system that shipped.

**Backlog — a schema requirement, not yet built:** `status: "shipped"` must carry
a `sourceRef`, and the build fails without one. It covers every place a status
is set: `/content/metrics.ts`, the case-study KPIs, the WarmChats KPIs, and the
in-sentence labels in `content/figure-labels.ts` (which already refuse a label
without a `source` string — the same idea, not yet a checked reference).

## Decided 2026-09-15: one design

| question | decision | where |
|---|---|---|
| The inner pages | **The whole site moves to the new design** — /work, both write-ups, the privacy policy and the 404 — with no copy change and nothing lost (check 30) | `redesign/techwix-home` |
| The old design | **Every trace of its code deleted**: its CSS, its three faces, framer-motion, the `[data-reveal]` system, the animated logo chip, Tailwind. One design system, easy to maintain; check 31 guards it | `redesign/techwix-home` |
| The layouts | **One root layout**; the 404 is the standard `app/not-found.tsx`, with no experimental flag and no Next-internal import | `redesign/techwix-home` |
| The hero field | **Static image first.** The three.js nebula and its four packages are deleted; the raw WebGL2 renderer comes later as its own change | `redesign/techwix-home` |
| "~80% of traffic" | **`target`**, all five instances (*A figure labelled shipped with nothing behind it*) | `fb5b83e` |
| The Team section | **Ten engineers** — the owner: "Team should be there 10 people, placeholder now, I'll upload the data later." The six verified are unchanged; Nadim, Joinal, Arifur Rahman and Tareq return by name only, `pending`: initials, "Profile coming soon", no link, handle, photo or Person node. The stat is counted from the roster ("10 engineers", "6 verified profiles") and the subtext says "Each verified card". Role, years, stack and photo come from the owner later, validated by the build. Supersedes the 2026-09-11 "six" rows | `feat/team-ten` |
| Then | **To `main`** | — |

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

Still open: gradient washes used as decoration. The instances this was written
about — the old hero's gradient headline, the old CTA and Team gradients, and
the one card shadow repeated across sections — went with the old design. The
new design's gradients (the primary button, the contact panel's delimiter, the
wordmark's "Fusion") have not been ruled on.

## Decided 2026-09-11, second round

| question | decision | where |
|---|---|---|
| The Team section | **The six people with a verified LinkedIn**, shown with name, handle and link. Role, stack and years stay empty until real data exists — thin cards because the data is thin. COPY.md §5 amended: a member without a verified profile is not listed. *Superseded 2026-09-15: ten, four with profiles pending (Decided 2026-09-15)* | `feat/team-verified-six` |
| The logo wordmark's contrast | **The check was wrong, not the mark.** WCAG 1.4.3 exempts logotypes; the exemption is scoped to the wordmark and guarded | `tooling/verify-site` |
| FAQ vs FAQPage structured data | **The rendered five are canonical**, and the markup is generated from them: one source, not a corrected second copy | `fix/faq-one-source` |
| COPY.md §4 layout note | **Superseded.** The section is a carousel; two cards on a two-column grid is a separate decision, not made | `docs/copy-md-decisions` |
| The "under 100ms" meta description | **Stays unlabelled**: a scoped exception to the label rule, recorded under Hard rules | `chore/low-findings` |
| FAQ answers missing from the served HTML | **Fixed in the same branch as the one-source fix:** the answers are in `<details>`, and check 14 reads them from the served HTML | `fix/faq-one-source` |
| COPY.md §2, "Ten engineers" | **Six**, with the reason recorded, so a copy pass cannot restore ten while the site shows six. *Superseded 2026-09-15: the site shows ten, and §2 says ten again* | `docs/copy-md-decisions` |
| The CMS | **Removed**: content, schema and validation moved to `/content`; admin, store, API and seven dependencies deleted (see Content) | `chore/remove-cms` |
| Unused CSS — `.ai-rise`, `animate-mesh`, `blob-*`, the old FAQ block (`.faq-item`), `.cv-section` and `.grain-overlay` | **Deleted on 2026-09-15**, with the rest of `app/globals.css`, when the old design was retired | `redesign/techwix-home` |

## Decided 2026-09-11, the homepage rebuild

| question | decision | where |
|---|---|---|
| The design | **The clone's design becomes the homepage**, with every piece of real proof kept (reverses decision (a)); none of the Techwix theme's photos, logos, icon font or copy. Extended to the whole site on 2026-09-15 | `redesign/techwix-home` |
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
