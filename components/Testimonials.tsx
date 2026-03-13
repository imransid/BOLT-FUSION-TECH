"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CEO, GreenLeaf",
    text: "Meily transformed our brand identity completely. The attention to detail and creative approach exceeded all expectations. Highly recommended!",
    stars: 5,
  },
  {
    name: "David Chen",
    role: "Founder, UrbanFit",
    text: "Working with Meily was an absolute pleasure. The packaging design was stunning and perfectly captured our brand essence.",
    stars: 5,
  },
  {
    name: "Emily Torres",
    role: "Marketing Lead, Nimbus",
    text: "Incredible work on our complete brand overhaul. The new identity has significantly boosted our market presence and customer engagement.",
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
              <span className="text-sm text-white">Client reviews</span>
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

            <p className="text-xl text-white/65 opacity-90" style={{ fontFamily: "'Inter Display', sans-serif" }}>
              What clients say about working with me and their experience with
              my design services.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
              >
                Book a Free Call
              </a>
              <a
                href="#projects"
                className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
              >
                See Projects
              </a>
            </div>
          </div>

          {/* Right - Testimonial image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 min-w-0 lg:min-w-[460px] h-[503px] rounded-[8px] overflow-hidden grayscale"
          >
            <img
              src="https://framerusercontent.com/images/GkhJfmw17Q5eehve51WR25Ijjnk.png"
              alt="Client work showcase"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Testimonial cards */}
        <div className="bg-[#0d0d0d] rounded-[18px] p-8 md:p-12 flex flex-col md:flex-row gap-6 items-stretch max-w-[1200px] mx-auto w-full">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex-1 min-w-[280px] flex flex-col gap-4"
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

          {/* Dividers */}
          {testimonials.length > 1 && (
            <>
              <div className="hidden md:block w-px bg-white/[0.15] self-stretch" />
              <div className="hidden md:block w-px bg-white/[0.15] self-stretch" style={{ order: -1, marginLeft: 0, marginRight: 0 }} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
