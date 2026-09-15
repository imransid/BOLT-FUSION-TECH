import type { CapabilityId } from "@/content/engineering-schema";

/* A small line glyph per domain, each a miniature of that capability's own
   diagram: the layered stack, the router, the module ring, the till, the
   machine loop, the release pipeline. Decorative: the words beside it name the
   domain. Stroke in currentColor. */
const PATHS: Record<CapabilityId, React.ReactNode> = {
  software: (
    <>
      <rect x="4" y="5" width="20" height="4" />
      <rect x="4" y="12" width="20" height="4" />
      <rect x="4" y="19" width="20" height="4" />
    </>
  ),
  ai: (
    <>
      <path d="M3 14h6" />
      <path d="M9 14l4-4 4 4-4 4z" />
      <path d="M17 14c2 0 2-7 5-7M17 14h5M17 14c2 0 2 7 5 7" />
    </>
  ),
  erp: (
    <>
      <circle cx="14" cy="14" r="3.5" />
      <circle cx="14" cy="14" r="9.5" strokeDasharray="2.5 2.5" />
      <circle cx="14" cy="4.5" r="1.5" />
      <circle cx="22.2" cy="18.8" r="1.5" />
      <circle cx="5.8" cy="18.8" r="1.5" />
    </>
  ),
  pos: (
    <>
      <rect x="6" y="5" width="16" height="11" />
      <path d="M4 20h20M9 16v4M19 16v4M10 9h8" />
    </>
  ),
  robotics: (
    <>
      <path d="M5 23h10M10 23v-5l6-7 6 3" />
      <circle cx="10" cy="18" r="1.5" />
      <circle cx="16" cy="11" r="1.5" />
      <path d="M22 14l2 3" />
    </>
  ),
  cloud: (
    <>
      <path d="M3 9l4 5-4 5M10 9l4 5-4 5M17 9l4 5-4 5" />
      <path d="M23 14h2" />
    </>
  ),
};

export default function DomainGlyph({ id, className }: { id: CapabilityId; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[id]}
    </svg>
  );
}
