import type { ReactNode } from "react";

/**
 * A page's closing call to action: the homepage's navy contact panel, with
 * its gradient delimiter, on a light band. `title` (an h2) is optional — the
 * restaurant write-up closes on its supporting line alone. `children` are the
 * buttons (components/techwix/Button: `light` and `secondary` on this panel);
 * `after` sits under the panel, inside the same band.
 */
export default function CtaPanel({
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
    <section className="tw-band tw-band--light" aria-labelledby={title ? titleId : undefined}>
      <div className="tw-band__inner">
        <div className="tw-contact__panel tw-on-dark" data-tw-reveal>
          <div className="tw-contact__lead">
            <span className="tw-contact__bar" aria-hidden="true" />
            <div>
              {title ? (
                <h2 id={titleId} className="tw-contact__title">
                  {title}
                </h2>
              ) : null}
              {text ? <p className={title ? "tw-contact__body" : "tw-cta__text"}>{text}</p> : null}
            </div>
          </div>
          <p className="tw-actions tw-contact__actions">{children}</p>
        </div>
        {after}
      </div>
    </section>
  );
}
