import type { ReactNode } from "react";

/**
 * A page's head: the block holding the page's one h1 (every inner page, and
 * /contact's own markup follows the same classes). An optional link back up
 * the site, the eyebrow, the h1, then `children` — the lead, a meta line, the
 * buttons. `aside` (a screenshot) sits beside the text from 1025px and below
 * it under that, never behind it.
 *
 * `size="long"` is for a title that is a sentence (a write-up, an article, the
 * privacy policy): the display size is for a short line.
 */
export default function PageHead({
  id,
  title,
  eyebrow,
  back,
  size = "display",
  describedBy,
  children,
  aside,
}: {
  id: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  back?: { href: string; label: string };
  size?: "display" | "long";
  describedBy?: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className={`bf-pagehead${aside ? " bf-pagehead--split" : ""}`} aria-labelledby={id} aria-describedby={describedBy}>
      <div className="bf-wrap bf-pagehead__inner">
        <div className="bf-pagehead__text">
          {back ? (
            <p className="bf-pagehead__back">
              <a href={back.href}>{back.label}</a>
            </p>
          ) : null}
          {eyebrow ? <p className="bf-eyebrow">{eyebrow}</p> : null}
          <h1 id={id} className={`bf-pagehead__title${size === "long" ? " bf-pagehead__title--long" : ""}`}>
            {title}
          </h1>
          {children}
        </div>
        {aside ? <div className="bf-pagehead__aside">{aside}</div> : null}
      </div>
    </section>
  );
}
