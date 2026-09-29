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
database: the content is typed files in `/content`. There is no Tailwind.
**three.js is back for one thing only, the homepage hero's scene**, by the
owner's brief of 2026-09-16 (*The hero field*, under Hard rules): imported
dynamically after LCP and load, desktop only, one chunk of at most 180KB
gzipped. It left on 2026-09-15 as the @react-three nebula; it returns as plain
three.js, with no React Three Fiber. **The one animation library is gsap
3.15.0 — core, ScrollTrigger and DrawSVGPlugin — for the Signal motion system
only** (owner, 2026-09-28; *Decided 2026-09-28*): imported dynamically, in
stages, after LCP and load, on a desktop that allows motion; phones, tablets,
Save-Data and reduced motion never request a byte of it (*Motion, as built*).

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
- **gsap arrives** (owner, 2026-09-28; *Decided 2026-09-28*): for the Signal
  motion system only — core, ScrollTrigger and DrawSVGPlugin, under gsap's
  Standard "no charge" licence (commercial use allowed). No `@gsap/react` (its
  `useGSAP` imports gsap statically, into every page's initial JavaScript), no
  SplitText, no Flip, no CustomEase, no ScrollSmoother.
- Package manager: yarn 4 (`packageManager` in package.json), `nodeLinker:
  node-modules` — Turbopack does not support Plug'n'Play. `yarn.lock` is the
  only lockfile.
- Runtime dependencies: `gsap`, `next`, `react`, `react-dom`, `server-only`,
  `three`, `zod`. `three` is pinned exactly (`0.186.0`), and `@types/three` in
  devDependencies matches it (`0.186.0`): bump the two together, and
  re-measure the scene chunk when you do. Only `components/field/scene.ts`
  imports it, and only `components/field/HeroScene.tsx` imports that, dynamically
  — check 31 (`--repo`) fails three.js imported anywhere else, or `scene.ts`
  imported statically. `gsap` is pinned exactly too (`3.15.0`; it ships its own
  types) and re-measured when bumped: only `components/motion/MotionLoader.tsx`
  imports it, and only dynamically (`components/motion/signal.ts` imports its
  types, which are erased) — check 31 fails gsap imported anywhere else, a
  static import, or a second module importing it. Verify-site check 24 fails a
  dependency nothing imports.
- There is no CI. `yarn verify:site` (below) is the check to run before pushing.
- Scripts beside the suite: `scripts/generate-icons.mjs` (the icons, from the
  mark), `scripts/contrast-site.mjs` (the contrast table below),
  `scripts/encode-screenshots.mjs`, `scripts/render-scene-poster.mjs` (the
  hero's poster, from the live scene) and `scripts/probe-scene.mjs` (the
  scene's frames over time: *The hero field*).

## Routes

| route | what it is | content from |
|---|---|---|
| `/` | homepage (`app/page.tsx`), in `site.sectionOrder` — since 2026-09-28 ordered for a buyer deciding whether to hire (*Decided 2026-09-28*): the hero, with the first call's microcopy and a proof line of three shipped products; the engineering stories (`#recent-work`: the two write-ups side by side — on a phone each its outcome and its result — then a Schedule a Call, the restaurant search's three lanes, the proof strip and, since 2026-09-29, TTouch Clothing's client-story band); how we work with you (`#how-we-work`: the terms, the engagement models, the two-week pilot on its trace, the headcount, a Schedule a Call); what we engineer (one ledger row per capability, `#software` … `#cloud`, each with its tiers, linked work, "in depth" and its diagram; on a phone, a Schedule a Call after it); how we build; the industries with delivered work; the Insights teaser; the FAQ (nine questions, four of them the buyer's objections); the final call to action | `content/site.ts` (hero, stories, team size, FAQ, final call to action, navigation, footer), `content/engineering.ts` (capabilities, industries, stages), `content/pages.ts` (how we work's words, /about's), `content/services.ts`, `content/pilot.ts`, `content/projects.ts` (the proof line, the attribution labels, the client story), `content/metrics.ts` (the proof strip), `content/architecture.ts` (the lanes) · static |
| `/contact` | Schedule a Call: the contact panel, the booking calendar (`#schedule`) and a three-field project form that opens the visitor's email app (`#project`) — `app/contact/page.tsx`, built 2026-09-16. From 1025px (2026-09-28) the h1 and the calendar sit side by side, the calendar in the first viewport: on the left the h1, the lead, /about's four terms word for word under "How we work with clients" and the email; on the right the calendar. Below 1025px it is one column in the DOM's order, the calendar straight after the h1. The panel's own Schedule a Call, a jump to a calendar already beside it, went. The form's wrapper is `.bf-contact-project` — it was `.bf-project`, /work's card, whose rule won and rendered the form 203px wide | `content/site.ts`, `contact`; the terms from `content/pages.ts` |
| `/capabilities` | the six capabilities in depth: body, what we build, how we approach it, the evidence tier with its note, the AI capability's labelled figures, linked work, the articles written from it, and each capability's own diagram; the anchors `#software` … `#cloud`, where the homepage's "in depth" links land; then the system map (`#system-map`, moved here from the homepage on 2026-09-28) (`app/capabilities/page.tsx`) | `content/engineering.ts`, `content/pages.ts`, `content/metrics.ts`, `content/insights.ts` · static |
| `/industries` | "Technology we can build for…": each industry's problems, what we'd build, the capabilities it draws on and — only where `content/engineering.ts` records delivered work — where we've built it, in two groups: with delivered work, and without | `content/engineering.ts`, `content/pages.ts` · static |
| `/engineering` | how we build (the homepage's six stages, and the three phases of `content/process.ts`), the stack by layer (SPEC §8b.2), architecture principles each linked to where it is written up, and the verify-before-release discipline | `content/engineering.ts`, `content/process.ts`, `content/pages.ts` · static |
| `/about` | who we are; the team (the Team section: 15+ developers, no one named, no Person node — on the homepage since 2026-09-28 only its headcount, in how we work); where our engineers work; how we work with clients (four terms, the engagement models, the pilot — MOVES.md's items word for word); what we won't do | `content/pages.ts`, `content/site.ts` (team), `content/services.ts`, `content/pilot.ts` · static |
| `/insights` | the index of the articles | `content/insights.ts`, `content/pages.ts` · static |
| `/insights/[slug]` | an article (`generateStaticParams`, `dynamicParams = false`): the sections in reading order, code in Barlow 500, each "diagram" an ordered flow, related work; Article JSON-LD | `content/insights.ts` · SSG |
| `/work` | every approved project, labelled by who built it: the write-ups, Bolt Fusion projects (with TTouch Clothing's four systems as a client story, `#ttouch-clothing`, since 2026-09-29), in-house products and our engineers' track record (`app/work/page.tsx`; *Projects and attribution*) | `/content/projects.ts` |
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
  proof strip, the restaurant story's lanes, the client-story band) and
  `lib/structured-data.ts`. `projects.ts` also holds the client stories
  (`clientStories`, 2026-09-29: a title and an intro; its members are computed
  from `client`, never stored) and refuses one with fewer than two members, a
  count in its words that is not its member count, or "live" said of a set
  whose members are not all live (the gate's RUN 3, cases h–j).
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
| `project` | a Bolt Fusion delivery: FanLock, Balanzify, Go Style Business, and TTouch Clothing's four systems — Delivery Lens BD, TTouch Wholesale, Sudarshini, TTouch Employee Verification (2026-09-29) | "Delivered project: built by Bolt Fusion [for ‹client›]" | the live product, or none | a real screenshot of the live site |
| `project`, `scope: "features"` | features Bolt Fusion built inside an app another company owns: Bazzile (Bazzile Technology SA), GodConnect Online (GodConnect LTD) | "Delivered project: features built by Bolt Fusion for ‹client›" — never "built by Bolt Fusion" | its store listings | **none** — the app's UI is the client's |
| `in-house` | a product we built for ourselves: OPAL | "In-house product: our own, not built for a client" | the live product, or none | a real screenshot of the live site |
| `track-record` | work one of our engineers shipped at a previous employer: Go Smart (Brain Station 23); NIdle Finishing (Intellier) is held back (below) | "Track record: built by our engineer at ‹employer›, not by Bolt Fusion" | store listings and public proof | **none** — the product is someone else's |

- **Never present an employer's product as ours.** A track-record project names
  its employer (`builtAt`) and the engineer's role (`role`), and the schema
  (`content/schema.ts`) refuses one without them — or with a client, a
  screenshot or metrics. It is never called our client and carries no
  confidential detail.
- **A product another company owns is "built by Bolt Fusion for …", never
  ours:** WarmChats belongs to WarmChats, Inc., Balanzify to Balanzify Inc.,
  and the four TTouch systems to TTouch Clothing (`client`).
- **TTouch Clothing's four systems (owner, 2026-09-29; *Decided 2026-09-29*).**
  Delivery Lens BD (a courier-risk web app for online sellers), TTouch
  Wholesale (an approval-based wholesale portal and its back office),
  Sudarshini (the store of TTouch's saree brand) and TTouch Employee
  Verification (a public check and an HR back office). All four are full
  builds — design, app, backend and database — by Bolt Fusion as an outside
  vendor, so each card reads "Delivered project: built by Bolt Fusion for
  TTouch Clothing", the client byte-identical on all four (check 9 compares
  the whole label). **The owner's word is the only source:** no repository,
  commit or document for any of them is on this machine (searched
  2026-09-29), so no date, duration, team size or database is stated, and
  every summary and role says only what the public sites show and what the
  owner said. The stack tags are the public fingerprints in the evidenced
  stack words (React, Next.js, Node.js, Django, REST) and name no database. No
  figures: the sites' counters, catalogue sizes and speed and accuracy claims
  are TTouch's, and check 30's `ttouch-cuts` set fails them — and the
  demo's phone numbers, the API's hidden fields and "came back" — on `/` and
  /work. All four link to their live sites; the employee portal's link is the
  owner's choice ("It already has a rate limit / protection" — his
  statement, not verified). **The credit caveat:** the four sites' footers
  credit "TTouch Clothing (IT Department)", and none mentions Bolt Fusion.
  Never say a Bolt Fusion credit exists on them; the owner is asking TTouch
  to add one.
- **A client story (2026-09-29)** is one client's product projects shown
  together: `clientStories` in `content/projects.ts` holds its anchor, title
  and intro, and its members are computed — every published product project
  whose `client` is the story's, byte for byte. On /work it is a sub-group of
  Bolt Fusion projects under its own h3; on the homepage, a band in the proof
  (below). The build refuses a story with fewer than two members, a count in
  its title or intro that is not its member count ("Four systems" cannot
  outlive a fifth card), and "live" said of a set whose members are not all
  live. It says "Four systems for TTouch Clothing", never "came back for
  four": that would claim separate engagements the owner has not stated.
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
  (its only public page) and OPAL's shop (its hero collage shows faces). The
  four TTouch systems (2026-09-29) are public pages only, captured with every
  non-GET request, the Meta Pixel and the Cloudflare beacon blocked, never a
  login and never a typed field: Delivery Lens BD's homepage with its demo
  settled on TTouch's own published number (never a frame with the demo's
  other two numbers), TTouch Wholesale's public catalogue (no prices, no
  images), TTouch Employee Verification's empty verify page (never a result),
  and — since every storefront view of Sudarshini shows the brand's model —
  a product page's details panel, cropped from a 1440×900 capture at DPR 3 and
  scaled to 1440×900, with the product photograph and the random "N people are
  viewing" line outside the crop (the owner: "a view with no face", picked or
  cropped). Never a
  mockup: OPAL's old AI-generated asset, banned by PLAN.md, was deleted on
  2026-09-16.
- **/work is four sections,** one per kind, in `projectSections` order. The
  track-record section says what it means: "Work our engineers shipped at
  previous employers — credited to them, not claimed as ours." Inside Bolt
  Fusion projects the product cards come first. Under them each client story
  is a sub-group (`.bf-subgroup--client`, anchored at its id,
  `/work#ttouch-clothing`): the eyebrow "Client story", its h3 and its intro —
  beside the h3 from 1025px — over its members' cards, two across, with h4
  names. Under that is a sub-group headed
  by its own h3, "Features we shipped into other companies’ apps", whose cards
  have h4 names so the outline nests. Every card carries its project's id, so
  evidence links land on the card itself (`/work#sudarshini`). Every grid, that one included, fills
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
  check. Delivery Lens BD replaces Go Style Business there only after TTouch
  fixes its demo's phone numbers and adds a privacy policy and terms (owner,
  2026-09-29). After the proof strip, each client story is a band — TTouch
  Clothing's label, the story's h3, the four names (each linking to the live
  system) over their taglines, and "See the four systems" to
  `/work#ttouch-clothing`, the count from the data; text only, since a
  screenshot off a /work card must link to a write-up (check 9) and the
  homepage's weight is budgeted (check 29). Check 9 reads the band
  (`[data-client-story]`): its label must be the kind's words for its client,
  where a reader can see it, and it must name every published product
  project of that client and nothing else. "See all work (N projects)" counts
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
  system map and, from the 3D wave, the hero scene — and **never in the Lab
  drawing** (robotics), on any profile: nothing flows in a system that has not
  shipped (2026-09-29, check 33). **Green and amber mean a
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
  its own (`#hero ~ .bf-section`): 56 / 64 / 80px of padding (phone / tablet /
  desktop; DECISIONS' 64–80px is the desktop's, in place of its uniform 128),
  with more air — 88 / 104 / 128px — only above a chapter (how we work, what
  we engineer, the close); the proof follows the hero with no hairline between
  them (that full-width rule read as the first screen's floor), so its heading
  crosses the 900px fold. A ruled block that ends a section (the ledger, the
  industries row) draws no bottom rule: the next section's hairline is its
  floor, where a rule of its own drew two floors 80px apart.
- **The hero's first screen (2026-09-28), measured.** At 1440x900 the proof
  line is at 585–677px and the first write-up at 913. Below 1025px the field
  sits above the text (SPEC §7) as a band — it was 4:3 and 16:9, and took the
  whole first screen at 1024x768 (the h1 at 701px) — and the poster is
  contained in it like everywhere else (*The hero field*), so the band's height
  is the scene's size: the frame is drawn at that height and 1.18 times as
  wide. **The band takes what the first screen leaves** (the merge,
  2026-09-29): `clamp(160px, max(22vh, 100svh - 658px), 260px)` on a phone and
  `clamp(260px, max(40vh, 100svh - 600px), 560px)` at 768–1024 — never less
  than the 22vh and 40vh the fold was first measured with, more where the
  text leaves room (658 and 600px are the text's height under the band at 390
  and 768), and at most 260px on a phone and 560, the frame's own height, on a
  tablet, so the poster is never drawn over 660px wide (`sizes`, H4); each
  after a fallback without `svh`. Measured: 186px at 390x844 (drawn 219 wide),
  179 at 375x812, 163 at 360x740, 160 at 390x664, 257 at 412x915 (was 188,
  drawn 303 wide), 424 at 768x1024 (drawn 500), the whole 660x560 frame at
  820x1180 and 1024x1366 (was 420), and 307 at 1024x768 (drawn 362). Contained
  in IA's first band — sized for `cover` — the scene was drawn at most 222px
  wide on any phone and 495 on any tablet; `probe-scene` (poster) reads the
  16px band as ground at 390, 768 and 1024, the nearest lit pixel 23px from
  the band's top at 390 and 37 at 1024. The pause control keeps
  its place under the field's right edge and the headline's first line
  ("Build") rises into that row beside it (`margin-bottom: -56px` on
  `.bf-hero__media`, only where the control is laid out — never under reduced
  motion); the proof line's three items sit in one row at every width, each a
  44px link over its client. Measured: at 390x844 the h1 at 289, Schedule a
  Call at 584 and the whole proof line at 745–832 — inside the first screen;
  at 412x915 by 823 and at 768x1024 by 1003 (both 10px lower under reduced
  motion, still inside); at 375x812 the names, their clients just
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
  on `.dg-flow` only. **The machine loop is the Lab drawing and carries no
  flow** (2026-09-29, the lead designer under the owner's honesty rule): its
  five connections are dashed steel edges with steel arrowheads, it has no
  `.dg-flow` and no flow arrowhead in its `<defs>` (`<Svg flow={false}>`), so
  there is no cyan in its markup at all, on any profile. Labels are 15–17 units on a 480-unit drawing, legible at a
  phone's width at full size. **In the homepage's ledger (2026-09-28)** each is
  drawn at a compact size, measured: beside its row in a 440px column from
  1280px (the drawing 422px wide, labels 12.3–15.8px) and 420px at 1025–1279
  (402px, 11.7–15.1px), up to 440px under it at 768–1024 (414px,
  12.1–15.5px) — and not at all below 768px, where its labels would fall under
  13px: each row links to its diagram on /capabilities, and robotics'
  "Concept — not a shipped system" becomes a concept tag beside its Lab chip.
- **The homepage's ledgers (2026-09-28).** *What we engineer* is one ruled row
  per capability (`.bf-cap6`: the number, the name, the job, every tier with
  its scope, robotics' honesty line, the linked work, "in depth", the diagram);
  on a phone it ends in a primary Schedule a Call (`.bf-ledger6__cta`, not
  shown from 768px, where the header carries one — the merge, 2026-09-29).
  *How we work* is a spec sheet (`.bf-hww`): the head beside the headcount, the
  four terms on one ruled row, the engagement models as a table beside the
  lines under it, and the pilot on its own surface plate, its three stations on
  the `pilot` trace (`[data-bf-trace="pilot"]`: one `svg.bf-trace` with its
  `.bf-trace__path` drawn complete in a steel hairline from the first
  station's marker to the last's, and the stations `[data-bf-trace-stop]`; the
  Signal traces it, and a station it has reached fills brand blue, as the
  rail's markers do — `.bf-hww__station[data-bf-lit]::before`, the hook
  owner's CSS; below 768px the stations stack down the list's own
  rule; each station's words start with a capital, set by CSS — the weeks are
  lower-case fragments in `content/pilot.ts`). The *industries* are a ruled
  grid on shared rows (`grid-template-rows: subgrid`), so a name that wraps
  moves every cell's "Where we've built it" with it — one row of five until
  2026-09-29, two rows of three since Logistics made six; the grid rules are
  scoped to the homepage's section (`.bf-inds-sec`), because /industries lists
  its rows in a `.bf-inds` too, and they had laid its industries out five to a
  row. *The engineering stories* (`#recent-work`) are the pair of write-ups — on
  a phone each is its outcome and its result, the problem, the system and the
  engineering staying in the served HTML for the write-up to tell — then the
  section's Schedule a Call, then the lanes band and the proof strip, whose
  four figures are ruled rows on a phone, not boxed cards, then the
  client-story band (`.bf-clientband`, 2026-09-29): TTouch Clothing's label
  over the story's h3, "See the four systems" to `/work#ttouch-clothing`
  beside them from 1025px, and one ruled row of the four names over their
  taglines — four across from 1025px, two from 768px, one on phones — each
  name a 44px link to the live system, set as the hero's proof line is. Text
  only: no screenshot on the homepage.
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
  DOM in the phone's order). The calendar's heading stands alone: its blurb,
  "Or grab an open slot below…", answered the panel's own Schedule a Call,
  which went that day, and was cut. The project form sits under both, at
  least 480px wide at 1440 (check 32).
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
  work's spec sheet), `.bf-inds` (a ruled grid), `.bf-clientband` (a client
  story on the homepage), `.bf-subgroup` / `.bf-subgroup--client` (/work's
  sub-groups), `.bf-stages` (a rail), `.bf-strata`,
  `.bf-build`, `.bf-evidence`, `.bf-honesty`, `.bf-concept`, `.bf-cap__plate`,
  `.bf-pagehead` (a page's h1 block), `.bf-prose` (an article, the privacy
  policy), `.bf-form` / `.bf-field`, the `data-bf-reveal` / `data-bf-flow`
  hooks of `components/site/SiteMotion`, and the `[data-bf-trace]` hook the
  motion stream traces (the pilot's, in how we work). `.bf-index` (the old
  "What we engineer" grid) and `.bf-ledger` (the old homepage industries) went
  with their sections on 2026-09-28.
- **Lib:** `lib/page-meta.ts` (`pageMetadata`: the title, description,
  canonical and share card an inner page needs), `lib/work-links.ts`
  (`workLink`: where a linked project is shown — a write-up, or since 2026-09-29
  the project's own card, `/work#<id>`), `lib/dates.ts` (`longDate`),
  and `articleLd` beside the rest in `lib/structured-data.ts`.

### The inner pages, as built (2026-09-16)

Every inner page is a page head (`PageHead`, the one h1), full-bleed sections
divided by hairlines, and a closing call to action — the homepage's `FinalCta`
on the new pages, `CtaBand` carrying the page's own approved words on /work and
the write-ups — then the footer. No light bands, no navy panels.

| page | sections, in order |
|---|---|
| `/capabilities` | page head with the tier legend · a contents row (each capability with its glyph and tier) · six capability sections (`#software` … `#cloud`): eyebrow, h2, body, robotics' honesty line (`data-honesty`), what we build (a tier chip where an item's evidence differs), how we approach it ("How we'd approach it" for Lab), evidence (the tiers, the note, the AI capability's three figures in `[data-metric]` rows, linked work, the articles written from it), and its own diagram beside the text, captioned (robotics: "Concept — not a shipped system") and described · the system map (since 2026-09-28; it was the homepage's): the map beside its lists of parts, connections and worked flows · final call to action |
| `/industries` | page head · "Industries with delivered work." (restaurants, retail, real estate, HR, salons and, since 2026-09-29, logistics: the problems, what we'd build, what it draws on, where we've built it) · "No delivered work here yet." (healthcare, education, enterprise operations, startups: no evidence cell) · final call to action |
| `/engineering` | page head · how we build (the homepage's stages rail) · in practice (the three phases of `content/process.ts`, each naming its stages) · the stack by layer (the homepage's strata) · architecture principles (eight, each linked to its write-up or article) · verify before release (what the suite fails on, with no number; what the build refuses) · final call to action |
| `/about` | page head (the company line, the canonical description) · who we are · the team (the homepage's section) · where our engineers work · how we work with clients (the tagline, four terms, the engagement models table, the line under it, the operating detail, the pilot and its button) · what we won't do · final call to action |
| `/insights` | page head · the articles as a ledger (date, author, title, dek, capabilities) · final call to action |
| `/insights/[slug]` | page head (back link, h1, dek, author, date) · the sections in reading order, beside related work, capabilities and more insights · final call to action |
| `/work` | page head (the title, its two leads) · case studies (rows: the screenshot beside the label, name, summary, facts, figures, stack, links and "Read the write-up") · Bolt Fusion projects (three cards, then the client story — "Four systems for TTouch Clothing", an eyebrow, h3 and intro over four h4 cards, two across, at `#ttouch-clothing` — then the feature-work sub-group, an h3 over two h4 cards) · in-house products (one card, its screenshot beside its text) · our engineers' track record (one text card: Go Smart; NIdle Finishing is held back) · the closing call to action |
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
  `data-project-kind` (`-scope`, `-id`), and since 2026-09-29 carrying its
  project's `id`; its `[data-attribution]` label, in the
  brand blue, is directly followed by its name (an h3, or an h4 under a
  sub-group's h3 — the client story's or the feature work's); `data-role`, `data-built-at` and
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
  title (72px) larger than the h1 (66px). Now three **chapter heads** — how
  we work, what we engineer and the close (`.bf-head--chapter`, and
  `.bf-final__title`) — are 36 / 48px on a phone and a tablet and
  `clamp(48px, 4.4vw, 64px)` from 1025: 63px at 1440, 56 from 1273, and always
  under the h1 (`clamp(52px, 4.6vw, 68px)`), so below 1273px they follow it
  down rather than hold DECISIONS' 56 above it (48px at 1025, where the h1 is
  52). Every other h2 on the homepage is 28 / 34 / 40px — the proof's too
  ("Two products, two write-ups."): it shares the first screen with the h1 at
  1440, and as a 60px chapter head it read as a second headline. The final
  call to action's title is `clamp(40px, 4.4vw, 60px)` on every page, never
  above that page's h1. Inner pages keep 48px h2s.
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
hover and focus states, and — since 2026-09-28 — **Signal**, the site's own
motion system, in three verbs: a connection TRACES in brand blue, data FLOWS
along it in cyan, then everything SETTLES and holds still (owner, 2026-09-28;
BRIEF §4; *Decided 2026-09-28*) — a diagram in the state the server sent, and,
since 2026-09-29, a hook LIT where its trace reached it: its stations filled
and its line brand blue, which only adds to the server's drawing (below, *The
hooks*). BRIEF §4 said every sequence settles to the server state; for the
hooks that made every payoff a blink (the design review). It is one idea
used at every scale, and it carries the argument — how Bolt Fusion builds —
without delaying reading. Transform, opacity and SVG strokes only. Everything is
off under reduced motion, and anything that moves for more than five seconds
has a pause control.

- **The reveal** (`components/site/SiteMotion.tsx`): an element marked
  `data-bf-reveal` that is still below the fold after hydration gets
  `.bf-revealed` when it enters the viewport — a 20px rise and fade over 0.8s,
  `fill-mode: none`. Nothing is hidden in the server HTML, and focus ends a
  reveal (A2). "Below the fold" is the IntersectionObserver's own first
  report (2026-09-29), not a position read when the effect runs, which after
  a client-side navigation can be the old page's.
- **A client-side navigation starts the new page at its top, at once**
  (2026-09-29): `<html data-scroll-behavior="smooth">` (`app/layout.tsx`)
  is how Next 16 knows to turn the stylesheet's smooth scrolling off for a
  route change (a same-page anchor still scrolls smoothly). Without it the
  header's logo, followed from the bottom of /capabilities, smooth-scrolled
  the new page up from 10201 to 0 over about 27 frames while the reader
  watched, and SiteMotion measured every reveal at that stale offset: 0 of 39
  ran, against 37 on a fresh load (the engineering review). The page's
  `SiteShell` mounts anew on a route change, so SiteMotion and the Signal's
  loader start again on the new page and scan it — trigger counts per page
  the same on every visit. Verify-site check 34 holds it.
- **The diagram flow:** a diagram marked `data-bf-flow` gets `.bf-flowing` once
  35% of it is in view, and its cyan `.dg-flow` paths run three 1.6s passes —
  under five seconds, so it needs no pause control (WCAG 2.2.2) — then rest.
  That is the whole flow everywhere the Signal does not run, and on a desktop
  until gsap has arrived. Where the Signal runs, a diagram still ahead of the
  reader is traced first and then flows for **two** passes, not three (the
  flow takes over 0.96s in, so 0.96 + 2 x 1.6 = 4.2s, still under five
  seconds): the engine claims it with
  `data-bf-motion="gsap"` at run time, SiteMotion skips a claimed diagram, and
  `[data-bf-motion="gsap"].bf-flowing .dg-flow` runs two iterations. A claim is
  made at run time, not in the server HTML, so a desktop where gsap never
  arrives keeps the CSS flow, and a claim the engine gives back (its gate
  stopped holding) flows here when next seen. The one exception is the Lab
  drawing, which never flows in the Signal's media, claimed or not (below).
- **The Signal** (`components/motion/`; owner, 2026-09-28). CSS keeps the block
  reveal and the flow for everyone; gsap owns only the trace overlays, the
  trace-to-flow handoff and the `[data-bf-trace]` hooks (the delivery rail, the
  final call to action's line) — one owner per element.
  - **The loader** (`MotionLoader.tsx`, rendered by `SiteShell` on every page,
    renders nothing) is the ONE module that imports gsap, always dynamically.
    Its gate is checked before any import: `(min-width: 1025px) and (pointer:
    fine) and (prefers-reduced-motion: no-preference)` with Save-Data off, and a
    page with nothing to trace (no `[data-bf-flow]` or `[data-bf-trace]` outside
    the hero — /work and its write-ups, /contact, /privacy-policy, the 404)
    imports nothing. Its stages, each a task of its own: the first
    LCP entry AND the load event, then a macrotask (the browser reports no LCP
    after the reader's first key, press or scroll, so that input stands in for
    the entry, and one made before hydration — which no listener sees — is
    covered by giving up on the entry 3s after load: measured, a wheel 15ms
    into the load and neither the scene nor the Signal ever started — the
    scene had no stand-ins until 2026-09-29, and now shares this wait,
    `components/motion/lcp.ts`); then the scene's
    `data-scene-ready` or 3s (a desktop whose WebGL context is refused never
    gets the attribute; a page with no hero field skips it); then an idle
    callback (a 300ms timeout where `requestIdleCallback` is missing) — the
    first scroll cuts those two short, never the load wait; then gsap core ·
    yield · ScrollTrigger · yield · `registerPlugin` · yield · DrawSVGPlugin ·
    yield · the engine · yield · start. The gate is watched live: the engine
    builds inside `gsap.matchMedia(gate)`, which reverts everything when a
    media condition stops holding and rebuilds when it holds again; Save-Data
    switched on stops it in the loader. A failed import leaves the page as
    the server sent it. `<html data-bf-signal="live">` while it runs.
  - **The engine** (`signal.ts`, gsap passed in, so it imports only gsap's
    types) arms each host in page order, one per task, and only a host whose
    trigger is still ahead: a diagram when its centre reaches 70% of the
    viewport's height, where the reader's eye is, a hook when its top
    does, once it has stayed in view 150ms (a
    fly-past spends nothing). A diagram started once 35% of it was in view
    until 2026-09-29: at 1440x900 the software drawing began tracing with its
    top at 779 of 900 (121px of its 335 on screen), AI at 739, ERP at 688, and
    a trace that is over in 1.16s ran mostly below the fold (the design
    review). Filmed since on fresh 1440 pages read down at reading speed:
    every ledger diagram on / starts wholly in view, its centre at 63-66% of
    the viewport (its top at 397-430); on /capabilities at 60-69%, 98-100%
    in view. A trigger's range ends when the host has left the
    top of the viewport — for the sticky capability figures, when their
    column's bottom carries them off, not where their static box would be (a
    reader landing in the stuck stretch would otherwise look at a claimed
    diagram that neither traces nor flows). Nothing is created before its
    trigger, and nothing in `#hero` is ever touched. Every tween is on an
    overlay it adds and removes: **the originals are never animated** (DrawSVG
    would overwrite their dash patterns — `.dg-flow`'s `4 12` read `120px,
    80.1px` when measured). No pins, no scrub on text, no smooth scroll.
    The triggers re-measure when fonts finish loading and on a
    150ms-debounced ResizeObserver of `main#main` (the FAQ's `<details>`), and
    on nothing else of ours — **each trigger on its own**
    (`ScrollTrigger.getAll()` → `refresh()`, then `ScrollTrigger.update()`),
    never `ScrollTrigger.refresh()`. A full refresh scrolls the page to the top
    to measure and puts it back, which cancels a smooth scroll in flight:
    following `#faq` while main grew 40px, 120ms in, left the reader at
    2473–4349 with the FAQ still 13–15k px below; `refresh(true)` reached
    16308–16670; per trigger it lands on 17777, the same as with gsap blocked
    (3 of 3). None of these triggers pins or scrubs, so re-reading each start
    and end is all a refresh would do; a probe that prepends 3000px to main
    and then scrolls to the first diagram's new place sees it trace there
    (and not, with the ResizeObserver stubbed out).
  - **Three things ScrollTrigger does to the page, undone in the engine.** It
    forgets the page's scroll position when the last trigger on it is killed,
    and a media change then refreshes from the top: when the gate stopped
    holding (a window narrowed to 1000px) the revert killed every trigger and
    threw the reader to scrollY 0 (measured 2883 → 0; main stays at 2883). One
    idle trigger lives as long as the engine and keeps the position (with it,
    2883, 12000 and 7000 are each kept exactly across 1440 → 1000 or 1024 →
    1440). And each refresh writes `scroll-behavior:
    smooth` back INLINE on `<html>`, which would outlive the stylesheet's own
    guard (smooth only under no-preference motion) once reduced motion is
    asked for; the engine removes it after each refresh. And it runs a
    `requestAnimationFrame` loop of its own (`_rafBugFix`, a Firefox repaint
    workaround) for as long as it is enabled, with triggers or without: about
    62 wake-ups a second, which ran on after the engine had stopped — 64-67 a
    second on /work after a client-side navigation there (the engineering
    review, 2026-09-29). The engine's stop now calls `ScrollTrigger.disable()`
    and the next start `enable()`: measured, 0 a second on /work after
    /engineering, and the triggers the same on every return. While the engine
    runs, the loop is gsap's documented behaviour and stays (about 60 a
    second on an idle /capabilities). `enable()` registers three gsap media
    listeners and one orientation context again each time — gsap's own, one
    set more per return to a page with something to trace. Check 34 holds
    the teardown (`/engineering → /work`).
  - **Trace → flow, on every `[data-bf-flow]` diagram** (/, /capabilities):
    each `.dg-edge` is cloned into a brand-blue 2px overlay with butt caps,
    placed just under its cyan `.dg-flow` twin so nothing on screen is covered,
    and drawn in topology order — edges levelled breadth-first from the nodes
    no edge enters, so in the AI router the router traces before the model —
    800ms each, `power2.inOut`, 60ms apart and the whole stagger at most 360ms
    (the nine spokes of the ERP ring close up to 45ms); the overlays fade over
    300ms and the flow takes over for two passes. A dashed edge is traced
    dashed, through a mask DrawSVG draws.
  - **The Lab sketch:** a concept drawing (`.dg-node--concept`, robotics) does
    not flow, on any profile — nothing flows in a system that has not
    shipped. A light-steel pencil (`--bf-soft`, 1.5px, dashed `5 4` — lighter
    than the drawing's own `--bf-steel`, or it would draw steel over steel and
    nobody would see it pass; never blue, never cyan) goes round the loop over
    the drawing, each concept box and then the edge leaving it, at one speed,
    1.4s in all, and fades. The evidence tier, shown in behaviour. **The "no
    flow" is the drawing's own** (2026-09-29, the merge; the lead designer's
    decision under the owner's honesty rule): the machine loop carries no
    `.dg-flow` at all, only dashed steel edges with steel arrowheads, so
    nothing can flow on it however the reader arrives — before or without
    gsap, after a reload in place or a deep link to `#robotics`, and on phones
    and touch screens, which until the merge kept the CSS cyan flow on it (4 of
    4 lines at 390 and 1366x1024 touch; the motion stream's CSS rule held it
    still only in the Signal's own media, and is gone). Check 33 watches it on
    fresh pages at 1440, 1180x820 touch and 390 (*Verify before pushing*).
  - **The hooks, `[data-bf-trace="<name>"]`:** a container holding one
    `<svg class="bf-trace" aria-hidden="true" focusable="false">` of
    `.bf-trace__path` lines or paths drawn COMPLETE in the server HTML — a
    `--bf-line-strong` hairline by default, at zero specificity
    (`:where(.bf-trace__path)`), so each hook's owner styles its own drawing
    whatever order the streams' CSS blocks merge in — with optional stations
    `[data-bf-trace-stop]`, in order: an SVG `rect.bf-trace__stop` (the stage
    marker's hollow square, drawn `crispEdges`) or any element, like the
    rail's stages and the pilot's `<li>`s. Without script it is a finished
    drawing. The engine traces the paths in order as one head (`power2.inOut`)
    and gives each station `data-bf-lit` from the moment the head reaches it,
    and it KEEPS it: **the settled state is the lit one** (2026-09-29). The
    trace holds 0.4s where it arrived, then the host takes `data-bf-traced` —
    its own line turns brand blue, the same width
    (`[data-bf-trace][data-bf-traced] .bf-trace__path`) — and the 2px overlay
    fades onto it over 0.6s. Until then the stations went hollow and the
    overlay faded 0.15s after arrival: filmed on a fresh 1440 page, the pilot's
    three lit for about 0.3s, the rail's six went dark together 0.57s after
    the last lit, and the close's one station was lit for 267ms (the design
    review). Reached where the trace first touches the
    station's box, or, for one the line only passes beside, at its nearest
    point; sampled on screen every 2px, so a stretched `viewBox` with a
    non-scaling stroke measures what is drawn (probed on a copy of the IA
    stream's pilot markup: its three stations lit in turn). A station is
    measured where the layout puts it: a translation on it or an ancestor
    inside the host that the drawing does not share (a reveal still rising)
    is taken back out. An overlay keeps its source's `shape-rendering`, so a
    hairline on the pixel grid is traced on it. An SVG station fills in the
    200ms `state` time; how an HTML station shows `data-bf-lit` is its owner's
    CSS. Any name works: `rail` 1.2s, `pilot` 1.2s, `cta` 0.9s, anything else
    1.2s. A sequence ended early (focus, the pause control) or one that would
    start in either state lands on the same end: the hook lit. When the gate
    stops holding (a window narrowed below 1025, reduced motion switched on)
    every lit hook goes back to the server's drawing, and is lit again, with
    no trace, if the gate holds again. Verify-site check 35 reads it.
    - `rail` (`HowWeBuild.tsx`, on / and /engineering, >=1025): one hairline
      (`crispEdges`) over the six stages, which give their top borders to it
      and keep their space, and the stages themselves are the stations
      (`li.bf-stage[data-bf-trace-stop]`), shown by each stage's own square
      marker (`.bf-stage::before`), filled brand blue while lit — the drawing
      the page always had. So the stations sit wherever the grid puts each
      column, whatever the grid does, and snap to whole pixels. The first
      version drew six SVG squares at i/6 of the rail: at DPR 1 four of the
      six spread their 1px edge over two pixels at a third of the brand's
      strength (the CSS squares are one full-strength pixel at 1100, 1439,
      1440 and 1920), and a column gap would have moved every one of them
      silently. The rail holds still: each stage's reveal is on its text
      (`.bf-stage__body`), never on its border or marker, at every width. The
      trace runs left to right, lighting the six stations in turn (sampled
      per frame at 1440: 0, 398, 516, 582, 666, 766ms), and settles lit: six
      filled markers on a brand-blue line (2026-09-29; it went back to hollow
      until then). Below 1025 the borders and markers are the rail, as they
      always were.
    - `cta` (`FinalCta.tsx`, on / and every page that ends with it —
      /capabilities, /industries, /engineering, /about, /insights and each
      article; >=1025): the buttons' row is the hook, and since 2026-09-29 it
      is as wide as the buttons (`width: fit-content`). A hairline 18px above
      them (half their 36px margin) runs from the second button's far edge to
      Schedule a Call's first edge and turns down into its top-left corner:
      the button itself is the station (`Cta traceStop`, its
      `data-bf-trace-stop`). The trace runs right to left over both buttons
      and down; reached, Schedule a Call's top edge turns brand blue — its
      border was transparent, so nothing moves — and stays so, with the line:
      the last trace on the page ends on the one action that matters. Until
      then the line ran the column's full width (1,300px at 1440) into an 8px
      square above the button: the trace crossed 1,100px of empty space,
      pointed away from the button for most of its travel, and its station was
      lit for 267ms (the design review). The buttons never move.
    - `pilot` (`HowWeWork.tsx`, on /, >=1025): the IA stream's hook inside
      how we work, a steel hairline from Week 1's square to the
      Deliverable's, over the three stations (`li.bf-hww__station`). The
      trace runs left to right and each square fills brand blue while it is
      lit (`.bf-hww__station[data-bf-lit]::before`, in the `state` time; the
      Deliverable's square is filled at rest, and the trace ends in it).
      Proven at the merge (2026-09-29) on a fresh, unscrolled 1440 page
      scrolled to it at reading speed: the overlay appeared when the plan
      reached 70% of the viewport, Week 1, Week 2 and the Deliverable lit at
      0, 584 and 1000ms, all three went hollow at 1.35s and the overlay was
      gone at 1.65s. Since 2026-09-29 they stay lit: filmed the same way (a
      burst every ~130ms), the three lit at 0, ~530 and ~940ms of the burst,
      the overlay gone by ~2.1s, and the plan at rest traced — three filled
      squares on a brand-blue line.
  - **The rules it keeps** (BRIEF §4.4): the resting state is the server HTML,
    or for a hook the server HTML lit (its stations filled, its line brand
    blue — additive, since 2026-09-29);
    text never moves, reverses or exits; numbers, chips and tier meters never
    move; nothing in the hero animates; every entry-bound sequence ends within
    5s (a diagram's trace and flow ends 4.2s after it starts: the last edge is
    drawn at 1.16s, the flow takes over at 0.96s for 2 x 1.6s; the Lab sketch
    1.8s; a hook 2.2s — its trace, a 0.4s hold and a 0.6s fade); **focus ends a sequence**
    (focus inside the host's section, or a sequence that would start with focus
    there, starts at its end); **the pause control ends them too** —
    `html[data-motion="paused"]` or `bf:motion` with `{ paused: true }` finishes
    every running sequence, and a new one starts at its end — a diagram the
    server's drawing, a hook lit.
  - **Tokens** (BRIEF §4.3): `response` 120–160ms and `state` 200ms (CSS);
    `trace` 800ms per edge, `power2.inOut`, 60ms stagger, 360ms ceiling, 300ms
    fade; a hook's trace 1.2s (`cta` 0.9s), a 400ms hold and a 600ms fade onto
    its lit line; `flow` linear 1.6s a pass, two after a trace, three without;
    `lab` 1.4s, steel, no flow.
- **The system map:** a lit link's cyan pulse runs four 1.2s passes and rests;
  the other parts dim with a 0.2s opacity change.
- **Hero field (homepage): a three.js scene over a poster of it** (2026-09-16,
  the owner's brief; engineering SPEC §7, "Many technologies. One engineering
  system."; its v2, 2026-09-28, *Decided 2026-09-28*). An engineering core of
  stacked, chamfered octagonal plates in machined graphite, each lit by a thin
  brand-blue seam, turning slowly. Seven modules sit on two swaying tiers, each
  a distinct form with no text: on the inner tier web (a thin panel), mobile (a
  slim slab), AI (a wireframe icosahedron) and cloud (a torus ring), across the
  back and the sides above the core; on the outer tier ERP (stacked blocks),
  POS (a terminal block) and robotics (an articulated two-segment arm), around
  the front of the floor. Thin links, about 1.75px, run from the core to
  each module, with cyan comets carrying data along them, over an
  architectural grid floor that fades into the ground. **Robotics is Lab work
  and is drawn as Lab:** the same arm as a steel (`#6b7385`) wireframe, on a
  dashed steel link, and no comet ever travels to it — "concept, not
  delivered", in the site's own convention (the dashed Lab chip), without a
  word. Hemisphere, key and rim lights, MeshStandardMaterial, no
  post-processing, no bloom and no textures. **The graphite's light is an
  analytic studio:** a dark floor, a cool sky and one long softbox, computed in
  the fragment shader from the reflected direction (`onBeforeCompile`) and fed
  through three.js's own EnvironmentBRDF, plus a thin brand-blue fresnel rim —
  so the metal has something to reflect with no environment map, no PMREM and
  no texture. Before it, metal with nothing to reflect (three.js scales a
  metal's diffuse by 1 − metalness) could only ever be dark: about 95% of the
  field sat under luminance 32. Graphite, one brand blue on edges, cyan only on
  the data flow, steel only on Lab work.
  - `components/field/scene.ts` is the scene; `components/field/HeroScene.tsx`
    loads it (*The hero field*, under Hard rules, for when and how).
  - **Motion:** the plates turn slowly, and the two tiers SWAY together
    (2026-09-29): one sway every 48 seconds, the inner tier 17 degrees either
    way of its slots and the outer 12.6, at its fastest through t = 0, so the
    scene moves from its first frame. The slots are the poster's layout and
    the centre of the sway, and the front of the inner orbit is left open. So
    every module keeps its own part of the frame and nothing ever crosses the
    core, the Lab robot or another module: `scripts/probe-scene.mjs` (overlap)
    projects every part of every object through the camera every 0.25s over
    seven sways, at rest and at the four parallax extremes, assembled and
    fully open, and fails a module in front of the core within 12px of it,
    anything within 12px of the robot and two modules within 8px (measured:
    15.0px robot to core, 14.8px AI to cloud, 22.8px web to mobile). **The
    tiers orbited until 2026-09-29, and from this camera an orbit cannot stay
    clear**: the outer ring's back arc projects onto the core's top edge, so
    ERP, POS and the robot rose out of the core into the inner tier; and an
    inner module at the front sits on the core unless it rises about 1.7
    units, which puts it in the frame's top band and on the module behind it.
    Orbiting (90 and 140s a turn, a 1.25 rise at the front), a front module
    overlapped the core for 250-330s of every 1257s and three modules crossed
    the robot for about 130s each; a 2.0 rise still left 70-110s; the tiers
    swaying in opposite phase made the AI and the ERP meet (the adversarial
    review, and probe-scene's overlap check, 2026-09-29). The inner orbit's
    ring is drawn only across the back and the sides, fading into the ground
    by 45 degrees from the front, where it would cross the core's face. The
    modules are a little smaller than they were (1.2 and 1.3, the robot 1.45)
    so the core leads and the sway has room. Each module keeps its face
    toward the viewer with a slow turn of its own, and the robot arm flexes.
    A comet — a head and a glow of
    four segments, each longer, thinner and dimmer than the one before —
    takes about four seconds to cross a link, and grows and shrinks at its
    ends, so nothing pops. Every 7 seconds a soft band of light climbs the
    seams, bottom to top: at most 55% of a mix toward pale blue, about a
    second on each seam, and exactly zero at t = 0. The camera follows the
    pointer by at most 6 degrees of yaw, eased. Nothing is fast and nothing
    flashes: over 30 seconds the core's mean luminance never moves more than
    0.25 (of 255) in a tenth of a second (on the GPU, sampled every 0.1s). The
    fog starts just in front of the core's centre (`CAM_DIST - 0.8`), so the
    core and the front tier are clear and only the back recedes.
  - **It answers Schedule a Call** (2026-09-28). Hovering or focusing the
    hero's own primary (`#hero [data-cta="schedule"]`, not the header's)
    charges the system: every seam, the top inlay included, mixes 24% toward
    pale blue — about 40% brighter, measured x1.42–1.45 in linear luminance (x1.39–1.41 with the orbiting tiers) —
    the graphite's fresnel rim rises 30%, and the comets and the seam band run
    on their own clock at 1.6x. All of it eases in and out at 5 per second,
    about 0.6s either way (60% of it by 0.2s, all of it by 0.6s), and back
    out on leave or blur. It is a brighter BLUE, never amber: amber means
    target. `probe-scene` holds it by the blue channel, which the charge must
    not lower while red and green rise (+33.9, +23.2, +0.2): the channels'
    order and the hue could not see amber mixed in at the same 24% (it keeps
    blue > green > red and turns the antialiased seams' hue 1.6 degrees), but
    its blue falls by 10 (2026-09-29, the gate's `charge-amber`). The comets run on `pulseClock`, not on `t`, because changing the
    rate under `phase + t x rate` would make every comet jump. The scene
    listens to the button itself (pointerenter/leave, focus/blur) and exposes
    nothing to the page; the canvas stays `pointer-events: none`, and the
    button's own hover and focus states stay the signal — the scene only
    answers them. It is identity at rest (charge 0, the clocks equal), so the
    poster did not change. Paused, nothing answers: the loop has stopped.
  - **It opens as the hero scrolls away** (2026-09-28): an exploded view, the
    engineering drawing's own gesture for "how it is put together". Over the
    first 16% of the field's height of scroll — 90px, the field being
    560px tall at every desktop width (36%, 202px, until 2026-09-29) — plate i
    lifts by (i + 1) x 0.13, the top die riding on the plate it is inlaid
    into; the inner tier rises with the plate its links leave from (plate 4,
    by 0.65), so no link detaches; the plinth, and the outer tier's links
    that leave from it, never move. The seams mix 30% toward pale blue in the
    opened gaps, and the camera lifts its target 0.53 (0.25 until
    2026-09-29), so the opened stack sits lower in the frame, and steps back
    5% to take in the taller stack; it no longer lowers (it did by 0.1 rad until
    2026-09-29, which flattened the swaying tiers into each other: the AI and
    the cloud touched). Scrolling back reassembles it. It follows the scroll damped (6 per second, about half a second
    behind), from the scene's own passive scroll listener, which reads only
    `scrollY` — the field's height is measured at mount and by the
    ResizeObserver, never per frame or per scroll. **The span is the
    field's, not the hero's** (the merge, 2026-09-29): it was 55% of the
    hero's height, so it moved with a layout the scene does not own — the IA
    stream's shorter hero floor took it from 393 to 375px — and at 375px the
    stack was never seen fully open: at 1440x900 the field's top had scrolled
    262px out of the viewport, and from three quarters of the opening on,
    the top plates, which open the most, were above the screen's edge. At
    202px the core's top plate was about 80px under the viewport's top
    (`.probe/merge/explode-view.mjs`) — but the inner tier sits above it, and
    **the header stays pinned over the top 73px for the first 200px of
    scroll**: as the stack finished opening, the cloud ring and the phone
    were under the header and off the screen and the AI wireframe half cut
    (the design review, 2026-09-29; on Metal at 1440x900 the drawing's top
    was at 22px at a scroll of 140, under the 73px header, and above the
    screen at 202). **So it opens over 90px, and sits lower as it opens**
    (2026-09-29): fully open at a scroll of 90, the drawing's top is at 88-90px
    in the viewport, below the header's 73, at 1025x768, 1280x720, 1366x768,
    1440x900 and 1920x1080 alike (the field's top is at 113px at every
    desktop width); scrolled on, it leaves as the page does. The frame's
    margins fully open are 114, 107, 58 and 44px at 660 and 81, 75, 123 and
    112 at 467 (left, right, top, bottom; the band the ground), and the
    layout holds (robot to core 16.8px, AI to cloud 17.2px fully open).
    `probe-scene` (view) holds it on the page as laid out. No GSAP, no pin, no scroll
    hijack: the page scrolls exactly as it would without it. It is identity
    at scroll 0, and like the charge it starts at 0 at mount and waits out
    the fade, so a page reloaded mid-scroll draws the poster first and then
    opens. It is frozen by Pause motion (the loop has stopped), and it stops
    while the field is offscreen, like everything else. A gap of 0.24 per
    plate (the research's first prototype) pushed the mobile module into the
    top edge band; at 0.13 the fully open stack keeps it (*The hero field*).
  - **The poster** is the scene's first frame (t = 0), rendered by
    `scripts/render-scene-poster.mjs` in three files, each as AVIF and WebP:
    `public/hero/scene-poster-v2-1320.*` (rendered at DPR 2),
    `-660-1x.*` (rendered at DPR 1: what a DPR-1 canvas draws, one-pixel lines
    at full strength; the 660w file from 768px up) and `-660.*` (the DPR-2
    frame downsampled, phones' file). It is a plain `<img>` in a `<picture>`,
    the LCP element, with the image optimizer off that path. It is CONTAINED
    in the field at every width (2026-09-29): the whole frame is drawn and the
    field's ground, the poster's own edge colour, fills the rest. Covering the
    4:3 and 16:9 fields below 1025px cut the frame's top and bottom off at
    768-1024, the Lab robot included, and brought the scene 4.5px from the
    edge at 390 (the adversarial review). Below 1025px or on a coarse pointer
    it drifts slowly — a pure CSS translate, 2.5% across and 1.2% down, no
    scale (a scaled poster pushed the frame past the field's edges); so no
    layout shift, and under reduced motion it is still. `probe-scene`
    (poster) reads it as the browser draws it at 390, 768, 1024 and a touch
    tablet at both ends of the drift: the 16px band stays ground, the nearest
    lit pixel 23px from an edge at 390 and 47 at 768, in the hero's band
    below 1025 (34 and 48 in the 4:3 and 16:9 fields before the merge). The v1
    files (2026-09-16) stay in `public/hero/`, unreferenced and unchanged: a
    page served before v2 still asks for them. The step-3 files,
    `field-poster-{660,1320}.*`, were deleted at the integration (2026-09-24):
    nothing referenced them.
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
    drawn, no loop) if the attribute is already set when it mounts. **The
    attribute is the button's one state** (2026-09-29): it reads
    `html[data-motion]` (`useSyncExternalStore` over a MutationObserver on
    `<html>`) and computes the next state from it. It kept a copy in React
    state until then, which a client-side Back or Forward reset while the
    attribute stayed: the page was paused, the button said "Pause motion"
    with `aria-pressed="false"`, and its first press only changed the label
    (the engineering review). Its state is said once, by the label ("Pause
    motion" / "Resume motion"): `aria-pressed` went, since with a label that
    changes a screen reader heard "Resume motion, toggle button, pressed".
    Check 34 holds both at 390.
- **The header's headroom** slide is a 0.25s transform; the drawer slides in
  over 0.28s.
- **One reveal on every page** since 2026-09-16. The older one
  (`components/techwix/RevealObserver.tsx`, `data-tw-reveal`) went with the
  Techwix design. Its lesson stays: until 2026-09-15 it animated nothing — React
  renders a bare boolean data attribute as `"true"`, which it read as an
  animation's name — and no check caught it, because every check reads a page at
  rest, where a reveal that never runs and one that has finished look the same.
- **One animation library, for the Signal only** (gsap, above). Everything else
  is CSS. The FAQ is a `<details name="faq">` with no animation but its icon's
  quarter turn.
- **Reduced motion:** nothing moves. The reveal, the diagram flow, the map's
  pulse and fade, the poster's drift, the header's slide, the drawer's slide,
  the FAQ icon and the quiet link's arrow each have a guard (verify-site checks 21 and 23).
  Since 2026-09-28 check 21 also sees motion a script writes (*Verify before
  pushing*). gsap is never requested — the loader's gate is checked before any
  import — and one switched on live is reverted by `gsap.matchMedia`.

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
  that (536px at 1100, 467px at 1025), where both draw the same 660x560 frame
  smaller: the poster contained, the canvas at a fixed horizontal field of
  view (2026-09-28; until then `cover` cropped it). Below 1025px the poster is
  contained too (2026-09-29), so no width crops the frame. It has NO border
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
  1280px), and the poster is contained in it, so it is drawn at most 660px
  wide — exactly 660 from 1280 up — and `sizes` says 660px (H4: at the
  column's full height, 832px at 1025, the browser once fetched a file about
  1.5x too small at every DPR); below that it sits above the text, contained
  in the hero's band (*Design language*, "The hero's first screen"), so it is
  drawn at the band's height x 1.18 and never over 660px wide: `sizes` is
  660px from 768 up, and phones take the 660 file at every density. Contained, the
  poster's box is still the field's, which is all check 28 reads, and at 1025
  it paints 467x396 against the h1's 420x98.
  - **A re-rendered poster gets a new file name.** `/hero/*` is served
    `public, max-age=31536000, immutable` (`next.config.ts`, un-hashed /public
    assets): a browser that has the old file never asks again. The scene's
    poster shipped as `scene-poster-v1-*` (2026-09-16); its v2 (2026-09-28)
    is `scene-poster-v2-*`, and the next render is `v3`, never over an old
    name. The old files stay: a page served before the new one asks for them.
    (v2 was re-rendered under its own names on 2026-09-29 — the swaying
    tiers, and the new `-660-1x` file — because it had never been served:
    the branch was not yet merged or deployed. From its first deploy on, the
    rule holds for it too.)
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
  - **No per-frame allocation** still holds. The comets are InstancedMeshes (a
    head and four glow segments each, the segments' falling brightness an
    instance colour written once at build), and the loop writes their matrices
    straight into the instance buffers.
    Every geometry, material and vector is made once, and the hot loops use no
    iterators or closures.
  - DPR capped at 1.75. **The watchdog degrades by steps, and nothing vanishes
    in one frame** (2026-09-28). **It judges the scene's own work, never the
    display's cadence** (2026-09-29): the script time of each frame's pose and
    draw (`performance.now()` around them), and the GPU time of its draw where
    the browser can clock it (`EXT_disjoint_timer_query_webgl2`: Chrome and
    Edge on the desktop; a ring of four queries made once, each read a frame
    or more later, a disjoint reading dropped). The scene is the slow part
    when either has averaged (about ten frames) over 10ms — or, with no GPU
    clock (Safari, Firefox), when frames come both slow (a running average
    over 20ms) AND uneven (p90 − p10 of the last 30 intervals over 4ms): a
    display's own cadence is steady, and a device that cannot keep up drops
    frames unevenly. Once it has been the slow part for two seconds, the
    drawing buffer steps down ONCE, from DPR 1.75 to 1.25 — one reallocation,
    before anything is dropped (a display at or under 1.25 skips the step).
    After two more slow seconds the comets fade out over 0.8s (by area, so
    evenly); after two more the outer tier sinks into the floor over 3.6s —
    the floor's depth hides it — and is then hidden. Before, the pulses and
    then the outer tier went `visible = false`: on SwiftShader POS, ERP and
    the robot vanished in one frame, and a slow integrated GPU saw the same
    pop. **Until 2026-09-29 it judged the rAF interval** (over 20ms on
    average for 2s), so a display delivering every second vsync — Safari's
    Low Power Mode, Chrome's Energy Saver, a laptop on battery — read as a
    slow GPU: on the M2 through Metal at a 30Hz cadence, every frame drawn
    far inside its budget, the comets were gone at once and the lower right
    (ERP, the robot) fell from 1,200 lit pixels to 73 by 3s (the design
    review). Measured since, on this machine: the M2 draws a frame in 0.24ms
    of GPU time at DPR 1 and 0.58ms at 1.75 (the median over 120 frames);
    SwiftShader in 13.8ms at DPR 1 and 25ms at 1.25, so it still degrades,
    as a GPU that slow should. On Metal at the 30Hz cadence the scene now
    keeps its comets (428-585 cyan pixels) and its lower right (1,193-1,275)
    for 16s, as at 60Hz (`.probe/review-design/watchdog.mjs`).
    `scripts/probe-scene.mjs` (watchdog) feeds 40ms frames that each cost 30ms
    of the scene's own script work and fails a phase that loses more than
    half of what it drops in one 0.2s step (the old watchdog: 84% of the
    comets and 69% of the outer tier; now 28-29% and 31-32%, run to run), and
    requires a GPU clocked at 30ms a frame, at a smooth 60Hz cadence, to step
    the buffer down within 4s; (cadence) a steady 30Hz cadence with cheap
    work, with the GPU clocked at 1.5ms and with no GPU clock, keeps the whole
    buffer and draws at t = 12s exactly the 60Hz frame (0.00% of pixels off),
    and, its control, an uneven cadence with no clock steps the buffer down.
    The clock's results are stood in for by the probe (a GPU of known speed,
    whatever the machine's is): 1ms a frame on every page unless a check
    says otherwise, since SwiftShader's real times on the few frames a
    fast-forward draws could trip the watchdog at random, and a check not
    about it would then compare a degraded scene with a whole one (a 0.34%
    "did not reassemble" in the explode check, found while this was built). Testing each frame
    alone reset the count on every fast frame, and a slow device's uneven
    frames kept resetting it, so it never fired (probe 6e, 2026-09-16), which
    is why it reads running averages. Paused offscreen (IntersectionObserver) and
    when the tab is hidden. On teardown every geometry, material and instance
    buffer is disposed, then the renderer, and the context is released
    (`forceContextLoss`); the scene makes no textures. A lost context
    (`webglcontextlost`) stops the loop and drops the canvas, and the poster,
    never hidden, is what remains. Nothing throws.
  - **When it loads.** `HeroScene` renders nothing, on the server or the
    client. While the conditions below hold, it waits for BOTH the first
    `largest-contentful-paint` entry (buffered) AND `load`, then an idle
    callback (a timeout where `requestIdleCallback` is missing), and only then
    runs `import("./scene")`. **The entry has two stand-ins** (2026-09-29,
    `components/motion/lcp.ts`, the Signal loader's wait too): the browser
    reports no LCP after the reader's first key, press, wheel turn, scroll or
    touch, so that input stands in for it, and one made before hydration,
    which no listener sees, is covered by giving up on the entry 3s after
    load. Until then the scene waited for the entry alone, and a wheel, a key
    or a click before the first paint (at 45-126ms, the first paint at
    160-304ms) left it waiting for ever: 5 of 5 trials, no canvas after 25s,
    while the Signal, which had the stand-ins, started (the engineering
    review). Check 25 holds it (`/ @1440 input before first paint`). The canvas goes inside `[data-hero-field]` with
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
    so the fade shows no jump. **Every state the visitor drives starts at
    rest and waits out the fade** (2026-09-28): the pointer's parallax, the
    charge and the exploded view are exactly zero at mount and follow the
    visitor only once 0.75s of scene time has passed (`HOLD_S`; the canvas
    fades in over 0.7s), so a page loaded with the pointer already on
    Schedule a Call, or reloaded halfway down the hero, still fades in over
    the poster's own picture — `scripts/probe-scene.mjs` compares both first
    frames with the poster file. **The scene keeps a fixed HORIZONTAL field of
    view** (2026-09-28): the 660x560 frame's, 30° vertical at 660x560, so a
    field narrower than 660 (between 1025 and 1280px, 467px at the narrowest)
    draws the whole frame smaller and gains ground above and below, exactly
    as `object-fit: contain` draws the poster (`.bf-hero__poster`). **What
    the crossfade matches, measured** (`probe-scene`, identity, 2026-09-29, the
    canvas's t = 0 frame against the poster the browser draws under it): at
    660 it is the same frame 1:1 — 0.36% of pixels off by more than 24 at DPR
    1 (the `-660-1x` file) and 0.42% at DPR 2 (the 1320 file), the rest
    encoding. At 536 and 467 both draw the frame smaller, and the canvas
    still draws a one-pixel line at full strength where the resampled poster
    draws it thinner and dimmer: 0.9-1.9% of pixels (1.86% at 536 and DPR 1), the lines only, so thin
    lines firm up a little as the canvas fades in. At DPR 1 the poster was the
    DPR-2 frame downsampled until 2026-09-29, which put every GL line at about
    half strength: 2.28% at 660, the lines visibly brightening in the fade
    (the adversarial review). Until then the
    vertical field of view was fixed and `cover` cropped the frame, so the
    scene had to be small enough for a 480 crop: at 660, the frame most
    desktops get, it floated in 100px or more of empty ground on each side.
    Composed for the frame instead, it is 15% larger (`CAM_DIST` 11.4, was
    13.1) and between 1025 and 1279 drawn up to 29% smaller than the frame
    rather than cropped.
    `scripts/render-scene-poster.mjs` renders it from the built site at 1440.
    It freezes requestAnimationFrame when `data-scene-ready` appears, so the
    canvas holds t = 0, and captures the field at 660x560 (its 1px border
    removed for the capture) twice, at DPR 2 and at DPR 1.
  - **It dissolves into the page; it never stops at a box** (coordinator's
    review, 2026-09-16). The field has no border, and its background is the
    ground, `#07090D`, which is also the canvas's clear colour. The grid floor
    and the blue pool under the core fade to exactly that ground by r = 2.8
    (`FLOOR_FADE` in `scene.ts`). **660x560 is the frame it is composed for,
    and the safe area**: since the field of view is fixed horizontally, a
    narrower field is the same frame smaller, never a crop of it. Measured on
    rendered frames by `scripts/probe-scene.mjs` (2026-09-29, the swaying
    tiers; t = 0–100s every 5s, and the pointer held at each of the four
    parallax extremes): at 660 the closest lit pixel is 97px from the left
    edge, 90 from the right, 54 from the top and 61 from the bottom; at 467,
    68, 63, 120 and 126; the 16px band is the ground in every frame (within 0
    of #07090D). Fully exploded (the hero scrolled past the span, t = 3–103s
    every 10s and the four parallax extremes) the stack is taller and the
    margins move to 114, 107, 58 and 44 at 660, and 81, 75, 123 and 112 at
    467 — the band still the ground in every frame (111, 103, 36 and 61 at
    660 until 2026-09-29, when the opened stack was lowered in the frame:
    *Motion, as built*). Below 1025px the drifting
    poster keeps the band too (*Motion, as built*, the poster). The poster script
    refuses a capture whose 16px edge band is not the ground, and
    `scripts/probe-scene.mjs` fails any frame whose band is not. It is done in the scene itself:
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
the full suite with `--repo` on a fresh copy and a fresh server (:3465), and
`scripts/probe-scene.mjs` beside it (2026-09-29); RUN 2, every misuse case in
`gate-cases.py` — the suite's `CASES` and the hero scene's `PROBE_CASES` —
patched into one build, each of which must fail its own check with its own
finding (and that finding must not already be on the clean build); RUN 3, bad
content the build must refuse in the schema's own words. `--only` is derived
from the case table, never written by hand. A case whose anchor stops applying
aborts the gate; a rule that cannot exist any more is
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
  first input, the 1024 run, both tablets, Save-Data, reduced motion. Since 2026-09-29 one more allowed profile, `/ @1440
  input before first paint`: a wheel turn and a key every 20ms from the moment
  the navigation commits, so the browser never reports an LCP entry — the
  scene must still start. Its input must land before the first paint (no LCP
  entry reported, up to three tries), or the path went untested and it fails
  as unsure; the gate's `scene-lcp-only` case puts the entry-only wait back.
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
  a tier chip says its tier. **Robotics honesty in the drawing (2026-09-29, the
  merge):** the Lab drawing (any `svg` holding `.dg-node--concept`) carries no
  `.dg-flow` and no cyan — on every visit it reads every element of the
  drawing, painted or in its `<defs>`, for a stroke, fill or stop colour that
  is `--bf-flow` or any saturated cyan (hue 160–195°) — and it never animates
  a flow: on FRESH pages of / and /capabilities at 1440 (a fine pointer, where
  the Signal sketches it), 1180x820 touch and 390 (touch, where the CSS flow
  would run), scrolled to it at reading speed and watched every 100ms for
  5.5s, no animation or transition runs on its own elements (the engine's
  `.bf-signal-*` overlays and masks are the sketch, and exempt), no own line's
  `stroke-dashoffset` moves, and nothing in it is painted cyan. A profile on
  which no route showed the drawing in view is a failure, not a pass. Misuse
  cases: `lab-flow` (the four connections back as flow lines; also
  `lab-flow-phone`, the flow running at 390), `lab-cyan-head` (cyan arrowheads
  on steel edges, no flow line) and `lab-dash-motion` (the steel dashes
  animated on a coarse pointer, no cyan).
- **23** — unchanged in what it compares. It captures under reduced motion, where
  the scene never mounts (check 25 fails one that does), and hides every canvas
  for the capture, so the live canvas cannot reach it; it now prints what the page
  held (its canvases, and whether a scene drew). Pausing the scene with
  `bf:motion` instead would make the capture depend on the scene's own pause
  working; reduced motion keeps the scene out of the page.

**Motion a script writes, and CLS while reading (2026-09-28).** Two blind spots
the Signal motion system would have walked into, closed before it landed. Each
rule was proven both ways on a served build — the clean build passes, the same
build with the misuse fails with its own finding — and each has its misuse case
in the gate's RUN 2.
- **21** — `getAnimations()` cannot see a script: three live gsap tweens read 0.
  An init script, in place before any page script, now counts per element the
  changes a script makes under reduced motion, in three kinds, each its own
  finding: an inline transform, translate, scale, rotate, opacity or stroke
  dash (`script-motion`, an rAF loop writing a transform); any inline CSS
  custom property, since `--x` feeding `transform: translateX(var(--x))` moves
  what reads it (`script-motion-var`); and an SVG motion attribute —
  transform, opacity, the stroke dash, x, y, cx, cy, r, x1–y2, d, points —
  gsap's attr plugin or a hand-rolled draw-on (`script-motion-attr`, an rAF
  loop writing `stroke-dashoffset`). 5 or more changes is "animated by script"
  and fails. The first version watched the inline properties alone: in
  review a custom property and two attributes, each written 120 times under
  reduced motion, went unseen. The info line names the elements set fewer
  times, and by which kind.
- **29** — **CLS while reading**: one fresh run per profile, throttled as the
  others, scrolled at reading speed top to bottom, at the same 0.005 line; the
  largest shifts are named with their nodes and scroll position
  (`scroll-shift`, a block inserted above `#faq` as a reader nears it). The runs
  at rest never scroll, and scrolling is not recent input, so a shift a reader
  meets was invisible to the check.

**The Signal and the suite (2026-09-28).** gsap loads in exactly the scene's
profile, so without a suite change check 25 counts it as the scene (139 + ~50KB,
over the 180KB cap), and checks 21 and 29 cannot see it at all. Each rule below
was proven both ways on a served build, and each has its misuse case in the
gate's RUN 2. gsap's chunks are known by their code, read off Turbopack's
production chunks (`GSAP_CODE`): the core by "GreenSock" and "gsap.com", a
plugin by `(x=window.gsap)&&x.registerPlugin`, the engine by `data-bf-signal`.
- **25** — gsap chunks are the Signal's, never the scene's: they leave the
  scene set, and the info line lists them with their sizes. A three.js chunk
  carrying GSAP is the scene importing gsap, and fails (`scene-gsap`). Turbopack
  gives a module two imports share a chunk of its own, so a scene importing the
  gsap the loader imports carries no GSAP code itself: every dynamic import's
  chunk list (`Promise.all(["static/chunks/…"])`) is read from the code, and
  one that loads a three.js chunk and a GSAP chunk together fails
  (`scene-share`). gsap requested where the Signal's gate fails — 390, 768,
  1024, a phone, a touch tablet, Save-Data, reduced motion — fails
  (`gsap-coarse`). And the positive case: on / at >=1025px with a fine pointer
  the engine must start, `html[data-bf-signal="live"]`, because every
  never-rule passes on a Signal that is silently dead (`signal-dead`).
- **29** — a GSAP chunk requested before the load event ended fails, printed
  with its size and parts (`gsap-static`); the info line lists the ones after
  load, and says so when the phone profile requested none.
- **31** — gsap (and any `@gsap/*`) is imported only under `components/motion/`,
  only dynamically, and only by `components/motion/MotionLoader.tsx`; a
  type-only import is erased (`gsap-static-31`, `scene-gsap-31`,
  `signal-second-loader`).
- **21** — no GSAP-signature script may be requested under reduced motion at
  all (`gsap-reduced`): the loader checks its gate before any import.

**The gate (2026-09-16).** RUN 1 builds a fresh copy of HEAD, serves it fresh and
runs all 34 checks with `--repo`: every failing finding is real. RUN 2 applies
every misuse case to another copy in one build; each must fail its own check
with its own finding, and that finding must not already be on RUN 1's report —
a pattern that matches the clean build proves nothing. RUN 3 builds ten
kinds of bad content — a figure KPI with no status, a capability KPI with one,
an exemption with an empty reason, a capability tier outside proven, core,
capable and lab, a named roster put back in the team (2026-09-24), since
2026-09-28 a hero first-call line that is not approved copy and feature work
named on the hero's proof line, and since 2026-09-29 a client story with one
member, one whose title's count is wrong, and one that says it is live while
a member is not — and requires the schema's own refusal in the
build log: a build that fails for another reason is unsure. The suite's `--only` list for RUN 2 is
derived from the case table: a hand-written list once omitted check 9, and its
case could not fail. A case whose target does not exist yet names the wave that
brings it and holds the verdict at INCOMPLETE until it runs. **The hero scene's
cases (2026-09-29)** check `probe:<name>` — `scripts/probe-scene.mjs`, whose
`--json` report the expectation table reads beside the suite's, with its own
derived `--only` (`gate-cases.py probe-only`). Every other case's patch is in
the same build, so each scene patch leaves the t = 0 frame alone, and each
finding names its cause (`cover` in the poster's, `scene-poster-v1` in the
identity's): two of the suite's patches hide the poster outright (`h2-hidden`,
`scene-hides-poster`), which would have let the poster and identity checks
pass on nothing, so the probe shows a hidden poster to measure it and fails
the hiding separately.

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
  far the chosen file is stretched to fill the frame (H4), without failing on it — by the poster's
  own `object-fit` since 2026-09-28: the larger axis for `cover`, the smaller for `contain` (every
  width since 2026-09-29).

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
  blurb, and — once that blurb was cut, the same day — onto the contact
  panel's body beside the calendar (still /contact text that is not the
  wordmark). `kubernetes` still patches the stack's list, which renders on
  /engineering only now, so /engineering's inventory includes the evidence
  cuts and check 30 still sees a cut technology come back. `cache-lane`
  stands: the restaurant search's lanes stay on `/`, as a band in the stories.

**Checks changed for the TTouch Clothing projects (2026-09-29).** Each rule was
proven both ways — the site passes; a copy with the misuse fails with that
rule's own finding — and each has its case in `scripts/gate/gate-cases.py`.
- **9, extended — the client-story band.** The homepage's band
  (`[data-client-story]`) is not a card, so no kind marker put it in check 9's
  reach, and its label is the only thing that says who built the four
  systems. Check 9 now reads it: the band's `[data-attribution]` must read the
  kind's words for the story's client — written in the suite, "Delivered
  project: built by Bolt Fusion for TTouch Clothing" — where a reader can see
  it; every `[data-story-project]` must be a published product project of that
  client, linking out over https to one of its own links; and no member may be
  left out. RUN 2: `story-label` (the label changed to "Built by TTouch
  Clothing"), `story-hidden` (the label given `sr-only`), `story-foreign` (our
  own OPAL named among TTouch's) and `story-missing` (Delivery Lens BD left out,
  from the same patch). Proven on a served build of the working tree with the
  three patches: all four findings, at 1440 and 390; the clean build passes.
- **The build, three new refusals (RUN 3).** `clientStories` in
  `content/projects.ts`: (h) a story pointed at a client with one published
  product project — "a client story is a set"; (i) "Five systems" over four
  members — "its title says "five", and "TTouch Clothing" has four published
  product projects"; (j) Delivery Lens BD set to in production under "All four
  are live." — "its intro says the set is live, and Delivery Lens BD is not".
  Each proven by loading the patched content with the real zod.
- **30** — a /work item for the client story, a / item for its band and one
  for the tiers it adds, Logistics among the homepage's industries with
  delivered work (and off the retired item's needles, which it no longer
  describes), new evidence items on /industries and /capabilities, and the
  `ttouch-cuts` set on / and /work.

**Checks changed in the motion fix pass (2026-09-29).** From the three
adversarial reviews (design, honesty, engineering) of `redesign/motion-hire`.
Each rule is proven both ways, and each has its case in
`scripts/gate/gate-cases.py`.
- **probe-scene: `watchdog` changed, `cadence` and `view` new.** `watchdog`'s
  slow frames now cost the scene 30ms of its own work each (the rAF interval
  alone no longer degrades anything), and a GPU clocked at 30ms a frame must
  step the buffer down at a smooth 60Hz; `cadence` holds a steady 30Hz with
  cheap work to the 60Hz frame, with and without a GPU clock, with an uneven
  cadence as its control; `view` holds the exploded view fully open before
  the drawing goes under the pinned header (*The hero field*; *Motion, as
  built*). PROBE_CASES: `scene-gpu-blind`, `scene-cadence` and
  `scene-cadence-safari`, `explode-span`. The probe's pages report a 1ms GPU
  unless a check says otherwise.
- **25, extended — an input before the first paint.** The profile `/ @1440
  input before first paint` (above, under 25): the scene must start although
  the browser reports no LCP entry. RUN 2: `scene-lcp-only`.
- **34, new — a client-side navigation.** From the bottom of /capabilities
  (scrollY 11809 at 1440, 16198 at 390) the header's logo, `<Link>` to /: on
  every frame after the click the new page must be at scrollY 0 — its first
  frame included — and, read down at reading speed, it must run as many
  reveals as a fresh load of / read the same way (37 of 39 at 1440, 39 of 39
  at 390), and at >=1025px the Signal must start on it. Two fresh contexts
  per width, at 1440 and 390. Without `data-scroll-behavior="smooth"` on
  `<html>` the new page's first frame was at 10201 and ran 0 reveals (the
  engineering review). RUN 2: `nav-smooth` and `nav-reveals`, one patch (the
  attribute removed). At 390, where the pause control shows for the poster's
  drift, it also presses Pause, goes Back to /capabilities and Forward to /
  (both client-side): `html[data-motion]` must still be "paused", the
  remounted control must read "Resume motion", and it carries no
  `aria-pressed`. RUN 2: `toggle-local` and `toggle-pressed`, one patch (the
  control back on a React state of its own, with `aria-pressed`). And at
  1440, /engineering (the Signal live) → /work through Next's own router
  (`window.next.router.push`, what a `<Link>` drives; not through / and the
  logo, since the gate's `signal-dead` case kills the engine on /): once
  idle, /work may ask for at most 5 animation frames a second — measured 0;
  ScrollTrigger's loop kept 64-67. RUN 2: `st-awake` (the teardown's
  `ScrollTrigger.disable()` removed).
- **35, new — the Signal's traces settle lit.** At 1440, on a fresh / and a
  fresh /engineering read down at reading speed, and on / after 34's
  navigation, 3s after the reading: every station of every hook drawn at that
  width is lit (`data-bf-lit`; 10 on /, 7 on /engineering), each host carries
  `data-bf-traced`, and no overlay is left. RUN 2: `hook-blink` and
  `hook-blink-untraced` (the hook's settle back to the hollow drawing), read
  on /engineering. `signal-dead` (check 25) kills the engine on / only since:
  it shares the misuse build with `hook-blink`, which needs the engine alive
  on /engineering to fail on its own damage.

**Anything triggered by entering the viewport** — lazy images, web-font loads,
reveals, count-ups — must be measured on a fresh page scrolled at reading
speed. Measured on a page that has already been scrolled, or never scrolled, it
reports the absence of the behaviour as a fact about the site.

**A change to the hero scene runs `scripts/probe-scene.mjs` as well** (2026-09-28).
The suite reads the scene's contract — a granted context, the chunk, the poster
as LCP, nothing painted over it — but never its pixels over time, so it cannot
see the rules of *The hero field* that live there. The probe's checks:
`clearance` (the 16px band the ground at 660 and 467 across t = 0–100s and the
parallax extremes), `overlap` (no module within 12px of the core in front of
it, nothing within 12px of the Lab robot, no two modules within 8px, read from
the scene's own objects over seven sways, assembled and fully open —
`scripts/lib/scene-layout.mjs`), `poster` (the drifting poster below 1025px
and on a touch tablet keeps the band), `identity` (the t = 0 frame against the
poster the browser draws under it, at 660, 536 and 467, DPR 1 and 2),
`charge` (eased, blue, gone after leave, dead while paused, and a page hovered
before mount still starts on the poster), `explode` (the band fully open;
identity at scroll 0, opening with the scroll, frozen by Pause motion,
reassembled at the top), `reload` (a page loaded mid-scroll starts on the
poster, then opens), `view` (2026-09-29: on the page as laid out, with the
header pinned over the first 200px of scroll, the stack is fully open before
any of the drawing goes under the header — read 10px of scroll at a time, its
opening from the scene's own objects), `watchdog` (each step a fade, on frames that cost the
scene 30ms of work; and a GPU clocked slow steps it down at a smooth cadence)
and `cadence` (2026-09-29: a steady 30Hz cadence with cheap work degrades
nothing, with the GPU clocked and with no clock, and draws the 60Hz frame;
its control, an uneven cadence with no clock, does degrade). It takes over the
scene's clock on fresh, unscrolled pages and scrolls them itself, so nothing
viewport-triggered is already over. It pins the field at 0,200 above the page
— the field AND `.bf-hero__stage`, the isolating ancestor its z-index lives
in: when the IA put `#recent-work` straight under the hero, the explode and
reload checks, which scroll, read the write-ups' screenshots painting over the
pinned field as 32 scene failures (found at the merge, 2026-09-29; a fixture
error, not the scene's). Against a local build: `node
scripts/probe-scene.mjs --base http://localhost:<port> [--only a,b] [--json
<file>]` (SwiftShader; `--gpu` for the machine's GPU, where the poster
comparisons print the cross-rasteriser diff instead of failing); about a
minute and a half. Exit 1 on any failure. **The gate runs it** (2026-09-29):
RUN 1 on the clean HEAD, where every probe finding is a real failure, and RUN
2 on the misuse build, where each `PROBE_CASES` row of
`scripts/gate/gate-cases.py` must fail its own probe check with its own
finding — the proofs that the probe's rules can fail live in the repository,
not in a scratch folder.

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
fresh context, with no input and no scroll — and, since 2026-09-28, one more
run per profile scrolled top to bottom at reading speed, for the layout shifts
a reader meets.

| | budget |
|---|---|
| LCP, mobile lab (390 wide, 4× CPU, 150ms RTT, 1.6Mbps down) | at most 1.5s |
| blocking time, mobile lab (each long task's time over 50ms, navigation to load + 4s) | at most 150ms |
| LCP, desktop (1440, unthrottled) | at most 0.5s |
| CLS | 0.00 — printed to three places, failing at 0.005; at rest, and during a reading-speed scroll (2026-09-28) |
| initial JavaScript (requested by the end of the load event, gzipped, as transferred) | at most 260KB |
| the hero scene chunk (three.js and the scene; 2026-09-16, was 15KB for the raw WebGL2 renderer) | at most 180KB gzipped as transferred; requested only after the load event; never below 1025px, on touch, with Save-Data or under reduced motion — check 25 |
| the Signal's gsap chunks (gsap 3.15.0 and the engine; 2026-09-28) | not initial JavaScript: requested only after the load event (check 29); never below 1025px, on touch, with Save-Data or under reduced motion (checks 25 and 21); never in the scene's chunk (check 25). No size budget of its own: motion.md's "at most 50KB gzipped" is met, not asserted |

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

**Re-measured 2026-09-29, with the swaying tiers: 144,153 bytes, 140.8KB**
gzipped at level 6 as served, 575KB raw, requested at 2.4s against a 245ms
load event: 250 bytes less than the orbiting v2, which carried the rise
shader for the inner tier's links and ring; 39.2KB of the 180KB left. At
the merge (2026-09-29) the explode's span is read from the canvas instead of
the hero: 25 bytes less (the chunk file at `gzip -6`: 143,438 → 143,413;
574,670 → 574,608 raw). The watchdog's work clock (2026-09-29: the script and
GPU time of a frame, and the cadence's evenness, instead of its interval):
387 bytes more (143,413 → 143,800 at `gzip -6`; 574,608 → 575,457 raw), no
new import.

**Re-measured 2026-09-28, with the scene's v2** (the studio, the comets, the
Lab robot, the fit-width camera and the watchdog's fades): **143,913 bytes,
140.5KB**, gzipped at level 6 as served — the same as its `encodedBodySize`
under `next start` — 574KB raw, requested at 1.3s against a 71ms load event.
The same chunk before v2 measured 142,287 bytes (139.0KB; the 137.9KB above
was 2026-09-16's build), so v2 costs 1.6KB and leaves 39.4KB of the 180KB. It
added one named import, `BufferAttribute` (the dashed link), which
`BufferGeometry` already pulls in. With the CTA charge: **144,211 bytes,
140.8KB** (+298 bytes, no new import), requested at 1.6s against a 247ms load
event; 39.2KB of the 180KB left. With the exploded view: **144,403 bytes,
141.0KB** (+192 bytes, no new import), requested at 1.5s against a 118ms load
event; 39.0KB left.

**The Signal's chunks, measured 2026-09-29** (`next start`, the gzip bodies as
served, `encodedBodySize` in the browser at 1440). Turbopack splits the staged
imports into four chunks, requested in order and each evaluated in its own
task: gsap core 26.7KB, ScrollTrigger 17.0KB, DrawSVGPlugin 1.9KB and the
engine (`signal.ts`) 3.5KB — **49.2KB in all**; the three gsap parts are 45.6KB
against esbuild's estimate of 45.9KB. (Re-measured 2026-09-29 after the review
fixes: the three gsap chunks are byte-identical, same hashes; the engine grew
from 3.3KB to 3.55KB — the per-trigger refresh, the stations' drift. Initial
JavaScript unchanged at 135.9KB in the same eight files; still no long task in
the Signal's window in three runs at 1x and three at 4x, at a load average of
6–11.) **Initial JavaScript went from 135.1KB to
135.9KB** as check 29 counts it, the same eight files: the +0.8KB is the loader
itself (its gate, its staged waits and Turbopack's import stubs), and none of
it is gsap. On an unthrottled 1440 the first gsap chunk is requested 2–3ms
after `data-scene-ready`, about 270–370ms after navigation in a warm run (the
load event at ~65ms); without the GPU flags check 29's desktop run uses, the
idle wait puts it near 1s, and on a loaded machine (load average 15–20) it
came 1–6s after navigation. The phone profile, the 1180x820 touch tablet,
1024, reduced motion and Save-Data request no gsap chunk at all. **No long task
in the Signal's window** — from the first gsap request to 1s after the engine
starts — in four runs at 1x and four at 4x CPU (the 4x runs' long tasks, 55–375ms
of blocking, all come before gsap is asked for: the scene's chunk and first
frame); and during a reading-speed scroll of the whole homepage with all eight
sequences playing, **no long task at 1x or 4x and CLS 0.0000** (main, the same
scroll at 4x: also none, 0.0000). Measured at a load average of 7–9, other
builds running.

**The scene is not initial JavaScript, and check 29 says so (2026-09-16).** The
260KB counts what is requested by the end of the load event, and the scene chunk
is imported after it: check 29 prints every scene chunk its runs requested, with
its start time against the load event, and fails one requested before the load
event ended — a static import of the scene would put three.js in the initial
JavaScript. Check 25 holds the 180KB: it gzips each scene file as served (level
6), because its WebGL runs re-serve scripts through the worker hook and their
resource timings are not the wire.

**The posters** (2026-09-29, the swaying tiers): `scene-poster-v2-660.avif`
7.4KB (phones), `-660-1x.avif` 11.2KB (DPR 1 from 768px), `-1320.avif`
15.0KB; `-660.webp` 13.6KB, `-660-1x.webp` 15.4KB, `-1320.webp` 31.8KB (AVIF
4:4:4 at quality 56, the 1x file at 64; WebP 82). The phone's LCP file is the
same weight as the orbiting v2's (7.5KB); a DPR-1 desktop's is 11.2KB where
it was 7.5KB — the frame rendered at its own density keeps one-pixel lines
that encode heavier — and a tablet at DPR 1 now takes it (11.2KB) instead of
the 1320 file (15.6KB), since `sizes` says 660px from 768 up. The orbiting
v2's, 2026-09-28: `-660.avif` 7.5KB, `-1320.avif` 15.6KB, `-660.webp` 13.8KB,
`-1320.webp` 33.0KB. The v2 frame is larger and lit (about 20% of its pixels
off the ground), so each file is about a third heavier than v1's — 1.8KB more
on the phone's LCP path (the 660 AVIF), with the mobile LCP at 844ms (check 29):
`scene-poster-v1-660.avif` 5.7KB, `-1320.avif` 11.5KB,
`-660.webp` 10.3KB, `-1320.webp` 24.8KB.
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

## Decided 2026-09-29: the TTouch Clothing projects (owner)

The owner's request, 2026-09-29, verbatim:

> https://wholesale.ttouch.clothing
> https://sudarshini.com
> https://deliverylensbd.com
> https://employee.ttouch.clothing
>
> add this our 4 project best way and hegilighted them perfect way

His answers (through AskUserQuestion, the recommended option each time; the
session's `research/projects/OWNER-ANSWERS.md`, which wins over its
`PROPOSAL.md` where they differ):

| question | the owner's answer | where it is on the site |
|---|---|---|
| Name the clients? | Yes, all of them, each linked to its live site | the four cards, the band, the llms files |
| What did Bolt Fusion build? | Everything, for all four: design, website/app, backend and database — "Built by Bolt Fusion for …", not feature work | `kind: "project"`, product scope; each role "The whole build: …" |
| Screenshots? | Public pages only; nothing behind a login; never log in | the four captures (*Projects and attribution*) |
| Figures? | None: each described by what it does | no figure in any new string; check 30's `ttouch-cuts` |
| The relationship? | Bolt Fusion is an outside company working for TTouch; all four "Built by Bolt Fusion for TTouch Clothing". The footers credit TTouch's IT department: a note for the owner (ask TTouch to add a "Built by Bolt Fusion" credit), and the site must not claim any credit exists | the label; never a word about a credit |
| Sudarshini? | A TTouch brand: credited as built for TTouch Clothing | its summary, "TTouch Clothing's saree brand" |
| Sudarshini's picture? | "A view with no face": pick or crop the best public view with no person in it | a product page's details panel, cropped |
| Timing? | Add the cards now; TTouch fixes the issues this week. Delivery Lens BD joins the hero's proof line only after its demo phone numbers and its missing privacy policy and terms are fixed; until then the hero keeps WarmChats · Balanzify · Go Style Business. The security issues (the wholesale JS's webhook URL, the anonymous API's hidden fields, the verify endpoint and its guessable IDs, Delivery Lens BD's demo numbers and missing policy, Sudarshini's random "viewing now" number) go to the owner, not onto the site | /work, the band and Industries now; the hero unchanged |
| The employee portal's link? | "Link it" — its option read "It already has a rate limit / protection". His statement, not verified | `employee.ttouch.clothing` on its card and in the band |

The proposal's defaults, taken because the owner was not asked: the stack
tags as drafted (React / Next.js, Django, REST, Node.js) with no database and
no MongoDB; the headline "Four systems for TTouch Clothing", which makes no
claim that TTouch "came back"; no dates.

| what | decided | where |
|---|---|---|
| /work | the four as a client story under their own h3, `#ttouch-clothing`, between the product cards and the feature work; each card the standard one, with a real screenshot and a live link | `motion-hire/projects` |
| The homepage | a text band in `#recent-work`, after the proof strip, with one link to `/work#ttouch-clothing`; the hero's proof line unchanged | `motion-hire/projects` |
| Industries | Retail & commerce gains Sudarshini and TTouch Wholesale; HR gains TTouch Employee Verification; Logistics moves to delivered work on Delivery Lens BD, its first problem ("Orders shipped to customers who refuse them at the door") and first build ("Courier data and delivery-risk checks") written to what that product does; each evidence link lands on its card | `motion-hire/projects` |
| Capabilities | Software engineering links Delivery Lens BD and Sudarshini; ERP's Proven scope is "HR, payroll and a wholesale back office" (Full ERP stays Capable, its line byte-identical); POS & commerce is Core for point of sale and Proven for "Online and wholesale commerce", with "Online stores" and "Wholesale ordering portals" in what it builds — still no payments or commerce integrations claimed; AI, Cloud and Robotics unchanged | `motion-hire/projects` |
| /industries' layout | the homepage's industries grid rules were scoped to its section: they had laid /industries' rows out five to a row from 1025px | `motion-hire/projects` |

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
| The order (`site.sectionOrder`) | hero → engineering stories (`#recent-work`, compact) → how we work with you (new) → what we engineer (one ledger that absorbed the six capability sections) → how we build → industries with delivered work → Insights → FAQ → final call to action. Measured: 10,672px at 1440 (from 19,526) and 14,839px at 390 (from 27,544) — 14,920 since the merge's phone call to action after the ledger, and 11,101 at 1440 and 15,925 at 390 since the projects merge (2026-09-29: TTouch Clothing's band in `#recent-work`, Logistics' industry cell and the ledger's new linked work); at 1440 the hero's proof line at 585–677px, `#recent-work` at 755 and its first write-up at 913 (from 13,847) | `motion-hire/ia` |
| Off the homepage, each still on its route | the six capability deep dives and the system map (/capabilities, the map after the six: its parts are the six); the stack by layer (/engineering); the industries with no delivered work (/industries); the Team section (/about — its headcount stays on `/`, in how we work). Check 30 retires each on `/` with "moved to /<route> — owner request 2026-09-28 ("make it easy for clients to hire")", and its destination's inventory requires the same needles | `motion-hire/ia` |
| Kept on `/` | every `[data-capability]` with its tier chip; robotics, its Lab chip, its honesty line verbatim and "Concept — not a shipped system"; `#recent-work` holding the proof strip; `/#contact`; the anchors `#software` … `#cloud` (the ledger's rows); the Service JSON-LD, now tied to the ledger's section | `motion-hire/ia` |
| The hero | its contract words unchanged (check 28's `HERO`). Under the calls to action: "Your first call is with the engineer who writes the code." (/about's term, word for word — the schema refuses anything but one whole sentence of those terms, RUN 3 case f) and a proof line — "Built by Bolt Fusion and in production": WarmChats (for WarmChats, Inc.), Balanzify (for Balanzify Inc.), Go Style Business — read from `content/projects.ts` through a strict `hero.proof` (feature work refused, case g), each linked as the data links it: WarmChats to its write-up, Balanzify and Go Style Business to the live products. Proof at the fold below 1025px as well: the field is a band there and the line one row (*Design language*, "The hero's first screen"). Robotics stays in the hero's body: those are the owner's words, and his call | `motion-hire/ia` |
| No new promises, no new figures | no reply time, no price, no call length. /about's interim quote line ("We'll give you a full quote … once we've seen the real codebase") is on `/` only where /about has it, under the engagement models in how we work. The FAQ's older "How do you estimate timeline and cost?" answers with ranges after a short discovery; the two are the owner's to reconcile, and the FAQ does not repeat the quote line beside it | `motion-hire/ia` |
| How we work with you | the four terms, the engagement models, the line under them and the operating detail, the pilot (Week 1, Week 2, Deliverable) on the `pilot` trace hook, the headcount and where the engineers work — every word /about's; closes with Schedule a Call and the ghost "Start a 2-week pilot" | `motion-hire/ia` |
| The FAQ | four buyer objections first — who writes the code, the overlap, who owns the IP, can we start small — in words the site already publishes; "4–8 hours of overlap … Two-week" has its own exemption, since FAQPage carries it. "Can we start small?" ends at the pilot's terms ("Two weeks. Fixed price. Full IP. No obligation.") | `motion-hire/ia` |
| /contact | the `.bf-project` class collision fixed; two columns from 1025px with the calendar in the first viewport, after the h1 on a phone; check 32 holds the form at 480px or wider at 1440. The panel's own Schedule a Call (a jump to the calendar beside it) went, and so did the calendar's blurb, "Or grab an open slot below…", whose "Or" answered it (a cut item in the inventory) | `motion-hire/ia` |
| Mobile | no header Schedule a Call below 520px: it does not fit at 360 (measured, *Design language*); contextual primaries after the proof and after how we work instead — and, at the merge (2026-09-29, the lead designer), ONE more on phones only, after the ledger (`.bf-ledger6__cta`, ≤767px, `data-cta="schedule"` to /contact#schedule): how we work's and the final call's were 7,471px apart at 390; now 2,748 and 4,803 — 2,946 and 5,070 on the merged tree with the client-story band and Logistics (6,700, 9,646 and 14,716 down the page) — one primary in view at a time; no sticky bar. The proof's comes straight after the pair of write-ups, each a phone card of its outcome and result: 1,974px after the hero's at 390, where it was 4,667, and `#recent-work` 3,256px tall there (from 4,412; 3,796 with the client-story band, which puts the proof's call 4,142px above how we work's, from 3,601). The ledger shows no diagram below 768px, where its labels would fall under 13px | `motion-hire/ia` |
| Hierarchy and rhythm | three chapter heads, `clamp(48px, 4.4vw, 64px)` from 1025 — 63px at 1440, inside DECISIONS' 56–64 from 1273, and under the h1 below that, where 56 would have put them above it — every other homepage h2 at 40px, the proof's included, since it shares the first screen with the h1; the final title never above the h1; chips at 12px/600; related sections' padding 80px on a desktop (DECISIONS' 64–80), 64 on a tablet and 56 on a phone, and 128px only above a chapter; 44px hit areas on the homepage's inline links, the hero's proof line at every width; the hero's full-width hairline "false floor" removed | `motion-hire/ia` |
| Honesty cleanup | NIdle Finishing's only proof link 301s to a bare PNG: removed, and the card held back until a working link exists (*Projects and attribution*). The rest of the brief's row 14 is the owner's | `motion-hire/ia` |

**The motion system, "Signal"** (DECISIONS item 9; BRIEF §4; the MOTION
stream). The request names GSAP, so gsap comes in — `gsap@3.15.0`, pinned
exactly; core, ScrollTrigger and DrawSVGPlugin; no `@gsap/react`, SplitText or
Flip — and it reverses this file's "there is no animation library" (*Stack*).
It is spent on the one thing CSS cannot do well: drawing the site's own systems
as they are read — a diagram's connections trace in topology order and then
flow, the Lab concept is only sketched, the delivery rail traces its six
stages, and the last trace on the page runs into Schedule a Call (*Motion, as
built*). It loads only where it runs: after LCP and load, in stages, at
>=1025px with a fine pointer, no reduced motion and no Save-Data — the scene's
own profile — so phones, tablets and anyone who asks for less motion never
download it, and the CSS reveal and flow stay for everyone. The reasons
(BRIEF §4.1, perf.md): as initial JavaScript, gsap pushed a phone's load event
back ~186ms; staged after load it measured no blocking at all; the buyers'
own reference sites ship almost no choreography, so the motion stays quiet and
explains a mechanism or does not ship. The suite learnt to see it: check 25
tells its chunks from the scene's, check 29 fails it before load and measures
CLS while scrolling, check 31 keeps it in one loader, and check 21 sees
script-written motion (*Verify before pushing*).

| question | decision | where |
|---|---|---|
| The library | gsap 3.15.0 — core, ScrollTrigger, DrawSVGPlugin — for the Signal only; the scene never imports it | `motion-hire/motion` |
| Who gets it | >=1025px, a fine pointer, no reduced motion, no Save-Data, watched live; everyone else keeps the CSS motion, which runs until gsap arrives and wherever it never does | `motion-hire/motion` |
| The flow after a trace | Two 1.6s passes (three without a trace), so trace + flow stays under five seconds | `motion-hire/motion` |
| The robotics diagram | A steel 1.4s sketch and no flow: nothing flows in a system that has not shipped. **At the merge (2026-09-29, the lead designer under the owner's honesty rule): no cyan anywhere on any profile** — its connections are dashed steel with steel arrowheads and it carries no flow line, so phones and touch screens no longer flow it either (the owner question the motion stream left); check 33 holds it | `motion-hire/motion`, the merge |
| Pins, smooth scroll, SplitText, count-ups | None (BRIEF §4.6–4.7) | `motion-hire/motion` |

**The hero scene, v2** (the scene stream, `motion-hire/scene`). The research
found the scene well engineered and badly lit: about 95% of the field's pixels
near-black, its lit pixels 3.3% of the viewport, the brightest thing in it a
few specular slivers and the AI wireframe rather than the core, the data flow
its least visible layer, and the robot — Lab work, nothing delivered — drawn
as a solid, lit, connected peer with data flowing to it. So:

1. **Lit graphite, visible flow, a Lab-honest robot and fit-width framing,
   with the watchdog's fades** — the analytic studio and fresnel rim, the
   comets and 1.75px links, the seam band, the steel wireframe on a dashed
   link, a fixed horizontal field of view with the poster contained, and a
   watchdog that steps the drawing buffer down before it fades anything
   (*Motion, as built*; *The hero field*). It changes the t = 0 frame, so the
   poster is re-rendered as `scene-poster-v2-*`. The robot's treatment
   changes what the picture says, deliberately: it is the one scene change
   the evidence tiers ask for, and it is the owner's to confirm.
   **Revised 2026-09-29, after the adversarial review:** upgrade 4's aim —
   modules that stop crossing the core — was not met by lifting the inner
   tier past the front: over the tiers' common period a front module sat on
   the core a quarter of the time, and the AI ran its comets into the Lab
   robot. The tiers now SWAY about the poster's layout instead of orbiting,
   and no module ever crosses the core, the robot or another module
   (measured by the probe's new `overlap` check). It is a change to how the
   scene moves, for the owner to see: the constellation keeps its designed
   composition at every moment rather than turning through it. With it the
   poster is contained at every width (it was cut at 768-1024), drifts
   without scaling, and gains a DPR-1 file so a 1x desktop's crossfade no
   longer brightens its lines.
2. **The CTA charge** — hovering or focusing the hero's Schedule a Call
   brightens the seams about 40% and runs the comets 1.6x, eased over about
   0.6s: the one place the scene answers the page's primary action, and it
   rewards the action rather than competing with it (*Motion, as built*). A
   brighter blue, never amber. Identity at rest, so no poster change.
3. **The exploded view** — the first scroll opens the core into an exploded
   engineering drawing, plate by plate, and scrolling back reassembles it:
   the structure of "one engineering system" shown the way engineers draw
   it (*Motion, as built*). It lives in the first 202px of scroll — 36%
   of the field's height, while the whole stack is still on screen (it was
   55% of the hero's, about 390px, until the merge) — as the hero leaves; the hero is NOT pinned to lengthen it — for a
   buyer, delaying the proof below costs more than the effect earns. Its
   own passive scroll listener, no GSAP; identity at scroll 0, so no poster
   change; frozen by Pause motion.

It stays inside every rule of *The hero field*: no textures, no
post-processing, nothing allocated per frame, built in slices, the poster the
t = 0 frame, the 16px band the ground, desktop and a fine pointer only, the
canvas `pointer-events: none`, no Raycaster, three.js only in
`components/field/scene.ts`, and the chunk 140.8KB of its 180KB.

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
