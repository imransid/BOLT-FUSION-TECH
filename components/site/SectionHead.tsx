import type { ReactNode } from "react";

/**
 * A section's heading block: the eyebrow (Barlow 500, muted, after a short
 * brand-blue rule), the h2 (Barlow 700, tight tracking), and an optional lead.
 * Sentence case; never tracked capitals.
 */
export default function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  leadId,
  className = "",
}: {
  id: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** An id on the lead, for a section's aria-describedby. */
  leadId?: string;
  className?: string;
}) {
  return (
    <div className={`bf-head${className ? ` ${className}` : ""}`} data-bf-reveal>
      {eyebrow ? <p className="bf-eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="bf-h2">
        {title}
      </h2>
      {lead ? (
        <p id={leadId} className="bf-lead">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
