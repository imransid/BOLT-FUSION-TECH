"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const HeroThreeField = dynamic(() => import("@/components/HeroThreeField"), {
  ssr: false,
  loading: () => null,
});

const logos = ["SaaS", "Fintech", "Healthtech", "E‑commerce", "AI products"];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip"
    >
      {/* ═══ Animated Smoky Background ═══ */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-black" />

        {/* WebGL accent — metallic jewel, soft blend (client-only) */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-soft-light opacity-[0.26] sm:opacity-[0.34] md:opacity-[0.4]"
          aria-hidden
        >
          <HeroThreeField />
        </div>

        {/* Smoky blobs — fewer / lighter on small screens (blur is expensive) */}
        <div className="absolute top-1/4 left-1/3 h-[min(100vw,380px)] w-[min(100vw,380px)] rounded-full bg-white/[0.04] blur-[72px] sm:h-[420px] sm:w-[420px] sm:blur-[100px] md:h-[500px] md:w-[500px] md:blur-[120px] animate-blob-1" />
        <div className="absolute top-1/2 right-1/4 hidden h-[340px] w-[340px] rounded-full bg-white/[0.03] blur-[90px] sm:block md:h-[400px] md:w-[400px] md:blur-[100px] animate-blob-2" />
        <div className="absolute bottom-1/4 left-1/2 h-[min(110vw,440px)] w-[min(110vw,440px)] rounded-full bg-white/[0.025] blur-[80px] sm:h-[520px] sm:w-[520px] sm:blur-[120px] md:h-[600px] md:w-[600px] md:blur-[140px] animate-blob-3" />

        {/* Extra subtle smoke wisps */}
        <div className="absolute top-[10%] right-[15%] hidden h-[200px] w-[300px] rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-[80px] animate-blob-2 md:block" />
        <div className="absolute bottom-[15%] left-[10%] hidden h-[250px] w-[350px] rounded-full bg-gradient-to-tr from-white/[0.025] to-transparent blur-[90px] animate-blob-1 lg:block" />

        {/* Gradient overlay fading to black at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-w-0 w-full max-w-[840px] flex-col items-center gap-6 px-4 pt-36 pb-16 text-center sm:px-5 sm:pt-40">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0a0a0a]/40 backdrop-blur-[68px] border border-white/5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <span className="text-sm text-white/80">
            Custom software &amp; product engineering
          </span>
        </motion.div>

        {/* Heading with stagger */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-full text-[clamp(1.85rem,6vw+0.35rem,3rem)] font-normal leading-[1.05] tracking-tight text-balance sm:text-7xl sm:leading-[1em] lg:text-[92px]"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {"Ship dependable products faster".split(" ").map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-base sm:text-lg text-white/65 max-w-[540px] leading-relaxed"
        >
          From first roadmap to production release, we help you clarify scope,
          de-risk delivery, and launch software your customers and teams can
          trust—without surprises on timeline or quality.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-2"
        >
          <BeamButton href="#contact">Plan your build</BeamButton>
          <BeamButton href="#projects">See recent work</BeamButton>
        </motion.div>

        {/* Scroll indicator */}
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

        {/* Logo marquee */}
        <div
          className="mt-8 w-full overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)",
          }}
        >
          <div className="flex animate-marquee gap-24 items-center">
            {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
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
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="group relative inline-flex items-center">
      {/* Button */}
      <div className="beam-button corner-glow relative px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white group-hover:border-white/25 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]">
        <span className="relative z-10">{children}</span>
      </div>
    </a>
  );
}
