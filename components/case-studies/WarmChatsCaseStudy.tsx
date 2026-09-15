import Link from "next/link";

import FigureText from "@/components/FigureText";
import LogoMarkSvg from "@/components/LogoMarkSvg";
import Cta from "@/components/site/Cta";
import CtaBand from "@/components/site/CtaBand";
import { ArrowUpRightIcon, CheckIcon } from "@/components/site/icons";
import { KpiCard, KpiGrid } from "@/components/site/Kpi";
import LaneCard from "@/components/site/LaneCard";
import { Bullets, Tags } from "@/components/site/Lists";
import PageHead from "@/components/site/PageHead";
import SectionHead from "@/components/site/SectionHead";
import Shot from "@/components/site/Shot";
import Summary from "@/components/site/Summary";

/* -------------------------------------------------------------------------- */
/*  Content — approved; the words and the section order are locked            */
/*  (CLAUDE.md, "Do not touch"). Restyled on 2026-09-15 with no copy change.   */
/* -------------------------------------------------------------------------- */

const SITE_URL = "https://www.warmchats.com/";

export const HERO = {
  badge: "Case study: real estate AI",
  title: "WarmChats: turn new real estate leads into booked appointments — automatically.",
  subtitle:
    "An always-on AI assistant for real estate agents. WarmChats instantly answers every new lead from Zillow, open houses, and Facebook, qualifies buyers and sellers, follows up 24/7 on email and SMS, and books showings straight into the calendar — so no lead ever goes cold.",
  accentLine:
    "Next.js, NestJS, Django, PostgreSQL, Claude, GPT-4.1 and event-driven microservices",
  image: "/projects/warmchats-ai-booking.png",
  imageAlt:
    "WarmChats landing page — 'Turn new real estate leads into booked appointments automatically', trusted by agents using Zillow, open houses, and Facebook leads",
  summary:
    "For real estate agents, speed-to-lead decides who gets the showing and wins the listing. WarmChats removes the human delay entirely: Claude reads and qualifies every new lead — buyer or seller — GPT-4.1 holds a natural, on-brand conversation across email and SMS, and the system books the appointment straight into the calendar, 24/7, with every message tracked. We delivered it as an event-driven microservice platform built to scale from a solo agent's first pilot to a brokerage running thousands of concurrent conversations.",
} as const;

type Kpi = { value: string; label: string; hint: string; status: "shipped" | "target" };

/* Every figure carries a shipped or target label (CLAUDE.md hard rule; the
   /work/warmchats lock yields to it). The caption under the grid calls these
   figures the product's "automation targets"; <60s is also content/metrics.ts
   `first-reply`, status target. */
const KPIS: readonly Kpi[] = [
  { value: "<60s", label: "First response", hint: "AI replies the moment a new lead lands — Zillow, open house, or Facebook.", status: "target" },
  { value: "24/7", label: "Autonomous", hint: "Qualifies, nurtures, and books showings with no agent in the loop.", status: "target" },
  { value: "100%", label: "Tracked", hint: "Every lead, message, and booking logged across email and SMS.", status: "target" },
];

const LANES = [
  {
    step: "01",
    tag: "Qualify",
    title: "Lead intake & buyer/seller routing",
    summary:
      "Claude reads every new lead, works out whether they're a buyer or a seller and how ready they are, and routes them into the right flow automatically.",
    bullets: [
      "Claude classifies intent — buyer, seller, urgency, and fit",
      "Leads self-route: Buyer → Nurture, Seller → Nurture, Appointment → Booking",
      "Spam and tyre-kickers filtered before they reach the agent",
    ],
    foot: "AI lead routing",
  },
  {
    step: "02",
    tag: "Engage",
    title: "Instant replies on email & SMS",
    summary:
      "GPT-4.1 answers within 60 seconds in the agent's voice, asks the right qualifying questions, and keeps the conversation warm around the clock.",
    bullets: [
      "GPT-4.1 replies in under 60s, tuned to the agent's brand voice",
      "Context carried across the whole thread and both channels",
      "Hands off to the agent the moment a human is genuinely needed",
    ],
    foot: "Conversational AI",
  },
  {
    step: "03",
    tag: "Book",
    title: "Showings booked automatically",
    summary:
      "The assistant detects intent to meet, offers real availability, and writes the showing or call straight into the calendar.",
    bullets: [
      "Detects booking intent and proposes open slots",
      "Confirms and writes appointments automatically",
      "Reminders and re-engagement close the no-show gap",
    ],
    foot: "Zero-touch booking",
  },
] as const;

const GALLERY = [
  {
    src: "/projects/warmchats-dashboard.png",
    title: "Operator dashboard",
    caption:
      "Estimated pipeline value, hot leads, appointments, and AI wins — everything the agent needs in one view.",
    featured: true,
  },
  {
    src: "/projects/warmchats-ai-agent.png",
    title: "AI Agent — leads route themselves",
    caption:
      "Buyer Nurture, Seller Nurture, Re-Engagement, Booking Flow, and Human Takeover, triggered automatically.",
    featured: false,
  },
  {
    src: "/projects/warmchats-onboarding.png",
    title: "Two-minute onboarding",
    caption:
      "Connect email or SMS and the AI goes live across the agent's channels in a guided 3-step setup.",
    featured: false,
  },
] as const;

const STACK_GROUPS = [
  { title: "Frontend", items: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
  { title: "Services", items: ["NestJS", "Django", "REST + Webhooks", "Queue workers"] },
  { title: "Data", items: ["PostgreSQL", "Redis", "Event log", "ORM / migrations"] },
  { title: "AI", items: ["Claude (Opus)", "GPT-4.1", "Prompt orchestration", "Guardrails"] },
  { title: "Messaging & infra", items: ["Telephony / SMS", "Webhooks", "Docker", "CI/CD"] },
] as const;

const SERVICES = [
  {
    name: "Web & dashboard",
    tagline: "Next.js",
    bullets: [
      "Marketing site, auth, and operator dashboard",
      "Live conversation view with full message history",
    ],
  },
  {
    name: "API gateway",
    tagline: "NestJS",
    bullets: [
      "Typed gateway for web, webhooks, and integrations",
      "Auth, rate limiting, and event publishing",
    ],
  },
  {
    name: "AI orchestration",
    tagline: "Django + LLMs",
    bullets: [
      "Claude lead scoring + GPT-4.1 reply generation",
      "Prompt templates, retries, and safety guardrails",
    ],
  },
  {
    name: "Messaging & scheduling",
    tagline: "Telephony and calendar",
    bullets: [
      "Inbound/outbound across SMS and chat channels",
      "Availability lookup and automated booking writes",
    ],
  },
] as const;

const PATTERNS = [
  "Event-driven",
  "Microservices",
  "Async workers",
  "Idempotent webhooks",
  "Audit log",
  "Horizontal scale",
] as const;

const OUTCOMES = [
  "Every new lead — Zillow, open house, or Facebook — answered in seconds, day or night, with no extra staffing.",
  "Agents freed from repetitive first-touch follow-up to focus on listings and closings.",
  "A complete, searchable record of every conversation, qualification, and booking.",
  "An architecture that scales from a solo agent to a brokerage running thousands of concurrent chats.",
] as const;

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The WarmChats write-up, /work/warmchats, in the site's one design (restyled
 * 2026-09-16 with every word and the section order kept; CLAUDE.md, "Do not
 * touch"). Its sections, in the approved order: the page head (back to all
 * work) and hero, the executive summary, the numbers, how it works, the
 * product, architecture and stack, the outcome, the call to action and the
 * sign-off. The site's header and footer come from the page
 * (components/site/SiteShell).
 *
 * Its buttons keep their approved labels — "Book a similar build", "Book a
 * strategy call" — and are the ghost variant with no `data-cta`: the primary
 * fill and `data-cta="schedule"` are Schedule a Call's (SPEC §1, §8).
 */
export default function WarmChatsCaseStudy() {
  return (
    <>
      {/* HERO — the page header's "All work" link sits at the top of the head */}
      <PageHead
        id="warmchats-title"
        title={HERO.title}
        eyebrow={HERO.badge}
        back={{ href: "/#recent-work", label: "← All work" }}
        size="long"
        aside={
          <Shot src={HERO.image} alt={HERO.imageAlt} sizes="(min-width: 1025px) 520px, calc(100vw - 32px)" priority>
            <figcaption className="bf-shot__caption bf-shot__caption--bar">
              <span>Live product</span>
              <span>warmchats.com</span>
            </figcaption>
          </Shot>
        }
      >
        <p className="bf-lead">
          <FigureText text={HERO.subtitle} />
        </p>
        <p className="bf-pagehead__meta">{HERO.accentLine}</p>
        <p className="bf-actions">
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="bf-btn bf-btn--ghost bf-btn--md">
            Visit warmchats.com
            <ArrowUpRightIcon className="bf-btn__icon" />
          </a>
          <Cta href="/contact#schedule" variant="ghost">
            Book a similar build
          </Cta>
        </p>
      </PageHead>

      {/* EXECUTIVE SUMMARY and KPIS */}
      <div className="bf-section">
        <div className="bf-wrap">
          <Summary label="Executive summary">
            <FigureText text={HERO.summary} />
          </Summary>

          <section className="bf-subsection" aria-labelledby="warmchats-numbers">
            <SectionHead id="warmchats-numbers" eyebrow="By the numbers" title="Built for speed-to-lead." />
            <KpiGrid cols={3} labelledBy="warmchats-numbers">
              {KPIS.map((k) => (
                <KpiCard key={k.label} value={k.value} label={k.label} hint={k.hint} status={k.status} />
              ))}
            </KpiGrid>
            <p className="bf-note">Figures reflect the WarmChats product&apos;s automation targets.</p>
          </section>
        </div>
      </div>

      {/* PIPELINE */}
      <section className="bf-section" aria-labelledby="warmchats-how">
        <div className="bf-wrap">
          <SectionHead
            id="warmchats-how"
            eyebrow="How it works"
            title="Qualify → Engage → Book, fully automated."
            lead="Each new lead flows through three AI stages. The model handles the conversation end-to-end and only escalates to the agent when it genuinely matters."
          />
          <ul className="bf-lanecards">
            {LANES.map((lane) => (
              <LaneCard
                key={lane.step}
                marker={lane.step}
                tag={lane.tag}
                title={lane.title}
                summary={<FigureText text={lane.summary} />}
                bullets={lane.bullets}
                foot={lane.foot}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* PRODUCT GALLERY */}
      <section className="bf-section" aria-labelledby="warmchats-product">
        <div className="bf-wrap">
          <SectionHead
            id="warmchats-product"
            eyebrow="The product"
            title="Inside WarmChats."
            lead="The agent-facing product — a live operator dashboard, self-routing AI workflows, and a two-minute setup — all running on the platform we built."
          />
          <div className="bf-gallery">
            {GALLERY.filter((g) => g.featured).map((g) => (
              <Shot key={g.src} src={g.src} alt={g.title} sizes="(min-width: 1300px) 1240px, calc(100vw - 32px)" wide reveal>
                <figcaption className="bf-shot__caption bf-shot__caption--row">
                  <span className="bf-shot__title">{g.title}</span>
                  <span className="bf-shot__text">{g.caption}</span>
                </figcaption>
              </Shot>
            ))}
            <div className="bf-grid-2">
              {GALLERY.filter((g) => !g.featured).map((g) => (
                <Shot key={g.src} src={g.src} alt={g.title} sizes="(min-width: 768px) 50vw, calc(100vw - 32px)" reveal>
                  <figcaption className="bf-shot__caption">
                    <span className="bf-shot__title">{g.title}</span>
                    <span className="bf-shot__text">{g.caption}</span>
                  </figcaption>
                </Shot>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE + STACK */}
      <div className="bf-section">
        <div className="bf-wrap bf-split">
          <section className="bf-col" aria-labelledby="warmchats-architecture">
            <SectionHead
              id="warmchats-architecture"
              eyebrow="Architecture"
              title="Event-driven microservices."
              lead="Independent services communicate over events and webhooks, so the AI workload scales separately from the API and the web app — and a slow third-party never blocks a reply."
            />
            <div className="bf-grid-2">
              {SERVICES.map((svc) => (
                <div key={svc.name} className="bf-card" data-bf-reveal>
                  <h3 className="bf-card__name">{svc.name}</h3>
                  <p className="bf-card__tagline">{svc.tagline}</p>
                  <Bullets items={svc.bullets} />
                </div>
              ))}
            </div>
            <div className="bf-group" data-bf-reveal>
              <p className="bf-card__label">Engineering patterns</p>
              <Tags items={PATTERNS} />
            </div>
          </section>

          <section className="bf-col" aria-labelledby="warmchats-stack">
            <SectionHead id="warmchats-stack" eyebrow="Technology" title="The full stack." />
            <div className="bf-stackgroups">
              {STACK_GROUPS.map((g) => (
                <div key={g.title} className="bf-card" data-bf-reveal>
                  <p className="bf-card__label">{g.title}</p>
                  <Tags items={g.items} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* OUTCOMES */}
      <section className="bf-section" aria-labelledby="warmchats-outcome">
        <div className="bf-wrap">
          <SectionHead id="warmchats-outcome" eyebrow="Outcome" title="What the business gets." />
          <ul className="bf-outcomes">
            {OUTCOMES.map((o) => (
              <li key={o} className="bf-outcome" data-bf-reveal>
                <CheckIcon className="bf-outcome__icon" />
                <p>{o}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA, then the sign-off that closed the page */}
      <CtaBand
        titleId="warmchats-cta"
        title="Want an AI that books appointments while you sleep?"
        text="We design and ship product-grade AI systems — from lead capture to booking — on architecture built to scale. Let's talk about yours."
        after={
          <div className="bf-signoff">
            <Link href="/" prefetch={false} className="bf-signoff__brand">
              <span className="bf-signoff__tile" aria-hidden="true">
                <LogoMarkSvg />
              </span>
              <span>Bolt Fusion Tech</span>
            </Link>
            <p className="bf-signoff__line">Custom software &amp; product engineering in the UK, Malaysia and Bangladesh</p>
          </div>
        }
      >
        <Cta href="/contact#schedule" variant="ghost">
          Book a strategy call
        </Cta>
        <Cta href="/#recent-work" variant="ghost">
          See more work
        </Cta>
      </CtaBand>
    </>
  );
}
