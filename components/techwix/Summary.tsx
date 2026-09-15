import type { ReactNode } from "react";

/**
 * An executive summary: the clone's gradient delimiter beside a label and one
 * paragraph, on the light surface. `id` goes on the paragraph, for an
 * aria-describedby that points at it.
 */
export default function Summary({ label, id, children }: { label: string; id?: string; children: ReactNode }) {
  return (
    <div className="tw-summary" data-tw-reveal>
      <span className="tw-summary__bar" aria-hidden="true" />
      <div className="tw-summary__body">
        <p className="tw-eyebrow">{label}</p>
        <p id={id} className="tw-summary__text">
          {children}
        </p>
      </div>
    </div>
  );
}
