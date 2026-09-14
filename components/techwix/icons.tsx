import type { ReactNode } from "react";

/* Inline stroke icons, drawn for this site. They replace the theme's icon font
   (flaticon_techwix), which is the theme author's and is not shipped here.
   Every icon is decorative — aria-hidden — and the control carrying it has its
   own text or label. They take the surrounding font size and colour. */

type IconProps = { className?: string };

function Stroke({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const MenuIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M8 14h32M8 24h32M8 34h32" />
  </Stroke>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M12 12l24 24M36 12L12 36" />
  </Stroke>
);

export const MailIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <rect x="6" y="11" width="36" height="26" rx="3" />
    <path d="M7 13l17 13 17-13" />
  </Stroke>
);

export const ArrowUpRightIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M15 33L33 15M18 15h15v15" />
  </Stroke>
);

export const ArrowUpIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M24 38V10M12 22l12-12 12 12" />
  </Stroke>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M24 10v28M10 24h28" />
  </Stroke>
);
