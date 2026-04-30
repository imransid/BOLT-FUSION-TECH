"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useSiteContent } from "@/context/SiteContentContext";

export default function AboutMe() {
  const { about: a } = useSiteContent();
  const skills = a.skills;
  const experience = a.experience;
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="about"
      className="py-20 px-5 md:px-20 overflow-hidden"
    >
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-11 items-start">
        {/* Left info */}
        <div
          className="flex-1 min-w-0 flex flex-col gap-8 rounded-[20px] lg:pr-5"
          style={{
            boxShadow: "16px 24px 20px 8px rgba(0,0,0,0.4)",
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-7xl lg:text-[92px] font-normal leading-[1em]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {a.title}
          </motion.h2>

          {/* Bio */}
          <div className="flex flex-col gap-8">
            <p className="text-base text-white/65 max-w-[640px] leading-relaxed">
              {a.bio}
            </p>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Skills */}
          <div className="flex flex-wrap gap-4">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-2.5 text-sm bg-[#0d0d0d] rounded-lg text-white/80"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Experience */}
          <div className="flex flex-col gap-5">
            {experience.map((exp) => (
              <div
                key={exp.company}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 bg-black rounded-[10px]"
                style={{
                  boxShadow: "16px 24px 20px 8px rgba(0,0,0,0.4)",
                }}
              >
                <span className="text-sm text-white/80">{exp.role}</span>
                <span className="text-sm text-white/80">{exp.company}</span>
                <span className="text-sm text-white/80 text-right">
                  {exp.period}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right image — framed with depth, vignette, and hover polish */}
        <motion.div
          initial={
            reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(10px)" }
          }
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-w-0 lg:min-w-[460px] relative isolate pt-2"
        >
          {/* Ambient rim light */}
          <div
            className="pointer-events-none absolute -inset-10 z-0 opacity-70 blur-3xl md:-inset-14"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(251,191,36,0.14), transparent 62%), radial-gradient(ellipse 55% 50% at 70% 80%, rgba(59,130,246,0.08), transparent 65%)",
            }}
          />

          <motion.div
            className="relative z-[1] aspect-video rounded-2xl overflow-hidden ring-1 ring-white/[0.12] cursor-default"
            initial="rest"
            variants={{ rest: {}, hover: {} }}
            whileHover={reduceMotion ? undefined : "hover"}
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04) inset, 0 28px 56px -24px rgba(0,0,0,0.75), 0 12px 32px -16px rgba(0,0,0,0.55)",
            }}
          >
            <div className="relative h-full w-full overflow-hidden">
              {reduceMotion ? (
                <img
                  src="/about-engineering.png"
                  alt="Product engineers collaborating on delivery, roadmap, and shipping reliable software"
                  width={1376}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <motion.img
                  src="/about-engineering.png"
                  alt="Product engineers collaborating on delivery, roadmap, and shipping reliable software"
                  width={1376}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  variants={{
                    rest: { scale: 1 },
                    hover: { scale: 1.06 },
                  }}
                  transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full object-cover object-center will-change-transform"
                />
              )}
            </div>

            {/* Inner glass edge */}
            <div
              className="pointer-events-none absolute inset-0 z-[2] rounded-2xl ring-1 ring-inset ring-white/[0.07]"
              aria-hidden
            />

            {/* Vignette + bottom blend into page */}
            <div
              className="pointer-events-none absolute inset-0 z-[3] rounded-2xl"
              style={{
                background:
                  "radial-gradient(ellipse 85% 70% at 50% 48%, transparent 32%, rgba(0,0,0,0.45) 100%), linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 42%)",
              }}
              aria-hidden
            />

            {/* Hover shine */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[4] overflow-hidden rounded-2xl"
                variants={{ rest: {}, hover: {} }}
                aria-hidden
              >
                <motion.div
                  className="absolute inset-y-0 left-0 w-[58%] -skew-x-12 bg-gradient-to-r from-transparent via-white/28 to-transparent"
                  variants={{
                    rest: { x: "-70%", opacity: 0 },
                    hover: { x: "135%", opacity: 1 },
                  }}
                  transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
