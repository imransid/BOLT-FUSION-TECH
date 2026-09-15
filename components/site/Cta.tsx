import type { ReactNode } from "react";

/**
 * A call to action, as a plain link: every one goes to a route, an anchor or a
 * mail link, and a plain link needs no router and no script.
 *
 *   primary    the brand-blue fill, white text at 5.35:1 — the one per view
 *   ghost      a hairline outline, text colour — the second action
 *   quiet      a text link with an arrow — "in depth" links inside a section
 *
 * `cta` sets `data-cta`, the suite's handle on the calls to action that matter
 * (SPEC §8): "schedule" on every Schedule a Call, "explore" on Explore Our
 * Capabilities, "project" on Tell Us About Your Project.
 */
export default function Cta({
  href,
  children,
  variant = "primary",
  size = "md",
  cta,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "quiet";
  size?: "sm" | "md";
  cta?: "schedule" | "explore" | "project";
  className?: string;
}) {
  return (
    <a href={href} className={`bf-btn bf-btn--${variant} bf-btn--${size}${className ? ` ${className}` : ""}`} data-cta={cta}>
      {children}
      {variant === "quiet" ? (
        <svg className="bf-btn__arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      ) : null}
    </a>
  );
}

/** Which `data-cta` a link carries, from its destination. */
export function ctaKind(href: string): "schedule" | "explore" | "project" | undefined {
  if (href.endsWith("#schedule")) return "schedule";
  if (href === "/capabilities") return "explore";
  if (href.endsWith("#project")) return "project";
  return undefined;
}
