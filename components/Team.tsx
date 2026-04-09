"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

const springSnappy = { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.72 };
const springSoft = { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.9 };
const springCard = { type: "spring" as const, stiffness: 380, damping: 22, mass: 0.85 };

const members = [
  { name: "Rafa", handle: "@mrousavy", image: "/team/marc-face.svg" },
  { name: "Nadim", handle: "@szymon20000", image: "/team/szymon-face.svg" },
  { name: "Joinal", handle: "@thomas-coldwell", image: "/team/thomas-face.svg" },
  { name: "Arif", handle: "@chrispader", image: "/team/christoph-face.svg" },
  { name: "Tareq", handle: "@janicduplessis", image: "/team/janic-face.svg" },
  { name: "Nazi", handle: "@catalinmiron", image: "/team/catalin-face.svg" },
  { name: "Talal", handle: "@gorhom", image: "/team/mo-face.svg" },
  { name: "Eric", handle: "@ericvicenti", image: "/team/eric-face.svg" },
  { name: "Musfique", handle: "@mateioprea", image: "/team/matei-face.svg" },
  { name: "Viktoria", handle: "@viktoria.psd", image: "/team/viktoria-face.svg" },
] as const;

function profileHref(handle: string): string {
  const h = handle.slice(1);
  if (h === "viktoria.psd") {
    return "https://www.instagram.com/viktoria.psd/";
  }
  return `https://x.com/${h}`;
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden
    >
      <path d="M200,64V168a8,8,0,0,1-16,0V89.66L69.66,204.24a8,8,0,0,1-11.32-11.32L172.68,78.34H96a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
    </svg>
  );
}

type ItemVariants = {
  hidden: { opacity: number; y: number; scale: number };
  show: {
    opacity: number;
    y: number;
    scale: number;
    transition:
      | { duration: number }
      | {
          type: "spring";
          stiffness: number;
          damping: number;
          mass: number;
        };
  };
};

function TeamMemberCard({
  member,
  index,
  scrollProgress,
  reduceMotion,
  variants,
}: {
  member: (typeof members)[number];
  index: number;
  scrollProgress: MotionValue<number>;
  reduceMotion: boolean | null;
  variants: ItemVariants;
}) {
  const depth = (index % 5) - 2;
  const portraitY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [12 + depth * 4, -12 - depth * 4]
  );

  return (
    <motion.li variants={variants} className="min-h-0">
      <motion.a
        href={profileHref(member.handle)}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={
          reduceMotion
            ? undefined
            : { y: -6, scale: 1.02, transition: springCard }
        }
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        transition={springCard}
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-stone-400/35 bg-gradient-to-br from-stone-100 from-25% via-[#e8e0d6] to-[#c9bfb3] outline-none duration-500 hover:border-amber-900/25 hover:shadow-[0_36px_72px_-32px_rgba(28,20,14,0.58)] focus-visible:ring-2 focus-visible:ring-amber-200/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:rounded-3xl"
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255,252,248,0.88), inset 0 0 0 1px rgba(180,150,95,0.08), 0 20px 48px -28px rgba(18,12,8,0.42)",
        }}
        aria-label={`${member.name}, ${member.handle} — open profile`}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 42%, rgba(120,85,45,0.06) 100%)",
          }}
          aria-hidden
        />

        <span
          className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-[1.35rem] sm:rounded-3xl"
          aria-hidden
        >
          <span className="absolute inset-y-0 -left-full w-[55%] -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[260%] group-hover:opacity-100" />
        </span>

        <span className="pointer-events-none absolute left-3 top-3 z-[2] font-mono text-[9px] tabular-nums tracking-[0.14em] text-stone-500/70">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="pointer-events-none absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-lg border border-stone-500/20 bg-gradient-to-b from-stone-50/95 to-stone-200/90 text-stone-500 shadow-sm backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-12 group-hover:scale-105 group-hover:border-amber-800/28 group-hover:from-stone-100 group-hover:to-amber-50/90 group-hover:text-stone-800 sm:right-3 sm:top-3">
          <ArrowUpRight className="opacity-55 transition-opacity duration-300 group-hover:opacity-100" />
        </span>

        <div className="relative z-[1] mx-2.5 mt-11 isolate aspect-[4/5] overflow-hidden rounded-2xl bg-white ring-1 ring-stone-300/55 ring-inset sm:mx-3 sm:mt-12">
          <motion.div
            className="absolute inset-0 flex items-end justify-center will-change-transform"
            style={{ y: portraitY }}
          >
            <motion.img
              src={member.image}
              alt=""
              className="h-[92%] w-[90%] object-contain object-bottom mix-blend-multiply"
              loading="lazy"
              decoding="async"
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.03 }}
              transition={springSoft}
            />
          </motion.div>
        </div>

        <div className="relative z-[1] flex flex-1 flex-col px-4 pb-5 pt-4 sm:pt-5">
          <span
            className="text-[15px] font-medium tracking-[-0.03em] text-stone-900"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {member.name}
          </span>
          <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">
            {member.handle}
          </span>
        </div>
      </motion.a>
    </motion.li>
  );
}

function AnimatedSeatCount({
  target,
  reduceMotion,
}: {
  target: number;
  reduceMotion: boolean | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });
  const [n, setN] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setN(target);
      return;
    }
    if (!inView) return;
    const c = animate(0, target, {
      duration: 1.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => c.stop();
  }, [inView, target, reduceMotion]);

  return (
    <span
      ref={ref}
      className="text-5xl font-extralight tabular-nums tracking-tighter text-white md:text-6xl"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      {n}
    </span>
  );
}

export default function Team() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const spring = {
    stiffness: reduceMotion ? 9000 : 36,
    damping: reduceMotion ? 110 : 30,
    mass: reduceMotion ? 0.04 : 0.92,
  };
  const scrollProgress = useSpring(scrollYProgress, spring);

  const blobTopY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [64, -64]
  );
  const blobAmberY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-88, 88]
  );
  const dotsY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [32, -32]
  );
  const dotsScale = useTransform(
    scrollProgress,
    [0, 0.5, 1],
    reduceMotion ? [1, 1, 1] : [1, 1.02, 1]
  );

  const headerY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-28, 28]
  );
  const statY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [18, -18]
  );

  const plinthY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [22, -22]
  );
  const bracketTopY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-8, 8]
  );
  const bracketBotY = useTransform(
    scrollProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [8, -8]
  );

  const container = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.065, delayChildren: 0.14 },
    },
  };

  const item: ItemVariants = {
    hidden: {
      opacity: reduceMotion ? 1 : 0,
      y: reduceMotion ? 0 : 36,
      scale: reduceMotion ? 1 : 0.94,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 360, damping: 24, mass: 0.82 },
    },
  };

  return (
    <section
      ref={sectionRef}
      id="team"
      className="relative overflow-hidden border-t border-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute -top-32 left-1/2 h-[420px] w-[min(92vw,820px)] -translate-x-1/2 rounded-full bg-white/[0.04] blur-[100px] will-change-transform"
          style={{ y: blobTopY }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[280px] w-[min(55vw,480px)] translate-x-1/4 translate-y-1/4 rounded-full bg-amber-100/[0.04] blur-[90px] will-change-transform"
          style={{ y: blobAmberY }}
        />
        <motion.div
          className="absolute inset-0 opacity-[0.45] will-change-transform"
          style={{
            y: dotsY,
            scale: dotsScale,
            transformOrigin: "50% 35%",
          }}
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,0.09) 0.5px, transparent 0.5px)",
              backgroundSize: "28px 28px",
              maskImage:
                "radial-gradient(ellipse 75% 65% at 50% 40%, black 20%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 65% at 50% 40%, black 20%, transparent 70%)",
            }}
          />
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32 lg:px-16">
        <motion.header
          style={{ y: headerY }}
          className="mb-14 will-change-transform md:mb-20 lg:mb-24 grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20"
        >
          <div className="relative max-w-[800px] space-y-9 pl-0 lg:pl-3">
            <div
              className="absolute left-0 top-2 hidden h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-amber-200/30 via-white/15 to-transparent lg:block"
              aria-hidden
            />

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -16, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={springSoft}
              className="flex flex-wrap items-center gap-4"
            >
              <motion.span
                className="inline-flex h-2 w-2 shrink-0 rotate-45 border border-amber-200/50 bg-gradient-to-br from-white/25 to-transparent"
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }
                }
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-white/45">
                Your bench
              </span>
              <span className="hidden h-px w-14 bg-gradient-to-r from-amber-200/40 to-transparent sm:block" />
              <span className="font-mono text-[10px] text-white/28">// who builds with you</span>
            </motion.div>

            <div className="space-y-6">
              <h2
                className="text-[clamp(2.4rem,5.8vw,5rem)] font-normal leading-[1.02] tracking-[-0.045em] text-white"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                <motion.span
                  className="block"
                  initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...springSnappy, delay: 0.02 }}
                >
                  Senior engineers.
                </motion.span>
                <motion.span
                  className="mt-2 block bg-gradient-to-r from-white via-amber-100/90 to-white/40 bg-clip-text text-transparent"
                  initial={reduceMotion ? false : { opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...springSoft, delay: 0.1 }}
                >
                  One delivery standard.
                </motion.span>
              </h2>
              <motion.div
                initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ ...springSnappy, delay: 0.18 }}
                className="h-[2px] max-w-lg origin-left rounded-full bg-gradient-to-r from-amber-300/70 via-white/35 to-transparent"
                aria-hidden
              />
            </div>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...springSoft, delay: 0.14 }}
              className="max-w-lg text-[15px] leading-[1.7] text-white/50 md:text-[17px]"
              style={{ fontFamily: "'Inter Display', Inter, sans-serif" }}
            >
              Each card opens in a new tab—so you can see who you would work
              with before you commit scope or budget.
            </motion.p>
          </div>

          <motion.div
            style={{ y: statY }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={springSnappy}
            className="will-change-transform flex flex-col items-start gap-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-6 backdrop-blur-sm lg:items-end"
          >
            <div className="flex items-baseline gap-2.5">
              <AnimatedSeatCount target={members.length} reduceMotion={reduceMotion} />
              <span className="pb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                specialists
              </span>
            </div>
            <motion.div
              className="flex flex-col gap-2"
              initial={reduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <motion.span
                className="h-0.5 rounded-full bg-gradient-to-r from-white/50 to-transparent"
                initial={reduceMotion ? false : { width: 0 }}
                whileInView={{ width: 64 }}
                viewport={{ once: true }}
                transition={{ ...springSnappy, delay: 0.4 }}
              />
              <motion.span
                className="h-0.5 rounded-full bg-gradient-to-r from-white/30 to-transparent"
                initial={reduceMotion ? false : { width: 0 }}
                whileInView={{ width: 40 }}
                viewport={{ once: true }}
                transition={{ ...springSnappy, delay: 0.48 }}
              />
              <motion.span
                className="h-0.5 rounded-full bg-gradient-to-r from-white/20 to-transparent"
                initial={reduceMotion ? false : { width: 0 }}
                whileInView={{ width: 56 }}
                viewport={{ once: true }}
                transition={{ ...springSnappy, delay: 0.56 }}
              />
            </motion.div>
          </motion.div>
        </motion.header>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={springSoft}
          style={{ y: plinthY }}
          className="relative will-change-transform rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.055] to-transparent p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-[2px] sm:rounded-[2rem] sm:p-2 md:p-4"
        >
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-[0.32]"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, rgba(251,191,36,0.14), transparent 38%, rgba(255,255,255,0.09), transparent 72%)",
                maskImage: "linear-gradient(black, transparent 62%)",
                WebkitMaskImage: "linear-gradient(black, transparent 62%)",
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
          )}

          <motion.div
            style={{ y: bracketTopY }}
            className="pointer-events-none absolute -right-px -top-px z-[2] h-16 w-16 rounded-tr-[1.65rem] border-r border-t border-white/[0.1] will-change-transform sm:rounded-tr-[1.85rem]"
            aria-hidden
          />
          <motion.div
            style={{ y: bracketBotY }}
            className="pointer-events-none absolute -bottom-px -left-px z-[2] h-12 w-12 rounded-bl-[1.65rem] border-b border-l border-white/[0.08] will-change-transform sm:rounded-bl-[1.85rem]"
            aria-hidden
          />

          <motion.ul
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px", amount: 0.12 }}
            className="relative z-[1] grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4 list-none p-0 m-0"
          >
            {members.map((member, index) => (
              <TeamMemberCard
                key={member.handle}
                member={member}
                index={index}
                scrollProgress={scrollProgress}
                reduceMotion={reduceMotion}
                variants={item}
              />
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
