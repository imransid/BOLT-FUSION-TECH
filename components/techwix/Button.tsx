import type { ReactNode } from "react";

/* The clone's buttons (Jost 600, 5px radius), as plain anchors: every one goes
   to an anchor on this page, a write-up or a mail link, and a plain link needs
   no router and no script.
     primary    the gradient, darkened so its lightest stop clears 4.65:1
     header     the header's smaller gradient button
     secondary  outlined in white, on the navy panels
     outline    outlined in --brand, on the white and light bands
     light      a white fill, on the navy contact panel */
export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "header" | "secondary" | "outline" | "light";
  className?: string;
}) {
  return (
    <a href={href} className={`tw-btn tw-btn--${variant}${className ? ` ${className}` : ""}`}>
      {children}
    </a>
  );
}
