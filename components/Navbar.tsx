"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Work", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Team", href: "#team" },
  { label: "Clients", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="backdrop-blur-xl bg-black/80 border-b border-white/5">
        <div className="max-w-[1680px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#hero"
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Logo />
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#schedule"
              className="beam-button corner-glow ml-4 px-5 py-2.5 text-sm rounded-full border border-white/10 bg-gradient-to-b from-[#0d0d0d] to-white/5 backdrop-blur-sm hover:border-white/25 transition-all duration-500 flex items-center gap-2 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 256 256"
                fill="currentColor"
                className="opacity-60"
              >
                <path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z" />
              </svg>
              Book a call
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              className="block w-5 h-0.5 bg-white"
            />
            <motion.span
              animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              className="block w-5 h-0.5 bg-white"
            />
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/5"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                <a
                  href="#hero"
                  onClick={() => setIsOpen(false)}
                  className="mb-2 flex items-center gap-2 border-b border-white/10 pb-4"
                >
                  <Logo markOnly />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                    Menu
                  </span>
                </a>
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-base text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="#schedule"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 w-full text-center px-5 py-3 text-sm rounded-xl border border-white/10 bg-[#0d0d0d]"
                >
                  Book a call
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
