"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { useSiteContent } from "@/context/SiteContentContext";

export default function AIDrivenExcellence() {
  const { aiExcellence: a } = useSiteContent();
  const metrics = a.metrics;
  const trustPoints = a.trustPoints;
  return (
    <section id="ai-excellence" className="px-5 py-20 md:px-20 md:py-24">
      <div className="mx-auto max-w-[1200px] rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm md:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="space-y-5"
          >
            <h2
              className="max-w-[14ch] text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-white"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {a.headlineLine1}
              <br />
              {a.headlineLine2}
              <br />
              {a.headlineLine3}
            </h2>
            <p className="max-w-[54ch] text-sm leading-relaxed text-white/65 md:text-base">
              {a.intro}
            </p>
            <a
              href={a.scheduleCtaHref}
              className="inline-flex items-center justify-center rounded-full border border-amber-200/35 bg-amber-300 px-5 py-2 text-sm font-semibold text-[#1f2329] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-200"
            >
              {a.scheduleCtaLabel}
            </a>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="relative h-[260px] overflow-hidden rounded-2xl border border-white/10 md:h-[300px]"
            >
              <Image
                src={a.imageSrc}
                alt={a.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover"
              />
            </motion.div>
          </motion.div>

          <div className="space-y-4 md:space-y-5">
            {metrics.map((metric, index) => (
              <motion.article
                key={metric.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: 0.08 * index }}
                className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span
                    className="text-[1.9rem] font-light leading-none text-cyan-200"
                    style={{ fontFamily: "Satoshi, sans-serif" }}
                  >
                    {metric.value}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-cyan-100/70">
                    {metric.label}
                  </span>
                </div>
                <h3
                  className="text-xl text-white"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {metric.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/62">
                  {metric.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-9 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-[1fr_auto_auto] md:items-center"
        >
          <div className="border-l-2 border-cyan-200/75 pl-4">
            <p
              className="text-[1.55rem] leading-none text-white"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {a.footerTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">
              {a.footerSubtitle}
            </p>
          </div>

          {trustPoints.map((point) => (
            <div
              key={point}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.14em] text-white/72"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/80" />
              {point}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
