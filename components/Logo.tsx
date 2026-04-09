"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

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
  const gBolt = `${id}-bolt`;
  const gAccent = `${id}-accent`;
  const gAccentDeep = `${id}-accent-deep`;
  const gCore = `${id}-core`;
  const gShine = `${id}-shine`;
  const gFacet = `${id}-facet`;
  const fGlow = `${id}-glow`;

  /* Cut diamond — rarer than hex; reads luxury + engineering */
  const dDiamond = "M20 3.65 L36.05 20 L20 36.35 L3.95 20 Z";
  const dDiamondInner =
    "M20 6.2 L32.9 20 L20 33.8 L7.1 20 Z";

  const svg = (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={framed ? "h-full w-full" : className}
    >
      <defs>
        <linearGradient id={gBolt} x1="6" y1="4" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.22" stopColor="#f4f4f5" />
          <stop offset="0.55" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id={gAccent} x1="4" y1="4" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffef0" />
          <stop offset="0.22" stopColor="#fef08a" />
          <stop offset="0.48" stopColor="#fbbf24" />
          <stop offset="0.72" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id={gAccentDeep} x1="20" y1="26" x2="20" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" stopOpacity="0" />
          <stop offset="1" stopColor="#b45309" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient
          id={gCore}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(20 11) rotate(90) scale(26 30)"
        >
          <stop stopColor="rgba(255,255,255,0.2)" />
          <stop offset="0.35" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>
        <linearGradient id={gShine} x1="13" y1="6" x2="21" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={gFacet} x1="20" y1="4" x2="36" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={fGlow} x="-28%" y="-28%" width="156%" height="156%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0.45" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${fGlow})`}>
        <path
          d={dDiamond}
          stroke={`url(#${gAccent})`}
          strokeOpacity={0.72}
          strokeWidth={1.05}
          strokeLinejoin="round"
          fill={`url(#${gCore})`}
        />
        <path
          d={dDiamondInner}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={0.5}
          fill="none"
        />
        <path
          d="M20 10 L28 18"
          stroke={`url(#${gFacet})`}
          strokeWidth={0.85}
          strokeLinecap="round"
          opacity={0.9}
        />
      </g>

      <path
        d="M6.8 23.2 Q20 34.2 33.2 23.2"
        stroke={`url(#${gAccent})`}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <path
        d="M8.5 21.2 Q20 31 31.5 21.2"
        stroke={`url(#${gAccentDeep})`}
        strokeWidth="0.85"
        strokeLinecap="round"
        strokeDasharray="2 5"
        fill="none"
        opacity={0.42}
      />

      {/* Asymmetric bolt — forward energy */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.4 7.2 L10.2 25.4 H17.1 L7.8 37.8 L30.2 16.4 H23.4 L22.4 7.2Z"
        fill={`url(#${gBolt})`}
      />
      <path
        d="M21.6 8.4 L18.2 18.5 L16.8 25.4H21.2L18.6 31.8L30.2 16.4H24.2L21.6 8.4Z"
        fill={`url(#${gAccent})`}
        opacity={0.32}
      />
      <path
        d="M17.2 9.8 L15.4 15.2 L14.3 19.8"
        stroke={`url(#${gShine})`}
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
        opacity={0.82}
      />
    </svg>
  );

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
        <span className="flex min-w-0 flex-col items-start justify-center gap-0.5">
          <span
            className="text-[0.5625rem] font-normal uppercase tracking-[0.62em] text-zinc-500 sm:text-[0.625rem] sm:tracking-[0.58em]"
            style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
          >
            Bolt
          </span>
          <span
            className="bg-gradient-to-r from-amber-50 via-amber-300 to-orange-500 bg-clip-text text-[1.0625rem] font-semibold leading-none tracking-[-0.04em] text-transparent sm:text-[1.125rem]"
            style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
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
              className="font-mono text-[0.5rem] font-medium uppercase tracking-[0.52em] text-zinc-600 sm:text-[0.5625rem] sm:tracking-[0.48em]"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              Tech
            </span>
          </span>
        </span>
      )}
    </motion.span>
  );
}
