import FigureText from "@/components/FigureText";
import { lanes } from "@/content";

import Button from "./Button";

/**
 * §3 — how the numbers are produced. COPY.md §3, verbatim: the heading, the
 * intro and the three lanes. The metric band that used to close this section
 * is the hero's proof strip now, and its closing line sits under the strip.
 *
 * Lane text goes through <FigureText>, exactly as the component is, so every
 * figure content/figure-labels.ts labels carries its chip where it stands — the
 * target chips on "Roughly 20% of traffic" and "~$0.001 per search", as on the
 * old homepage. The chip's homepage look comes from app/(home)/techwix.css. No
 * status is decided here, and a figure the labels do not cover stays as it is.
 *
 * The cost line is one colour: teal and amber mean shipped and target on this
 * site, so they are not borrowed to mean "free path" and "paid path".
 */
export default function Architecture() {
  return (
    <section id="architecture" className="tw-band tw-band--light" aria-labelledby="arch-title">
      <div className="tw-band__inner">
        <div className="tw-heading" data-tw-reveal>
          <h2 id="arch-title" className="tw-title-wrapper">
            <span className="title-section">Type a query. Watch what it costs.</span>
          </h2>
          <p className="tw-heading__intro">
            Most AI products die after launch — too slow, too expensive, too unstable. This is the routing we built so one
            didn&rsquo;t. Every query is classified before any paid inference runs, so most traffic never reaches a model.
          </p>
        </div>

        <ul className="tw-lanes">
          {lanes.map((lane) => (
            <li key={lane.id} className="tw-lane" data-tone={lane.tone} data-tw-reveal>
              <h3 className="tw-title-wrapper">
                <span className="title-sub">{lane.name}</span>
              </h3>
              <p className="tw-lane__premise">— {lane.premise}</p>
              <p className="tw-lane__detail">
                <FigureText text={lane.detail} />
              </p>
              <p className="tw-lane__cost">
                <FigureText text={lane.cost} />
              </p>
            </li>
          ))}
        </ul>

        <p className="tw-actions">
          <Button href="/work/restaurant-search" variant="primary">
            Read the full architecture
          </Button>
          <Button href="#contact" variant="outline">
            Book a technical call
          </Button>
        </p>
      </div>
    </section>
  );
}
