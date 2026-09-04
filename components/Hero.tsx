"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useSiteContent } from "@/context/SiteContentContext";

const HeroParticleField = dynamic(
  () => import("@/components/HeroParticleField"),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function Hero() {
  const { hero: h } = useSiteContent();

  // Line 2 carries the hero's single amber phrase. Split on the FIRST occurrence
  // so each fragment renders exactly once; if a CMS edit drops the substring from
  // line 2, `accentAt` is -1 and line 2 degrades to plain text instead of breaking.
  const accent = h.headlineLine2Accent.trim();
  const accentAt = accent ? h.headlineLine2.indexOf(accent) : -1;
  const line2 =
    accentAt >= 0
      ? {
          before: h.headlineLine2.slice(0, accentAt),
          accent: h.headlineLine2.slice(accentAt, accentAt + accent.length),
          after: h.headlineLine2.slice(accentAt + accent.length),
        }
      : null;

  return (
    <section
      id="hero"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip"
    >
      {/* Premium background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />

        {/* Interactive curl-noise particle nebula (decorative, cursor-reactive) */}
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <HeroParticleField />
        </div>

        <div className="absolute left-1/2 top-[20%] z-[2] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-200/[0.07] blur-[88px] md:h-[460px] md:w-[460px] md:blur-[110px]" />
        <div className="absolute bottom-[10%] right-[8%] z-[2] hidden h-[300px] w-[300px] rounded-full bg-amber-200/[0.05] blur-[95px] md:block" />
        <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.09),transparent_52%)]" />
        {/* Center vignette keeps the headline legible over the additive glow */}
        <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_50%_42%,rgba(0,0,0,0.5),rgba(0,0,0,0.16)_36%,transparent_60%)]" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      <div className="relative z-10 mx-auto flex min-w-0 w-full max-w-[980px] flex-col items-center gap-7 px-4 pt-36 pb-16 text-center sm:px-5 sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="group relative flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.03] px-4 py-2.5 shadow-[0_12px_30px_-18px_rgba(255,255,255,0.35)] backdrop-blur-2xl"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(120deg, rgba(34,211,238,0.12), rgba(255,255,255,0.02), rgba(251,191,36,0.1))",
            }}
            aria-hidden
          />
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/80">
            {h.badge}
          </span>
        </motion.div>

        <motion.h1
          // LCP element — render visible immediately (never gate it behind opacity:0).
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          // --h1 drives BOTH lines: line 2 is derived from it, so the statement/
          // qualifier ratio holds at every viewport without a second clamp to keep
          // in sync.
          //
          // The cap is set by the WIDEST face that can render line 1, not by the
          // one that happens to render today. Measured advance of "Build. Scale.
          // Transform." at -0.04em: system-ui 8.56em, Satoshi 9.25em, Arial 9.66em.
          // The content box maxes out at 940px (980 - 2*20 padding), so 6rem/96px
          // keeps it on one line in all three (Satoshi 888px, Arial 927px). Sizing
          // to the 8.56em that renders now would have wrapped the moment the
          // --font-heading wiring is fixed. If a face wider still ever loads, the
          // break falls at a space — i.e. between sentences, never mid-phrase.
          className="[--h1:clamp(2rem,9.2vw,6rem)] font-normal"
          style={{ fontFamily: "var(--font-heading)", fontSize: "var(--h1)" }}
        >
          <span className="block bg-gradient-to-b from-white via-white to-white/80 bg-clip-text leading-[0.98] tracking-[-0.04em] text-transparent">
            {h.headlineLine1}
          </span>
          {/* The qualifier. Tight tracking is a display-size device and smears at
              this size, so it resets to normal. max-width is in `em` (not `ch`,
              not nowrap) so longer CMS copy reflows instead of clipping.

              The 0.42 ratio is deliberately allowed to RISE below ~466px. Straight
              0.42 puts this line at 14.5px on a 375px screen, under the 16px
              subtext beneath it — the headline's own second line reading smaller
              than body copy, which inverts the hierarchy. The 1.125rem floor holds
              it at 18px there (~52% of line 1) and never binds above ~466px, where
              0.42 already clears 18px and the ratio is exact again. */}
          <span
            className="mx-auto block max-w-[22em] leading-[1.2] tracking-normal text-white/70 text-balance"
            style={{
              fontSize: "max(1.125rem, calc(var(--h1) * 0.42))",
              marginTop: "calc(var(--h1) * 0.14)",
            }}
          >
            {line2 ? (
              <>
                {line2.before}
                <span className="text-[#fbbf24]">{line2.accent}</span>
                {line2.after}
              </>
            ) : (
              h.headlineLine2
            )}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-[640px] text-base leading-relaxed text-white/65 sm:text-[1.15rem]"
        >
          {h.subtext}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.68 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          {h.trustPoints.map((point) => (
            <span
              key={point}
              className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white/58"
            >
              {point}
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.72 }}
          className="max-w-[560px] text-[0.83rem] uppercase tracking-[0.2em] text-white/35"
        >
          {h.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-4"
        >
          <BeamButton href={h.primaryCtaHref} variant="primary">
            {h.primaryCtaLabel}
          </BeamButton>
          <BeamButton href={h.secondaryCtaHref} variant="ghost">
            {h.secondaryCtaLabel}
          </BeamButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="hidden md:flex items-center gap-4 mt-12 w-full max-w-[640px]"
        >
          <span className="text-sm text-white/50">{h.scrollHintLeft}</span>
          <div className="flex-1 h-px bg-white/10" />
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 256 256"
              fill="white"
              className="opacity-60"
            >
              <path d="M144,16H112A64.07,64.07,0,0,0,48,80v96a64.07,64.07,0,0,0,64,64h32a64.07,64.07,0,0,0,64-64V80A64.07,64.07,0,0,0,144,16Zm48,160a48.05,48.05,0,0,1-48,48H112a48.05,48.05,0,0,1-48-48V80a48.05,48.05,0,0,1,48-48h32a48.05,48.05,0,0,1,48,48ZM136,64v48a8,8,0,0,1-16,0V64a8,8,0,0,1,16,0Z" />
            </svg>
          </motion.div>
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-sm text-white/50">{h.scrollHintRight}</span>
        </motion.div>

      </div>
    </section>
  );
}

function BeamButton({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const isPrimary = variant === "primary";
  return (
    // Neither variant had a focus ring. Amber is the focus colour here, and
    // outline-offset puts the ring on the black page rather than on the amber
    // fill, so it stays visible on the primary too.
    <a
      href={href}
      className="group relative inline-flex items-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbbf24]"
    >
      <div
        className={
          isPrimary
            ? // The hero's second and last amber, directly under the accented phrase.
              // `beam-button`/`corner-glow` paint a white hairline, a sliding white
              // beam and a 25%-white corner wash — tuned for dark glass chips, they
              // streak across a solid fill — so the primary opts out of both.
              "relative rounded-[10px] bg-[#fbbf24] px-6 py-3 text-sm text-[#12151A] shadow-[0_16px_36px_-18px_rgba(251,191,36,0.75)] transition-all duration-500 group-hover:bg-[#fcd34d] group-hover:shadow-[0_20px_44px_-18px_rgba(251,191,36,0.9)]"
            : "beam-button corner-glow relative rounded-[10px] border border-white/14 bg-black/60 px-6 py-3 text-sm text-white transition-all duration-500 group-hover:border-white/30 group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
        }
      >
        <span className="relative z-10">{children}</span>
      </div>
    </a>
  );
}
