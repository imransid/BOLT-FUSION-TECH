"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const HeroThreeField = dynamic(() => import("@/components/HeroThreeField"), {
  ssr: false,
  loading: () => null,
});

const logos = ["SaaS", "Fintech", "Healthtech", "E-commerce", "AI products"];
const trustPoints = ["Senior-only team", "Timezone overlap", "Quality-first delivery"];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip"
    >
      {/* Premium background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />

        <div
          className="pointer-events-none absolute inset-0 z-[2] hidden mix-blend-soft-light opacity-[0.24] md:block"
          aria-hidden
        >
          <HeroThreeField />
        </div>

        <div className="absolute left-1/2 top-[20%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-200/[0.07] blur-[88px] md:h-[460px] md:w-[460px] md:blur-[110px]" />
        <div className="absolute bottom-[10%] right-[8%] hidden h-[300px] w-[300px] rounded-full bg-amber-200/[0.05] blur-[95px] md:block" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.09),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      <div className="relative z-10 mx-auto flex min-w-0 w-full max-w-[980px] flex-col items-center gap-7 px-4 pt-36 pb-16 text-center sm:px-5 sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="group relative flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.03] px-4 py-2.5 shadow-[0_12px_30px_-18px_rgba(255,255,255,0.35)] backdrop-blur-[68px]"
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
            Custom software &amp; product engineering
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-[13ch] text-[clamp(2.1rem,6vw+0.35rem,6rem)] font-normal leading-[0.98] tracking-[-0.04em] text-balance sm:leading-[0.98] lg:text-[96px]"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          <span className="bg-gradient-to-b from-white via-white to-white/80 bg-clip-text text-transparent">
            Elite engineers.
          </span>
          <br />
          <span className="bg-gradient-to-r from-white via-cyan-100 to-amber-100 bg-clip-text text-transparent">
            Lower hiring cost.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-[640px] text-base leading-relaxed text-white/65 sm:text-[1.15rem]"
        >
          Build with a dedicated remote team of top-tier Bangladeshi engineers
          trusted to deliver speed, quality, and reliability.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.68 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          {trustPoints.map((point) => (
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
          Senior execution, transparent process, enterprise-grade quality
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-4"
        >
          <BeamButton href="#contact" variant="primary">
            Plan your build
          </BeamButton>
          <BeamButton href="#projects" variant="ghost">
            See recent work
          </BeamButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="hidden md:flex items-center gap-4 mt-12 w-full max-w-[640px]"
        >
          <span className="text-sm text-white/50">Scroll down</span>
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
          <span className="text-sm text-white/50">to explore delivery</span>
        </motion.div>

        <div
          className="mt-10 w-full overflow-hidden rounded-full border border-white/10 bg-white/[0.02] py-3"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)",
          }}
        >
          <div className="flex animate-marquee gap-24 items-center">
            {[...logos, ...logos].map((logo, i) => (
              <span
                key={i}
                className="text-white/30 text-sm font-medium whitespace-nowrap tracking-widest uppercase flex-shrink-0"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
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
    <a href={href} className="group relative inline-flex items-center">
      <div
        className={`beam-button corner-glow relative rounded-[10px] px-6 py-3 text-sm text-white transition-all duration-500 ${
          isPrimary
            ? "border border-cyan-200/35 bg-gradient-to-br from-cyan-200/25 via-white/[0.16] to-amber-200/20 shadow-[0_16px_36px_-20px_rgba(34,211,238,0.9)] group-hover:border-cyan-100/60 group-hover:shadow-[0_22px_44px_-20px_rgba(34,211,238,0.95)]"
            : "border border-white/14 bg-black/60 group-hover:border-white/30 group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
        }`}
      >
        {isPrimary && (
          <span
            className="pointer-events-none absolute inset-0 rounded-[10px] opacity-80"
            style={{
              background:
                "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(255,255,255,0.02), rgba(251,191,36,0.12))",
            }}
            aria-hidden
          />
        )}
        <span className="relative z-10">{children}</span>
      </div>
    </a>
  );
}
