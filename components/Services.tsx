"use client";

import { motion } from "framer-motion";

const serviceSkills = [
  "TypeScript & React",
  "Next.js & Node",
  "Mobile (iOS / Android)",
  "AWS & cloud-native",
  "API design",
  "Automated testing",
];

const serviceCards = [
  {
    title: "Custom product development",
    desc: "End-to-end web and mobile builds: discovery workshops, technical design, implementation, and handoff documentation—so your team owns the system with confidence after launch.",
  },
  {
    title: "Platforms & integrations",
    desc: "Connect products to payments, CRMs, data pipelines, and internal tools with APIs and event-driven workflows that are observable, secure, and easy to extend.",
  },
  {
    title: "Reliability & scale",
    desc: "Hardening for real traffic: performance tuning, monitoring and alerts, CI/CD, and operational runbooks—reducing downtime and making releases boring in the best way.",
  },
  {
    title: "UX & frontend craft",
    desc: "Interfaces that match your brand and usability goals: accessible components, responsive layouts, and design-system thinking so new features stay consistent.",
  },
];

const marqueeServices = [
  "Technical discovery",
  "Sprint delivery",
  "Code review",
  "Security-minded defaults",
  "Documentation",
  "Post-launch support",
];

export default function Services() {
  return (
    <section id="services" className="py-20 px-5 md:px-20">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-11">
        {/* Top row */}
        <div className="flex flex-col lg:flex-row gap-11">
          {/* Left content */}
          <div className="flex-1 min-w-0 lg:min-w-[460px] flex flex-col gap-6 lg:pr-10">
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
              <span className="text-sm text-white">What we deliver</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              Services
            </motion.h2>

            <p className="text-xl text-white/65 opacity-90" style={{ fontFamily: "'Inter Display', sans-serif" }}>
              Practical engineering aligned to your roadmap: you get transparent
              communication, measurable milestones, and software ready for real
              users—not a black box.
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-4">
              {serviceSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-2.5 text-sm bg-[#0d0d0d] rounded-lg text-white/80"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
              >
                Discuss your project
              </a>
              <a
                href="#projects"
                className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
              >
                See recent work
              </a>
            </div>
          </div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 min-w-0 lg:min-w-[460px] h-[503px] rounded-[17px] overflow-hidden ring-1 ring-white/[0.08] grayscale transition-[filter] duration-500 hover:grayscale-0"
            style={{ boxShadow: "20px 30px 20px 8px rgba(0,0,0,0.4)" }}
          >
            <img
              src="/section-services.png"
              alt="Engineering team building software products with clear UI and architecture on screen"
              width={1376}
              height={768}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </div>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#0d0d0d] rounded-[20px] p-8 md:p-10 flex flex-col gap-5"
              style={{
                boxShadow: "16px 24px 20px 8px rgba(0,0,0,0.4)",
              }}
            >
              {/* Icon */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  opacity="0.2"
                />
                <path d="M12 8v8M8 12h8" />
              </svg>

              <h4
                className="text-xl md:text-2xl text-white"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {card.title}
              </h4>

              <div className="w-full h-px bg-white/10" />

              <p className="text-sm text-white/65 leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* More services marquee */}
        <div
          className="w-full max-w-[1400px] mx-auto overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%)",
          }}
        >
          <div className="flex animate-marquee gap-6 items-center">
            {[...marqueeServices, ...marqueeServices, ...marqueeServices, ...marqueeServices].map(
              (service, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0d0d0d] text-sm text-white/80 whitespace-nowrap"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-50"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {service}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
