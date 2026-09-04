# Bolt Fusion Tech — approved copy

Placeholders in `{{ }}` need a decision before build. Do not invent values for them.

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
> PostgreSQL ILIKE with PostGIS geo filters. Roughly 80% of traffic, under 80ms.
> `$0 marginal cost`

**Lane 2**
> **AI lane** — complex intent becomes structured retrieval.
> Claude Haiku parses intent to JSON, then OpenAI embeddings and pgvector cosine
> similarity in Postgres. Roughly 20% of traffic, under 1200ms.
> `~$0.001 per search`

**Lane 3**
> **Cache lane** — repeat demand disappears at the edge.
> Redis, 30-second TTL, key is tenant plus query plus geo plus filters plus
> classification. Under 15ms.
> `30–40% hit rate target`

**Metric band** — each carries its label

| Value | Label | Status |
|---|---|---|
| `<100ms` | Search response, 80% of traffic | shipped |
| `~$0.001` | Average cost per AI query | shipped |
| `~90%` | Of AI calls routed to Haiku, not a frontier model | shipped |
| `<60s` | First reply to every inbound lead | target |

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

**Layout note:** two cards on a three-column grid leaves a hole. Use a two-column
grid at `md` and up, letting each card run larger — the screenshots benefit.

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

**If a member has no LinkedIn yet,** render the card without the link rather than
omitting the person or linking to an unverified profile.

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
