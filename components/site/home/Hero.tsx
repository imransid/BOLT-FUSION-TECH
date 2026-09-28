import HeroScene from "@/components/field/HeroScene";
import { projects } from "@/content";
import type { SiteContent } from "@/content/site-schema";

import Cta, { ctaKind } from "../Cta";
import { ArrowUpRightIcon } from "../icons";
import MotionToggle from "../MotionToggle";

/* The width the poster is DRAWN at, which is what `sizes` must say. The image
   covers its frame, so a frame taller than the image's 660:560 is filled by
   height, and the drawn width is the frame's height x 1.18, not its width.
   At >=1025px the frame is 560px tall (app/site.css) and never wider than
   660px, so the poster is drawn exactly 660px wide at every desktop width: the
   660 file at DPR 1, the 1320 file at DPR 2, neither stretched (H4). Below
   1025px the frame is filled by width: the content column, the viewport less
   the side gutters (16px each at phone widths). Phones take the 660 file at
   every density through the first two sources. */
const SIZES = "(min-width: 1025px) 660px, calc(100vw - 32px)";

/** The headline as two lines that never break inside: "Build" / "what's next."
 *  A line of one word is fine at the top; verify-site check 7 fails a headline
 *  whose LAST line is a single word, and each span is one part it reads. */
function headlineLines(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  const cut = Math.max(1, Math.floor(words.length / 2));
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/** The proof line's items: each project's name, client and link from
 *  content/projects.ts. A case study links to its write-up; a product without
 *  one links to the product itself, live — its first link in
 *  content/projects.ts — so "in production" is something a buyer can open and
 *  check, not a card to scan for on /work (2026-09-28, DECISIONS item 2: "the
 *  existing links from content/projects.ts"). */
function proofItems(ids: readonly string[]) {
  return ids.map((id) => {
    const p = projects.find((x) => x.id === id);
    if (!p) throw new Error(`hero.proof names "${id}", which is not in content/projects.ts`);
    const writeUp = p.kind === "case-study" && p.href ? p.href : null;
    const href = writeUp ?? p.links[0]?.href;
    if (!href) throw new Error(`hero.proof names "${id}", which has no write-up and no live link in content/projects.ts`);
    return { id, name: p.name, client: p.client ?? null, href, external: !writeUp };
  });
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
 * (scene-poster-v1-*: /hero/* is served immutable, so a re-render is v2).
 */
export default function Hero({ hero }: { hero: SiteContent["hero"] }) {
  const [first, rest] = headlineLines(hero.title);
  const proof = proofItems(hero.proof.projects);
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
          {/* Under the calls to action (2026-09-28): what the first call is, in
              the approved /about words, and the proof line — shipped work with
              its attribution, each a link to its write-up or to the product
              itself. Server HTML, still, like everything the hero says
              (check 28). */}
          <p className="bf-hero__micro">{hero.microcopy}</p>
          <div className="bf-hero__proof">
            <p id="hero-proof-label" className="bf-hero__proof-label">
              {hero.proof.label}
            </p>
            <ul className="bf-hero__proof-list" aria-labelledby="hero-proof-label">
              {proof.map((p) => (
                <li key={p.id} className="bf-hero__proof-item">
                  {p.external ? (
                    <a href={p.href} className="bf-hero__proof-name" target="_blank" rel="noopener noreferrer">
                      {p.name}
                      <ArrowUpRightIcon className="bf-hero__proof-out" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <a href={p.href} className="bf-hero__proof-name">
                      {p.name}
                    </a>
                  )}
                  {p.client ? <span className="bf-hero__proof-for">for {p.client}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bf-hero__media">
          <div className="bf-hero__stage">
            <div className="bf-hero__field" aria-hidden="true" data-hero-field>
              <picture>
                <source media="(max-width: 767px)" type="image/avif" srcSet="/hero/scene-poster-v1-660.avif" />
                <source media="(max-width: 767px)" type="image/webp" srcSet="/hero/scene-poster-v1-660.webp" />
                <source type="image/avif" srcSet="/hero/scene-poster-v1-660.avif 660w, /hero/scene-poster-v1-1320.avif 1320w" sizes={SIZES} />
                <source type="image/webp" srcSet="/hero/scene-poster-v1-660.webp 660w, /hero/scene-poster-v1-1320.webp 1320w" sizes={SIZES} />
                {/* The LCP poster: a plain <img> in a <picture>, never next/image, so its fetch priority, size and formats are exactly what the served HTML says, with no optimizer round trip. */}
                <img
                  data-hero-poster
                  className="bf-hero__poster"
                  src="/hero/scene-poster-v1-660.webp"
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
