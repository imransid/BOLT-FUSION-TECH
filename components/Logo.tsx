"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

import LogoMarkSvg from "@/components/LogoMarkSvg";

type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

const springLux = { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.82 };

/**
 * Bolt Fusion Tech — signature mark + wordmark.
 * Faceted diamond (jewel / precision), asymmetric bolt, fusion orbit.
 * Jewel chip with optional aurora; couture-style type stack.
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

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={`group inline-flex items-center gap-3 sm:gap-4 ${className}`}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={springLux}
    >
      <LogoMark framed={!markOnly} className={markOnly ? "h-8 w-8 sm:h-9 sm:w-9" : undefined} />
      {!markOnly && (
        <span
          /* The wordmark. WCAG 2.2 SC 1.4.3 exempts logotypes: "Text that is part of a
             logo or brand name has no contrast requirement." verify-site exempts THIS
             element from its two contrast checks (18, 20) and nothing else, and fails
             if it ever holds anything but the brand name, so the attribute cannot
             quietly become a small-text exemption. */
          data-logotype
          className="flex min-w-0 flex-col items-start justify-center gap-0.5"
        >
          <span
            className="text-[0.5625rem] font-normal text-zinc-500 sm:text-[0.625rem]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Bolt
          </span>
          <span
            className="bg-gradient-to-r from-amber-50 via-amber-300 to-orange-500 bg-clip-text text-[1.0625rem] font-semibold leading-none tracking-[-0.04em] text-transparent sm:text-[1.125rem]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Fusion
          </span>
          <span className="mt-1 flex items-center gap-2.5">
            <span
              className="h-1 w-1 shrink-0 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]"
              aria-hidden
            />
            <span
              className="h-px w-6 bg-gradient-to-r from-amber-500/50 to-transparent sm:w-8"
              aria-hidden
            />
            <span
              className="text-[0.5rem] font-medium text-zinc-600 sm:text-[0.5625rem]"
            >
              Tech
            </span>
          </span>
        </span>
      )}
    </motion.span>
  );
}
