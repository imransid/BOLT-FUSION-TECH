import Link from "next/link";

import FigureText from "@/components/FigureText";
import LogoMarkSvg from "@/components/LogoMarkSvg";
import Button from "@/components/techwix/Button";
import CtaPanel from "@/components/techwix/CtaPanel";
import { ArrowUpRightIcon, CheckIcon } from "@/components/techwix/icons";
import { KpiCard, KpiGrid } from "@/components/techwix/Kpi";
import LaneCard from "@/components/techwix/LaneCard";
import PageBanner from "@/components/techwix/PageBanner";
import SectionHeading from "@/components/techwix/SectionHeading";
import Shot from "@/components/techwix/Shot";
import Summary from "@/components/techwix/Summary";
import { Bullets, Tags } from "@/components/techwix/Tags";

/* -------------------------------------------------------------------------- */
/*  Content — approved; the words and the section order are locked            */
/*  (CLAUDE.md, "Do not touch"). Restyled on 2026-09-15 with no copy change.   */
/* -------------------------------------------------------------------------- */

const SITE_URL = "https://www.warmchats.com/";

const HERO = {
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
 * The WarmChats write-up, /work/warmchats, in the site's design. Its sections,
 * in the approved order: the page header (back to all work) and hero, the
 * executive summary, the numbers, how it works, the product, architecture and
 * stack, the outcome, the call to action and the sign-off. The site's header
 * and footer come from the page (components/techwix/PageShell).
 */
export default function WarmChatsCaseStudy() {
  return (
    <>
      {/* HERO — the page header's "All work" link sits at the top of the panel */}
      <PageBanner
        titleId="warmchats-title"
        title={HERO.title}
        eyebrow={HERO.badge}
        back={{ href: "/#recent-work", label: "← All work" }}
        aside={
          <Shot src={HERO.image} alt={HERO.imageAlt} sizes="(min-width: 1025px) 560px, 100vw" priority>
            <figcaption className="tw-shot__caption tw-shot__caption--bar">
              <span>Live product</span>
              <span>warmchats.com</span>
            </figcaption>
          </Shot>
        }
      >
        <p className="tw-banner__lead">
          <FigureText text={HERO.subtitle} />
        </p>
        <p className="tw-banner__meta">{HERO.accentLine}</p>
        <p className="tw-actions">
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="tw-btn tw-btn--light">
            Visit warmchats.com
            <ArrowUpRightIcon className="tw-btn__icon" />
          </a>
          <Button href="/#schedule" variant="secondary">
            Book a similar build
          </Button>
        </p>
      </PageBanner>

      {/* EXECUTIVE SUMMARY and KPIS */}
      <div className="tw-band tw-band--white">
        <div className="tw-band__inner">
          <Summary label="Executive summary">
            <FigureText text={HERO.summary} />
          </Summary>

          <section className="tw-band__inner" aria-labelledby="warmchats-numbers">
            <SectionHeading id="warmchats-numbers" eyebrow="By the numbers" title="Built for speed-to-lead." />
            <div className="tw-group">
              <KpiGrid cols={3} labelledBy="warmchats-numbers">
                {KPIS.map((k) => (
                  <KpiCard key={k.label} value={k.value} label={k.label} hint={k.hint} status={k.status} />
                ))}
              </KpiGrid>
              <p className="tw-note">Figures reflect the WarmChats product&apos;s automation targets.</p>
            </div>
          </section>
        </div>
      </div>

      {/* PIPELINE */}
      <section className="tw-band tw-band--light" aria-labelledby="warmchats-how">
        <div className="tw-band__inner">
          <SectionHeading
            id="warmchats-how"
            eyebrow="How it works"
            title="Qualify → Engage → Book, fully automated."
            intro="Each new lead flows through three AI stages. The model handles the conversation end-to-end and only escalates to the agent when it genuinely matters."
          />
          <ul className="tw-lanes">
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
      <section className="tw-band tw-band--white" aria-labelledby="warmchats-product">
        <div className="tw-band__inner">
          <SectionHeading
            id="warmchats-product"
            eyebrow="The product"
            title="Inside WarmChats."
            intro="The agent-facing product — a live operator dashboard, self-routing AI workflows, and a two-minute setup — all running on the platform we built."
          />
          <div className="tw-col">
            {GALLERY.filter((g) => g.featured).map((g) => (
              <Shot key={g.src} src={g.src} alt={g.title} sizes="(min-width: 1300px) 1300px, 100vw" wide reveal>
                <figcaption className="tw-shot__caption tw-shot__caption--row">
                  <span className="tw-shot__title">{g.title}</span>
                  <span className="tw-shot__text">{g.caption}</span>
                </figcaption>
              </Shot>
            ))}
            <div className="tw-grid-2">
              {GALLERY.filter((g) => !g.featured).map((g) => (
                <Shot key={g.src} src={g.src} alt={g.title} sizes="(min-width: 768px) 50vw, 100vw" reveal>
                  <figcaption className="tw-shot__caption">
                    <span className="tw-shot__title">{g.title}</span>
                    <span className="tw-shot__text">{g.caption}</span>
                  </figcaption>
                </Shot>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE + STACK */}
      <div className="tw-band tw-band--light">
        <div className="tw-band__inner">
          <div className="tw-split">
            <section className="tw-col tw-col--loose" aria-labelledby="warmchats-architecture">
              <SectionHeading
                id="warmchats-architecture"
                eyebrow="Architecture"
                title="Event-driven microservices."
                intro="Independent services communicate over events and webhooks, so the AI workload scales separately from the API and the web app — and a slow third-party never blocks a reply."
              />
              <div className="tw-grid-2">
                {SERVICES.map((svc) => (
                  <div key={svc.name} className="tw-card" data-tw-reveal>
                    <h3 className="tw-title-wrapper">
                      <span className="title-small">{svc.name}</span>
                    </h3>
                    <p className="tw-card__tagline">{svc.tagline}</p>
                    <Bullets items={svc.bullets} />
                  </div>
                ))}
              </div>
              <div className="tw-group" data-tw-reveal>
                <p className="tw-card__label">Engineering patterns</p>
                <Tags items={PATTERNS} />
              </div>
            </section>

            <section className="tw-col tw-col--loose" aria-labelledby="warmchats-stack">
              <SectionHeading id="warmchats-stack" eyebrow="Technology" title="The full stack." />
              <div className="tw-col">
                {STACK_GROUPS.map((g) => (
                  <div key={g.title} className="tw-card" data-tw-reveal>
                    <p className="tw-card__label">{g.title}</p>
                    <Tags items={g.items} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* OUTCOMES */}
      <section className="tw-band tw-band--white" aria-labelledby="warmchats-outcome">
        <div className="tw-band__inner">
          <SectionHeading id="warmchats-outcome" eyebrow="Outcome" title="What the business gets." />
          <ul className="tw-grid-2">
            {OUTCOMES.map((o) => (
              <li key={o} className="tw-card tw-card--soft tw-outcome" data-tw-reveal>
                <span className="tw-outcome__icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                <p>{o}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA, then the sign-off that closed the page */}
      <CtaPanel
        titleId="warmchats-cta"
        title="Want an AI that books appointments while you sleep?"
        text="We design and ship product-grade AI systems — from lead capture to booking — on architecture built to scale. Let's talk about yours."
        after={
          <div className="tw-signoff">
            <Link href="/" prefetch={false} className="tw-signoff__brand">
              <span className="tw-logo__tile" aria-hidden="true">
                <LogoMarkSvg uid="wc-signoff-mark" />
              </span>
              Bolt Fusion Tech
            </Link>
            <p className="tw-signoff__line">Custom software &amp; product engineering in the UK, Malaysia and Bangladesh</p>
          </div>
        }
      >
        <Button href="/#schedule" variant="light">
          Book a strategy call
        </Button>
        <Button href="/#recent-work" variant="secondary">
          See more work
        </Button>
      </CtaPanel>
    </>
  );
}
