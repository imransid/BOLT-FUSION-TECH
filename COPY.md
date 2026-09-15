# Bolt Fusion Tech — approved copy

Placeholders in `{{ }}` need a decision before build. Do not invent values for them.

**Restyled with no copy change, 2026-09-15.** The owner moved the whole site to
the new design. /work, both write-ups (/work/warmchats and
/work/restaurant-search), /privacy-policy and the 404 were restyled; not a word
of their copy changed, and /work/warmchats keeps its section order.
`scripts/content-inventory.json` (verify-site check 30) holds every required
word on every page. The 404's words are the ones it always showed — "404" and
"This page could not be found." — and its one button reuses the privacy
policy's "← Back to boltfusiontech.com". The share image kept its words too.

---

## 1. Hero

**H1**
> We build AI systems that are still running in six months.

**Sub**
> Senior engineers, published architecture, and a named team before you sign.
> Production MVP in 8–16 weeks.

**Buttons**
`Start a 2-week pilot` · `Book a technical call`

**Supporting line** (plain sentence, not a dotted meta string)
> Senior-only teams, named engineers up front, 4–8 hours of overlap with US and EU,
> and you own the IP.

**Query Engine input placeholder**
> Type a restaurant search and watch it route

---

## 2. Trust rail

> Live in production at warmchats.com. Ten engineers across the UK, Malaysia and
> Bangladesh.

**Amended 2026-09-15: six → ten.** The owner restored the team to ten (§5): six
with a verified LinkedIn, four with profiles pending. The trust rail is not
rendered anywhere on the site today.

*History, superseded 2026-09-15:* **Amended 2026-09-11: ten → six.** The site
lists six engineers — the six with a verified LinkedIn (§5, amended). A draft
saying ten while the site shows six is exactly what a later copy pass would
restore by accident. Raise the number when a verified profile is added to the
Team section, not before.

---

## 3. Architecture

**H2**
> Type a query. Watch what it costs.

**Intro**
> Most AI products die after launch — too slow, too expensive, too unstable. This is
> the routing we built so one didn't. Every query is classified before any paid
> inference runs, so most traffic never reaches a model.

**Lane 1**
> **Keyword lane** — simple intents, no model call.
> PostgreSQL ILIKE with PostGIS geo filters. Roughly 80% of traffic [target], under 80ms.
> `$0 marginal cost`

**Lane 2**
> **AI lane** — complex intent becomes structured retrieval.
> Claude Haiku parses intent to JSON, then OpenAI embeddings and pgvector cosine
> similarity in Postgres. Roughly 20% of traffic [target], under 1200ms.
> `~$0.001 per search` [target]

**Lane 3**
> **Cache lane** — repeat demand disappears at the edge.
> Redis, 30-second TTL, key is tenant plus query plus geo plus filters plus
> classification. Under 15ms.
> `30–40% hit rate target`

**Metric band** — each carries its label

| Value | Label | Status |
|---|---|---|
| `<100ms` | Search response, 80% of traffic [target] | shipped |
| `~$0.001` | Average cost per AI query | target |
| `~90%` | Of AI calls routed to Haiku, not a frontier model | shipped |
| `<60s` | First reply to every inbound lead | target |

**Relabelled 2026-09-15: the 80% share is a target too.** It is the complement of the
~20%, with the same history and no source. `<100ms` stays shipped; the 80% in its
label carries its own target chip.

**Relabelled 2026-09-12: both are budgets.** `~$0.001` and the AI lane's "roughly
20% of traffic" are targets, not measurements. The 2026-05-02 write-up calls the
cost "budgeted" and "Budgeted hybrid retrieval" and says the architecture "caps
model spend at roughly" that figure; the `shipped` in this table arrived on
2026-09-05 with no source, and nothing in any repo, doc or branch holds a
measurement of either figure. The earliest evidence wins over a later unsourced
claim. `[target]` above marks where the page puts a target chip beside the
figure. CLAUDE.md, "A figure labelled shipped with nothing behind it".

**Closing line**
> Every figure here comes from a system we shipped, and every one is labelled with
> whether it's measured or targeted. Ask on the call and we'll walk you through the
> architecture.

**Link**
`Read the full architecture` → `/work/restaurant-search`

---

## 4. Work

**H2**
> Two products, two write-ups.

**Intro**
> Each one has a full technical write-up, not a screenshot and a sentence.

Projects: WarmChats · Intelligent restaurant search

**Why two, not three.** OPAL's only asset is an AI-generated mockup and it has no
write-up, so it cannot be substantiated. Two projects with two real write-ups is a
stronger page than three where one is an empty frame — and it keeps the section's
own promise, which is that every card leads somewhere. Add a third when a real
screenshot and a real write-up both exist; the content layer takes it without any
component change.

~~**Layout note:** two cards on a three-column grid leaves a hole. Use a two-column
grid at `md` and up, letting each card run larger — the screenshots benefit.~~

**Superseded 2026-09-11 — leave the layout alone.** The section is a horizontal
carousel, not a grid, so the note describes a layout that does not exist. Two cards
on a two-column grid is a different decision, and it has not been made.

**As built on the rebuilt homepage (2026-09-14):** the carousel went with the old
homepage. The section is now the clone design's case-study row — a larger card
beside a smaller one, stacked on phones. The copy above is unchanged.

## 4a. /work — every approved project, labelled by who built it (decided 2026-09-15)

The homepage section above keeps its two write-ups. /work shows every project the owner
approved on 2026-09-15, in four sections, each card labelled with who built it (CLAUDE.md,
"Projects and attribution"). The words and facts are the owner's portfolio's
(imran-khan-chi.vercel.app); nothing is invented. OPAL is back, as an in-house product with a
real screenshot of the live store and never the AI mockup, so "Why two, not three" still holds
for the homepage and no longer for /work.

**Banner** — the approved lead stays, and a second line follows it:
> Below the write-ups: the other products we built, for clients and for ourselves, and what
> our engineers shipped at previous employers. Every card says who built it.

**Sections**, in order: Case studies. Bolt Fusion projects. In-house products. Our engineers'
track record, with one line:
> Work our engineers shipped at previous employers — credited to them, not claimed as ours.

**Labels** — one per kind, above the project's name on every card:
- Case study: built by Bolt Fusion (for WarmChats, Inc.)
- Delivered project: built by Bolt Fusion (for Balanzify Inc.)
- Delivered project: features built by Bolt Fusion for Bazzile Technology SA / GodConnect LTD —
  feature work inside another company's app (decided 2026-09-16)
- In-house product: our own, not built for a client
- Track record: built by our engineer at Brain Station 23 / Intellier, not by Bolt Fusion

**Projects**:
- Case studies: WarmChats (built for WarmChats, Inc.; backend lead) and restaurant search.
- Bolt Fusion projects: FanLock (backend lead), Balanzify (built for Balanzify Inc.; in
  production, Jul 2025 – ongoing) and Go Style Business (backend lead; in production).
- Bolt Fusion feature work, under the products in the same section, with its own heading:
  > Features we shipped into other companies’ apps

  Bazzile (features built for Bazzile Technology SA: swipe-based browsing, Google Maps location
  matching and Firebase real-time sync in its React Native app; live, Jan 2025 – Jul 2025) and
  GodConnect Online (features built for GodConnect LTD: "Feature work in the React Native app";
  live, 2023 – 2024). Text cards with App Store and Google Play links, no screenshots.
- In-house: OPAL.
- Our engineers' track record: Go Smart (Modhumoti Bank's digital banking app, built at Brain
  Station 23, 2020–2022; Software Engineer) and NIdle Finishing (built at Intellier, Nov 2023 –
  Feb 2024; Senior Software Engineer). No screenshots: the products are someone else's.

**Why "features built by Bolt Fusion for …" (owner, 2026-09-16).** Bazzile and GodConnect Online
were delivered through Bolt Fusion, but as features inside apps other companies own. "Built by
Bolt Fusion" would claim the whole app. So the label says "features", names the owner, and the
role names only features the portfolio says were ours. The portfolio does not say which of
GodConnect's features were ours, so its card names none. The cards have no screenshots, because
the apps' screens belong to their owners; showing one needs the owner's permission, which is a
separate decision. Bazzile's "70,000 downloads" is the client's growth, not ours, and is never
written.

**Homepage link** — `See all work (N projects)`, beside `See all case studies`. N is counted
from `content/projects.ts`, never typed: the published projects that are ours, the feature work
included, without the track record.

**Meta description for /work** — "Architecture-level write-ups of the systems we shipped, the
other products we built, and our engineers' track record, each labelled with who built it."

**Excluded — never write them:** the Jumatechs apps (Myrep, IQ Test, Cleva, Bidesh App), Bangladesh
RAB, Team Pharma and JTI Sheikh. The reasons are in CLAUDE.md.

**Held back until the owner answers:** Playzone (its live URL shows a different product). The
reasons are in CLAUDE.md. Bazzile and GodConnect Online were held back here until 2026-09-16
(no employer on record); the owner placed them as Bolt Fusion feature work, above.

---

## 5. The engineers

**H2**
> You'll meet them before you sign.

**Body**
> Your first call is with the engineer who will write the code, not a salesperson.
> Engineers are named and assigned before the contract, and every profile links to
> a public LinkedIn so you can verify us yourself.

**Cards — interim layout, no photos.** Photos are not available yet, so the section
ships text-forward: name, role, stack, years, LinkedIn. No image frame, no monogram,
no placeholder tile. Ten empty frames read as unfinished; a clean text list reads as
deliberate.

Add the photo slot when real photographs exist. Never a template avatar, a stock
face, or a generated one — see CLAUDE.md, "No fake faces, ever."

**Amended 2026-09-15:** a pending card (below) carries an initials monogram —
text, in the corner where a verified card carries its arrow, never a face. A
verified card still carries none.

~~**If a member has no LinkedIn yet,** render the card without the link rather than
omitting the person or linking to an unverified profile.~~

*History, superseded 2026-09-15:* **Amended 2026-09-11 — only people with a verified
LinkedIn are listed.** A member without one is not shown until it exists, and an
unverified profile is never linked. The struck rule was written when there were no
photos and no roles and a card was only a name. It now conflicts with the stronger rule
that every claim on the site is verifiable: a named engineer nobody can look up is
exactly the claim this section exists to disprove. With the amendment, the body's
"every profile links to a public LinkedIn" is true of every card.

**Amended 2026-09-15 — ten engineers, four with profiles pending.** The owner restored
the team to ten: "Team should be there 10 people, placeholder now, I'll upload the data
later." The six with a verified LinkedIn are unchanged. Nadim, Joinal, Arifur Rahman
and Tareq — on the original roster, off it since 2026-09-11 — are back by name only,
never with the strangers' GitHub handles or the template faces their old cards
carried. Each is shown as profile pending: the name, initials and "Profile coming
soon", with no link and no Person markup. An unverified profile is still never linked;
what changed is that a real team member without one is named instead of left out.

- **Stat:** counted from the roster, never written — "10 engineers" and "6 verified
  profiles". It read "6 specialists".
- **Subtext:** "Each verified card opens the engineer's LinkedIn profile in a new
  tab—so you can see who you would work with before you commit scope or budget." One
  word added, so it stays true of the cards it describes.
- The body above ("every profile links to a public LinkedIn") is still true: a pending
  member has no profile on the site yet.

---

## 6. How we work

**H2**
> How a project actually runs.

**Sequence** — this content is genuinely a sequence, so numbering is allowed

**1. Discovery and plan**
> We agree on users, success metrics, constraints and risks, then produce a technical
> approach and milestone plan so everyone knows what "done" means and when.

**2. Build in iterations**
> Working software every cycle, with demos, an open backlog, and early integration of
> auth, data and deployments — so problems surface when they are cheap to fix.

**3. Launch and operate**
> Release with monitoring, runbooks and a sensible cutover. We support stabilisation
> after go-live and hand the system over properly.

**Engagement models** — no price column in v1. Pilot price is the only published
number; full bands move to /how-we-work in Phase 2.

| Model | Shape | Timeline |
|---|---|---|
| MVP build | Scope, architecture, shippable v1 | 8–16 weeks |
| Embedded team | Roadmap delivery with your PMs | Ongoing |
| Stabilise and scale | Performance, reliability, maintainability | As needed |

**Line under the table**
> Most engagements start with the two-week pilot below. We'll give you a full quote
> for the wider build at the end of it, once we've seen the real codebase.

**Operating detail**
> Two-week sprints, a demo at the end of each, a named escalation contact, and a
> written weekly report. Ask for a sample report and we'll send a real one.

---

## 7. The pilot

**H2**
> Two weeks. Fixed price. Full IP. No obligation.

**Body**
> A scoped slice of your real product, not a demo. You keep everything whether you
> continue or not.

**Timeline** — a sequence, numbering allowed
> **Week 1** — architecture and a working vertical slice
> **Week 2** — iterate, harden, and write the handover document

**Deliverable**
> Running code in your repository, on your infrastructure, with a handover doc.

**Price** — {{ pilot price }}

**Button** — `Start a pilot`

---

## 8. Three doors

> **For engineers** — the full architecture write-up
> **For finance** — pricing, engagement models and pilot terms
> **For procurement** — IP assignment, NDA, security practices and handover

---

## 9. Objections

**H2**
> The questions you should be asking.

**Superseded for the site, 2026-09-11.** The FAQ the homepage renders — five
questions, `faq.items` in the site content — is canonical, and the FAQPage structured
data is generated from it. The six below are not rendered anywhere; they reached the
site only as structured data, which is how the markup and the page came to disagree.
Do not copy them back into a second source.

**Who exactly writes my code?**
> Named engineers, assigned before the contract, with public LinkedIn profiles. Your
> first technical call is with them. If we ever need to change who is on your project,
> we tell you before it happens.

**What happens outside overlap hours?**
> You get 4–8 hours of overlap with US and EU working days. Outside that window, work
> continues asynchronously against the agreed sprint scope, and there is a named
> escalation contact for anything urgent.

**Who owns the IP, and when?**
> You do. IP is assigned on payment, and we sign an NDA before scoping — before you
> share anything sensitive.

**What if we want to bring this in-house in a year?**
> That's a normal outcome and we plan for it. Every engagement ends with handover
> documentation, architecture decision records, and a walkthrough with your team.

**Can you work in a codebase you didn't write?**
> Yes. We start with a short audit — dependencies, test coverage, deployment path,
> known risks — and give you a written assessment before proposing any work.

**What does week one look like?**
> Kickoff, access and environment setup, an architecture session, and a scoped backlog
> for sprint one. You see working software by the end of week two.

---

## 10. Contact

**H2**
> Tell us what you need to ship.

**Body**
> Share your goals, timeline and constraints. We'll reply with an honest view on fit,
> a suggested approach, and what it would cost.

**Fields**
Name · Work email · Company · Project type · Budget band · Target timeline · Message

**Button** — `Send` → success state reads `Sent`

**Secondary**
> Prefer to talk first? Book a 30-minute technical call.

**Empty/error voice**
> Error: `That email address doesn't look right. Check it and send again.`
> Success: `Sent. You'll hear from an engineer within one working day.`

---

## Removed from the homepage — decided 2026-09-11

**The nav's "About" link — removed 2026-09-15.** With the About section cut, the link
pointed at the Team section, next to the "Team" link: two items for one place, one of them
promising a section that no longer exists. "Services" stays, pointing at the engagement
table — what someone buys.

The homepage rebuild (`redesign/techwix-home`) keeps six sections that argue:
the hero with its proof strip, the two write-ups, the architecture, how we work,
the team, and questions and contact. The blocks below were on the old homepage
and were **cut deliberately**. They are recorded here so a later copy pass does
not restore them.

**About** — "Why Bolt Fusion Tech", its bio ("Clients come to us when delivery
has to be predictable…"), six capability chips and three engagement types. Cut:
generic reassurance any firm could write. The engagement types repeated the
engagement models table in How we work, which stays.

**Services** — "What we deliver", "Services", its intro ("Practical engineering
aligned to your roadmap…"), six tech-stack chips, four cards and their buttons.
Cut: a "we do everything" card grid.

**Both chip lists** — the six capabilities under About (Web & mobile apps, APIs &
integrations, Cloud & DevOps, Product discovery, UI/UX engineering, Quality &
launch readiness) and the six technologies under Services (TypeScript & React,
Next.js & Node, Mobile (iOS / Android), AWS & cloud-native, API design, Automated
testing). Cut, in the owner's words:

> Six capabilities and six technologies is "we do everything" in a different
> shape. The engagement table says what someone buys, and the architecture
> section shows the real stack in context, which is stronger than a badge row.

Also gone from the homepage: the standalone metric band, whose four figures now
sit in the hero's proof strip, each still labelled and linked to its source; and
the clone theme's testimonials, logo wall, video buttons, dropdown menu and
back-to-top widget.

`scripts/content-inventory.json` marks About and Services `cut`, so verify-site
check 30 fails if any of their text comes back. The `about` and `services`
blocks in `content/site.ts` are rendered by nothing.

---

## Company description — canonical

This is the single source for the organisation description. It is used verbatim
for schema.org `Organization.description`, `llms.txt`, and the LinkedIn company
page, so all three say the same thing. It deliberately asserts NO headcount —
see PLAN.md §7 on entity consistency.

> We build AI systems that are still running in six months.
>
> Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh. We build production AI, custom software and platform work for teams who need systems that hold up after launch — not demos.
>
> How we work: named engineers assigned before you sign, 4–8 hours of overlap with US and EU working days, IP assigned on payment, and an NDA before scoping. Your first call is with the engineer who writes the code.
>
> Most engagements start with a two-week paid pilot: a scoped slice of your real product, fixed price, full IP, no obligation.
>
> Live work: warmchats.com

The meta description is the first two sentences of the above, trimmed for length.

---

## Words to avoid site-wide
elite · cutting-edge · world-class · seamless · robust · leverage · synergy ·
best-in-class · game-changing · transform your business

## Never write
- A number without a `shipped` or `target` label
- A claim about a project we can't link to
- "Trust us" in any form
