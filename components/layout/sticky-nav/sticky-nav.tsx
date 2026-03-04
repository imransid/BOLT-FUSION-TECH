"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#", label: "Home" },
  { href: "#team", label: "Team" },
  { href: "#skills", label: "Skills" },
  { href: "#clients", label: "Clients" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#book", label: "Book meeting" },
  { href: "#contact", label: "Contact" },
];

const StickyNav = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <nav className="mx-4 mt-3 sm:mx-6 sm:mt-4 md:mx-8 lg:mx-auto lg:max-w-5xl">
          <div className="flex items-center justify-between rounded-2xl bg-surface/90 border border-white/10 backdrop-blur-xl shadow-lg px-4 py-3 sm:px-6 sm:py-3.5">
            <Link
              href="/"
              className="font-display font-semibold tracking-[0.2em] uppercase text-sm sm:text-base shrink-0 flex items-center gap-2 group"
            >
              <span className="text-accent group-hover:text-cyan-300 transition-colors font-extrabold">BOLT</span>
              <span className="w-px h-3.5 bg-white/30 rounded-full" aria-hidden />
              <span className="text-white/90 group-hover:text-white transition-colors font-medium">FUSION TECH</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {LINKS.slice(1).map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-white/70 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
            >
              {open ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-40 w-[min(280px,85vw)] bg-surface border-l border-white/10 shadow-2xl md:hidden transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pt-20 px-6 pb-8 flex flex-col gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-accent py-3.5 text-lg font-medium transition-colors border-b border-white/5"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default StickyNav;
