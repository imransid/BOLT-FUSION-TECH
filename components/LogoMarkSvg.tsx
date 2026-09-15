/**
 * The Bolt Fusion Tech mark: the faceted diamond, the asymmetric bolt and the
 * fusion orbit. The drawing only — no hooks, no motion, no "use client" — so a
 * server component can render it: the header's logo and the drawer's
 * (components/techwix/Logo.tsx), the footer, and the WarmChats sign-off. The
 * caller passes `uid`, which must be unique on the page, because the gradients
 * are referenced by id. It was drawn for a dark tile (.tw-logo__tile).
 */
export default function LogoMarkSvg({ uid, className, size }: { uid: string; className?: string; size?: number }) {
  const gBolt = `${uid}-bolt`;
  const gAccent = `${uid}-accent`;
  const gAccentDeep = `${uid}-accent-deep`;
  const gCore = `${uid}-core`;
  const gShine = `${uid}-shine`;
  const gFacet = `${uid}-facet`;
  const fGlow = `${uid}-glow`;

  /* Cut diamond — rarer than hex; reads luxury + engineering */
  const dDiamond = "M20 3.65 L36.05 20 L20 36.35 L3.95 20 Z";
  const dDiamondInner =
    "M20 6.2 L32.9 20 L20 33.8 L7.1 20 Z";

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      /* the share image (app/opengraph-image.tsx) renders it outside CSS */
      width={size}
      height={size}
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
}
