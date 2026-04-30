"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useSiteContent } from "@/context/SiteContentContext";
import { INDUSTRY_ICON_PATH_D } from "@/lib/industry-icon-paths";

export default function Industries() {
  const { industries: ind } = useSiteContent();
  const industries = ind.items;
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!section || cards.length === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.set(cards, {
        opacity: 0,
        y: 30,
        scale: 0.985,
      });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.08,
        duration: 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 76%",
          once: true,
        },
      });
      if (!reduceMotion) {
        const cta = cards[cards.length - 1];
        if (cta) {
          gsap.to(cta, {
            y: -6,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      }
    }, section);

    if (reduceMotion) {
      return () => ctx.revert();
    }

    return () => {
      ctx.revert();
    };
  }, [industries.length]);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="relative overflow-hidden px-5 py-20 md:px-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.09),transparent_38%),radial-gradient(circle_at_85%_85%,rgba(251,191,36,0.09),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_28%)]" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mb-12 space-y-4 text-center md:mb-14">
          <p className="mx-auto w-fit rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/55">
            {ind.badge}
          </p>
          <h2
            className="text-[clamp(2rem,5.5vw,4rem)] font-normal leading-[1.03] tracking-[-0.03em] text-white"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {ind.titleLine1}
            <br />
            {ind.titleLine2}
          </h2>
          <p className="mx-auto max-w-[620px] text-sm leading-relaxed text-white/55 md:text-base">
            {ind.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {industries.map((industry, index) => (
            <div
              key={`${industry.title}-${index}`}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="group relative min-h-[230px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d0d0d] to-white/5 p-6 shadow-[0_22px_40px_-28px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:shadow-[0_28px_52px_-24px_rgba(0,0,0,0.92)]"
            >
              <span
                className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                aria-hidden
              />
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white/85">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={INDUSTRY_ICON_PATH_D[industry.iconKey]} />
                </svg>
              </div>

              <h3
                className="mb-2 text-[1.9rem] leading-none text-white"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {industry.title}
              </h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-white/68">{industry.description}</p>

              <a
                href="#contact"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-300/95 transition-colors duration-300 group-hover:text-amber-200"
              >
                {ind.learnMoreLabel}
                <span aria-hidden>→</span>
              </a>
            </div>
          ))}

          <div
            ref={(node) => {
              cardRefs.current[industries.length] = node;
            }}
            className="group relative flex min-h-[230px] flex-col justify-between rounded-2xl border border-amber-300/35 bg-gradient-to-b from-[#0d0d0d] to-white/5 p-6 shadow-[0_24px_46px_-24px_rgba(0,0,0,0.92)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/70 hover:shadow-[0_32px_58px_-24px_rgba(0,0,0,0.94)]"
          >
            <span
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent"
              aria-hidden
            />
            <div>
              <p
                className="text-3xl leading-tight text-white"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {ind.ctaCardTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{ind.ctaCardBody}</p>
            </div>
            <a
              href="#contact"
              className="mt-7 inline-flex w-fit items-center justify-center rounded-xl border border-amber-100/45 bg-gradient-to-b from-amber-300 to-amber-400 px-4 py-2.5 text-sm font-semibold text-[#1f2329] transition-all duration-300 hover:-translate-y-0.5 hover:from-amber-200 hover:to-amber-300"
            >
              {ind.ctaCardButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
