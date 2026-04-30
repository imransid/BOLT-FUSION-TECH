"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "framer-motion";

import { useSiteContent } from "@/context/SiteContentContext";

function useGalleryActiveIndex(
  scrollerRef: RefObject<HTMLDivElement | null>,
  itemCount: number
) {
  const [active, setActive] = useState(0);

  const updateActive = useCallback(() => {
    const root = scrollerRef.current;
    if (!root || itemCount === 0) return;
    const center = root.scrollLeft + root.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    const nodes = root.querySelectorAll<HTMLElement>("[data-gallery-slide]");
    nodes.forEach((el, i) => {
      const mid = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(mid - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  }, [scrollerRef, itemCount]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    root.addEventListener("scroll", updateActive, { passive: true });
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateActive);
    });
    ro.observe(root);
    return () => {
      root.removeEventListener("scroll", updateActive);
      ro.disconnect();
    };
  }, [updateActive, scrollerRef]);

  return active;
}

export default function RecentWorks() {
  const { recentWorks: rw } = useSiteContent();
  const featuredWork = rw.items;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const active = useGalleryActiveIndex(scrollerRef, featuredWork.length);

  const scrollToSlide = (index: number) => {
    const root = scrollerRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-gallery-slide="${index}"]`);
    el?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  };

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
              {rw.title}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-sm text-white/55 max-w-[560px] leading-relaxed"
            >
              {rw.subtitle}
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

        <p className="mb-3 text-center text-xs text-white/40 md:hidden">
          {rw.mobileSwipeHint}
        </p>

        <div
          ref={scrollerRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden scroll-pl-4 scroll-pr-6 pb-4 pl-1 pr-6 [-webkit-overflow-scrolling:touch] md:scroll-p-0 md:gap-4 md:px-0 md:pr-2"
        >
          {featuredWork.map((project, i) => (
            <motion.a
              key={project.src}
              data-gallery-slide={i}
              href="#contact"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative flex h-[min(400px,68dvh)] w-[min(100%,calc(100dvw-3.25rem))] max-w-[360px] shrink-0 snap-center snap-always overflow-hidden rounded-2xl bg-[#0d0d0d] ring-1 ring-white/10 outline-none first:ml-3 focus-visible:ring-2 focus-visible:ring-amber-200/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:h-[min(440px,72dvh)] sm:w-[300px] sm:max-w-none sm:first:ml-0 md:snap-start"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 48px -28px rgba(0,0,0,0.65)",
              }}
              aria-label={`${project.title}: ${project.outcome}. Contact to discuss a similar project.`}
            >
              <img
                src={project.src}
                alt={project.alt}
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out active:scale-[1.02] md:group-hover:scale-[1.03] ${
                  project.imgClass
                    ? project.imgClass
                    : "object-top sm:object-center"
                }`}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent opacity-95"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 z-[1] p-4 pt-16 sm:p-5 sm:pt-20">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/85">
                  {project.stack}
                </p>
                <h3
                  className="mt-1.5 text-base font-medium leading-snug text-white sm:mt-2 sm:text-lg md:text-xl"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {project.title}
                </h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/60 line-clamp-3 sm:mt-2 sm:text-xs">
                  {project.outcome}
                </p>
              </div>
              <span className="pointer-events-none absolute inset-x-4 bottom-4 z-[2] flex justify-center sm:inset-x-5 sm:bottom-5 md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-medium text-white backdrop-blur-md sm:px-5 sm:py-2.5 sm:text-xs">
                  Discuss a similar build
                  <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
                    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
                  </svg>
                </span>
              </span>
            </motion.a>
          ))}
        </div>

        <div
          className="mt-1 flex justify-center gap-2 md:hidden"
          role="tablist"
          aria-label="Featured work slides"
        >
          {featuredWork.map((project, i) => (
            <button
              key={project.src}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Show ${project.title}`}
              onClick={() => scrollToSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                active === i ? "w-7 bg-white" : "w-2 bg-white/35"
              }`}
            />
          ))}
        </div>

        <div
          className="mt-4 rounded-[48px] border border-white/10 h-0 w-full"
          style={{ maskImage: "linear-gradient(black 0%, rgba(0,0,0,0.16) 83%)" }}
        />
      </div>
    </section>
  );
}
