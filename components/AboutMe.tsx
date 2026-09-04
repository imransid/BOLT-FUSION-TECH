"use client";

import { motion } from "framer-motion";

import { useSiteContent } from "@/context/SiteContentContext";

export default function AboutMe() {
  const { about: a } = useSiteContent();
  const skills = a.skills;
  const experience = a.experience;

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
            style={{ fontFamily: "var(--font-heading)" }}
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

      </div>
    </section>
  );
}
