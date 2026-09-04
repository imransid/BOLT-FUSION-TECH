"use client";

import { motion } from "framer-motion";

import { processSteps, services } from "@/content";

/**
 * Section 6 — How we work. COPY.md §6, verbatim. Replaces the old Process section.
 *
 * OLD DESIGN LANGUAGE: #0d0d0d cards at rounded-[30px] with the existing shadow,
 * Satoshi headings at the old scale, beam-button CTAs, framer whileInView reveals,
 * the existing hairline dividers. No trace rail, no new tokens.
 *
 * The step number badge is kept from the old Process card — CLAUDE.md permits
 * 01/02/03 numbering exactly where the content is genuinely a sequence, and
 * COPY.md §6 says so explicitly.
 *
 * Data comes from /content (processSteps, services), not from the CMS document and
 * not hardcoded, so these become Payload collections unchanged in Phase 2.
 */

const CARD_SHADOW = "16px 24px 20px 8px rgba(0,0,0,0.4)";

export default function HowWeWork() {
  return (
    <section id="how-we-work" className="py-20 px-5 md:px-20">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-11">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[16ch] text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          How a project actually runs.
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {processSteps.map((step, i) => (
            <motion.article
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col gap-6 rounded-[30px] bg-[#0d0d0d] p-8 md:p-11"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="w-[30px] h-[29px] text-white/80">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="10" opacity="0.2" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>

              <h3
                className="text-2xl md:text-3xl font-normal text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {step.title}
              </h3>

              <div className="w-full h-px bg-white/10" />

              <p className="text-sm leading-relaxed text-white/65">{step.body}</p>

              <div
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#0d0d0d] text-sm text-white/80"
                style={{ boxShadow: "inset 0 2px 0 0 rgba(184,180,180,0.14)" }}
                aria-hidden
              >
                {i + 1}
              </div>
            </motion.article>
          ))}
        </div>

        {/* Engagement models. No price column in v1 — COPY.md §6. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto rounded-[30px] bg-[#0d0d0d] p-8 md:p-11"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">Engagement models</caption>
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className="pb-4 pr-6 text-xs font-normal uppercase tracking-[0.14em] text-white/50">Model</th>
                <th scope="col" className="pb-4 pr-6 text-xs font-normal uppercase tracking-[0.14em] text-white/50">Shape</th>
                <th scope="col" className="pb-4 text-xs font-normal uppercase tracking-[0.14em] text-white/50">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-white/10 last:border-b-0">
                  <th
                    scope="row"
                    className="py-5 pr-6 text-base font-normal text-white"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {s.name}
                  </th>
                  <td className="py-5 pr-6 text-sm leading-relaxed text-white/65">{s.shape}</td>
                  <td className="py-5 text-sm text-white/65">{s.timeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="flex flex-col gap-4">
          <p className="max-w-[720px] text-sm leading-relaxed text-white/65">
            Most engagements start with the two-week pilot below. We&rsquo;ll give you a full
            quote for the wider build at the end of it, once we&rsquo;ve seen the real codebase.
          </p>
          <p className="max-w-[720px] text-sm leading-relaxed text-white/65">
            Two-week sprints, a demo at the end of each, a named escalation contact, and a
            written weekly report. Ask for a sample report and we&rsquo;ll send a real one.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#contact"
              className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              Start a 2-week pilot
            </a>
            <a
              href="#recent-work"
              className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              See recent work
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
