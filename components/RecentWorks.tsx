"use client";

import { motion } from "framer-motion";

/** Shipped client products — real screenshots, written for buyer clarity */
const featuredWork = [
  {
    src: "/projects/hospitality-ops-admin.png",
    title: "Hospitality operations suite",
    outcome: "Staff admin for dashboard, kitchen, procurement, POS, and orders—built for fast floor decisions.",
    stack: "Mobile · React Native",
    alt: "Mobile admin app for restaurant operations: kitchen, POS, orders, and procurement",
  },
  {
    src: "/projects/opal-fashion-tech.png",
    title: "OPAL — Fashion × Tech",
    outcome: "Luxury commerce experience with a cinematic hero, trust strip, and conversion-focused layout.",
    stack: "Web · Next.js · Commerce",
    alt: "OPAL Fashion × Tech e-commerce hero: craft meets circuitry, shop and brand story",
  },
  {
    src: "/projects/immidox-immigration.png",
    title: "Immidox immigration services",
    outcome: "High-trust services site with clear journeys, proof points, and strong primary calls to action.",
    stack: "Web · CMS-ready",
    alt: "Immidox immigration services website hero with confident messaging and CTAs",
  },
  {
    src: "/projects/expert-marketplace-mobile.png",
    title: "Expert marketplace & booking",
    outcome: "Search, rich profiles, availability, and booking in one flow—trust signals like ratings and status built in.",
    stack: "Mobile · Marketplace",
    alt: "Mobile app to find skilled experts, view profiles, and book services with ratings and availability",
  },
  {
    src: "/projects/godconnect-community.png",
    title: "GodConnect — faith community",
    outcome: "Welcome journey, daily encouragement, and community connection—clear onboarding and a focused first-run experience.",
    stack: "Mobile · Community",
    alt: "GodConnect app splash and welcome screen for a Christian community platform",
  },
  {
    src: "/projects/rebellion-brand-agency.png",
    title: "REBELLION — brand agency",
    outcome: "Statement hero, brutalist energy, and interactive work showcase—built to win bold creative briefs.",
    stack: "Web · Agency / brand",
    alt: "REBELLION agency website hero with bold typography and project carousel on orange background",
    /** Wide hero inside a tall card — bias crop toward headline */
    imgClass: "object-[center_22%] sm:object-[center_top]",
  },
] as const;

export default function RecentWorks() {
  return (
    <section id="recent-work" className="py-20 px-5 md:px-20 scroll-mt-24">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="space-y-3">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-white max-w-[640px]"
              style={{ fontFamily: "'Inter Display', sans-serif" }}
            >
              Featured client work
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-sm text-white/55 max-w-[560px] leading-relaxed"
            >
              Six shipped experiences—operations, commerce, regulated services,
              marketplaces, community, and agency brands—each tuned to real users
              and conversion.
            </motion.p>
          </div>
          <div className="opacity-75 shrink-0 hidden sm:block">
            <svg
              width="35"
              height="35"
              viewBox="0 0 256 256"
              fill="white"
            >
              <path
                d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                opacity="0.2"
              />
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm37.66-85.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L120,148.69V88a8,8,0,0,1,16,0v60.69l18.34-18.35A8,8,0,0,1,165.66,130.34Z" />
            </svg>
          </div>
        </div>

        <div className="w-full h-px bg-white/10 mb-8" />

        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-4 min-w-max pr-2">
            {featuredWork.map((project, i) => (
              <motion.a
                key={project.src}
                href="#contact"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex w-[min(292px,calc(100vw-3rem))] sm:w-[300px] h-[min(440px,72vh)] flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-[#0d0d0d] outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 48px -28px rgba(0,0,0,0.65)",
                }}
                aria-label={`${project.title}: ${project.outcome}. Contact to discuss a similar project.`}
              >
                <img
                  src={project.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                    "imgClass" in project && project.imgClass
                      ? project.imgClass
                      : "object-top sm:object-center"
                  }`}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent opacity-95"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 z-[1] p-5 pt-20">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/85">
                    {project.stack}
                  </p>
                  <h3
                    className="mt-2 text-lg font-medium leading-snug text-white sm:text-xl"
                    style={{ fontFamily: "Satoshi, sans-serif" }}
                  >
                    {project.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/60 line-clamp-3">
                    {project.outcome}
                  </p>
                </div>
                <span className="pointer-events-none absolute inset-x-5 bottom-5 z-[2] flex justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs font-medium text-white backdrop-blur-md">
                    Discuss a similar build
                    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
                      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                    </svg>
                  </span>
                </span>
              </motion.a>
            ))}
          </div>
        </div>

        <div
          className="mt-4 rounded-[48px] border border-white/10 h-0 w-full"
          style={{ maskImage: "linear-gradient(black 0%, rgba(0,0,0,0.16) 83%)" }}
        />
      </div>
    </section>
  );
}
