"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: 1,
    title: "Discovery & plan",
    desc: "We align on users, success metrics, constraints, and risks—then produce a concise technical approach and milestone plan so stakeholders know what “done” looks like and when to expect it.",
  },
  {
    num: 2,
    title: "Build in iterations",
    desc: "Working software every cycle: demos, backlog transparency, and early integration (auth, data, deployments) so issues surface when they are cheap to fix—not the week before launch.",
  },
  {
    num: 3,
    title: "Launch, measure, improve",
    desc: "Release with monitoring, runbooks, and a sensible cutover. After go-live we support stabilization, iterate on feedback, and help your team operate the product with confidence.",
  },
];

export default function Process() {
  return (
    <section id="process" className="py-20 px-5 md:px-20">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-11">
        {/* Left image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex-1 min-w-0 lg:min-w-[460px] min-h-[360px] rounded-[17px] overflow-hidden"
          style={{ boxShadow: "20px 30px 20px 8px rgba(0,0,0,0.4)" }}
        >
          <img
            src="https://framerusercontent.com/images/djbcRHCD89IflJ1okJAa1J65cuM.png"
            alt="How we deliver software with you"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Right content */}
        <div className="flex-1 min-w-0 lg:min-w-[460px] flex flex-col gap-6">
          {/* Badge */}
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
            <span className="text-sm text-white">How we work</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Process
          </motion.h2>

          <p className="text-xl text-white/65 max-w-[640px]" style={{ fontFamily: "'Inter Display', sans-serif" }}>
            A straightforward process designed for busy product leaders: fewer
            surprises, clearer tradeoffs, and decisions you can explain to your
            board or budget owner.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              href="#contact"
              className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              Discuss your roadmap
            </a>
            <a
              href="#projects"
              className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
            >
              See recent work
            </a>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step cards */}
          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative bg-[#0d0d0d] rounded-[30px] p-8 md:p-11 flex flex-col gap-6"
                style={{
                  boxShadow: "16px 24px 20px 8px rgba(0,0,0,0.4)",
                }}
              >
                {/* Step icon - decorative */}
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
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <h3
                  className="text-2xl md:text-3xl font-normal text-white"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {step.title}
                </h3>

                <div className="w-full h-px bg-white/10" />

                <p className="text-sm text-white/65 leading-relaxed">
                  {step.desc}
                </p>

                {/* Step number badge */}
                <div
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#0d0d0d] flex items-center justify-center text-sm text-white/80"
                  style={{
                    boxShadow: "inset 0 2px 0 0 rgba(184,180,180,0.14)",
                  }}
                >
                  {step.num}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
