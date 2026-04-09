"use client";

import { motion } from "framer-motion";

const projects = [
  {
    src: "/projects/hospitality-ops-admin.png",
    alt: "Hospitality staff admin: kitchen, POS, orders, procurement",
    caption: "Hospitality ops — mobile",
  },
  {
    src: "/projects/opal-fashion-tech.png",
    alt: "OPAL Fashion × Tech storefront hero and navigation",
    caption: "OPAL — commerce",
  },
  {
    src: "/projects/immidox-immigration.png",
    alt: "Immidox immigration services marketing site hero",
    caption: "Immidox — services web",
  },
  {
    src: "/projects/expert-marketplace-mobile.png",
    alt: "Expert search, profiles, booking, and trust metrics on mobile",
    caption: "Expert marketplace",
  },
  {
    src: "/projects/godconnect-community.png",
    alt: "GodConnect onboarding and community app screens",
    caption: "GodConnect — community",
  },
  {
    src: "/projects/rebellion-brand-agency.png",
    alt: "REBELLION agency hero and interactive brand showcase",
    caption: "REBELLION — agency web",
  },
  {
    src: "/about-engineering.png",
    alt: "Bolt Fusion Tech — product engineering partnership",
    caption: "How we work with your team",
    isProfile: true,
  },
  {
    src: "/section-services.png",
    alt: "Engineers shipping product with clear UI on monitors",
    caption: "Delivery & architecture",
  },
  {
    src: "/section-process.png",
    alt: "Sprint planning and stakeholder alignment",
    caption: "Discovery to launch",
  },
  {
    src: "/section-testimonials.png",
    alt: "Client trust and advisory conversations",
    caption: "Stakeholder partnership",
  },
  {
    src: "/gallery-engineering-desk.png",
    alt: "Engineering workspace with code and systems design",
    caption: "Build quality",
  },
  {
    src: "/gallery-product-analytics.png",
    alt: "Product analytics across mobile and web surfaces",
    caption: "Insights & scale",
  },
];

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="white">
      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
    </svg>
  );
}

interface ProjectCardProps {
  src: string;
  alt: string;
  caption?: string;
  isProfile?: boolean;
}

function ProjectCard({ src, alt, isProfile, caption }: ProjectCardProps) {
  return (
    <motion.div
      className="relative aspect-[1.07] overflow-hidden rounded group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={src}
        alt={alt}
        width={1376}
        height={768}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover transition-all duration-500 ${
          isProfile ? "grayscale-0" : "grayscale group-hover:grayscale-0"
        }`}
      />
      {!isProfile && (
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/30 shadow-lg">
            <span className="text-sm text-white line-clamp-1">
              {caption ?? "View case study"}
            </span>
            <ArrowIcon />
          </div>
        </div>
      )}
      {isProfile && caption && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="rounded-full backdrop-blur-md bg-black/50 border border-white/20 px-4 py-2.5">
            <span className="text-xs text-white/90">{caption}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Projects() {
  const col1 = projects.slice(0, 4);
  const col2 = projects.slice(4, 8);
  const col3 = projects.slice(8, 12);

  return (
    <section id="projects" className="py-16 px-2 scroll-mt-24">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 max-w-2xl text-sm text-white/50 leading-relaxed"
        >
          Selected visuals from shipped work and how we operate—scroll to{" "}
          <a href="#recent-work" className="text-white/75 underline underline-offset-4 hover:text-white">
            featured case cards
          </a>{" "}
          for full context on our six featured launches.
        </motion.p>

        <div className="hidden lg:flex gap-3">
          <div className="flex-1 flex flex-col gap-3">
            {col1.map((p, i) => (
              <motion.div
                key={p.src}
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
                key={p.src}
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
                key={p.src}
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

        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.src}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <ProjectCard {...p} />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-10 px-5 md:px-10">
          <a
            href="#recent-work"
            className="text-sm text-white underline underline-offset-4 hover:text-white/80 transition-colors"
          >
            Featured launches (detail)
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
