"use client";

import { motion } from "framer-motion";

const skills = [
  "Product Design",
  "Brand Identity Design",
  "UX Design",
  "Branding",
  "Packaging Design",
  "Figma",
  "Photoshop",
];

const experience = [
  { role: "Freelance", company: "GreenLeaf Co", period: "Currently" },
  { role: "Brand Designer", company: "UrbanFit Studio", period: "2023-24" },
  { role: "Package Designer", company: "GreenK Studio", period: "2020-22" },
];

export default function AboutMe() {
  return (
    <section
      id="about-me"
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
            Meet Meily
          </motion.h2>

          {/* Bio */}
          <div className="flex flex-col gap-8">
            <p className="text-base text-white/65 max-w-[640px] leading-relaxed">
              I&apos;m Meily, a passionate Brand Identity &amp; Package Designer
              based in Tokyo. I specialize in crafting bold visual identities and
              packaging that captivate and inspire, blending creativity with
              strategy to elevate brands.
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

        {/* Right image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex-1 min-w-0 lg:min-w-[460px] aspect-[1.07] rounded-[4px] overflow-hidden grayscale"
          style={{
            boxShadow: "16px 24px 20px 8px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src="https://framerusercontent.com/images/roWFLkzHAotwSx5UxGPxpxMeA.jpg"
            alt="Meily - Brand Designer"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
