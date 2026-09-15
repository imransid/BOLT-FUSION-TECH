import type { ReactNode } from "react";

/* Inline stroke icons, drawn for this site. Every icon is decorative —
   aria-hidden — and the control carrying it has its own text or label. They
   take the surrounding font size and colour. */

type IconProps = { className?: string };

function Stroke({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const ArrowUpRightIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M4.5 11.5l7-7M6 4.5h5.5V10" />
  </Stroke>
);

export const CheckIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M3 8.5l3.2 3L13 4.5" />
  </Stroke>
);

/** "Won't": a struck circle, for /about's list of what we refuse. */
export const RefuseIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M4.2 11.8l7.6-7.6" />
  </Stroke>
);
