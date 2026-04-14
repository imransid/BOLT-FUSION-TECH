"use client";

import { motion } from "framer-motion";

type ProjectItem = {
  src: string;
  alt: string;
  caption?: string;
  isProfile?: boolean;
  /** Narrow viewports: bias `object-cover` so hero type in screenshots stays readable */
  imgMobileClass?: string;
};

const projects: ProjectItem[] = [
  {
    src: "/projects/hospitality-ops-admin.png",
    alt: "Hospitality staff admin: kitchen, POS, orders, procurement",
    caption: "Hospitality ops — mobile",
    imgMobileClass: "object-[center_top]",
  },
  {
    src: "/projects/opal-fashion-tech.png",
    alt: "OPAL Fashion × Tech storefront hero and navigation",
    caption: "OPAL — commerce",
    /** Wide hero — keep “craft meets circuitry” in frame on phones */
    imgMobileClass: "object-[52%_28%] min-[380px]:object-[center_22%]",
  },
  {
    src: "/projects/immidox-immigration.png",
    alt: "Immidox immigration services marketing site hero",
    caption: "Immidox — services web",
    imgMobileClass: "object-[center_18%]",
  },
  {
    src: "/projects/expert-marketplace-mobile.png",
    alt: "Expert search, profiles, booking, and trust metrics on mobile",
    caption: "Expert marketplace",
    imgMobileClass: "object-[center_top]",
  },
  {
    src: "/projects/godconnect-community.png",
    alt: "GodConnect onboarding and community app screens",
    caption: "GodConnect — community",
    imgMobileClass: "object-[center_20%]",
  },
  {
    src: "/projects/rebellion-brand-agency.png",
    alt: "REBELLION agency hero and interactive brand showcase",
    caption: "REBELLION — agency web",
    imgMobileClass: "object-[center_25%]",
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
    imgMobileClass: "object-[center_35%]",
  },
  {
    src: "/section-process.png",
    alt: "Sprint planning and stakeholder alignment",
    caption: "Discovery to launch",
    imgMobileClass: "object-[center_30%]",
  },
  {
    src: "/section-testimonials.png",
    alt: "Client trust and advisory conversations",
    caption: "Stakeholder partnership",
    imgMobileClass: "object-[center_30%]",
  },
  {
    src: "/gallery-engineering-desk.png",
    alt: "Engineering workspace with code and systems design",
    caption: "Build quality",
    imgMobileClass: "object-[center_40%]",
  },
  {
    src: "/gallery-product-analytics.png",
    alt: "Product analytics across mobile and web surfaces",
    caption: "Insights & scale",
    imgMobileClass: "object-[center_35%]",
  },
];

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="white">
      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
    </svg>
  );
}

interface ProjectCardProps extends ProjectItem {
  /** Desktop masonry: tall cards. Mobile strip: short fixed height. */
  layout?: "masonry" | "strip";
}

function ProjectCard({
  src,
  alt,
  isProfile,
  caption,
  imgMobileClass,
  layout = "masonry",
}: ProjectCardProps) {
  const isStrip = layout === "strip";
  return (
    <motion.div
      className={`group relative cursor-pointer overflow-hidden rounded-lg md:rounded-xl ${
        isStrip
          ? "h-[200px] w-full sm:h-[220px]"
          : "aspect-[1.07]"
      }`}
      whileHover={isStrip ? undefined : { scale: 1.02 }}
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
          isProfile
            ? "grayscale-0"
            : "grayscale group-hover:grayscale-0 max-md:grayscale-0"
        } ${isStrip ? (imgMobileClass ?? "object-center") : ""}`}
      />
      {!isProfile && (
        <div
          className={`absolute left-0 right-0 transition-all duration-300 ${
            isStrip
              ? "bottom-0 border-t border-white/10 bg-gradient-to-t from-black/95 to-black/40 px-3 py-2.5"
              : "bottom-2 left-2 right-2 translate-y-0 opacity-100 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          }`}
        >
          <div
            className={
              isStrip
                ? "flex items-center justify-between gap-2"
                : "flex items-center justify-between gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 shadow-lg backdrop-blur-md sm:px-5 sm:py-3"
            }
          >
            <span
              className={`min-w-0 text-white ${isStrip ? "line-clamp-2 text-xs font-medium leading-snug" : "line-clamp-1 text-sm"}`}
            >
              {caption ?? "View case study"}
            </span>
            <span className={isStrip ? "shrink-0 opacity-70" : ""}>
              <ArrowIcon />
            </span>
          </div>
        </div>
      )}
      {isProfile && caption && (
        <div className={`absolute ${isStrip ? "bottom-2 left-2 right-2" : "bottom-2 left-2 right-2"}`}>
          <div className="rounded-full border border-white/20 bg-black/50 px-4 py-2.5 backdrop-blur-md">
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
    <section
      id="projects"
      className="scroll-mt-28 px-2 pb-12 pt-6 sm:scroll-mt-24 md:py-16 lg:py-16"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 max-w-2xl text-sm leading-relaxed text-white/50 md:mb-8"
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

        <div className="lg:hidden">
          <p className="mb-2 text-center text-[11px] leading-snug text-white/45">
            Swipe sideways — shorter cards, less scrolling
          </p>
          <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-1 pl-2 pr-6 [-webkit-overflow-scrolling:touch] sm:gap-3 sm:pl-1 sm:pr-4">
            {projects.map((p, i) => (
              <motion.div
                key={p.src}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.2) }}
                className="w-[min(82vw,300px)] shrink-0 snap-center snap-always first:ml-0.5"
              >
                <ProjectCard {...p} layout="strip" />
              </motion.div>
            ))}
          </div>
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
