import type { ReactNode } from "react";

/**
 * A section's heading block: the eyebrow (Archivo 500, after a cobalt dot),
 * the h2 (Archivo 600, set expanded and tight), and an optional lead.
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
