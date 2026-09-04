"use client";

import { motion } from "framer-motion";

import { lanes, metrics } from "@/content";

/**
 * Section 3 — Architecture. COPY.md §3, verbatim.
 *
 * Replaces BOTH the old AiExcellence section and the old CaseStudy section on the
 * homepage (PLAN.md §6: "Section 3 absorbs the old sections 3 and 7"). The full
 * restaurant write-up lives at /work/restaurant-search and is linked from here, so
 * the project is told once rather than twice.
 *
 * OLD DESIGN LANGUAGE: black base, #0d0d0d cards at rounded-[30px] with the
 * existing drop shadow, Satoshi headings at the old type scale, beam-button CTAs,
 * framer whileInView reveals. No trace rail, no new tokens.
 *
 * WHAT DID NOT CHANGE IN THE PORT: the copy, the /content wiring, and the
 * shipped/target label on every figure. CLAUDE.md's hard rule — "every metric
 * carries a shipped or target label, no unlabelled numbers" — is carried across
 * intact; only its colours move onto the old palette (cyan = shipped/measured,
 * amber = target, matching how this page already used those two accents).
 */

const CARD_SHADOW = "16px 24px 20px 8px rgba(0,0,0,0.4)";

export default function Architecture() {
  return (
    <section id="architecture" className="py-20 px-5 md:px-20">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-11">
        <div className="flex flex-col gap-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-[16ch] text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Type a query. Watch what it costs.
          </motion.h2>

          <p
            className="max-w-[640px] text-lg text-white/65 sm:text-xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Most AI products die after launch — too slow, too expensive, too unstable. This is
            the routing we built so one didn&rsquo;t. Every query is classified before any paid
            inference runs, so most traffic never reaches a model.
          </p>
        </div>

        {/* The three lanes, in the old card treatment. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {lanes.map((lane, i) => (
            <motion.article
              key={lane.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col gap-5 rounded-[30px] bg-[#0d0d0d] p-8 md:p-11"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <h3
                className="text-2xl md:text-3xl font-normal text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {lane.name}
              </h3>
              <p className="text-sm text-white/80">— {lane.premise}</p>
              <div className="w-full h-px bg-white/10" />
              <p className="text-sm leading-relaxed text-white/65">{lane.detail}</p>
              {/* Mono: a cost figure is machine output. */}
              <p
                className={`text-sm ${lane.tone === "fast" ? "text-cyan-200" : "text-amber-300"}`}
                style={{ fontFamily: "var(--font-machine)" }}
              >
                {lane.cost}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Metric band. Every figure keeps its shipped/target label. */}
        <div
          className="grid grid-cols-1 gap-8 rounded-[30px] bg-[#0d0d0d] p-8 md:grid-cols-2 md:p-11 lg:grid-cols-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          {metrics.map((m, i) => {
            const shipped = m.status === "shipped";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col gap-2"
              >
                <p
                  className={`text-[2.4rem] leading-none ${shipped ? "text-cyan-200" : "text-amber-300"}`}
                  style={{ fontFamily: "var(--font-machine)" }}
                >
                  {m.value}
                </p>
                <p className="text-sm leading-relaxed text-white/80">{m.label}</p>
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      shipped
                        ? "border-cyan-200/45 text-cyan-200"
                        : "border-amber-300/50 text-amber-300"
                    }`}
                    style={{ fontFamily: "var(--font-machine)" }}
                  >
                    {m.status}
                  </span>
                  <span className="text-xs text-white/50">{m.source}</span>
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-6">
          <p className="max-w-[720px] text-sm leading-relaxed text-white/65">
            Every figure here comes from a system we shipped, and every one is labelled with
            whether it&rsquo;s measured or targeted. Ask on the call and we&rsquo;ll walk you
            through the architecture.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/work/restaurant-search"
              className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              Read the full architecture
            </a>
            <a
              href="#contact"
              className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              Book a technical call
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
