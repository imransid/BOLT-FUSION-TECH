"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section
      id="contact"
      className="py-20 px-5 md:px-20 flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-[1200px] rounded-[30px] overflow-hidden"
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
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-24 px-8 gap-6">
          {/* Small label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/80">Available for work</span>
          </div>

          <h2
            className="text-5xl sm:text-7xl lg:text-[80px] font-normal leading-[1em] max-w-[900px]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Available For Work
          </h2>

          <p className="text-base sm:text-lg text-white/65 max-w-[540px]">
            Let&apos;s collaborate and bring your brand vision to life
          </p>

          <a
            href="mailto:hello@portfolite.com"
            className="group relative inline-flex items-center mt-4"
          >
            <div className="beam-button corner-glow relative px-8 py-4 rounded-[10px] bg-black border border-white/10 text-sm text-white group-hover:border-white/25 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] flex items-center gap-2">
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
              <span className="relative z-10">Book a Free Call</span>
            </div>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
