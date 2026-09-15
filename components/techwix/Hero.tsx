import FigureText from "@/components/FigureText";
import { metrics } from "@/content";
import type { SiteContent } from "@/content/site-schema";

import Button from "./Button";
import StatusChip from "./StatusChip";

/* The frame's width: at >=1025px the column beside the text (half the panel's
   content box, capped by its 1300px); below that the panel's full width, less
   the hero's 15px gutters. Phones take the 660 frame at every density through
   the first two sources: the field is a soft cloud of points, and 660 pixels
   are plenty for it at 390 — 33KB of AVIF on the LCP path instead of 87KB. */
const SIZES = "(min-width: 1025px) min(630px, calc(50vw - 110px)), calc(100vw - 30px)";

/**
 * §1 — the hero: the clone's rounded navy panel with COPY.md §1 and the proof
 * strip. Built to CLAUDE.md, "The hero field":
 *
 *  · Everything it says is server HTML: the headline, the subtext, both calls
 *    to action, the supporting line, and all four figures with their labels,
 *    their status and a link to their source.
 *  · The field sits BESIDE the headline — the right half of the panel at
 *    >=1025px, above the text below that — never behind it. The headline sits
 *    on flat navy, so its contrast holds by construction.
 *  · The LCP element is the POSTER, a real frame of the field: a plain <img>
 *    in a <picture> (the image optimizer stays off the LCP path) with its size,
 *    fetchpriority="high" and no lazy loading, and `data-hero-poster` for the
 *    suite to find it. It carries no information: alt="" and aria-hidden.
 *  · No canvas and no WebGL in this step. Step 4's renderer fades a canvas in
 *    over the poster, inside the same frame, so it cannot shift layout.
 *  · Below 1025px, or on a coarse pointer, the poster drifts slowly (a CSS
 *    transform); under reduced motion it stays still.
 *
 * The headline is one colour: a single coloured headline word is banned.
 */
export default function Hero({ hero }: { hero: SiteContent["hero"] }) {
  const headline = [hero.headlineLine1, hero.headlineLine2]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <section id="hero" className="tw-hero" aria-labelledby="hero-title">
      <div className="tw-hero__panel tw-on-dark">
        <div className="tw-hero__inner">
          <div className="tw-hero__text">
            {hero.badge.trim() ? <p className="tw-hero__subtitle">{hero.badge}</p> : null}
            <h1 id="hero-title" className="tw-title-wrapper">
              <span className="title-major tw-hero__title">{headline}</span>
            </h1>
            <p className="tw-hero__paragraph">
              <FigureText text={hero.subtext} />
            </p>
            <div className="tw-actions">
              <Button href={hero.primaryCtaHref} variant="primary">
                <FigureText text={hero.primaryCtaLabel} />
              </Button>
              {hero.secondaryCtaLabel.trim() ? (
                <Button href={hero.secondaryCtaHref} variant="secondary">
                  {hero.secondaryCtaLabel}
                </Button>
              ) : null}
            </div>
            {hero.tagline.trim() ? <p className="tw-hero__tagline">
                <FigureText text={hero.tagline} />
              </p> : null}
          </div>

          <div className="tw-hero__field" aria-hidden="true" data-hero-field>
            <picture>
              <source media="(max-width: 767px)" type="image/avif" srcSet="/hero/field-poster-660.avif" />
              <source media="(max-width: 767px)" type="image/webp" srcSet="/hero/field-poster-660.webp" />
              <source type="image/avif" srcSet="/hero/field-poster-660.avif 660w, /hero/field-poster-1320.avif 1320w" sizes={SIZES} />
              <source type="image/webp" srcSet="/hero/field-poster-660.webp 660w, /hero/field-poster-1320.webp 1320w" sizes={SIZES} />
              {/* eslint-disable-next-line @next/next/no-img-element -- the LCP poster: a plain <img> in a <picture>, so its fetch priority, size and formats are exactly what the served HTML says, with no optimizer round trip */}
              <img
                data-hero-poster
                className="tw-hero__poster"
                src="/hero/field-poster-660.webp"
                alt=""
                aria-hidden="true"
                width={660}
                height={560}
                fetchPriority="high"
              />
            </picture>
          </div>
        </div>

        {/* The proof strip: the four figures from content/metrics.ts. Each one
            shows its label, its shipped/target status and a link to the
            write-up it comes from — nothing here is a bare number. */}
        <div className="tw-proof">
          <ul className="tw-proof__list">
            {metrics.map((m) => (
              <li key={m.id} className="tw-proof__item">
                <p className="tw-proof__figure">{m.value}</p>
                <p className="tw-proof__label">
                  <FigureText text={m.label} />
                </p>
                <p className="tw-proof__meta">
                  <StatusChip status={m.status} />
                  {m.href ? (
                    <a className="tw-proof__source" href={m.href}>
                      {m.source}
                    </a>
                  ) : (
                    <span>{m.source}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          <p className="tw-proof__note">
            Every figure here comes from a system we shipped, and every one is labelled with whether it&rsquo;s measured or
            targeted. Ask on the call and we&rsquo;ll walk you through the architecture.
          </p>
        </div>
      </div>
    </section>
  );
}
