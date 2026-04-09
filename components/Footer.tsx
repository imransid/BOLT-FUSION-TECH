"use client";

import { motion } from "framer-motion";

const socialLinks = [
  { name: "Behance", url: "#" },
  { name: "Dribbble", url: "#" },
  { name: "X (Twitter)", url: "#" },
];

export default function Footer() {
  return (
    <footer className="py-8 px-5 md:px-20 border-t border-white/5">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-white/50"
        >
          © 2026 Bolt Fusion Tech. All rights reserved.
        </motion.p>

        {/* Social links */}
        <div className="flex items-center gap-1">
          {socialLinks.map((link, i) => (
            <span key={link.name} className="flex items-center gap-1">
              <a
                href={link.url}
                className="text-sm text-white/50 hover:text-white transition-colors duration-300 px-3 py-2"
              >
                {link.name}
              </a>
              {i < socialLinks.length - 1 && (
                <span className="text-white/20">|</span>
              )}
            </span>
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
