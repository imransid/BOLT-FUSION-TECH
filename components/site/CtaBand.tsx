import type { ReactNode } from "react";

/**
 * A page's closing call to action, in the shape of the homepage's final one: a
 * short brand-blue rule, the h2 (optional — the restaurant write-up closes on
 * its supporting line alone), the line, and the buttons (`children`, each a
 * components/site/Cta). `after` sits under the panel, inside the same section.
 */
export default function CtaBand({
  titleId,
  title,
  text,
  children,
  after,
}: {
  titleId?: string;
  title?: string;
  text?: ReactNode;
  children: ReactNode;
  after?: ReactNode;
}) {
  return (
    <section className="bf-section bf-ctaband" aria-labelledby={title ? titleId : undefined}>
      <div className="bf-wrap">
        <div className={`bf-ctaband__panel${title ? "" : " bf-ctaband__panel--untitled"}`} data-bf-reveal>
          {title ? (
            <h2 id={titleId} className="bf-ctaband__title">
              {title}
            </h2>
          ) : null}
          {text ? <p className="bf-ctaband__text">{text}</p> : null}
          <p className="bf-actions">{children}</p>
        </div>
        {after}
      </div>
    </section>
  );
}
