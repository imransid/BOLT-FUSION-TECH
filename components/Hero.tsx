"use client";

import { motion } from "framer-motion";

const logos = ["Opal", "Dune", "Oasis", "Nimbus", "Pulse"];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* ═══ Animated Smoky Background ═══ */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-black" />

        {/* Smoky blobs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-white/[0.04] blur-[120px] animate-blob-1" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-[100px] animate-blob-2" />
        <div className="absolute bottom-1/4 left-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.025] blur-[140px] animate-blob-3" />

        {/* Extra subtle smoke wisps */}
        <div className="absolute top-[10%] right-[15%] w-[300px] h-[200px] rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-[80px] animate-blob-2" />
        <div className="absolute bottom-[15%] left-[10%] w-[350px] h-[250px] rounded-full bg-gradient-to-tr from-white/[0.025] to-transparent blur-[90px] animate-blob-1" />

        {/* Gradient overlay fading to black at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-5 pt-40 pb-16 max-w-[840px] mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0a0a0a]/40 backdrop-blur-[68px] border border-white/5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <span className="text-sm text-white/80">
            Crafting Unique Brand Identities
          </span>
        </motion.div>

        {/* Heading with stagger */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em] tracking-tight"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {"Branding that you need Indeed".split(" ").map((word, i) => (
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
          Elevate your brand with custom identity and package design. Showcase
          your story through bold visuals and strategic design solutions.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-2"
        >
          <BeamButton href="#contact">Get Started Now</BeamButton>
          <BeamButton href="#projects">See Projects</BeamButton>
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
          <span className="text-sm text-white/50">to see projects</span>
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
