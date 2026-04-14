"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah K.",
    role: "CEO, B2B SaaS",
    text: "They turned a vague brief into a shipped MVP with sane tradeoffs explained along the way. Our team finally had a release cadence we could plan around.",
    stars: 5,
  },
  {
    name: "David Chen",
    role: "Head of Product, Fintech",
    text: "Strong engineering judgment on integrations and compliance-sensitive flows. We cut rework because they asked the right questions early.",
    stars: 5,
  },
  {
    name: "Emily Torres",
    role: "CTO, Healthtech",
    text: "Clear documentation and handoff after launch. Internal developers picked up the codebase without a weeks-long archaeology project.",
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-5 md:px-20">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-11">
        <div className="flex flex-col lg:flex-row gap-11">
          {/* Left */}
          <div className="flex-1 min-w-0 lg:min-w-[460px] flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0d0d0d] w-fit"
              style={{
                boxShadow:
                  "16px 24px 20px 8px rgba(0,0,0,0.4), inset 0 2px 0 0 rgba(184,180,180,0.08)",
              }}
            >
              <span className="w-[11px] h-[11px] rounded-[10px] bg-white flex items-center justify-center">
                <span className="w-[8px] h-[9px] rounded-[10px] bg-[#0d0d0d] flex items-center justify-center">
                  <span className="w-[5px] h-[5px] rounded-[10px] bg-white" />
                </span>
              </span>
              <span className="text-sm text-white">Client outcomes</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              Testimonials
            </motion.h2>

            <p
              className="text-lg text-white/65 opacity-90 sm:text-xl"
              style={{ fontFamily: "'Inter Display', sans-serif" }}
            >
              Feedback from leaders who needed delivery they could defend—to
              users, investors, and their own engineering teams.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
              >
                Start a conversation
              </a>
              <a
                href="#projects"
                className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
              >
                See recent work
              </a>
            </div>
          </div>

          {/* Right - Testimonial image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 min-w-0 overflow-hidden rounded-[8px] ring-1 ring-white/[0.08] grayscale transition-[filter] duration-500 hover:grayscale-0 aspect-[16/10] min-h-[200px] w-full max-h-[min(28rem,58vh)] lg:aspect-auto lg:h-[503px] lg:max-h-none lg:min-w-[460px]"
          >
            <img
              src="/section-testimonials.png"
              alt="Client stakeholders in a trusted advisory conversation"
              width={1376}
              height={768}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </div>

        {/* Testimonial cards */}
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-0 rounded-[18px] bg-[#0d0d0d] p-8 md:flex-row md:items-stretch md:gap-0 md:p-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`flex min-w-0 flex-1 flex-col gap-4 pt-8 first:pt-0 md:min-h-0 md:pt-0 md:pl-8 md:first:pl-0 ${
                i > 0 ? "border-t border-white/[0.12] md:border-l md:border-t-0" : ""
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <svg
                    key={si}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="gold"
                    className="opacity-80"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-white/70 leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white/60">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
