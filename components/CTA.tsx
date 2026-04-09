"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section
      id="contact"
      className="flex items-center justify-center py-14 px-4 sm:py-20 sm:px-6 md:px-12 lg:px-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative w-full min-w-0 max-w-[1200px] overflow-hidden rounded-2xl sm:rounded-[30px]"
      >
        {/* Animated smoky gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 animate-mesh" />
          {/* Floating smoke blobs */}
          <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-white/[0.04] blur-[100px] animate-blob-1" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-white/[0.035] blur-[80px] animate-blob-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/[0.025] blur-[120px] animate-blob-3" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-5 px-4 py-16 text-center sm:gap-6 sm:px-8 sm:py-24">
          {/* Small label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/80">Taking new engagements</span>
          </div>

          <h2
            className="max-w-[900px] text-[clamp(2rem,8vw,5rem)] font-normal leading-[1.05] sm:text-7xl lg:text-[80px]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Tell us what you need to ship
          </h2>

          <p className="text-base sm:text-lg text-white/65 max-w-[540px]">
            Share goals, timeline, and constraints—we&apos;ll reply with honest
            fit, a suggested approach, and next steps. No pressure, no jargon
            wall.
          </p>

          <div className="mt-2 flex w-full max-w-md flex-col items-stretch gap-3 sm:mt-4 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <a href="#schedule" className="group relative inline-flex w-full items-center justify-center sm:w-auto">
              <div className="beam-button corner-glow relative flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-white px-6 py-3.5 text-sm text-black transition-all duration-500 group-hover:bg-white/95 sm:w-auto sm:px-8 sm:py-4">
                <span className="relative z-10 font-medium">Pick a time (30 min)</span>
              </div>
            </a>
            <a
              href="mailto:hello@boltfusiontech.com"
              className="group relative inline-flex w-full items-center justify-center sm:w-auto"
            >
              <div className="beam-button corner-glow relative flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-black px-6 py-3.5 text-sm text-white transition-all duration-500 group-hover:border-white/25 group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] sm:w-auto sm:px-8 sm:py-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  className="opacity-60"
                >
                  <path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z" />
                </svg>
                <span className="relative z-10">Email the team</span>
              </div>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
