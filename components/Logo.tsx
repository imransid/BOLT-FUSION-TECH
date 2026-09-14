"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

import LogoMarkSvg from "@/components/LogoMarkSvg";

const springLux = { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.82 };

/**
 * The Bolt Fusion Tech mark, for every page except the homepage — /work/warmchats
 * and /privacy-policy draw it. The drawing itself is components/LogoMarkSvg.tsx;
 * this adds ids from useId() and, when `framed`, the old design's jewel chip.
 * The homepage's logo, with the wordmark, is components/techwix/Logo.tsx.
 */
export function LogoMark({
  className,
  framed = false,
}: {
  className?: string;
  framed?: boolean;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const svg = <LogoMarkSvg uid={id} className={framed ? "h-full w-full" : className} />;

  if (!framed) {
    return svg;
  }

  const chip = (
    <span
      className={`logo-chip-breathe relative inline-block shrink-0 overflow-hidden rounded-2xl p-px shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset,0_12px_40px_-14px_rgba(251,191,36,0.28),0_6px_20px_-8px_rgba(0,0,0,0.5)] transition-[box-shadow] duration-500 ease-out group-hover:shadow-[0_0_0_1px_rgba(251,191,36,0.28)_inset,0_18px_52px_-12px_rgba(251,191,36,0.38),0_10px_28px_-6px_rgba(0,0,0,0.55)] ${className ?? ""}`}
    >
      {!reduceMotion && (
        <span
          className="logo-jewel-aurora pointer-events-none absolute -inset-[40%] z-0 opacity-[0.22] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.38]"
          aria-hidden
        />
      )}
      <span
        className="relative z-[1] rounded-[15px] bg-gradient-to-br from-amber-200/45 via-white/12 to-amber-700/40 p-px"
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.18), inset 0 -12px 24px -8px rgba(0,0,0,0.35)",
        }}
      >
        <span className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-[14px] bg-[#09090b]/92 backdrop-blur-xl ring-1 ring-white/[0.06] sm:h-[38px] sm:w-[38px]">
          {svg}
        </span>
      </span>
    </span>
  );

  if (reduceMotion) {
    return chip;
  }

  return (
    <motion.span
      className="inline-flex shrink-0"
      whileHover={{ scale: 1.04 }}
      transition={springLux}
    >
      {chip}
    </motion.span>
  );
}
