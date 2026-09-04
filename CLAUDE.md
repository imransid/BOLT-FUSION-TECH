# Bolt Fusion Tech — site

Read `PLAN.md` for full context and `COPY.md` for approved copy.
Never invent copy that exists in `COPY.md`.

## Stack
Next.js App Router · TypeScript · Tailwind · Postgres · deployed on Vercel

## Design tokens — always use vars, never hardcode

```
--ink          #0B1015   page base
--strata       #131A22   raised surfaces, lane bands
--rule         #24303B   hairlines, trace rail, lane dividers
--type         #E6EDF3   primary text
--type-quiet   #7D8B99   secondary text
--fast         #37C4A8   teal  — cached/keyword lane, SHIPPED metrics
--paid         #E8A33D   amber — AI lane, cost, TARGET metrics
--fault        #E5484D   errors only

Space   8 / 16 / 24 / 40 / 64 / 96 / 160
Type    76 / 50 / 33 / 22 / 17 / 15 / 13
Radius  3 inputs · 6 cards · 0 lane bands
Grid    12 col · 1200px max · 24px gutter
```

Fonts: Instrument Sans (display + UI), Commit Mono (machine values only).

## Layout motif — the trace rail
A 1px `--rule` vertical line runs down the left of the content column for the whole
page, with a tick at each section. Sections hang off it. Content is left-aligned
throughout. Never centre a section.

## Hard rules

- **Zero stock photography.** Screenshots, real photos, or SVG diagrams only.
- **No fake faces, ever.** Never a template avatar, a stock face, or a generated
  one — not as a placeholder, not "just for now". A section ships without the
  photo slot until real photographs exist. Cited by COPY.md §5.
- **Mono is for machine output only** — query strings, ms, $, model names, stack
  items. Never for decorative labels or eyebrows.
- **Every metric carries a `shipped` or `target` label.** No unlabelled numbers.
- **Two accents encode meaning:** `--fast` = free/fast path, `--paid` = paid/slow
  path. Never use them decoratively.
- **Content lives in typed files under `/content`**, never hardcoded in JSX. These
  become Payload CMS collections in Phase 2.
- Body line length max 68ch.
- Semantic HTML, no heading-level skips, visible keyboard focus everywhere.

## Banned — these read as templated

- Tracked-out ALL-CAPS eyebrow labels above headings
- Meta strings joined with middle dots (`A · B · C`) used as chrome
- `→` appended to link or button text
- One word in a headline coloured or italicised for emphasis
- `01 / 02 / 03` numbering unless the content is genuinely a sequence
  (only the process section and pilot timeline qualify)
- Identical rounded cards with identical shadows for every content type
- Gradient washes as decoration

## Motion

Boldness is spent in exactly ONE place: the hero Query Engine.

Allowed elsewhere — only motion that responds to user action:
- accordion open/close 240ms
- input focus rule draw 200ms
- form submit → success state
- copy-on-click confirmation
- metric band counts up once on first entry (the only non-triggered reveal)

Banned: fade-and-slide-up on every section, hover lift on every card, parallax,
scroll-jacking, kinetic typography, page-transition animations, custom cursors,
magnetic buttons, particle backgrounds.

All motion ≤400ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
`prefers-reduced-motion` respected globally, no exceptions.

## 3D — hero only

- WebGL exists ONLY in the hero. Nowhere else on the site.
- Bundle ≤180KB gzipped, dynamically imported.
- LCP element is a static WebP poster, NOT the canvas.
- Init canvas only after LCP fires, inside `requestIdleCallback`.
- `InstancedMesh` only. No per-frame object allocation. Cap `dpr` at 1.75.
- `IntersectionObserver` must pause the render loop when offscreen.
- Auto-degrade to 1,000 particles if frame time >20ms sustained 2s.
- Mobile: never mount WebGL. Serve the 2D SVG waterfall.
- `prefers-reduced-motion`: static poster only.
- Postprocessing: selective bloom only. No SSAO, DOF, or SSR.
- **Ship the SVG fallback FIRST. WebGL is progressive enhancement.**

## Performance gates — a session is not done until these pass
- Lighthouse 95+ on all four categories
- LCP < 2.0s
- No layout shift from any animation

## Do not touch
`/app/work/warmchats` — copy approved, structure locked.

## Writing voice
Plain verbs, sentence case, active voice. A CTA says what happens: "Start a pilot",
not "Submit". Errors explain what went wrong and how to fix it. No filler.
Never claim a metric without a source label.
