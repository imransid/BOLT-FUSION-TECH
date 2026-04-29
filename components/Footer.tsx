"use client";

import { motion } from "framer-motion";
import { LogoMark } from "@/components/Logo";

const socialLinks = [
  { name: "LinkedIn", url: "https://www.linkedin.com/company/bolt-fusion-tech/" },
  { name: "Facebook", url: "https://web.facebook.com/boltfusiontech" },
  { name: "X (Twitter)", url: "https://x.com/boltfusiontech" },
];

export default function Footer() {
  return (
    <footer className="py-8 px-5 md:px-20 border-t border-white/5">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <a
            href="#hero"
            className="flex items-center gap-2 text-white/60 transition-colors hover:text-white/90"
          >
            <LogoMark className="h-7 w-7 opacity-90" />
            <span className="text-sm text-white/50">
              © 2026 Bolt Fusion Tech
            </span>
          </a>
          <span className="hidden text-white/25 sm:inline" aria-hidden>
            ·
          </span>
          <span className="text-xs text-white/35 sm:text-sm sm:text-white/50">
            All rights reserved.
          </span>
        </motion.div>

        {/* Social links */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[10px] border border-white/12 bg-white/[0.02] px-3.5 py-2 text-sm text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_10px_24px_-16px_rgba(125,211,252,0.75)]"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Back to top */}
        <a
          href="#hero"
          className="text-sm text-white/50 hover:text-white transition-colors duration-300 flex items-center gap-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 256 256"
            fill="currentColor"
          >
            <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
          </svg>
          Back to top
        </a>
      </div>
    </footer>
  );
}
