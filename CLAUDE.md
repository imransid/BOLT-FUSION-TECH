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

Next.js 16 (App Router) · React 19 · TypeScript · Zod 4 · plain CSS · Barlow and
Jost through `next/font/google` · deployed on Vercel. There is no CMS and no
database: the content is typed files in `/content`. There is no animation
library and no Tailwind. **three.js is back for one thing only, the homepage
hero's scene**, by the owner's brief of 2026-09-16 (*The hero field*, under
Hard rules): imported dynamically after LCP and load, desktop only, one chunk
of at most 180KB gzipped. It left on 2026-09-15 as the @react-three nebula; it
returns as plain three.js, with no React Three Fiber.

- **One stylesheet.** `app/site.css` is the design — the owner's engineering
  redesign of 2026-09-16 (*Design language*): the shell and every page, the 404
  included, loaded from `app/layout.tsx`. The Techwix design it replaced
  (`app/techwix.css`, the `.tw-` classes, `components/techwix`) was retired the
  same day, once the inner pages had moved (*Retired 2026-09-16: the Techwix
  design*).
  Verify-site check 31 knows the design by `app/site.css`'s rules and fails the
  retired one — its stylesheet, any `tw-` class, `components/techwix` — if any
  of it comes back (*Verify before pushing*).
- **three.js returns** (owner, 2026-09-16; *Decided 2026-09-16*): for the hero's
  3D scene only — three.js core, dynamically imported after load, desktop-only,
  at most 180KB gzipped. It landed with the 3D wave (`redesign/eng-scene`;
  *The hero field*).
- Package manager: yarn 4 (`packageManager` in package.json), `nodeLinker:
  node-modules` — Turbopack does not support Plug'n'Play. `yarn.lock` is the
  only lockfile.
- Runtime dependencies: `next`, `react`, `react-dom`, `server-only`, `three`,
  `zod`. `three` is pinned exactly (`0.186.0`), and `@types/three` in
  devDependencies matches it (`0.186.0`): bump the two together, and
  re-measure the scene chunk when you do. Only `components/field/scene.ts`
  imports it, and only `components/field/HeroScene.tsx` imports that, dynamically
  — check 31 (`--repo`) fails three.js imported anywhere else, or `scene.ts`
  imported statically. Verify-site check 24 fails a dependency nothing imports.
- There is no CI. `yarn verify:site` (below) is the check to run before pushing.
- Scripts beside the suite: `scripts/generate-icons.mjs` (the icons, from the
  mark), `scripts/contrast-site.mjs` (the contrast table below),
  `scripts/encode-screenshots.mjs`.

## Routes

| route | what it is | content from |
|---|---|---|
| `/` | homepage (`app/page.tsx`), in `site.sectionOrder` — since 2026-09-28 ordered for a buyer deciding whether to hire (*Decided 2026-09-28*): the hero, with the first call's microcopy and a proof line of three shipped products; the engineering stories (`#recent-work`: the two write-ups side by side, the restaurant search's three lanes, the proof strip, a Schedule a Call); how we work with you (`#how-we-work`: the terms, the engagement models, the two-week pilot on its trace, the headcount, a Schedule a Call); what we engineer (one ledger row per capability, `#software` … `#cloud`, each with its tiers, linked work, "in depth" and its diagram); how we build; the industries with delivered work; the Insights teaser; the FAQ (nine questions, four of them the buyer's objections); the final call to action | `content/site.ts` (hero, stories, team size, FAQ, final call to action, navigation, footer), `content/engineering.ts` (capabilities, industries, stages), `content/pages.ts` (how we work's words, /about's), `content/services.ts`, `content/pilot.ts`, `content/projects.ts` (the proof line, the attribution labels), `content/metrics.ts` (the proof strip), `content/architecture.ts` (the lanes) · static |
| `/contact` | Schedule a Call: the contact panel, the booking calendar (`#schedule`) and a three-field project form that opens the visitor's email app (`#project`) — `app/contact/page.tsx`, built 2026-09-16. From 1025px (2026-09-28) the h1 and the calendar sit side by side, the calendar in the first viewport: on the left the h1, the lead, /about's four terms word for word under "How we work with clients" and the email; on the right the calendar. Below 1025px it is one column in the DOM's order, the calendar straight after the h1. The panel's own Schedule a Call, a jump to a calendar already beside it, went. The form's wrapper is `.bf-contact-project` — it was `.bf-project`, /work's card, whose rule won and rendered the form 203px wide | `content/site.ts`, `contact`; the terms from `content/pages.ts` |
| `/capabilities` | the six capabilities in depth: body, what we build, how we approach it, the evidence tier with its note, the AI capability's labelled figures, linked work, the articles written from it, and each capability's own diagram; the anchors `#software` … `#cloud`, where the homepage's "in depth" links land; then the system map (`#system-map`, moved here from the homepage on 2026-09-28) (`app/capabilities/page.tsx`) | `content/engineering.ts`, `content/pages.ts`, `content/metrics.ts`, `content/insights.ts` · static |
| `/industries` | "Technology we can build for…": each industry's problems, what we'd build, the capabilities it draws on and — only where `content/engineering.ts` records delivered work — where we've built it, in two groups: with delivered work, and without | `content/engineering.ts`, `content/pages.ts` · static |
| `/engineering` | how we build (the homepage's six stages, and the three phases of `content/process.ts`), the stack by layer (SPEC §8b.2), architecture principles each linked to where it is written up, and the verify-before-release discipline | `content/engineering.ts`, `content/process.ts`, `content/pages.ts` · static |
| `/about` | who we are; the team (the Team section: 15+ developers, no one named, no Person node — on the homepage since 2026-09-28 only its headcount, in how we work); where our engineers work; how we work with clients (four terms, the engagement models, the pilot — MOVES.md's items word for word); what we won't do | `content/pages.ts`, `content/site.ts` (team), `content/services.ts`, `content/pilot.ts` · static |
| `/insights` | the index of the articles | `content/insights.ts`, `content/pages.ts` · static |
| `/insights/[slug]` | an article (`generateStaticParams`, `dynamicParams = false`): the sections in reading order, code in Barlow 500, each "diagram" an ordered flow, related work; Article JSON-LD | `content/insights.ts` · SSG |
| `/work` | every approved project, labelled by who built it: the write-ups, Bolt Fusion projects, in-house products and our engineers' track record (`app/work/page.tsx`; *Projects and attribution*) | `/content/projects.ts` |
| `/work/warmchats` | WarmChats case study — `components/case-studies/WarmChatsCaseStudy.tsx` | **hardcoded in the component** |
| `/work/restaurant-search` | restaurant search case study — `components/CaseStudy.tsx` | `/content/site.ts`, `caseStudy` block |
| `/privacy-policy` | privacy policy | hardcoded |

**The navigation's six routes all exist** (SPEC §4; built 2026-09-16,
`redesign/eng-pages`), each in the sitemap. The engineering pages render the
same entries in `content/engineering.ts` that the homepage summarises.

Also generated: `/opengraph-image`, `/robots.txt`, `/sitemap.xml`. Static:
`public/llms.txt`, `public/llms-full.txt`.

**One root layout.** `app/layout.tsx` wraps every page and the 404. It loads the
stylesheet and the Barlow and Jost faces, and holds the site-wide metadata: the
title template, the canonical description, icons and robots. Every page renders
inside `components/site/SiteShell.tsx` — the header, the page's `<main id="main">`
and the footer. Every page passes `ground="graphite"` — the default since the
Techwix design was retired — and the main gets `.bf-main`; `<html>` and `<body>`
paint the same ground. The header's links are routes on every
page, and `current` marks the page's own link (`aria-current`). "Back to top"
goes to `#masthead`, the header. The old homepage anchors still land somewhere:
`/#recent-work` is the engineering stories, `/#contact` the final call to action,
and `/#software` … `/#cloud` the capability's row in the "What we engineer"
ledger (since 2026-09-28; its deep dive is on /capabilities).

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
`<Link prefetch={false}>` — the header's logo among them.

## Content — one layer, in `/content`

Every word on the site that is not hardcoded in a component lives in a typed
file in `/content`, parsed with Zod when the module loads, so a malformed entry
fails `next build` with the file named:

- `site.ts` (schema `site-schema.ts`) — the navigation and footer every page
  shares; the homepage's hero (with, since 2026-09-28, the first call's
  microcopy and the proof line's project ids), engineering stories
  (`recentWorks`: the two write-ups in the problem / system / engineering /
  result shape, and the proof strip's heading and note), team (the Team
  section on /about; the homepage shows its size), FAQ and final call to action; `/contact`
  (`contact`); and the restaurant case study (`caseStudy`). It is server-only and
  deep-frozen: server components read it and pass each client component only its
  slice as props. Never re-export `./site` from the `/content` barrel — client
  components import that barrel. The schema refuses a primary call to action
  that does not say exactly "Schedule a Call", the words "Book a call" anywhere
  in the file, a homepage description that does not open with the canonical
  line, a hero microcopy that is not one whole sentence of /about's terms, word
  for word (never empty, never a fragment of one), and a proof line naming
  anything but three published projects that are ours and live or in
  production (never feature work, never a track record). The gate's RUN 3
  proves the last two refusals (*Verify before pushing*).
- `engineering.ts` (schema `engineering-schema.ts`) — the engineering company
  (2026-09-16): the six capabilities with every depth field (body, what we build,
  an optional build note, approach, evidence tiers with their scope, the evidence
  note, linked work slugs, metric ids, the diagram id, title, description and
  caption, the honesty line where Lab), the industries (problems, what we'd build,
  evidence links only where work exists, a note), the six How We Build stages,
  the technical-depth layers, the system map (parts, links, worked flows) and each
  section's heading. ONE SOURCE: the homepage shows summaries; /capabilities,
  /industries and /engineering render the same entries in depth. Not server-only
  (the system map's client component takes its slice). The schema refuses an
  unlabelled figure anywhere in it (the same idea as check 8, at build time),
  linked work that is not published Bolt Fusion work (never a track-record
  project), a Lab capability without its honesty line or a Lab diagram not
  captioned "Concept", Kubernetes, Kafka or RabbitMQ, and a robotics link or flow
  not marked concept.
- `canonical.ts` — the canonical company description, one string, imported by
  the metadata, the share image, the structured data and the content.
- `metrics.ts`, `projects.ts`, `services.ts`, `process.ts`, `pilot.ts`,
  `architecture.ts` (schemas in `schema.ts`) — read by `/work`, the homepage (the
  proof strip, the restaurant story's lanes) and `lib/structured-data.ts`.
  `services.ts` (the engagement models) and `pilot.ts` (which carries COPY.md
  §7's title and body since 2026-09-16) left the homepage on 2026-09-16 and
  render on /about — and, since 2026-09-28, in the homepage's how we work too; `process.ts`'s three steps gave way to the six stages on the
  homepage and are /engineering's three phases.
- `figure-labels.ts` — the in-sentence labels and exemptions (*Hard rules*).
- `pages.ts` — the inner pages' own words (2026-09-16): each page's head and
  metadata (the schema refuses a description outside check 26's 50–160
  characters), /engineering's phases, architecture principles and verify list,
  /about's who we are, where our engineers work, how we work with clients and
  what we won't do, and the /insights index and the homepage's teaser. Nothing
  in it is a new claim: each principle links to its write-up or article, the
  verify list names what the suite checks and no number, and /about's terms and
  lines are the Organization description's and the old homepage's, word for
  word. It refuses an unlabelled figure, as `engineering.ts` does.
- `insights.ts` (schema `insights-schema.ts`) — the /insights articles (redesign
  SPEC §6), written from real work only; server-only and deep-frozen like
  `site.ts`, so never re-exported from the barrel. They render on /insights,
  /insights/[slug] and the homepage's teaser (before the FAQ). An article may
  carry a shorter `description` for its meta tags — check 26 wants 50–160
  characters and two deks are longer; the schema refuses one outside that — and
  a `place` that sets where a section's list, code block or diagram sits in its
  reading order.
  `node scripts/verify-insights.mjs` reads every article string with check 8’s
  own grammar (`tokenizeFigures`, read out of the suite) and fails a figure
  without its entry in `figure-labels.ts`, or any figure outside a paragraph or
  bullet: titles, deks and headings feed the Article JSON-LD and meta tags,
  where no chip can render.

There is one FAQ (`faq.items`); its structured data is generated from the same
items the section renders (`fix/faq-one-source`). The team is a headcount
(`team.size`, "15+", and `team.sizeLabel`; *The team is a headcount*): no
roster, no Person structured data. `site.sectionOrder` must list every section exactly
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
| `project`, `scope: "features"` | features Bolt Fusion built inside an app another company owns: Bazzile (Bazzile Technology SA), GodConnect Online (GodConnect LTD) | "Delivered project: features built by Bolt Fusion for ‹client›" — never "built by Bolt Fusion" | its store listings | **none** — the app's UI is the client's |
| `in-house` | a product we built for ourselves: OPAL | "In-house product: our own, not built for a client" | the live product, or none | a real screenshot of the live site |
| `track-record` | work one of our engineers shipped at a previous employer: Go Smart (Brain Station 23); NIdle Finishing (Intellier) is held back (below) | "Track record: built by our engineer at ‹employer›, not by Bolt Fusion" | store listings and public proof | **none** — the product is someone else's |

- **Never present an employer's product as ours.** A track-record project names
  its employer (`builtAt`) and the engineer's role (`role`), and the schema
  (`content/schema.ts`) refuses one without them — or with a client, a
  screenshot or metrics. It is never called our client and carries no
  confidential detail.
- **A product another company owns is "built by Bolt Fusion for …", never
  ours:** WarmChats belongs to WarmChats, Inc., Balanzify to Balanzify Inc.
  (`client`).
- **Feature work says it is feature work (owner, 2026-09-16).** Bazzile and
  GodConnect Online were delivered through Bolt Fusion as features inside other
  companies' apps. We did not build those apps, so their label is "features
  built by Bolt Fusion for ‹client›", never "built by Bolt Fusion", which would
  claim the whole app. `scope: "features"` is allowed on kind `project` only
  (left out, it is `"product"`). The schema requires its `client` and refuses
  an image: the app's UI belongs to the client, and a screenshot needs their
  permission, which is a separate decision. It may be published without the
  screenshot a product project needs, as a text card with its store links. Its
  role names only features the portfolio says were ours: Bazzile's three, and
  for GodConnect just "Feature work in the React Native app", because the
  portfolio does not say which features were ours. Bazzile's "70,000
  downloads" is the client's growth, not ours. It is never shown, and check 30
  fails it on /work.
- **The label sits directly above the project's name on every card,** the
  case-study rows included, in the brand blue — never a shipped/target colour.
  Verify-site check 9 holds its own copy of the labels and fails a card on
  /work whose label is missing, hidden, somewhere else or not its kind's; a
  track-record card without its employer and role, or with a screenshot; a
  feature-work card whose label says "built by Bolt Fusion" without "features",
  or that shows any screenshot; a card not in `projects.ts`, or a published
  project with no card; a card image that does not load; and a card that is not
  a case study linking to a write-up. It reads an h3 on /work as a group's
  heading, not a card's, when the h3's parent holds the cards.
- **Screenshots are real captures of the live sites,** Playwright at 1440×900,
  saved as webp in `public/projects/`, of a view with no faces in it: FanLock's
  "Fight leaks" section (its hero shows a face), Balanzify's migration page (its
  homepage dashboard shows customer avatars), Go Style Business's sign-in page
  (its only public page) and OPAL's shop (its hero collage shows faces). Never a
  mockup: OPAL's old AI-generated asset, banned by PLAN.md, was deleted on
  2026-09-16.
- **/work is four sections,** one per kind, in `projectSections` order. The
  track-record section says what it means: "Work our engineers shipped at
  previous employers — credited to them, not claimed as ours." Inside Bolt
  Fusion projects the product cards come first. Under them is a sub-group headed
  by its own h3, "Features we shipped into other companies’ apps", whose cards
  have h4 names so the outline nests. Every grid, that one included, fills
  its rows: three across from 1025px, two across from 768px, one on phones; a
  set that divides by neither is one column, and a card alone lays its
  screenshot beside its text.
- **The homepage keeps its two case studies,** each card with its kind's label
  above its name (the `attribution` words /work uses), and since 2026-09-28 the
  hero's proof line names three shipped products — WarmChats (for WarmChats,
  Inc.), Balanzify (for Balanzify Inc.) and Go Style Business — read from
  `content/projects.ts` with the client as the data has it. Each links to its
  write-up if it has one (WarmChats) and otherwise to the product itself, live
  — the first of its `links`, in a new tab, with an arrow (Balanzify,
  Go Style Business) — so "in production" is something a buyer can open and
  check. "See all work (N projects)" counts
  the published projects that are ours, from the data, the feature work
  included. The track record is not counted.
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
- **NIdle Finishing** (track record) is `awaiting-asset` since 2026-09-28. Its
  only proof link, "Intellier's case study" (intellier.com/nidle/), answers a
  301 to a bare PNG, and a proof link that opens an image hurts trust, so it
  went (the 2026-09-28 redesign's honesty cleanup). A track-record card is a
  text card that carries its store and proof links, and the schema refuses a
  published one without them — so the card waits for a working link. Two
  candidates were checked and not used: nidle.intellier.com says of NIdle
  Finishing "We are currently working on this feature", and Intellier's press
  link names another company's group. The owner supplies the link; the card is
  one `state` back.

Bazzile and GodConnect Online were held back here until 2026-09-16, as track
record with no employer on record. The owner placed them that day: Bolt Fusion
feature work, above.

## Design language, as built

**The engineering redesign — decided by the owner on 2026-09-16.** A dark,
precise, restrained engineering foundation (the redesign spec, §3): full-bleed
graphite sections divided by hairlines, not boxes; one brand blue for actions;
one cyan for data flow only; a distinct diagram per capability; quiet motion.
`app/site.css` styles it, every class `bf-`: the shell (header, drawer, footer)
and every page, the 404 included (*The inner pages, as built*, below). Its base
block carries the resets the retired `app/techwix.css` held — the body's Jost
16px on the unitless 1.73, the button reset, 600 for bold, code in Barlow.

- **Tokens** (`:root` in `app/site.css`): ground `#07090d`, surface `#0d1016`,
  raised `#141922`; hairline `#232a36`, a stronger rule `#2e3747`, steel `#6b7385`
  (a boundary that must read: inputs, ghost buttons, diagram strokes); text
  `#eceff4`, body `#c3c9d4`, muted `#9aa3b4`; brand `#4c86ff` (links on dark),
  `#7aa7ff` (hover), the button fill `#2a62e0` (hover `#2256c9`); flow cyan
  `#2ee6d6`; shipped `#34d399`, target `#fbbf24`; focus `#8ab4ff`. Content capped
  at 1240px; the side gutter `clamp(16px, 4vw, 48px)`; the header 72px.
- **The cyan is never text and never a chip:** flow lines in the diagrams, the
  system map and, from the 3D wave, the hero scene. **Green and amber mean a
  figure's shipped and target status, and nothing else.**
- **No neon, no glow on text.** One subtle radial light behind the hero field;
  gradients only inside the scene and the diagrams. The faint engineering grid
  (1px lines at 4%) sits behind the hero field and the system map only.
- **Breakpoints:** `≤767`, `768–1024`, `≥1025`, plus the header's own: `1200`
  (the full navigation ↔ the drawer) and `520` (below it the header's Schedule a
  Call moves into the drawer). No horizontal scroll at any width. The button
  stays in the drawer below 520px, measured 2026-09-28: at 360 the bar leaves
  89px between the lockup (171px) and the menu button with 12px gaps, and the
  button is 133px (about 105px even at 13px) — it does not fit, so the phone's
  primaries are in the page instead: after the proof, and after how we work.
- **Sections** (`.bf-section`): full bleed, a hairline on top, 72px of padding on
  phones, 96 from 768, 128 from 1025. **The homepage's rhythm (2026-09-28)** is
  its own (`#hero ~ .bf-section`): 56 / 72 / 88px, with more air — 88 / 104 /
  128px — only above a chapter (how we work, what we engineer, the close); the
  proof follows the hero with no hairline between them (that full-width rule
  read as the first screen's floor), so its heading crosses the 900px fold.
- **The hero's first screen (2026-09-28), measured.** At 1440x900 the proof
  line is at 585–677px and the first write-up at 913. Below 1025px the field
  sits above the text (SPEC §7) as a band, still `cover` and filled by width
  so `sizes` holds: `clamp(160px, 22vh, 188px)` tall on a phone,
  `clamp(260px, 40vh, 420px)` at 768–1024 — it was 4:3 and 16:9, and took the
  whole first screen at 1024x768 (the h1 at 701px). The pause control keeps
  its place under the field's right edge and the headline's first line
  ("Build") rises into that row beside it (`margin-bottom: -56px` on
  `.bf-hero__media`, only where the control is laid out — never under reduced
  motion); the proof line's three items sit in one row at every width, each a
  44px link over its client. Measured: at 390x844 the h1 at 289, Schedule a
  Call at 584 and the whole proof line at 745–832 — inside the first screen;
  at 768x1024 all of it by 989; at 375x812 the names, their clients just
  under the fold; at 1024x768 and 360x740 the h1 and Schedule a Call are in the
  first screen and the proof line starts under it (798 and 716px). A phone
  browser's own bars take more of those heights than the lab viewport does.
  Cards only where the content is a set (/work's projects; a write-up's
  services and stack groups; the homepage's pair of write-ups); everything else
  is a ruled grid, a ledger, a rail, a strata table or a diagram — never a row
  of identical cards.
- **Buttons** (`components/site/Cta.tsx`): Barlow 600, square-cut (2px).
  `primary` is white on the button fill, one per view; `ghost` a steel outline;
  `quiet` a brand-blue text link with an arrow. `data-cta` marks the calls to
  action the suite follows: `schedule` on every Schedule a Call, `explore` on
  Explore Our Capabilities, `project` on Tell Us About Your Project.
- **Three chip families, never confusable** (a figure's status is check 8's):
  - *status* (`components/site/StatusChip.tsx`, and `<FigureText>`'s `.bf-figchip`,
    `.tw-figchip` until 2026-09-16): a pill in green (shipped) or amber (target), the only
    use of those colours, with `data-status` on the figure's wrapper — 12px and
    600 (the in-sentence chip was 11px until 2026-09-28: the brand's trust
    mechanism was the smallest text on the page);
  - *evidence tier* (`components/site/TierChip.tsx`): square, neutral, a four-step
    brand-blue meter (Proven 4, Core 3, Capable 2, Lab 1), `data-tier`, never
    `data-status`; Lab's edge is dashed. The legend (`TierLegend`) sits under the
    "What we engineer" ledger's heading;
  - *concept* (`.bf-concept`): a dashed tag, the same family as Lab and every
    concept drawing.
- **The diagrams** (`components/site/diagrams.tsx`): each capability's own
  server-rendered inline SVG — a layered stack, a router in front of the model, a
  module ring, a till hub with its offline queue, a machine loop (dashed, and
  captioned "Concept — not a shipped system"), a release pipeline. `role="img"`,
  named by its `<title>` and described by its `<desc>`; colours by class; the cyan
  on `.dg-flow` only. Labels are 15–17 units on a 480-unit drawing, legible at a
  phone's width at full size. **In the homepage's ledger (2026-09-28)** each is
  drawn at a compact size — about 380px wide beside its row from 1025px (labels
  12–13.5px), up to 440px under it at 768–1024 — and not at all below 768px,
  where its labels would fall under 13px: each row links to its diagram on
  /capabilities, and robotics keeps its caption as text.
- **The homepage's ledgers (2026-09-28).** *What we engineer* is one ruled row
  per capability (`.bf-cap6`: the number, the name, the job, every tier with
  its scope, robotics' honesty line, the linked work, "in depth", the diagram).
  *How we work* is a spec sheet (`.bf-hww`): the head beside the headcount, the
  four terms on one ruled row, the engagement models as a table beside the
  lines under it, and the pilot on its own surface plate, its three stations on
  the `pilot` trace (`[data-bf-trace="pilot"]`: one `svg.bf-trace` with its
  `.bf-trace__path` drawn complete in a steel hairline from the first
  station's marker to the last's, and the stations `[data-bf-trace-stop]`; the
  motion stream traces it; below 768px the stations stack down the list's own
  rule). The *industries* are one ruled row of five cells.
- **The system map** (`components/site/SystemMap.tsx`, a client component; on
  /capabilities after the six since 2026-09-28, the homepage's until then): the
  SVG is the picture for a pointer and is `aria-hidden`; the lists beside it
  (`data-system-map`: parts, connections, worked flows) are the same content as
  text — the no-JS and crawler view. With script each part and flow is a button:
  focus or hover lights its links, a polite live region says what they do, a
  click pins it. Without script they are plain text, never a dead button.
- **/contact is two columns from 1025px** (2026-09-28): the head, what
  happens next and the email on the left (5 of 12), the booking calendar on
  the right (7 of 12), so the calendar is in the first viewport; one column
  below that, the calendar right after the h1 (`grid-template-areas`, with the
  DOM in the phone's order). The project form sits under both, at least 480px
  wide at 1440 (check 32).
- **One light surface, on purpose:** the booking calendar on /contact. Calendly
  paints its own white interface and ignores the colour parameters, so the embed
  is a card we place — white (`--bf-paper`), generous padding, the design's 2px
  radius, a hairline (`--bf-paper-line`), our caption on it (`--bf-paper-muted`,
  7.81:1) — with its height reserved so the iframe cannot shift the page, a
  placeholder behind it, and a visible note under it carrying the email and the
  project form for a browser that blocks the third party. Inside that panel the
  focus ring and links switch to the deeper brand fill, which reads on white.
- **The logo** is the Forward Monogram (*Decided 2026-09-16*): `lib/mark.ts`
  holds the geometry, `components/LogoMarkSvg.tsx` draws it (the stem and upper
  bowl in `currentColor`, the lower bowl in `var(--brand)`, which the redesign's
  pieces set to the brand blue), and `components/site/Logo.tsx` builds the
  lockups — horizontal (gap 0.3 x the mark), stacked, the mark alone — with the
  wordmark "Bolt Fusion" in Barlow 700 at −0.01em and "Tech" in Barlow 500,
  muted, and a stem width of clear space. `scripts/generate-icons.mjs` writes the
  favicon, the ICO and the apple-touch icon from it: white on the button fill,
  the small cut (3-unit seams) below 24px.
- **The header** (`components/site/Header.tsx`) is graphite and sticky with a
  hairline, headroom as before, the six routes from 1200px and the drawer below
  it (`components/site/MobileDrawer.tsx`: focus trapped, Escape closes,
  `aria-expanded` on the burger, rendered hidden in the server HTML and portalled
  to `<body>` after mount; its list is the `<nav aria-label="Primary">` below
  1200px). The page scrolls with `scroll-padding-top` of the header plus 16px
  (A1, check 19).
- **Skip link:** "Skip to content", the first stop on every page, off screen until
  focused, white on the button fill, to `main#main`.
- **Visible focus:** a 2px `#8ab4ff` ring (9.5:1 on the ground) on every link,
  button, summary, field and anything with a tabindex, on every page.

### Contrast — every pair measured

`node scripts/contrast-site.mjs` measures every text/background pair
`app/site.css` uses and every boundary that must read, and exits 1 on a failure.
Text needs 4.5:1; a boundary or indicator 3:1 (SC 1.4.11). A translucent chip
fill is composited over its ground first. Every pair is AA:

| foreground | background | ratio | needs | used for |
|---|---|---|---|---|
| text #eceff4 | ground #07090d | 17.29:1 | 4.5:1 | headings, primary text, labels on the page |
| text #eceff4 | surface #0d1016 | 16.52:1 | 4.5:1 | text on the footer, drawer, diagram plates, lanes |
| text #eceff4 | raised #141922 | 15.29:1 | 4.5:1 | tier-chip labels, diagram node labels, the honesty note |
| soft #c3c9d4 | ground #07090d | 11.98:1 | 4.5:1 | body copy |
| soft #c3c9d4 | surface #0d1016 | 11.45:1 | 4.5:1 | body copy in the footer and drawer |
| soft #c3c9d4 | raised #141922 | 10.59:1 | 4.5:1 | a tier chip's scope |
| muted #9aa3b4 | ground #07090d | 7.85:1 | 4.5:1 | eyebrows, meta, labels, the pause control |
| muted #9aa3b4 | surface #0d1016 | 7.50:1 | 4.5:1 | footer labels and base row, diagram notes |
| muted #9aa3b4 | raised #141922 | 6.94:1 | 4.5:1 | muted text on a raised surface |
| brand #4c86ff | ground #07090d | 5.85:1 | 4.5:1 | links, the quiet call to action, stage numbers |
| brand #4c86ff | surface #0d1016 | 5.59:1 | 4.5:1 | links on the footer and drawer |
| brandHi #7aa7ff | ground #07090d | 8.35:1 | 4.5:1 | link hover, a pressed map part |
| brandHi #7aa7ff | surface #0d1016 | 7.98:1 | 4.5:1 | the drawer's current link |
| white #ffffff | brandFill #2a62e0 | 5.35:1 | 4.5:1 | the primary button, the skip link |
| white #ffffff | brandFillHover #2256c9 | 6.48:1 | 4.5:1 | the primary button, hovered |
| shipped #34d399 | rgb(12,29,27) | 9.05:1 | 4.5:1 | a shipped chip on the ground |
| shipped #34d399 | rgb(17,36,35) | 8.40:1 | 4.5:1 | a shipped chip on a surface |
| target #fbbf24 | rgb(31,27,15) | 10.29:1 | 4.5:1 | a target chip on the ground |
| target #fbbf24 | rgb(37,34,23) | 9.53:1 | 4.5:1 | a target chip on a surface |
| shipped #34d399 | rgb(23,44,46) | 7.61:1 | 4.5:1 | a shipped chip inside a tag on a card |
| target #fbbf24 | rgb(43,42,34) | 8.63:1 | 4.5:1 | a target chip inside a tag on a card |
| steel #6b7385 | ground #07090d | 4.19:1 | 3:1 | input borders, ghost-button borders, diagram strokes (non-text) |
| steel #6b7385 | surface #0d1016 | 4.00:1 | 3:1 | diagram strokes on the plate (non-text) |
| steel #6b7385 | raised #141922 | 3.71:1 | 3:1 | the Lab chip's dashed edge (non-text) |
| flow #2ee6d6 | surface #0d1016 | 12.16:1 | 3:1 | the cyan flow lines on a diagram plate (non-text) |
| flow #2ee6d6 | ground #07090d | 12.72:1 | 3:1 | the cyan on the system map (non-text) |
| brand #4c86ff | surface #0d1016 | 5.59:1 | 3:1 | an accented node's outline, a tier meter step (non-text) |
| brand #4c86ff | raised #141922 | 5.17:1 | 3:1 | a tier meter step on the chip (non-text) |
| focus #8ab4ff | ground #07090d | 9.54:1 | 3:1 | the focus ring on the ground (non-text) |
| focus #8ab4ff | surface #0d1016 | 9.12:1 | 3:1 | the focus ring in the footer and drawer (non-text) |
| paperMuted #4a5266 | paper #ffffff | 7.81:1 | 4.5:1 | the booking calendar panel's caption and placeholder (/contact) |
| brandFill #2a62e0 | paper #ffffff | 5.35:1 | 3:1 | that panel's focus ring and links on white (non-text) |

The wordmark keeps its logotype exemption (checks 18 and 20), and no longer
needs it: "Bolt Fusion" is `#eceff4` and "Tech" `#9aa3b4` on the ground.

### The pieces every page is built from

- **Content:** `content/engineering.ts` (the capabilities with every depth field,
  the industries with problems, what we'd build, evidence and notes, the stages,
  the depth layers, the system map, the section headings), `content/pages.ts`
  (the inner pages' heads and their own words), `content/site.ts` (navigation,
  footer, team, contact, the restaurant case study), `content/insights.ts`,
  `content/canonical.ts`.
- **Components** (`components/site`): `SiteShell` (`ground="graphite"` and
  `current`), `PageHead` (a page's one h1: a back link, the eyebrow, the lead
  and meta line, an aside beside it), `SectionHead`, `Cta` and `ctaKind`,
  `CtaBand` (a closing call to action), `TierChip` and `TierLegend`,
  `StatusChip`, `ProofStrip`, `CapabilityDiagram` (`diagrams.tsx`),
  `DomainGlyph`, `SystemMap`, `ContactForm`, `Logo`, `JsonLd`, `ScreenImage` and
  `Shot` (screenshots), `Kpi` (`KpiGrid`, `KpiCard`), `LaneCard`, `Lists`
  (`Tags`, `Bullets`), `Summary`, `ProjectCard` (with `attribution`,
  `AttributionLabel`, `ProjectFacts`, `ProjectLinks`), `CodeBlock`, `FlowSteps`,
  `icons`, and the homepage's sections in `components/site/home` — `Hero`,
  `Stories`, `HowWeWork`, `WhatWeEngineer` (the ledger), `HowWeBuild`,
  `Industries`, `InsightsTeaser`, `Faq`, `FinalCta`. `HowWeBuild`,
  `TechnicalDepth` (/engineering), `Team` (/about), `SystemMapSection`
  (/capabilities) and `FinalCta` render on the inner pages; since 2026-09-28
  the last three of those are not on the homepage, and `Capabilities.tsx` (the
  six homepage deep dives) is gone — /capabilities renders its own.
- **CSS primitives** (`app/site.css`): `.bf-wrap`, `.bf-section`, `.bf-head` /
  `.bf-eyebrow` / `.bf-h2` / `.bf-h4` / `.bf-lead`, `.bf-head--chapter`,
  `.bf-actions`, `.bf-btn--*`, `.bf-cap6` (a ledger row), `.bf-hww` (how we
  work's spec sheet), `.bf-inds` (a ruled row), `.bf-stages` (a rail), `.bf-strata`,
  `.bf-build`, `.bf-evidence`, `.bf-honesty`, `.bf-concept`, `.bf-cap__plate`,
  `.bf-pagehead` (a page's h1 block), `.bf-prose` (an article, the privacy
  policy), `.bf-form` / `.bf-field`, the `data-bf-reveal` / `data-bf-flow`
  hooks of `components/site/SiteMotion`, and the `[data-bf-trace]` hook the
  motion stream traces (the pilot's, in how we work). `.bf-index` (the old
  "What we engineer" grid) and `.bf-ledger` (the old homepage industries) went
  with their sections on 2026-09-28.
- **Lib:** `lib/page-meta.ts` (`pageMetadata`: the title, description,
  canonical and share card an inner page needs), `lib/work-links.ts`
  (`workLink`: where a linked project is shown), `lib/dates.ts` (`longDate`),
  and `articleLd` beside the rest in `lib/structured-data.ts`.

### The inner pages, as built (2026-09-16)

Every inner page is a page head (`PageHead`, the one h1), full-bleed sections
divided by hairlines, and a closing call to action — the homepage's `FinalCta`
on the new pages, `CtaBand` carrying the page's own approved words on /work and
the write-ups — then the footer. No light bands, no navy panels.

| page | sections, in order |
|---|---|
| `/capabilities` | page head with the tier legend · a contents row (each capability with its glyph and tier) · six capability sections (`#software` … `#cloud`): eyebrow, h2, body, robotics' honesty line (`data-honesty`), what we build (a tier chip where an item's evidence differs), how we approach it ("How we'd approach it" for Lab), evidence (the tiers, the note, the AI capability's three figures in `[data-metric]` rows, linked work, the articles written from it), and its own diagram beside the text, captioned (robotics: "Concept — not a shipped system") and described · the system map (since 2026-09-28; it was the homepage's): the map beside its lists of parts, connections and worked flows · final call to action |
| `/industries` | page head · "Industries with delivered work." (restaurants, retail, real estate, HR, salons: the problems, what we'd build, what it draws on, where we've built it) · "No delivered work here yet." (healthcare, education, logistics, enterprise operations, startups: no evidence cell) · final call to action |
| `/engineering` | page head · how we build (the homepage's stages rail) · in practice (the three phases of `content/process.ts`, each naming its stages) · the stack by layer (the homepage's strata) · architecture principles (eight, each linked to its write-up or article) · verify before release (what the suite fails on, with no number; what the build refuses) · final call to action |
| `/about` | page head (the company line, the canonical description) · who we are · the team (the homepage's section) · where our engineers work · how we work with clients (the tagline, four terms, the engagement models table, the line under it, the operating detail, the pilot and its button) · what we won't do · final call to action |
| `/insights` | page head · the articles as a ledger (date, author, title, dek, capabilities) · final call to action |
| `/insights/[slug]` | page head (back link, h1, dek, author, date) · the sections in reading order, beside related work, capabilities and more insights · final call to action |
| `/work` | page head (the title, its two leads) · case studies (rows: the screenshot beside the label, name, summary, facts, figures, stack, links and "Read the write-up") · Bolt Fusion projects (three cards, then the feature-work sub-group, an h3 over two h4 cards) · in-house products (one card, its screenshot beside its text) · our engineers' track record (one text card: Go Smart; NIdle Finishing is held back) · the closing call to action |
| `/work/warmchats` | page head with the screenshot · executive summary and the numbers · how it works · the product · architecture beside the full stack · outcome · call to action and the sign-off |
| `/work/restaurant-search` | page head with the system image · executive summary and the KPIs · the three lanes · the stack beside the bounded contexts · call to action |
| `/privacy-policy` | page head with the date · the policy as legal prose |
| 404 | page head: the eyebrow "404", the h1, the way home |

- **Words.** Every word and the section order of /work, both write-ups, the
  privacy policy and the 404 are unchanged (check 30's inventories). The locked
  WarmChats constants are byte-identical; only the markup around them changed.
- **Buttons.** The primary fill and `data-cta="schedule"` are Schedule a Call's.
  Approved labels that are not it — "Book a similar build", "Book a strategy
  call", "Discuss a similar engagement", "Book a technical call", "Start a
  pilot", "Start a 2-week pilot", "Read the write-up" — are the ghost variant
  with no `data-cta`.
- **/work's contract with check 9 is unchanged:** every card is an `<li>` marked
  `data-project-kind` (`-scope`, `-id`); its `[data-attribution]` label, in the
  brand blue, is directly followed by its name (an h3, or an h4 under the
  feature-work sub-group's h3); `data-role`, `data-built-at` and
  `data-project-status` sit on the facts; each figure is a `[data-metric]` row
  with its own chip; and no other h3 or h4 is on the page. Grids fill their rows:
  three across from 1025px; a set of two, two across from 768px; a set of three,
  and a lone card, one to a row from 768px (a lone card at every width above
  that) with the screenshot beside the text; one column on phones.
- **Articles.** Figures only in paragraphs and bullets, through `<FigureText>`
  (`node scripts/verify-insights.mjs`); code in Barlow 500 with tabular figures,
  `white-space: pre`, in a focusable region that scrolls sideways, captioned;
  each "diagram" an ordered flow (`FlowSteps`) on a cyan rail — the cyan of every
  data-flow line, never on text.

### Retired 2026-09-16: the Techwix design

The Techwix clone's design — decided for the whole site on 2026-09-15 and
superseded by the engineering redesign on 2026-09-16 — was retired on
2026-09-16 (`redesign/eng-pages`), once the inner pages had moved:
`app/techwix.css`, every `.tw-` class, `.tw-root` on `<body>`, and
`components/techwix` (PageShell, PageBanner, SectionHeading, Summary, Kpi,
LaneCard, Tags, Shot, ScreenImage, ProjectCard, CtaPanel, Button, StatusChip,
icons and the older reveal, RevealObserver with `data-tw-reveal`).
`<FigureText>`'s chip is `.bf-figchip`, and screenshots go through
`components/site/ScreenImage.tsx`. What replaced each class, and the one suite
contract that changed — check 31's stylesheet signature — are in the redesign's
RENAMES.md. None of the theme's photographs, logos, icon font, SVG art or copy
ever shipped. The old dark design that preceded it went on 2026-09-15, code and
all (`app/globals.css`, Inter, Satoshi, Commit Mono, framer-motion, Tailwind);
verify-site check 31 fails if any of it comes back.

## Type

Barlow and Jost only, from `next/font/google` in `app/layout.tsx`: Barlow 500 /
600 / 700 and Jost 400 / 500 / 600. All normal — no italic anywhere. No new
family (checks 2 and 31), and the site loads no mono face. `<b>` and `<strong>`
are 600: the browser's `bold` would ask Jost for a 700 it does not load (check 3).

**The redesign's ramp** (`app/site.css`): 72 / 48 / 32 / 22 / 18 / 16 / 14.
- Barlow 700 for the H1 and every H2, tracking −0.02em (−0.015em at 32px). The
  hero's H1 is upper case by `text-transform` over its sentence-case source
  ("Build what's next."), set as two lines that never break inside ("Build" /
  "what's next.") so check 7 never sees an orphaned last word:
  `clamp(40px, 11.5vw, 72px)` below 1025px and `clamp(52px, 4.6vw, 68px)` from it,
  sized so the longer line fits its column at every width. Negative tracking is
  not tracked-out capitals.
- H2s are 48px from 768 and 32 below; Barlow 600 for H3 and H4 (22 and 18);
  buttons in Barlow 600.
- **The homepage's hierarchy (2026-09-28).** It had 16 h2s at 48px and a final
  title (72px) larger than the h1 (66px). Now four **chapter heads** — the
  proof, how we work, what we engineer and the close (`.bf-head--chapter`,
  and `.bf-final__title`) — are 36 / 48 / 48–60px (phone / tablet /
  `clamp(48px, 4.2vw, 60px)` from 1025), and every other h2 on the homepage is
  28 / 34 / 40px. The final call to action's title is `clamp(40px, 4.4vw,
  60px)` on every page, never above that page's h1. Inner pages keep 48px h2s.
- Jost for text: 16px on 1.65, leads 18 on 1.6, lines at most 62–68ch.
- Machine values — figures, stack names, stage numbers — in Barlow 500 with
  `tabular-nums`.
- The tokens `--bf-font-heading` (Barlow) and `--bf-font-body` (Jost) are
  declared at `:root` in `app/site.css`.

Code in an article is Barlow 500 with tabular figures and `white-space: pre`,
in a box that scrolls sideways: the site loads no mono face, and `pre`, `code`,
`kbd` and `samp` are set in Barlow so the browser never reaches for one.

**All six faces are preloaded,** because every page paints each: the header's
wordmark sets Barlow 700 and 500, every button — the footer's Schedule a Call on
every page, at every width — is Barlow 600, and the text is Jost. A preload
lands on every page the one layout wraps, so a face that stops being painted on
any page gets `preload: false`; check 25 fails a preload its page never renders.
**The tradeoff, measured by the hero-perf review (2026-09-15):** the four font
preloads cost about 140ms of first contentful paint in the mobile lab profile,
and gain about 20ms of LCP. They are kept because LCP is the budgeted metric
(check 29) and the poster is the LCP element either way; FCP is not budgeted. A
change that makes FCP matter — a budget on it, or a first paint that has to be
the text — reopens this. (Recorded, not re-measured, in the fix pass.)

The `next/font` variables live on `<html>`, which is `:root`, where the
stylesheet declares the tokens that read them. Move them to `<body>` and every
token stops resolving; delete the tokens and the whole site renders in the
system font. Both have happened. Verify-site checks 1 and 2 catch both.

The share image (`app/opengraph-image.tsx`) renders outside CSS, in satori,
which reads TTF, OTF or WOFF and not the WOFF2 files next/font serves. It uses
Barlow 500, 600 and 700 as TrueType files in `assets/fonts` (700 added on
2026-09-16, for the wordmark and the headline), with their SIL OFL licence
beside them, read at build time.

## Motion, as built

The redesign's motion is quiet (SPEC §3): the hero's 3D scene is to be the one
orchestrated moment; everywhere else, reveals from a visible resting state,
hover and focus states, and a slow flow along diagram paths. Transform and
opacity only. Everything is off under reduced motion, and anything that moves
for more than five seconds has a pause control.

- **The reveal** (`components/site/SiteMotion.tsx`): an element marked
  `data-bf-reveal` that is still below the fold after hydration gets
  `.bf-revealed` when it enters the viewport — a 20px rise and fade over 0.8s,
  `fill-mode: none`. Nothing is hidden in the server HTML, and focus ends a
  reveal (A2).
- **The diagram flow:** a diagram marked `data-bf-flow` gets `.bf-flowing` once a
  third of it is in view, and its cyan `.dg-flow` paths run three 1.6s passes —
  under five seconds, so it needs no pause control (WCAG 2.2.2) — then rest.
- **The system map:** a lit link's cyan pulse runs four 1.2s passes and rests;
  the other parts dim with a 0.2s opacity change.
- **Hero field (homepage): a three.js scene over a poster of it** (2026-09-16,
  the owner's brief; engineering SPEC §7, "Many technologies. One engineering
  system."). An engineering core of stacked, chamfered octagonal plates in
  graphite, each lit by a thin brand-blue seam, turning slowly. Seven modules
  sit on two orbital tiers, each a distinct form with no text: on the inner
  tier web (a thin panel), mobile (a slim slab), AI (a wireframe icosahedron)
  and cloud (a torus ring); on the outer tier ERP (stacked blocks), POS (a
  terminal block) and robotics (an articulated two-segment arm). Thin curves
  run from the core to each module, with small cyan pulses travelling along
  them, over an architectural grid floor that fades into the ground.
  Hemisphere, key and rim lights, MeshStandardMaterial, no post-processing and
  no bloom. Graphite, one brand blue on edges, cyan only on the data flow.
  - `components/field/scene.ts` is the scene; `components/field/HeroScene.tsx`
    loads it (*The hero field*, under Hard rules, for when and how).
  - **Motion:** the plates and the two tiers turn slowly, the tiers in opposite
    directions (one turn in about 90 and 140 seconds). Each module keeps its
    face toward the viewer with a slow sway, and the robot arm flexes. A pulse
    takes about four seconds to cross a connection, and grows and shrinks at
    its ends, so nothing pops. The camera follows the pointer by at most 6
    degrees of yaw, eased. Nothing is fast and nothing flashes.
  - **The poster** is `public/hero/scene-poster-v1-{660,1320}.{avif,webp}`, the
    scene's first frame (t = 0), rendered by `scripts/render-scene-poster.mjs`.
    It is a plain `<img>` in a `<picture>`, the LCP element, with the image
    optimizer off that path. Below 1025px or on a coarse pointer it drifts
    slowly — a CSS transform, so no layout shift; under reduced motion it is
    still. The step-3 files, `field-poster-{660,1320}.*`, were deleted at the
    integration (2026-09-24): nothing referenced them.
  - **Its pause control** (`components/site/MotionToggle.tsx`) shows only
    where the hero moves — the drift, or a hero marked `data-scene="live"` —
    and is invisible in the server HTML (`visibility: hidden` until it
    carries `data-ready`), keeping its space, so appearing never shifts the
    page. As `hidden` it moved the hero text 42px when it appeared: CLS 0.0085
    at 1440 when the scene went live, and 0.0245 at 390 at hydration (found by
    the scene's probe, fixed 2026-09-16). `HeroScene` sets `data-scene="live"` on
    `#hero` once the scene has drawn and removes it on teardown, so the button
    stays while the scene is paused and can resume it. Pausing sets
    `data-motion="paused"` on `<html>` and dispatches `bf:motion` with
    `{ paused }`: the drift reads the attribute; the scene stops its loop on
    the event and resumes on the next, and starts paused (its t = 0 frame
    drawn, no loop) if the attribute is already set when it mounts.
- **The header's headroom** slide is a 0.25s transform; the drawer slides in
  over 0.28s.
- **One reveal on every page** since 2026-09-16. The older one
  (`components/techwix/RevealObserver.tsx`, `data-tw-reveal`) went with the
  Techwix design. Its lesson stays: until 2026-09-15 it animated nothing — React
  renders a bare boolean data attribute as `"true"`, which it read as an
  animation's name — and no check caught it, because every check reads a page at
  rest, where a reveal that never runs and one that has finished look the same.
- **No animation library.** The FAQ is a `<details name="faq">` with no
  animation but its icon's quarter turn.
- **Reduced motion:** nothing moves. The reveal, the diagram flow, the map's
  pulse and fade, the poster's drift, the header's slide, the drawer's slide,
  the FAQ icon and the quiet link's arrow each have a guard (verify-site checks 21 and 23).

## SEO and AI visibility

- Metadata: the root layout plus per-page metadata; title template
  `%s | Bolt Fusion Tech`.
- **Canonical description**, word for word wherever the company is described —
  the meta and og descriptions, the share image and its alt text, Organization
  JSON-LD, `llms.txt` and `llms-full.txt`: *"We engineer intelligent software,
  business systems, automation, and connected technologies — from idea to
  production."* It is `CANONICAL_DESCRIPTION` in `content/canonical.ts` (COPY.md,
  "Company description — canonical"). The owner changed it on 2026-09-16; it was
  "We build AI systems that are still running in six months." verify-site check
  12 enforces it, and the site-content schema refuses a homepage description that
  does not open with it.
- **A meta description is 50–160 characters** (check 26), so the homepage's — and
  the layout's default — is the canonical line and nothing else: 117 characters.
  /contact's is its own, 103. The company line, what we build and how we work
  live in the Organization node, which has no length limit. The site-content
  schema checks all three lengths, so this fails the build, not the suite. The
  homepage's was 211 until 2026-09-16.
- JSON-LD from `lib/structured-data.ts`. The homepage graph: Organization (the
  new description, the apple-touch icon as its logo), WebSite, **one Service per
  capability** from `content/engineering.ts` (robotics' description carries its
  honesty line), FAQPage, BreadcrumbList — and no Person, on any page (*The
  team is a headcount*). `/contact` emits a BreadcrumbList. `/work` and both case
  studies emit their own; each case study is BreadcrumbList + Article.
  `/capabilities` emits Organization, one Service per capability and a
  BreadcrumbList; `/industries` and `/engineering` a BreadcrumbList; `/about`
  Organization, AboutPage and BreadcrumbList; `/insights` CollectionPage and
  BreadcrumbList; each article an Article (its headline the page's h1, its
  author "Bolt Fusion Tech engineering", `datePublished`) and a BreadcrumbList.
  Every Service points at its section on `/capabilities`.
  Breadcrumbs point at pages, never at anchors. `/work` is named "Case studies"
  in every breadcrumb — its own and the write-ups' — as the navigation named it,
  and each Article's headline is its page's h1, from the same source the page
  renders (A7, 2026-09-15).
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
  exist. The sitemap lists every public route: `/`, `/work`, both write-ups,
  `/capabilities`, `/industries`, `/engineering`, `/about`, `/insights`, the
  three articles (from `content/insights.ts`), `/contact` and `/privacy-policy`.
- The share image (`app/opengraph-image.tsx`) is in the redesign: the graphite
  ground, the Forward Monogram, the wordmark in Barlow 700 and 500, the support
  line in the brand blue, and the canonical description as its headline. The two
  write-ups use their own screenshots. The icons come from the mark
  (`scripts/generate-icons.mjs`): `public/favicon.svg` and
  `public/apple-touch-icon.png`, declared in the layout (an explicit `icons`
  object suppresses Next's `app/apple-icon` convention), and `app/favicon.ico`,
  served by Next's convention.
- `llms.txt` and `llms-full.txt` describe the broad engineering company — the six
  capabilities with their evidence tiers, the inner pages and the three
  articles — and credit every project exactly as /work does.

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
- **The team is a headcount. Decided by the owner 2026-09-24: "we just show
  we have 15+ developer team, no details".** The Team section (/about) and the
  homepage's headcount (in how we work with you since 2026-09-28, where the
  homepage's Team section merged) state "15+ developers" and nothing about any
  one person: no names,
  no profiles, no LinkedIn links, no photographs, no initials, and no Person
  structured data on any page. Enforced at load: `team` is a strict object with
  `size` and `sizeLabel`, so a `roster` put back fails the build, and `size` is
  a figure whose exemption must exist in `content/figure-labels.ts`. Checked on
  the page: check 14 fails a person card (`[data-person-card]`) or a Person
  node on any page; check 30 fails a named member coming back (a cut item on /
  and /about). It supersedes the rule of 2026-09-15 below.
  *History, superseded 2026-09-24:* **A person is linked, and marked up as
  Person, only with a verified LinkedIn profile; a named member without one is
  shown as "profile pending", with initials** (`feat/team-ten`, checks 14, 27,
  30). The roster, its verified and pending member schemas, `personLd` and the
  cards' CSS were deleted with it.
- **Reveals render visible in the server HTML.** Fade-on-scroll is allowed; an
  element the server sends at `opacity:0` is not. *Holds*: the reveal's
  `fill-mode: none` has no hidden resting state (checks 4 and 5).
- **The hero field — the one place WebGL is allowed, and never in the way.**
  Decided 2026-09-11 for the homepage rebuild; amended by the owner on
  2026-09-16 (*Decided 2026-09-16*). The canvas over the poster is now the
  three.js scene (*Motion, as built*), and the field is the right column of the
  graphite hero (`components/site/home/Hero.tsx`): 660 x 560 from 1280px up —
  the width `sizes` declares and the scene is composed for, so the canvas and
  the poster frame the scene identically — and as wide as the grid allows below
  that (536px at 1100, 467px at 1025), where `cover` crops it. It has NO border
  and NO radius, only the ground colour, so the scene reads as part of the page
  and not a card (the coordinator's review, 2026-09-16); nothing is painted over
  the poster. The
  poster `<img data-hero-poster>` is the final LCP entry,
  measured with a buffered `PerformanceObserver` on a fresh, unscrolled load —
  verify-site check 28 asserts it by identity at 390 (also as a phone), 768,
  1024, 1025, 1280 (also at DPR 2) and 1440 on every run, and then, settled,
  that the poster is still rendered, opaque, the field's box, on top of
  everything in the field but a canvas with the field's box, and clear of the
  h1 (an LCP entry is never withdrawn, so the identity alone cannot see a
  poster hidden, faded, covered or moved after it painted). At ≥1025px the
  field is 560px tall and at most 660px wide (narrower between 1025 and
  1280px), so the poster is drawn exactly 660px wide and `sizes` says so (H4:
  at the column's full height, 832px at 1025, the browser once fetched a file
  about 1.5x too small at every DPR); below that it sits above the text.
  - **A re-rendered poster gets a new file name.** `/hero/*` is served
    `public, max-age=31536000, immutable` (`next.config.ts`, un-hashed /public
    assets): a browser that has the old file never asks again. The scene's
    poster ships as `scene-poster-v1-*`; the next render is `v2`, never over
    the old name.
  - The LCP element is a static poster `<img>` made from a real frame of the
    field, never the canvas. The canvas fades in over it and cannot shift layout.
  - Everything the hero says is server HTML. The field carries no information
    and is `aria-hidden`.
  - The fallback ships first; WebGL is progressive enhancement, imported only
    after the first LCP entry and `load`, inside `requestIdleCallback`.
  - **Reversed by the owner, 2026-09-16: three.js is allowed for the hero
    scene.** This rule said "raw WebGL2 only, one draw call, about 5KB; do not
    bring three.js back". The owner's brief asked for a three.js hero, an
    abstract engineering ecosystem, and not a brain, a particle cloud or a
    globe. It stays within PLAN.md §5.2's original 3D budget: one chunk of at
    most **180KB gzipped as transferred**. It is plain three.js, with no React
    Three Fiber, and uses named imports so it tree-shakes (measured under
    *Performance targets*). The raw WebGL2 particle renderer on the local
    branch `wip/field-renderer` is not used; only its gating, loading and
    pausing patterns were kept.
  - **No per-frame allocation** still holds. The pulses are InstancedMeshes,
    and the loop writes their matrices straight into the instance buffers.
    Every geometry, material and vector is made once, and the hot loops use no
    iterators or closures.
  - DPR capped at 1.75. Once the running average frame (about ten frames) has
    stayed over 20ms for two seconds the pulses go; after two more, the outer
    tier. Testing each frame alone reset the count on every fast frame, and a
    slow device's uneven frames kept resetting it, so it never fired (probe 6e,
    2026-09-16). Paused offscreen (IntersectionObserver) and
    when the tab is hidden. On teardown every geometry, material and instance
    buffer is disposed, then the renderer, and the context is released
    (`forceContextLoss`); the scene makes no textures. A lost context
    (`webglcontextlost`) stops the loop and drops the canvas, and the poster,
    never hidden, is what remains. Nothing throws.
  - **When it loads.** `HeroScene` renders nothing, on the server or the
    client. While the conditions below hold, it waits for BOTH the first
    `largest-contentful-paint` entry (buffered) AND `load`, then an idle
    callback (a timeout where `requestIdleCallback` is missing), and only then
    runs `import("./scene")`. The canvas goes inside `[data-hero-field]` with
    the field's box (`position:absolute; inset:0`), `aria-hidden`, at opacity
    0. It fades in over 700ms once the first frame is drawn, and the field then
    carries `data-scene-ready`.
  - **It builds in slices, and draws once.** Construction runs a few
    milliseconds at a time, a frame apart, and each group's shaders are
    compiled as that group appears; one frame is drawn at the end, the whole
    scene at t = 0, which is the poster's frame. Built in one block it was the
    page's longest task after load (*Performance targets*, "The scene's
    main-thread cost"). Nothing is visible during the build: the canvas is at
    opacity 0 until that frame is drawn.
  - **The poster is a frame of the scene, by construction.** The scene's
    first frame is t = 0 with the camera at rest, and that frame is the poster,
    so the fade shows no jump. The scene keeps a fixed vertical field of view,
    so a field narrower than 660 (between about 1025 and 1300px) shows the
    centre crop of the 660x560 frame, exactly as `object-fit: cover` crops the
    poster; it is composed to read from about 480 to 660 wide.
    `scripts/render-scene-poster.mjs` renders it from the built site at 1440.
    It freezes requestAnimationFrame when `data-scene-ready` appears, so the
    canvas holds t = 0, and captures the field at 660x560 (its 1px border
    removed for the capture) at DPR 2.
  - **It dissolves into the page; it never stops at a box** (coordinator's
    review, 2026-09-16). The field has no border, and its background is the
    ground, `#07090D`, which is also the canvas's clear colour. The grid floor
    and the blue pool under the core fade to exactly that ground by r = 2.8
    (`FLOOR_FADE` in `scene.ts`). **660x560 is the frame it is composed for**,
    and 480x560 — the narrowest the field goes — is the safe area nothing
    important may leave. With the pointer at either parallax extreme, at 480
    the fade ends at least 23px inside every edge, the rings at least 63px and
    every module, at every orbit angle, at least 13px, on bounding spheres; at
    660 the same objects clear the sides by at least 103px and the top and
    bottom by at least 65px and 50px. That was checked by projection and on
    rendered frames at t = 0, 20, 30 and 45s. The poster
    script refuses a capture whose 16px edge band is not the ground, and the
    probe reads the live canvas's edge band. It is done in the scene itself:
    no overlay and no post-processing, since anything painted over the poster
    but the canvas fails check 28.
  - Never mounted on mobile — only on `(pointer: fine) and (min-width: 1025px)`
    with Save-Data off. Phones get the poster and a CSS drift; under reduced
    motion, the poster alone. Check 25 hooks `getContext` before any page
    script — in the page, in every frame, and inside every dedicated worker —
    sends a first pointer move, tap or click, wheel turn and key, and fails any
    WebGL context at 390, 768 or 1024, as a phone, as a touch tablet (1180x820
    and 1366x1024, a coarse pointer), with Save-Data on, or under reduced
    motion. The conditions are watched live: when they stop holding (a resize
    below 1025, reduced motion switched on) the scene is torn down and
    disposed. Since the suite wave (2026-09-16) check 25 also requires the
    scene where it is allowed — a granted context at 1440 with a fine pointer,
    its canvas in the field, `data-scene-ready` — and holds the scene chunk to
    180KB gzipped, requested after the load event (*Verify before pushing*).
    Width alone is never the gate: an iPad in landscape is 1180 or 1366 wide.
  - **It sits beside the headline, never behind it.** On the old black hero it
    sat behind the headline, and keeping the white type legible took five
    overlay layers — two colour glows, a radial wash, a vignette and a fade to
    black — which wiped the particles out. In the graphite hero the field is
    the right column and the headline sits on the flat ground, so contrast
    holds by construction and nothing covers the field. Putting it behind the
    headline again means rebuilding those five layers.
  - **What the 2026-09-16 reversal did NOT change.** The poster is the LCP
    element, never the canvas. There is no WebGL on phones, tablets, touch,
    below 1025px, with Save-Data or under reduced motion: those visitors get
    the poster, and the scene's chunk is never requested. The scene loads
    lazily, after LCP and load, in an idle callback, and is never initial
    JavaScript. The field sits beside the text, never behind it. The canvas is
    `aria-hidden`, carries no information and cannot shift layout, and the
    poster stays rendered under it.
- **No tracked-out ALL-CAPS labels, no single headline word coloured for
  emphasis, no meta strings joined with middle dots, mono for machine output
  only.** *Holds* with `design/rules-decided`; the site now loads no mono face
  at all. The redesign's hero H1 is upper case by `text-transform` with negative
  tracking, which the spec allows: it is a headline, not a tracked-out label.
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
  in its page head (`components/site/PageHead`; the homepage's in the hero); the
  header and footer carry none.
- **Visible keyboard focus everywhere.** *Holds*: a 2px `#8ab4ff` ring, 9.5:1 on
  the ground, on every link, button, summary, form field and anything with a
  tabindex (`app/site.css`) — the article code blocks and the engagement-models
  table, which scroll sideways, take focus too.
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

**The gate (`scripts/gate/`, moved into the repository 2026-09-24).** Nothing
goes to `main` unless `scripts/gate/gate.sh` passes on the committed HEAD: RUN 1,
the full suite with `--repo` on a fresh copy and a fresh server (:3465); RUN 2,
every misuse case in `gate-cases.py` patched into one build, each of which must
fail its own check with its own finding (and that finding must not already be on
the clean build); RUN 3, bad content the build must refuse in the schema's own
words. `--only` is derived from the case table, never written by hand. A case
whose anchor stops applying aborts the gate; a rule that cannot exist any more is
RETIRED with its reason, printed on every run. Scratch copies go under
`$GATE_TMP` (default `$TMPDIR/bf-gate`). It lived in a session scratchpad until
then, and was lost with it once.

**The redesign and the suite (2026-09-16).** The suite wave (`redesign/eng-suite`)
brought the suite to the owner's redesign (the redesign spec, §8, with the binding
§8b): checks 7, 12, 23, 25, 28, 29, 30 and 31 changed, and 32 and 33 are new. The
inventory follows the homepage agent's MOVES.md, every fate recorded. Each change
was proven both ways on a served fixture — the page passes, the same page with one
misuse fails — and every new rule has a misuse case in the gate's RUN 2.
- **7** — the headline is two spans, "Build" / "what's next.", and a span of one
  word is by design; so besides each span's own lines the check reads the lines
  of the WHOLE headline, across its spans, and fails a last line of one word. The
  per-span rule alone passed "Build what's" / "next." set as two spans that never
  wrap: neither span breaks, and the headline still ends on an orphan.
- **12** — the canonical line is the owner's of 2026-09-16, written in the suite
  (as check 9 writes its labels) and compared with `content/canonical.ts`, so a
  changed line cannot pass by agreeing with itself; changing it means changing
  both, on purpose. It must open the Organization description and appear word for
  word in the meta, og and twitter descriptions, the share image's alt text and
  BOTH llms files — the check never read `llms-full.txt`, so a copy changed there
  alone passed.
- **25, rewritten for the three.js scene** — exactly one profile may have a WebGL
  context: `/` at ≥1025px with a fine pointer, no touch, no Save-Data and no
  reduced motion. There one MUST exist — a context the browser grants, a canvas
  inside `[data-hero-field]`, and `data-scene-ready` on the field — because every
  "never" rule passes on a scene that is silently dead. The browser is launched
  with ANGLE's SwiftShader (the scene's own probes' flags) so a headless run can
  draw; the flags make WebGL available and change nothing a page decides, and a
  refused context at 1440 is unsure, a failure. The scene chunk — what the
  allowed profile requests on `/` that no other profile does, plus any script
  that is three.js (its GLSL strings survive minification) or asks for a context
  — is at most 180KB gzipped and requested after the load event. three.js is
  never requested at 390, 768 or 1024, as a phone, on a touch tablet, with
  Save-Data, under reduced motion or on another page; @react-three never. Every
  older hardening stays: every frame, workers, a frame that removes itself, the
  first input, the 1024 run, both tablets, Save-Data, reduced motion.
- **28** — the hero contract is the owner's words: "Build what's next.", the
  support line "Software. Intelligence. Automation. Machines.", the body
  paragraph after it, and both calls to action, "Schedule a Call" to
  /contact#schedule and "Explore Our Capabilities" to /capabilities — each in the
  served HTML with scripts stripped. The proof-strip assertions followed the strip
  to the engineering stories, `#recent-work`: the list holding the `[data-metric]`
  rows, every row's figure, label, status and source compared with
  `content/metrics.ts` and served as shown. At ≥1025px the settled poster is read
  once the scene has drawn over it (up to 12s more), so "the poster stays
  rendered under the canvas" is a finding about the scene, not about a page
  without one; and the poster is BESIDE the h1 there — right of every line of
  it — and above it below 1025.
- **29** — the budget is unchanged. The scene chunk is not counted because it is
  requested after the load event, and that exclusion is now written into the
  check: every scene chunk the runs requested is printed with its start time, and
  one requested before the load event ended fails — a scene imported statically
  would put three.js in the initial JavaScript (check 25 fails it too).
- **30** — the inventory follows MOVES.md for `/` and adds `/contact` (*Check 30
  is the content contract*, below). New in the check: `retired` items, a `scope`,
  whole-word matching, `ignoreCase`, shared `sets` and `awaiting` routes; a cut or
  retired item without its reason, or a status, scope or match it does not know,
  fails.
- **31, one design: the redesign's** — the site's stylesheet is known by
  `app/site.css`'s `.bf-header` / `.bf-wrap` / `.bf-hero` / `.bf-main` rules. The
  Techwix design joins the retired list: a stylesheet with its `.tw-root` /
  `.tw-hero` / `.tw-header` rules, any element with a `tw-` class (the 404's markup
  too), and with `--repo` a tracked `app/techwix.css` or `components/techwix/*` and
  any import of them. three.js is allowed only under `components/field/`, in a
  module nothing imports statically (a type-only import is erased) and only
  `components/field/HeroScene.tsx` imports dynamically; @react-three,
  framer-motion and Tailwind stay banned everywhere. **Until the pages wave
  deletes the Techwix design, check 31 fails on it:** every page's
  `<body class="tw-root">`, `<FigureText>`'s `.tw-figchip`, the inner pages'
  markup, and `app/techwix.css` with its pieces.
- **32, new — "Schedule a Call"** — no page says "Book a call", in any case: each
  page's served HTML (text, attributes, head, JSON-LD and page data), each page
  as rendered (hidden text and every attribute), the 404 and the llms files. The
  WarmChats write-up's locked "Book a similar build" and "Book a strategy call",
  and the restaurant write-up's "Book a technical call", are other phrases. The
  header's primary button — every link in `header#masthead` that is not the
  navigation or the logo's link home — reads exactly "Schedule a Call", carries
  `data-cta="schedule"` and goes to /contact#schedule; every `[data-cta]` reads
  its kind's words and goes to its kind's page (schedule → /contact#schedule,
  explore → /capabilities, project → /contact#project); `/` carries all three;
  and /contact answers 200 with `#schedule` and `#project`.
- **33, new — the honesty contract** — every `[data-capability]` shows a tier chip
  a reader can see; the robotics capability (on `/`, and on /capabilities once it
  exists) shows a visible Lab chip, no other tier, and a `[data-honesty]` element
  holding SPEC §8b.7's line verbatim where a reader can see it; no tier chip
  carries or holds a `data-status`, which check 8 reads as a figure's label; and
  a tier chip says its tier.
- **23** — unchanged in what it compares. It captures under reduced motion, where
  the scene never mounts (check 25 fails one that does), and hides every canvas
  for the capture, so the live canvas cannot reach it; it now prints what the page
  held (its canvases, and whether a scene drew). Pausing the scene with
  `bf:motion` instead would make the capture depend on the scene's own pause
  working; reduced motion keeps the scene out of the page.

**The gate (2026-09-16).** RUN 1 builds a fresh copy of HEAD, serves it fresh and
runs all 33 checks with `--repo`: every failing finding is real. RUN 2 applies
every misuse case to another copy in one build; each must fail its own check
with its own finding, and that finding must not already be on RUN 1's report —
a pattern that matches the clean build proves nothing. RUN 3 builds seven
kinds of bad content — a figure KPI with no status, a capability KPI with one,
an exemption with an empty reason, a capability tier outside proven, core,
capable and lab, a named roster put back in the team (2026-09-24), and since
2026-09-28 a hero first-call line that is not approved copy and feature work
named on the hero's proof line — and requires the schema's own refusal in the
build log: a build that fails for another reason is unsure. The suite's `--only` list for RUN 2 is
derived from the case table: a hand-written list once omitted check 9, and its
case could not fail. A case whose target does not exist yet names the wave that
brings it and holds the verdict at INCOMPLETE until it runs.

**The inner pages (2026-09-16).** With `app/techwix.css` deleted, check 31 as
written — it knows the site's stylesheet by `.tw-root` / `.tw-hero` /
`.tw-header` rules — fails every page until the suite wave points it at
`app/site.css`'s rules; and check 30 fails the new routes until they have
inventories. Both are the suite wave's, from the redesign's RENAMES.md and the
inner-pages report.

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
"two-week"). "Still running in six months" was the canonical line until 2026-09-16; a spelled-out metric is caught by
review, not by this check.

**Check 30 is the content contract.** `scripts/content-inventory.json` lists every
page's content; a required needle missing from the served HTML fails, and so does
a cut item coming back. A restyle that moves text into different nodes splits
the needle at the boundary (`8716ba5`); it never deletes a required word. Since
2026-09-16:
- an item is `required`, `cut` (with its reason) or `retired` (with its reason:
  printed on every run, checked neither way). "About", cut on 2026-09-15 when it
  pointed at #team, is retired: it is the /about link again, and a required
  Navigation needle;
- `scope` matches inside the header, footer or main only — a link cut from the
  navigation ("Services", "Team") can still be a word on the page, and
  "Services" is one, in a diagram's label;
- `match: "word"` matches whole words with the text's spaces kept: "Expo" never
  matches "export" or "exposure". The squashed matching stays the default, because
  a restyle splits words across nodes; `ignoreCase` covers "Book a call" in any
  case;
- `sets` hold items several routes include (`{ "include": name }`): the excluded
  projects on `/` and /work, and SPEC §8b's cuts (Expo, Supabase, Whisper,
  FastAPI, Kubernetes, Kafka, RabbitMQ, GoRestora, nResto, B-POS, "Book a call",
  the old honesty line) on `/`, /contact and, since the stack's list left `/`
  on 2026-09-28, /engineering;
- `awaiting` holds the inventory of a page not yet published — /about, with the
  engagement models, the pilot and the overlap hours that left `/` — printed on
  every run and required the moment the page is in the sitemap, where it must
  move into `routes`. Adding a route is data only.

Every old `/` needle has a fate — kept, cut, retired, moved to /contact or
awaiting /about — and none was dropped silently; the inventory was generated
with a guard that refused to write it otherwise.

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
- **14 and 30, the team as a headcount (2026-09-24)** — 14 fails any
  `[data-person-card]` and any Person node, on every page it reads: the team
  names no one. 30: the team item's needles are the headcount ("15+",
  "developers") and the new subtext; the ten names, the handles, "Profile coming
  soon" and "verified profiles" are a cut item on / and /about. 27 is unchanged
  (no fake faces, anywhere). The gate's "person" case (an empty jobTitle) is
  RETIRED — there is no Person node left to empty — and a "person-card" case
  takes its place; RUN 3 adds "a roster put back".
- *History:* **14, 27 and 30, the team of ten (2026-09-15)** — 14: every verified person
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

**Checks changed in the 2026-09-28 redesign (IA stream).** Each rule was proven
both ways on a served build — the site passes, the same site with one misuse
fails with that rule's own finding — and each has its misuse case in the gate's
RUN 2 (`scripts/gate/gate-cases.py`).
- **32, extended — the project form is usable where it lands.** At 1440,
  `#project .bf-form` on /contact is at least 480px wide (`PROJECT_FORM_MIN`),
  visible, and there. It rendered 203px wide in a bordered panel whose heading
  touched its edge: the contact wrapper was `bf-wrap bf-project`, and /work's
  card rule `.bf-project` (display flex, a column, a border) came later in
  `app/site.css` and won over the contact grid of the same name, whose
  `align-items: start` then shrank the form to its button. No check measured
  it. The misuse case `contact-form` makes the wrapper a flex column that
  shrinks its items — the bug's shape — and reproduces it to the pixel: "the
  project form (#project .bf-form) is 203px wide"; the clean build reads 640px.
- **2, corrected — only text the browser renders.** Check 2 asks CDP which
  platform font painted each text element, and read "no font" as a fallback.
  An element inside a closed `<details>` is never painted, yet an inline one
  reports a box, so the first figure wrapper inside an FAQ answer (the overlap
  answer's exemption, 2026-09-28) read "wants Jost, got ?". The stamp now
  skips what `checkVisibility()` says is not rendered. The misuse case
  `fallback-face` puts CJK text, which no face of the site's can draw, in a
  visible paragraph on `/`, and check 2 still fails it: the correction narrows
  the reading to rendered text and loosens nothing. Check 2 joins RUN 2's
  derived `--only` list with it.
- **The build, two new refusals (RUN 3).** The hero's microcopy and proof line
  are read through the schema (`content/site-schema.ts`), and each new rule
  has a bad-content build that must fail in its own words. The microcopy must
  be one whole sentence of /about's terms, word for word: the first version
  tested `includes`, so `""` compiled and served an empty
  `<p class="bf-hero__micro">`, and "writes the code" passed as a fragment —
  and check 30 could not see either, since the sentence is also served in how
  we work and the FAQ and a needle is a substring. Case (f) sets it to a new
  promise, "We reply within one working day.", and the build refuses it: "is
  not approved copy"; `""` and "writes the code" are refused the same way.
  Case (g) names `bazzile` on the proof line: "hero.proof: "bazzile" is
  feature work in another company's app". Both proven on throwaway builds of
  the working tree, and the clean build takes the real content.
- **The gate's cases, re-anchored with the homepage (same meaning).** `honesty`
  onto the ledger's honesty render (`components/site/home/WhatWeEngineer.tsx`;
  `Capabilities.tsx` is gone); `person-card` onto how we work's headcount as
  well as /about's Team section, since that is where the team is shown on `/`;
  `faq-client` onto the answer's `<FigureText>`; `logotype` onto /contact's
  blurb. `kubernetes` still patches the stack's list, which renders on
  /engineering only now, so /engineering's inventory includes the evidence
  cuts and check 30 still sees a cut technology come back. `cache-lane`
  stands: the restaurant search's lanes stay on `/`, as a band in the stories.

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
`components/site/Logo.tsx`, the only wordmark on the site — for checks
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
| the hero scene chunk (three.js and the scene; 2026-09-16, was 15KB for the raw WebGL2 renderer) | at most 180KB gzipped as transferred; requested only after the load event; never below 1025px, on touch, with Save-Data or under reduced motion — check 25 |

**The homepage, measured 2026-09-16** (check 29 against `next start`, the median
of three runs, on a machine also building elsewhere — its load average is printed
beside each run). Mobile lab: **LCP 892–916ms**, the poster the LCP element in
every run, FCP equal to it, blocking 31–43ms, **CLS 0.000**. Desktop: LCP
72–264ms, CLS 0.000. Initial JavaScript 145.4KB gzipped. Two figures worth
watching: the homepage's HTML is 42KB gzipped (161KB of it the RSC payload, which
repeats the markup) against production's 22KB, and desktop blocking time is
0.9–1.9s, which is the scene's chunk parsing and starting after load — outside
check 29's budget, which measures blocking on the mobile profile only.

**The scene chunk, measured 2026-09-16.** One Turbopack chunk holds three.js
0.186.0 and the scene: 555KB raw, **137.9KB on the wire**. That is the
response's `encodedBodySize` under `next start`'s gzip, read in the browser at
1440; the file itself is 140.5KB at `gzip -9`. It is requested at about 2.2s,
after the load event (164ms locally), and none of the nine scripts before load
holds three.js. esbuild's estimate before the build was 142.8KB. So named
imports from `three` tree-shake under Turbopack with about 42KB to spare. If a
three bump or a new import pushes it past 180KB, import from
`three/src/...` module paths.

**The scene is not initial JavaScript, and check 29 says so (2026-09-16).** The
260KB counts what is requested by the end of the load event, and the scene chunk
is imported after it: check 29 prints every scene chunk its runs requested, with
its start time against the load event, and fails one requested before the load
event ended — a static import of the scene would put three.js in the initial
JavaScript. Check 25 holds the 180KB: it gzips each scene file as served (level
6), because its WebGL runs re-serve scripts through the worker hook and their
resource timings are not the wire.

**The posters:** `scene-poster-v1-660.avif` 5.7KB, `-1320.avif` 11.5KB,
`-660.webp` 10.3KB, `-1320.webp` 24.8KB (AVIF 4:4:4 at quality 56, WebP 82).
The step-3 field posters they replace were 33.6KB and 87.4KB as AVIF. A dark
frame of hard-edged shapes that dissolves into the ground compresses far
better than a cloud of points, which takes weight off the LCP path. They were
re-rendered for the dissolve on 2026-09-16 under the same v1 names, since v1
had never been deployed. From the first deploy on, a re-render is v2.

**Check 29's desktop blocking reads ~500ms since 2026-09-24 — a headless
artefact, not the site.** Check 25's WebGL runs moved to their own browser with
the SwiftShader flags (check 23's captures failed with them on the shared one),
so check 29's desktop run now uses a browser without them, and its first WebGL
context takes a slower software path. Same build, side by side at 1440: 674–1,037ms
of blocking without the flags, 5–73ms with them, the scene drawn both ways. No
budget reads it (desktop blocking is not budgeted); do not "fix" the scene for it.
The table below was measured with the flags.

**The scene's main-thread cost, measured 2026-09-16.** Check 29 budgets
blocking time on the mobile profile only, and the scene never runs there, so
no check fails on this — but its desktop line is real for the machines that do
get the scene. Counted its way (every long task from navigation to load + 4s,
each task's time over 50ms), on the merged homepage at 1440:

| | before | after |
|---|---|---|
| unthrottled, long-task total | 62–177ms | **0–60ms** (no long task at all in 2 runs of 4, DPR 2 included) |
| unthrottled, longest task | 111ms | **60ms** |
| CPU throttled 4x, total | 249–264ms | **128–152ms** |
| CPU throttled 4x, longest task | 127–159ms | **67–96ms** |
| CPU throttled 6x, total | 381ms | **170–196ms** |
| CPU throttled 6x, longest task | 217ms | **90–102ms** |

The render loop was never the problem: after the first frame it produces no
long tasks at all, and its callbacks run 0.3–0.5ms. Shader compilation was not
either (`compileShader` and `linkProgram` both measure 0ms). The cost was two
tasks — evaluating the chunk, which is the price of its size, and building the
whole scene in one synchronous block, which is now sliced (`scene.ts`, "The
build, in slices"). What is left of the first draw is 25ms of upload and
program setup, which is no longer a long task on this machine.

**Nothing resizes the canvas after its first draw** — checked at DPR 1 and
DPR 2, five seconds past the fade and a pointer move, by hooking the
`width`/`height` setters (every assignment reallocates the drawing buffer,
even one that writes the value it already holds). What that check did find was
a redundant sizing BEFORE the first draw: `setPixelRatio` then `setSize` wrote
each dimension twice, and at DPR 1 the first pair wrote 300 over 300. Sizing
once, through `setDrawingBufferSize` (`applySize`), took it to two assignments
and halved the first draw, from 48–53ms to 25ms. The general lesson, learnt
the expensive way in a rejected experiment: **resizing a canvas's backing
store costs far more than the frame it saves** — an 8x8 warm-up draw turned a
54ms first render into 815ms.

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

## Decided 2026-09-28: easier to hire, and the motion system (owner)

The owner's request, 2026-09-28, verbatim:

> think as like you have 20+ experience UI and UX
> you are one of the world best creative designer
> now make our westive more better and do here more better threee js and GSAP cool and better animation
>
> research and do it more beter way that easy for me clint hire

Every decision below was made under this request, on `redesign/motion-hire`
(the research and the binding decisions: the session's `research/DECISIONS.md`
and `BRIEF.md`). The direction is "Proof Line": the page proves before it
explains. **Nothing is pushed or merged to `main`; the owner reviews first.**

**The homepage's information architecture (the IA stream).** Measured at 1440,
the first write-up started at 13,847px (15 screens) and the page ran 19,526px;
the hiring terms were only on /about, and "pilot" appeared nowhere on `/`.

| question | decision | where |
|---|---|---|
| The order (`site.sectionOrder`) | hero → engineering stories (`#recent-work`, compact) → how we work with you (new) → what we engineer (one ledger that absorbed the six capability sections) → how we build → industries with delivered work → Insights → FAQ → final call to action. Measured: 10,409px at 1440 (from 19,526) and 16,317px at 390 (from 27,544); `#recent-work` at 755px and its first write-up at 913px at 1440 (from 13,847) | `motion-hire/ia` |
| Off the homepage, each still on its route | the six capability deep dives and the system map (/capabilities, the map after the six: its parts are the six); the stack by layer (/engineering); the industries with no delivered work (/industries); the Team section (/about — its headcount stays on `/`, in how we work). Check 30 retires each on `/` with "moved to /<route> — owner request 2026-09-28 ("make it easy for clients to hire")", and its destination's inventory requires the same needles | `motion-hire/ia` |
| Kept on `/` | every `[data-capability]` with its tier chip; robotics, its Lab chip, its honesty line verbatim and "Concept — not a shipped system"; `#recent-work` holding the proof strip; `/#contact`; the anchors `#software` … `#cloud` (the ledger's rows); the Service JSON-LD, now tied to the ledger's section | `motion-hire/ia` |
| The hero | its contract words unchanged (check 28's `HERO`). Under the calls to action: "Your first call is with the engineer who writes the code." (/about's term, word for word — the schema refuses anything but one whole sentence of those terms, RUN 3 case f) and a proof line — "Built by Bolt Fusion and in production": WarmChats (for WarmChats, Inc.), Balanzify (for Balanzify Inc.), Go Style Business — read from `content/projects.ts` through a strict `hero.proof` (feature work refused, case g), each linked as the data links it: WarmChats to its write-up, Balanzify and Go Style Business to the live products. Proof at the fold below 1025px as well: the field is a band there and the line one row (*Design language*, "The hero's first screen"). Robotics stays in the hero's body: those are the owner's words, and his call | `motion-hire/ia` |
| No new promises, no new figures | no reply time, no price, no call length. The price question is answered only with /about's interim line ("We'll give you a full quote … once we've seen the real codebase") | `motion-hire/ia` |
| How we work with you | the four terms, the engagement models, the line under them and the operating detail, the pilot (Week 1, Week 2, Deliverable) on the `pilot` trace hook, the headcount and where the engineers work — every word /about's; closes with Schedule a Call and the ghost "Start a 2-week pilot" | `motion-hire/ia` |
| The FAQ | four buyer objections first — who writes the code, the overlap, who owns the IP, can we start small — in words the site already publishes; "4–8 hours of overlap … Two-week" has its own exemption, since FAQPage carries it | `motion-hire/ia` |
| /contact | the `.bf-project` class collision fixed; two columns from 1025px with the calendar in the first viewport, after the h1 on a phone; check 32 holds the form at 480px or wider at 1440 | `motion-hire/ia` |
| Mobile | no header Schedule a Call below 520px: it does not fit at 360 (measured, *Design language*); contextual primaries after the proof and after how we work instead; no sticky bar. The ledger shows no diagram below 768px, where its labels would fall under 13px | `motion-hire/ia` |
| Hierarchy and rhythm | four chapter heads at 48–60px, every other homepage h2 at 40px, the final title never above the h1; chips at 12px/600; 56–88px between related sections, 128px only above a chapter; 44px hit areas on the homepage's inline links; the hero's full-width hairline "false floor" removed | `motion-hire/ia` |
| Honesty cleanup | NIdle Finishing's only proof link 301s to a bare PNG: removed, and the card held back until a working link exists (*Projects and attribution*). The rest of the brief's row 14 is the owner's | `motion-hire/ia` |

## Decided 2026-09-16: the engineering redesign (owner)

The owner's brief of 2026-09-16 ("Premium brand & website redesign") repositions
the company from "AI studio" to a broad engineering company: "Software.
Intelligence. Automation. Machines." Its spec (v1, with the binding evidence
corrections of its §8b) wins where it and this file disagree. The rules it
reversed:

| was | now (owner, 2026-09-16) |
|---|---|
| AI-native positioning as the front page | A broad engineering company. AI is one capability of six |
| Raw WebGL2 only, "do not bring three.js back", 15KB renderer | three.js, lazy and desktop-only, ≤180KB gzipped (PLAN.md §5.2's original 3D budget) — the 3D wave |
| "Book a call" | **"Schedule a Call"**, everywhere, title case |
| Canonical description "We build AI systems that are still running in six months." | **"We engineer intelligent software, business systems, automation, and connected technologies — from idea to production."** (check 12 enforces it everywhere) |
| Clone design, light bands on navy | A dark, premium engineering foundation (*Design language*) |
| The old diamond logo | The Forward Monogram |

**Evidence tiers** — the rule is old, the page is new: Proven — shipped, with a
case study or project; Core — repeated work; Capable — we can engineer it, no
delivery yet; Lab — research or prototype only. Every capability shows its tier
(`data-tier`). Robotics is Lab and says so, verbatim; no robotics, drone or
computer-vision delivery is claimed anywhere.

**The evidence corrections are binding** (§8b, from 91 claims checked against the
repos and the portfolio). The stack is only React, Next.js, React Native;
Node.js, NestJS, Django, GraphQL, REST, gRPC, Socket.IO; PostgreSQL, Redis,
pgvector, WatermelonDB, SQLite; Claude, GPT-4.1, embeddings and retrieval,
agents; Docker, Docker Swarm, GitHub Actions, Vercel. No Expo, Expo EAS, Supabase
or Whisper (the owner's Jumatechs work and SaraAI, not Bolt Fusion evidence); no
FastAPI, AWS, Render or Sentry (weak evidence); no Kubernetes, Kafka or RabbitMQ.
POS: restaurants built; retail and pharmacy in development; no payments or
commerce integrations claimed, no internal repository named, no live merchant.
The proof strip never says "Measured on…". /about says where "our engineers
work", never "offices", until the owner gives addresses.

| question | decision | where |
|---|---|---|
| The foundation | `app/site.css`; the shell on every page; the homepage and /contact | `redesign/eng-site` |
| The inner pages | **Moved onto `app/site.css`** with every word and the section order kept — /work, both write-ups, the privacy policy and the 404; `app/techwix.css` and `components/techwix` deleted (*Retired 2026-09-16: the Techwix design*) | `redesign/eng-pages` |
| The new routes | /capabilities, /industries, /engineering, /about, /insights and three articles, from `content/engineering.ts`, `content/pages.ts` and `content/insights.ts`; the homepage gains an Insights teaser before the FAQ | `redesign/eng-pages` |
| /about's locations | "Our engineers work across the UK, Malaysia and Bangladesh" (the company line) — never "offices", and no address (SPEC §8b.12) | `redesign/eng-pages` |
| Approved labels that are not "Schedule a Call" | The ghost variant with no `data-cta` (*The inner pages, as built*): the primary fill and `data-cta="schedule"` are Schedule a Call's | `redesign/eng-pages` |
| The 3D hero | A three.js scene over the poster, poster first | 3D wave |
| The contact form | Three fields that open the visitor's email app — mailto, the existing mechanism, no backend | `redesign/eng-site` |
| Cloud's evidence tier | **Core** (repeated work under every project). The spec gives none; this is the conservative reading, for the owner to confirm | `redesign/eng-site` |

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

## Screenshots are pre-encoded (decided 2026-09-16)

Every project screenshot is served from pre-encoded AVIF and WebP files through
`<picture>` (`components/site/ScreenImage.tsx`), never through the Next image
optimizer. The hero poster was already served this way.

**Why.** A long-running `next start` got one optimizer job for a screenshot
stuck: the restaurant-search image at 640px, as AVIF. Every later request for it
then hung. It happened three times, always after a busy stretch. Pages holding
that image never reached "load", and the full suite failed checks 4, 6, 9, 10,
19, 21 and 22 on them. A fresh server from the same build answered every width
in under 150ms. It is a race in the local optimizer; production uses Vercel's
image service and was unaffected. Hiding it, for example by restarting the
server between runs, would break "unsure is a failure". Taking the optimizer
off the path removes the failure for good, and serves the images faster.

**How to add a screenshot.**
1. Put the file in `public/projects/`.
2. Add its path to `SCREENSHOTS` in `scripts/encode-screenshots.mjs`.
3. Run `node scripts/encode-screenshots.mjs`.
4. Commit `public/projects/opt/` and `lib/screenshots.json`.

The script writes 640w plus the full width, capped at 1280. `ScreenImage`
throws on a screenshot that has no encodes, so a missing entry fails the build
rather than falling back to the optimizer. `next/image` remains only in
`components/site/home/Team.tsx`, for the engineers' photos when they are uploaded.
