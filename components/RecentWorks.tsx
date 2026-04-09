"use client";

import { motion } from "framer-motion";

const recentProjects = [
  {
    src: "https://framerusercontent.com/images/bed888CTflXNK3KFX1R7VhRMtE.png",
    alt: "Web platform interface",
  },
  {
    src: "https://framerusercontent.com/images/JGI1jOpxUUfW0IRfPmx7eMGhc.png",
    alt: "Mobile product experience",
  },
  {
    src: "https://framerusercontent.com/images/fsFDlU7CKq0E96MXMN9fUXrNw.png",
    alt: "Dashboard and analytics UI",
  },
  {
    src: "https://framerusercontent.com/images/jlIAaI4caPj3oVLaxetMd2RvY.png",
    alt: "Design system components",
  },
  {
    src: "https://framerusercontent.com/images/RYRvZnstUexQMOl8zRyrvDfDT0.png",
    alt: "Product marketing site",
  },
];

export default function RecentWorks() {
  return (
    <section id="recent-work" className="py-20 px-5 md:px-20 scroll-mt-24">
      <div className="max-w-[1600px] mx-auto">
        {/* Section heading */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="space-y-3">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-white max-w-[640px]"
              style={{ fontFamily: "'Inter Display', sans-serif" }}
            >
              Recent work
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-sm text-white/55 max-w-[520px] leading-relaxed"
            >
              A snapshot of interfaces and products we have shipped—each
              engagement tuned to the client&apos;s stack, users, and launch
              goals.
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

        {/* Horizontal scroll carousel */}
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-3 min-w-max">
            {recentProjects.map((project, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative w-[250px] h-[350px] flex-shrink-0 overflow-hidden rounded group cursor-pointer"
              >
                <img
                  src={project.src}
                  alt={project.alt}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-full backdrop-blur-md bg-white/10 border border-white/30">
                    <span className="text-xs text-white">View case study</span>
                    <svg width="16" height="16" viewBox="0 0 256 256" fill="white">
                      <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rounded border pill decoration */}
        <div className="mt-4 rounded-[48px] border border-white/10 h-0 w-full" style={{ maskImage: "linear-gradient(black 0%, rgba(0,0,0,0.16) 83%)" }} />
      </div>
    </section>
  );
}
