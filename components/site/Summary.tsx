import type { ReactNode } from "react";

/**
 * An executive summary: a label and one paragraph beside a brand-blue rule.
 * `id` goes on the paragraph, for an aria-describedby that points at it.
 */
export default function Summary({ label, id, children }: { label: string; id?: string; children: ReactNode }) {
  return (
    <div className="bf-summary" data-bf-reveal>
      <p className="bf-eyebrow">{label}</p>
      <p id={id} className="bf-summary__text">
        {children}
      </p>
    </div>
  );
}
