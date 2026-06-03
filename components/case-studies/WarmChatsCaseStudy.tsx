"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { LogoMark } from "@/components/Logo";

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

const SITE_URL = "https://www.warmchats.com/";

const HERO = {
  badge: "Case study · AI Automation",
  title: "WarmChats: AI that replies in seconds and books the meeting.",
  subtitle:
    "An always-on AI sales assistant that qualifies inbound leads, replies instantly across channels, and books appointments automatically — so no warm lead ever goes cold.",
  accentLine:
    "Next.js · NestJS · Django · PostgreSQL · Claude · GPT-4.1 · event-driven microservices",
  image: "/projects/warmchats-ai-booking.png",
  imageAlt:
    "WarmChats landing page — 'Stop chasing leads, let AI book appointments for you' — comparing manual follow-up with WarmChats automation",
  summary:
    "Speed-to-lead decides who wins the deal. WarmChats removes the human delay entirely: Claude reads and qualifies every inbound lead, GPT-4.1 holds a natural, on-brand conversation in real time, and the system books the appointment straight into the calendar — 24/7, with every message tracked. We delivered it as an event-driven microservice platform built to scale from first pilot to thousands of concurrent conversations.",
} as const;

const KPIS = [
  { value: "<60s", label: "First response", hint: "AI replies the moment a lead lands — day or night." },
  { value: "3×", label: "More replies", hint: "Instant, conversational follow-up keeps leads engaged." },
  { value: "24/7", label: "Autonomous", hint: "Qualifies, nurtures, and books with no human in the loop." },
  { value: "100%", label: "Tracked", hint: "Every message logged and auditable across channels." },
] as const;

const LANES = [
  {
    step: "01",
    tag: "Qualify",
    title: "Lead intake & scoring",
    summary:
      "Claude reads each inbound lead, infers intent, and routes only the conversations worth pursuing.",
    bullets: [
      "Claude (Opus) classifies intent, urgency, and fit",
      "Noise and spam filtered before a human ever sees it",
      "High-intent leads prioritised and routed instantly",
    ],
    foot: "AI lead selection",
  },
  {
    step: "02",
    tag: "Engage",
    title: "Instant AI replies",
    summary:
      "GPT-4.1 holds a natural, on-brand conversation and answers questions in real time across web and messaging.",
    bullets: [
      "GPT-4.1 conversational replies, tuned per brand voice",
      "Context carried across the full thread, not single messages",
      "Hand-off to a human the moment it's actually needed",
    ],
    foot: "Conversational AI",
  },
  {
    step: "03",
    tag: "Book",
    title: "Automated scheduling",
    summary:
      "The assistant detects intent to meet, offers real availability, and writes the appointment to the calendar.",
    bullets: [
      "Detects booking intent and proposes open slots",
      "Confirms and writes events automatically",
      "Reminders and follow-ups close the no-show gap",
    ],
    foot: "Zero-touch booking",
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
    tagline: "Telephony · Calendar",
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
  "Every inbound lead answered in seconds, around the clock — no staffing required.",
  "Reps freed from repetitive first-touch follow-up to focus on closing.",
  "A complete, searchable record of every AI conversation and booking.",
  "An architecture that scales from pilot to thousands of concurrent chats.",
] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const linkFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

function reveal(delay: number, reduced: boolean) {
  if (reduced) return {};
  return {
    initial: { opacity: 0, y: 14 } as const,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.48, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  };
}

function Divider() {
  return (
    <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent md:my-14" />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
      {children}
    </p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-2.5 text-[clamp(1.35rem,2.8vw,1.9rem)] font-medium leading-snug tracking-[-0.02em] text-white"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      {children}
    </h2>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function WarmChatsCaseStudy() {
  const reduced = !!useReducedMotion();

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            className={`flex items-center gap-2 text-white/75 transition-colors hover:text-white ${linkFocus} rounded-lg`}
          >
            <LogoMark className="h-7 w-7 opacity-90" />
            <span className="text-sm">Bolt Fusion Tech</span>
          </Link>
          <Link
            href="/#recent-work"
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            ← All work
          </Link>
        </div>
      </header>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(251,191,36,0.10),transparent_70%)]"
      />

      <main className="relative mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-20">
        {/* ---------------------------------------------------------------- */}
        {/* HERO                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="flex min-w-0 flex-col gap-7">
            <motion.span
              {...reveal(0, reduced)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/25 bg-amber-300/10 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-200/90"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {HERO.badge}
            </motion.span>

            <motion.h1
              {...reveal(0.04, reduced)}
              className="text-balance text-[clamp(2.1rem,5vw,3.5rem)] font-normal leading-[1.04] tracking-[-0.032em] text-white"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {HERO.title}
            </motion.h1>

            <motion.p
              {...reveal(0.07, reduced)}
              className="max-w-[58ch] text-[15px] leading-[1.7] text-white/65 md:text-base"
            >
              {HERO.subtitle}
            </motion.p>

            <motion.p
              {...reveal(0.09, reduced)}
              className="font-mono text-[11px] leading-relaxed tracking-[0.04em] text-white/45 md:text-[12px]"
            >
              {HERO.accentLine}
            </motion.p>

            <motion.div {...reveal(0.12, reduced)} className="flex flex-wrap gap-3 pt-1">
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-amber-200/40 bg-amber-300 px-6 py-3 text-[13px] font-semibold text-[#1a1d22] transition-all duration-300 hover:bg-amber-200/95 ${linkFocus}`}
              >
                Visit warmchats.com
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
                  <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                </svg>
              </a>
              <Link
                href="/#schedule"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/14 bg-white/[0.03] px-6 py-3 text-[13px] font-medium text-white transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06] ${linkFocus}`}
              >
                Book a similar build
              </Link>
            </motion.div>
          </div>

          <motion.figure
            {...reveal(0.06, reduced)}
            className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-black shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]"
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={HERO.image}
                alt={HERO.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover object-top"
              />
            </div>
            <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/75 px-4 py-3 backdrop-blur-md">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/42">
                Live product
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-white/55">
                warmchats.com
              </span>
            </figcaption>
          </motion.figure>
        </section>

        {/* Executive summary */}
        <motion.div
          {...reveal(0.1, reduced)}
          className="mt-12 rounded-2xl border border-white/[0.07] bg-black/25 py-6 pl-6 pr-5 md:mt-14 md:py-7 md:pl-7 md:pr-6"
        >
          <div className="border-l-2 border-amber-300/40 pl-5">
            <Eyebrow>Executive summary</Eyebrow>
            <p className="mt-3 max-w-[78ch] text-pretty text-sm leading-[1.75] text-white/78 md:text-[15px]">
              {HERO.summary}
            </p>
          </div>
        </motion.div>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* KPIS                                                             */}
        {/* ---------------------------------------------------------------- */}
        <Eyebrow>By the numbers</Eyebrow>
        <Heading>Built for speed-to-lead.</Heading>
        <motion.div
          {...reveal(0.06, reduced)}
          className="mt-8 grid grid-cols-1 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-black/28 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 [&>*:nth-child(3)]:border-t [&>*:nth-child(3)]:border-white/[0.07] sm:[&>*:nth-child(3)]:border-t-0 sm:[&>*:nth-child(odd)]:border-t-0 sm:[&>*:nth-child(2)]:border-t-0"
        >
          {KPIS.map((k) => (
            <article key={k.label} className="flex flex-col px-5 py-6 sm:px-6 lg:px-7">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span
                  className="text-[1.9rem] font-light leading-none text-cyan-200/95 md:text-[2.1rem]"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {k.value}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-100/60">
                  {k.label}
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/50">{k.hint}</p>
            </article>
          ))}
        </motion.div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/35">
          Figures reflect the WarmChats product's automation targets.
        </p>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* PIPELINE                                                         */}
        {/* ---------------------------------------------------------------- */}
        <Eyebrow>How it works</Eyebrow>
        <Heading>Qualify → Engage → Book, fully automated.</Heading>
        <p className="mt-3 max-w-[68ch] text-sm leading-[1.7] text-white/58 md:text-[15px]">
          Each inbound lead flows through three AI stages. The model handles the
          conversation end-to-end and only escalates to a human when it genuinely
          matters.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3 md:items-stretch">
          {LANES.map((lane, i) => (
            <motion.article
              key={lane.step}
              {...reveal(0.05 + i * 0.05, reduced)}
              className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-6 md:p-7"
              style={{ boxShadow: "12px 20px 28px -16px rgba(0,0,0,0.5)" }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-[13px] font-semibold text-white/90">
                  {lane.step}
                </span>
                <span className="rounded-full border border-amber-200/25 bg-amber-300/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200/85">
                  {lane.tag}
                </span>
              </div>
              <h3
                className="mt-5 text-lg font-medium leading-snug text-white"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {lane.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/52">{lane.summary}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-[13px] leading-relaxed text-white/66">
                {lane.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-300/60" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/[0.07] pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
                {lane.foot}
              </p>
            </motion.article>
          ))}
        </div>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* ARCHITECTURE + STACK                                             */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-14">
          {/* Architecture */}
          <div>
            <Eyebrow>Architecture</Eyebrow>
            <Heading>Event-driven microservices.</Heading>
            <p className="mt-3 text-sm leading-[1.7] text-white/58 md:text-[15px]">
              Independent services communicate over events and webhooks, so the AI
              workload scales separately from the API and the web app — and a slow
              third-party never blocks a reply.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {SERVICES.map((svc, i) => (
                <motion.div
                  key={svc.name}
                  {...reveal(0.04 + i * 0.03, reduced)}
                  className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d]/90 p-5 md:p-6"
                >
                  <h4
                    className="text-[15px] font-medium text-white"
                    style={{ fontFamily: "Satoshi, sans-serif" }}
                  >
                    {svc.name}
                  </h4>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-amber-200/70">
                    {svc.tagline}
                  </p>
                  <ul className="mt-3.5 space-y-2 text-[12px] leading-relaxed text-white/60 md:text-[13px]">
                    {svc.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/25" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <motion.div {...reveal(0.08, reduced)} className="mt-6">
              <Eyebrow>Engineering patterns</Eyebrow>
              <ul className="mt-3 flex flex-wrap gap-2">
                {PATTERNS.map((p) => (
                  <li
                    key={p}
                    className="rounded-md border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium leading-snug text-white/76"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Stack */}
          <div>
            <Eyebrow>Technology</Eyebrow>
            <Heading>The full stack.</Heading>
            <div className="mt-7 flex flex-col gap-4">
              {STACK_GROUPS.map((g, gi) => (
                <motion.div
                  key={g.title}
                  {...reveal(0.04 + gi * 0.03, reduced)}
                  className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d]/90 p-5 md:p-6"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    {g.title}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {g.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-white/[0.08] bg-black/35 px-3 py-1.5 text-[12px] leading-snug text-white/78 md:text-[13px]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* OUTCOMES                                                         */}
        {/* ---------------------------------------------------------------- */}
        <Eyebrow>Outcome</Eyebrow>
        <Heading>What the business gets.</Heading>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {OUTCOMES.map((o, i) => (
            <motion.div
              key={o}
              {...reveal(0.04 + i * 0.04, reduced)}
              className="flex gap-4 rounded-2xl border border-white/[0.07] bg-black/28 p-5 md:p-6"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-300/10 text-cyan-200/90" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
                </svg>
              </span>
              <p className="text-[14px] leading-relaxed text-white/72 md:text-[15px]">{o}</p>
            </motion.div>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* CTA                                                              */}
        {/* ---------------------------------------------------------------- */}
        <motion.section
          {...reveal(0.04, reduced)}
          className="mt-14 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.012] px-6 py-10 text-center shadow-[0_28px_72px_-36px_rgba(0,0,0,0.88)] md:px-10 md:py-12"
        >
          <h2
            className="mx-auto max-w-[24ch] text-balance text-[clamp(1.5rem,3.4vw,2.2rem)] font-normal leading-[1.1] tracking-[-0.02em] text-white"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Want an AI that books appointments while you sleep?
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-white/60 md:text-[15px]">
            We design and ship product-grade AI systems — from lead capture to
            booking — on architecture built to scale. Let&apos;s talk about yours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/#schedule"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-amber-200/40 bg-amber-300 px-7 py-3 text-[13px] font-semibold text-[#1a1d22] transition-all duration-300 hover:bg-amber-200/95 ${linkFocus}`}
            >
              Book a strategy call
            </Link>
            <Link
              href="/#recent-work"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/14 bg-white/[0.03] px-7 py-3 text-[13px] font-medium text-white transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06] ${linkFocus}`}
            >
              See more work
            </Link>
          </div>
        </motion.section>

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-white/5 pt-8 text-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
          >
            <LogoMark className="h-6 w-6 opacity-80" />
            Bolt Fusion Tech
          </Link>
          <p className="text-xs text-white/35">
            Custom software &amp; product engineering · UK · Malaysia · Bangladesh
          </p>
        </footer>
      </main>
    </div>
  );
}
