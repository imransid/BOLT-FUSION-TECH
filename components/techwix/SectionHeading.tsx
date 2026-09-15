import type { ReactNode } from "react";

/**
 * A section's heading block, as the homepage's: an optional eyebrow (the
 * clone's Barlow 500 subtitle), the h2 on the title ramp's section size, and an
 * optional intro. It reveals on entry like every block below the fold.
 */
export default function SectionHeading({
  id,
  title,
  eyebrow,
  intro,
  introId,
  center = false,
}: {
  id: string;
  title: string;
  eyebrow?: ReactNode;
  intro?: ReactNode;
  introId?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "tw-heading tw-heading--center" : "tw-heading"} data-tw-reveal>
      {eyebrow ? <p className="tw-eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="tw-title-wrapper">
        <span className="title-section">{title}</span>
      </h2>
      {intro ? (
        <p id={introId} className="tw-heading__intro">
          {intro}
        </p>
      ) : null}
    </div>
  );
}
