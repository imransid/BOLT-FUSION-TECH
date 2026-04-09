"use client";

import { motion } from "framer-motion";

const projects = [
  {
    src: "https://framerusercontent.com/images/GkhJfmw17Q5eehve51WR25Ijjnk.png",
    alt: "Client web application",
  },
  {
    src: "https://framerusercontent.com/images/En1SV0rP485Zf5WOrpnHl3Nz658.png",
    alt: "Product workflow UI",
  },
  {
    src: "https://framerusercontent.com/images/bed888CTflXNK3KFX1R7VhRMtE.png",
    alt: "SaaS dashboard concept",
  },
  {
    src: "https://framerusercontent.com/images/roWFLkzHAotwSx5UxGPxpxMeA.jpg",
    alt: "Bolt Fusion Tech team",
    isProfile: true,
  },
  {
    src: "https://framerusercontent.com/images/QqqmFNIdzb0HbOiMSHvqZXkwT7w.png",
    alt: "Mobile app screens",
  },
  {
    src: "https://framerusercontent.com/images/RYRvZnstUexQMOl8zRyrvDfDT0.png",
    alt: "Marketing and product site",
  },
  {
    src: "https://framerusercontent.com/images/jlIAaI4caPj3oVLaxetMd2RvY.png",
    alt: "Component library preview",
  },
  {
    src: "https://framerusercontent.com/images/MM7F7DNjn9gGQjHqbiowegENsRY.png",
    alt: "Enterprise tool interface",
  },
  {
    src: "https://framerusercontent.com/images/W7bXB4tsou7l5mHYU8sze3sBeg.png",
    alt: "Early-stage product concept",
  },
];

function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="white"
    >
      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
    </svg>
  );
}

interface ProjectCardProps {
  src: string;
  alt: string;
  isProfile?: boolean;
}

function ProjectCard({ src, alt, isProfile }: ProjectCardProps) {
  return (
    <motion.div
      className="relative aspect-[1.07] overflow-hidden rounded group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isProfile ? "grayscale-0" : "grayscale group-hover:grayscale-0"
        }`}
      />
      {!isProfile && (
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center justify-between px-5 py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/30 shadow-lg">
            <span className="text-sm text-white">View case study</span>
            <ArrowIcon />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Projects() {
  // Distribute into 3 columns for desktop
  const col1 = projects.slice(0, 3);
  const col2 = projects.slice(3, 6); // includes profile
  const col3 = projects.slice(6, 9);

  return (
    <section id="projects" className="py-16 px-2 scroll-mt-24">
      <div className="max-w-[1600px] mx-auto">
        {/* Desktop 3-column grid */}
        <div className="hidden lg:flex gap-3">
          <div className="flex-1 flex flex-col gap-3">
            {col1.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <ProjectCard {...p} />
              </motion.div>
            ))}
          </div>
          <div className="flex-[1.2] flex flex-col gap-3">
            {col2.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 + 0.1 }}
              >
                <ProjectCard {...p} />
              </motion.div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {col3.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 + 0.2 }}
              >
                <ProjectCard {...p} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile / Tablet grid */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <ProjectCard {...p} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10 px-5 md:px-10">
          <a
            href="#recent-work"
            className="text-sm text-white underline underline-offset-4 hover:text-white/80 transition-colors"
          >
            More recent work
          </a>
          <a
            href="#contact"
            className="beam-button corner-glow px-6 py-3 rounded-[10px] bg-black border border-white/10 text-sm text-white hover:border-white/25 transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)]"
          >
            Discuss your build
          </a>
        </div>
      </div>
    </section>
  );
}
