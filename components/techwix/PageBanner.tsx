import type { ReactNode } from "react";

/**
 * A page's banner: the homepage hero's rounded navy panel, holding the page's
 * one h1 (app/techwix.css, "The page banner"). The title is on the title ramp —
 * `major` (70/78) for a short line, `section` (48/54) for a long one — in white
 * on flat navy.
 *
 * `back` is a link above everything else in the panel; `eyebrow` a line above
 * the title; `children` what follows it (the lead, a meta line, the buttons).
 * `aside` — a screenshot — takes the right 45% of the panel at >=1025px and goes
 * below the text under that, beside the text and never behind it.
 */
export default function PageBanner({
  titleId,
  title,
  titleSize = "section",
  eyebrow,
  back,
  describedBy,
  children,
  aside,
}: {
  titleId: string;
  title: string;
  titleSize?: "major" | "section";
  eyebrow?: ReactNode;
  back?: { href: string; label: string };
  describedBy?: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="tw-banner" aria-labelledby={titleId} aria-describedby={describedBy}>
      <div className="tw-banner__panel tw-on-dark">
        <div className={aside ? "tw-banner__inner tw-banner__inner--split" : "tw-banner__inner"}>
          <div className="tw-banner__text">
            {back ? (
              <p>
                <a className="tw-banner__back" href={back.href}>
                  {back.label}
                </a>
              </p>
            ) : null}
            {eyebrow ? <p className="tw-eyebrow">{eyebrow}</p> : null}
            <h1 id={titleId} className="tw-title-wrapper">
              <span className={`title-${titleSize} tw-banner__title`}>{title}</span>
            </h1>
            {children}
          </div>
          {aside ? <div className="tw-banner__aside">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
