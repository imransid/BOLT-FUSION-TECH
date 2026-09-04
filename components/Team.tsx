"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

import { useSiteContent } from "@/context/SiteContentContext";
import type { SiteContent } from "@/lib/site-content-schema";

const springSoft = { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.9 };

type TeamMember = SiteContent["team"]["roster"][number];

/**
 * There is deliberately NO profileHref() helper here any more.
 *
 * The old one built `https://x.com/${handle}` for anyone without an explicit
 * mapping, which is how @nadim and @tareq ended up linking to strangers' X
 * accounts. A profile link now comes from ONE place — `member.profileUrl` in the
 * CMS — and a member without one renders a card with no link at all.
 *
 * Entrances are the CSS-only `.ai-rise` (globals.css), declared entirely inside
 * a `prefers-reduced-motion: no-preference` block, so every element's base style
 * is its final style. The framer `initial={reduceMotion ? false : {opacity:0}}`
 * pattern this replaced shipped 19 `opacity:0` declarations in the server HTML,
 * because `useReducedMotion()` returns null during SSR. Scroll parallax below is
 * transform-only and never hides content, so it stays.
 */

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden
    >
      <path d="M200,64V168a8,8,0,0,1-16,0V89.66L69.66,204.24a8,8,0,0,1-11.32-11.32L172.68,78.34H96a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
    </svg>
  );
}

const CARD_BASE =
  "group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/[0.09] " +
  "bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-[#070708] outline-none sm:rounded-3xl";

const CARD_INTERACTIVE =
  " transition-[transform,border-color,box-shadow] duration-500 hover:border-cyan-400/20 " +
  "hover:shadow-[0_32px_80px_-28px_rgba(0,0,0,0.85),0_0_0_1px_rgba(34,211,238,0.06)] " +
  "motion-safe:hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-cyan-300/35 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function TeamMemberCard({
  member,
  index,
  scrollProgress,
  reduceMotion,
  scrollMuted,
}: {
  member: TeamMember;
  index: number;
  scrollProgress: MotionValue<number>;
  reduceMotion: boolean | null;
  scrollMuted: boolean;
}) {
  const depth = (index % 5) - 2;
  const portraitY = useTransform(
    scrollProgress,
    [0, 1],
    scrollMuted ? [0, 0] : [12 + depth * 4, -12 - depth * 4]
  );

  const href = member.profileUrl?.trim();
  const role = member.role?.trim();
  const experience = member.experience?.trim();
  const stack = (member.stack ?? []).filter((s) => s.trim());

  const chrome = (
    <>
      <span
        className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:rounded-3xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(34,211,238,0.08) 0%, transparent 38%, rgba(167,139,250,0.06) 58%, rgba(251,191,36,0.05) 100%)",
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute left-3 top-3 z-[2] rounded-md border border-white/[0.08] bg-black/35 px-1.5 py-0.5 font-mono text-[9px] tabular-nums tracking-[0.16em] text-white/55 backdrop-blur-md"
        aria-hidden
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative z-[1] mx-2.5 mt-11 isolate aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b from-[#faf8f5] to-[#e8e2d9] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65),inset_0_12px_32px_rgba(255,255,255,0.35),0_12px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/20 sm:mx-3 sm:mt-12">
        {member.image ? (
          <motion.div
            className="absolute inset-0 flex items-end justify-center will-change-transform"
            style={{ y: portraitY }}
          >
            <motion.img
              src={member.image}
              alt=""
              className="h-[92%] w-[90%] object-contain object-bottom mix-blend-multiply"
              loading="lazy"
              decoding="async"
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.03 }}
              transition={springSoft}
            />
          </motion.div>
        ) : null}
      </div>

      {/* Hierarchy: name (15px) → role (12px) → experience + stack (10px). Every
          optional line is conditional, so a blank field leaves no gap and no
          orphaned separator — the tags are a flex-wrap row, not a "·" list. */}
      <div className="relative z-[1] flex flex-1 flex-col px-4 pb-5 pt-4 sm:pt-5">
        <h3
          className="text-[15px] font-medium leading-tight tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {member.name}
        </h3>

        {role ? (
          <p className="mt-1.5 text-[12px] leading-snug text-white/72">{role}</p>
        ) : null}

        {experience || stack.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {experience ? (
              /* cyan = measurement, per the codebase convention */
              <span className="rounded border border-cyan-300/25 bg-cyan-300/[0.07] px-1.5 py-0.5 text-[10px] leading-none text-cyan-100/90">
                {experience}
              </span>
            ) : null}
            {stack.map((tech) => (
              <span
                key={tech}
                className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[10px] leading-none text-white/65"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}

        <span className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          {member.handle}
        </span>
      </div>
    </>
  );

  return (
    <li
      className="ai-rise min-h-0"
      style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
    >
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={CARD_BASE + CARD_INTERACTIVE}>
          <span
            className="pointer-events-none absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-white/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-[transform,border-color] duration-300 group-hover:rotate-12 group-hover:border-cyan-400/25 group-hover:text-white sm:right-3 sm:top-3"
            aria-hidden
          >
            <ArrowUpRight />
          </span>
          {chrome}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        /* No verified profile: the card renders in full, minus the link and the
           affordances that would imply one. Never an empty href, never "#". */
        <div className={CARD_BASE}>{chrome}</div>
      )}
    </li>
  );
}

export default function Team() {
  const { team: t } = useSiteContent();
  const roster = t.roster;
  const reduceMotion = useReducedMotion();
  const [wideEnoughForScrollParallax, setWideEnoughForScrollParallax] =
    useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWideEnoughForScrollParallax(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const scrollMuted = Boolean(reduceMotion) || !wideEnoughForScrollParallax;
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const spring = {
    stiffness: scrollMuted ? 9000 : 36,
    damping: scrollMuted ? 110 : 30,
    mass: scrollMuted ? 0.04 : 0.92,
  };
  const scrollProgress = useSpring(scrollYProgress, spring);

  const blobTopY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [64, -64]);
  const blobAmberY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [-88, 88]);
  const dotsY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [32, -32]);
  const headerY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [-28, 28]);
  const statY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [18, -18]);
  const plinthY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [22, -22]);
  const bracketTopY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [-8, 8]);
  const bracketBotY = useTransform(scrollProgress, [0, 1], scrollMuted ? [0, 0] : [8, -8]);

  return (
    <section
      ref={sectionRef}
      id="team"
      aria-labelledby="team-heading"
      className="relative overflow-hidden border-t border-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute -top-32 left-1/2 h-[420px] w-[min(92vw,820px)] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/[0.07] via-white/[0.04] to-violet-400/[0.06] blur-[100px] will-change-transform"
          style={{ y: blobTopY }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[300px] w-[min(58vw,520px)] translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-tr from-amber-400/[0.07] via-orange-400/[0.04] to-transparent blur-[95px] will-change-transform"
          style={{ y: blobAmberY }}
        />
        <motion.div
          className="absolute inset-0 opacity-[0.45] will-change-transform"
          style={{ y: dotsY, transformOrigin: "50% 35%" }}
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,0.09) 0.5px, transparent 0.5px)",
              backgroundSize: "28px 28px",
              maskImage:
                "radial-gradient(ellipse 75% 65% at 50% 40%, black 20%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 65% at 50% 40%, black 20%, transparent 70%)",
            }}
          />
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32 lg:px-16">
        <motion.header
          style={{ y: headerY }}
          className="mb-14 will-change-transform md:mb-20 lg:mb-24 grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20"
        >
          <div className="relative max-w-[800px] space-y-9 pl-0 lg:pl-3">
            <div
              className="absolute left-0 top-2 hidden h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-cyan-300/35 via-amber-200/25 via-50% to-transparent lg:block"
              aria-hidden
            />

            <div className="ai-rise flex flex-wrap items-center gap-4">
              <span
                className="inline-flex h-2 w-2 shrink-0 rotate-45 border border-cyan-300/40 bg-gradient-to-br from-cyan-200/30 via-white/20 to-amber-200/25"
                aria-hidden
              />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.38em] text-white/60">
                {t.benchLabel}
              </span>
              <span
                className="hidden h-px w-16 bg-gradient-to-r from-cyan-300/45 via-amber-200/35 to-transparent sm:block"
                aria-hidden
              />
              <span className="font-mono text-[10px] text-white/55">{t.codeComment}</span>
            </div>

            <div className="space-y-6">
              <h2
                id="team-heading"
                className="ai-rise text-[clamp(2.4rem,5.8vw,5rem)] font-normal leading-[1.02] tracking-[-0.045em] text-white"
                style={{ fontFamily: "var(--font-heading)", animationDelay: "60ms" }}
              >
                <span className="block">{t.headlineLine1}</span>
                <span className="mt-2 block bg-gradient-to-r from-white via-cyan-100/85 to-amber-100/75 bg-clip-text text-transparent">
                  {t.headlineLine2}
                </span>
              </h2>
              <div
                className="h-[2px] max-w-lg rounded-full bg-gradient-to-r from-cyan-300/60 via-amber-200/55 to-transparent"
                aria-hidden
              />
            </div>

            <p
              className="ai-rise max-w-lg text-[15px] leading-[1.7] text-white/65 md:text-[17px]"
              style={{ fontFamily: "var(--font-sans)", animationDelay: "120ms" }}
            >
              {t.subtext}
            </p>
          </div>

          <motion.div
            style={{ y: statY }}
            className="ai-rise will-change-transform flex flex-col items-start gap-6 rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent px-6 py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_48px_-28px_rgba(0,0,0,0.5)] backdrop-blur-md lg:items-end"
          >
            <p className="flex items-baseline gap-2.5">
              {/* Plain text. No count-up, no useState — the real number is in the
                  server-rendered HTML, so crawlers and no-JS visitors see it. */}
              <span
                className="text-5xl font-extralight tabular-nums tracking-tighter text-white md:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {roster.length}
              </span>
              <span className="pb-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/60">
                {t.statLabel}
              </span>
            </p>
            <span className="flex flex-col gap-2" aria-hidden>
              <span className="h-0.5 w-16 rounded-full bg-gradient-to-r from-white/50 to-transparent" />
              <span className="h-0.5 w-10 rounded-full bg-gradient-to-r from-white/30 to-transparent" />
              <span className="h-0.5 w-14 rounded-full bg-gradient-to-r from-white/20 to-transparent" />
            </span>
          </motion.div>
        </motion.header>

        <motion.div
          style={{ y: plinthY }}
          className="ai-rise relative will-change-transform rounded-[1.75rem] border border-white/[0.1] bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_40px_100px_-48px_rgba(34,211,238,0.06)] backdrop-blur-[3px] sm:rounded-[2rem] sm:p-2 md:p-4"
        >
          <motion.div
            style={{ y: bracketTopY }}
            className="pointer-events-none absolute -right-px -top-px z-[2] h-16 w-16 rounded-tr-[1.65rem] border-r border-t border-cyan-400/20 will-change-transform sm:rounded-tr-[1.85rem]"
            aria-hidden
          />
          <motion.div
            style={{ y: bracketBotY }}
            className="pointer-events-none absolute -bottom-px -left-px z-[2] h-12 w-12 rounded-bl-[1.65rem] border-b border-l border-amber-300/18 will-change-transform sm:rounded-bl-[1.85rem]"
            aria-hidden
          />

          <ul
            role="list"
            className="relative z-[1] grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4 list-none p-0 m-0"
          >
            {roster.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                index={index}
                scrollProgress={scrollProgress}
                reduceMotion={reduceMotion}
                scrollMuted={scrollMuted}
              />
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
