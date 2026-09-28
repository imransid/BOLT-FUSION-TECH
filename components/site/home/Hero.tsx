import HeroScene from "@/components/field/HeroScene";
import type { SiteContent } from "@/content/site-schema";

import Cta, { ctaKind } from "../Cta";
import MotionToggle from "../MotionToggle";

/* The width the poster is DRAWN at, which is what `sizes` must say. At
   >=1025px the frame is 560px tall (app/site.css) and never wider than 660px,
   and the poster is CONTAINED in it (2026-09-28, as the scene draws a narrower
   field): it is drawn at the frame's width, 660px from 1280px up and 467–660px
   between 1025 and 1279 — at most 660, so the 660 file at DPR 1 and the 1320
   file at DPR 2 are never stretched (H4). Below 1025px the image covers its
   frame, filled by width: the content column, the viewport less the side
   gutters (16px each at phone widths). Phones take the 660 file at every
   density through the first two sources. */
const SIZES = "(min-width: 1025px) 660px, calc(100vw - 32px)";

/** The headline as two lines that never break inside: "Build" / "what's next."
 *  A line of one word is fine at the top; verify-site check 7 fails a headline
 *  whose LAST line is a single word, and each span is one part it reads. */
function headlineLines(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  const cut = Math.max(1, Math.floor(words.length / 2));
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/**
 * The hero (SPEC §5; CLAUDE.md, "The hero field"). Everything it says is server
 * HTML: the one h1, the support line, the body and both calls to action.
 *
 * The field sits BESIDE the text at >=1025px — the right column, a 560px-tall
 * frame on the ground colour — and above the text below that; never behind it.
 * The faint engineering grid and the one radial light are behind the field
 * only (.bf-hero__stage), never behind the words.
 *
 * The LCP element is the POSTER: a plain <img data-hero-poster> in a <picture>
 * (no optimizer on the LCP path) with its size, fetchpriority="high", never
 * lazy, alt="". The field carries no information and is aria-hidden. Below
 * 1025px, or on a coarse pointer, the poster drifts slowly (a CSS transform, so
 * no layout shift); under reduced motion it is still, and the pause control
 * stops it (components/site/MotionToggle).
 *
 * <HeroScene /> (components/field) mounts the three.js scene inside the field,
 * over the poster, at >=1025px with a fine pointer, no Save-Data and motion
 * allowed, after LCP and load. The poster is that scene's first frame, t = 0
 * (scene-poster-v2-*: /hero/* is served immutable, so a re-render is v3).
 */
export default function Hero({ hero }: { hero: SiteContent["hero"] }) {
  const [first, rest] = headlineLines(hero.title);
  return (
    <section id="hero" className="bf-hero" aria-labelledby="hero-title">
      <div className="bf-wrap bf-hero__inner">
        <div className="bf-hero__text">
          <h1 id="hero-title" className="bf-hero__title">
            <span className="bf-hero__line">{first}</span> <span className="bf-hero__line">{rest}</span>
          </h1>
          <p className="bf-hero__support">{hero.support}</p>
          <p className="bf-hero__body">{hero.body}</p>
          <div className="bf-actions">
            <Cta href={hero.primaryCta.href} cta="schedule">
              {hero.primaryCta.label}
            </Cta>
            <Cta href={hero.secondaryCta.href} variant="ghost" cta={ctaKind(hero.secondaryCta.href)}>
              {hero.secondaryCta.label}
            </Cta>
          </div>
        </div>

        <div className="bf-hero__media">
          <div className="bf-hero__stage">
            <div className="bf-hero__field" aria-hidden="true" data-hero-field>
              <picture>
                <source media="(max-width: 767px)" type="image/avif" srcSet="/hero/scene-poster-v2-660.avif" />
                <source media="(max-width: 767px)" type="image/webp" srcSet="/hero/scene-poster-v2-660.webp" />
                <source type="image/avif" srcSet="/hero/scene-poster-v2-660.avif 660w, /hero/scene-poster-v2-1320.avif 1320w" sizes={SIZES} />
                <source type="image/webp" srcSet="/hero/scene-poster-v2-660.webp 660w, /hero/scene-poster-v2-1320.webp 1320w" sizes={SIZES} />
                {/* The LCP poster: a plain <img> in a <picture>, never next/image, so its fetch priority, size and formats are exactly what the served HTML says, with no optimizer round trip. */}
                <img
                  data-hero-poster
                  className="bf-hero__poster"
                  src="/hero/scene-poster-v2-660.webp"
                  alt=""
                  aria-hidden="true"
                  width={660}
                  height={560}
                  fetchPriority="high"
                />
              </picture>
              <HeroScene />
            </div>
          </div>
          <MotionToggle />
        </div>
      </div>
    </section>
  );
}
