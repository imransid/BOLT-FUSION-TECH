import Image from "next/image";

import type { SiteContent } from "@/content/site-schema";

import Button from "./Button";
import { ArrowUpRightIcon } from "./icons";

type Work = SiteContent["recentWorks"]["items"][number];

/**
 * §2 — the two write-ups, straight after the hero, so the figures above have
 * somewhere to be verified. The clone's case-study row: a larger card beside a
 * smaller one.
 *
 * The screenshot is a real image with its alt text — it is content — and the
 * text sits on its own scrim, so it stays readable over a light screenshot.
 * Only a published project links anywhere, and it links to its write-up: the
 * schema refuses a published project without one, and there is no fallback.
 */
function Card({ p, large }: { p: Work; large: boolean }) {
  const published = p.state === "published" && Boolean(p.href);
  const cta = p.ctaLabel ?? "Read the case study";
  const body = (
    <>
      {p.src ? (
        <Image
          src={p.src}
          alt={p.alt}
          fill
          sizes={large ? "(max-width: 767px) 100vw, 55vw" : "(max-width: 767px) 100vw, 45vw"}
          className={`tw-case__img${p.imgClass ? " tw-case__img--top" : ""}`}
        />
      ) : null}
      <div className="tw-case__body">
        <p className="tw-case__stack">{p.stack}</p>
        <h3 className="tw-title-wrapper tw-case__title">
          <span className="title-sub">{p.title}</span>
        </h3>
        <p className="tw-case__outcome">{p.outcome}</p>
        {published ? (
          <span className="tw-case__cta">
            {cta}
            <ArrowUpRightIcon className="tw-case__cta-icon" />
          </span>
        ) : null}
      </div>
    </>
  );
  return published ? (
    <a href={p.href} className="tw-case" data-tw-reveal>
      {body}
    </a>
  ) : (
    <div className="tw-case" data-tw-reveal>
      {body}
    </div>
  );
}

export default function Proof({ work }: { work: SiteContent["recentWorks"] }) {
  return (
    <section id="recent-work" className="tw-band tw-band--white" aria-labelledby="work-title">
      <div className="tw-band__inner">
        <div className="tw-heading tw-heading--center" data-tw-reveal>
          <h2 id="work-title" className="tw-title-wrapper">
            <span className="title-section">{work.title}</span>
          </h2>
          {work.subtitle ? <p className="tw-heading__intro">{work.subtitle}</p> : null}
        </div>

        <div className="tw-cases">
          {work.items.map((p, i) => (
            <Card key={p.title} p={p} large={i === 0} />
          ))}
        </div>

        {/* The internal link path: homepage -> /work -> each write-up. */}
        <p className="tw-actions tw-actions--center">
          <Button href="/work" variant="outline">
            See all case studies
          </Button>
        </p>
      </div>
    </section>
  );
}
