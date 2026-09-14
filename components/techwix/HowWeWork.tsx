import FigureText from "@/components/FigureText";
import { processSteps, services } from "@/content";

import Button from "./Button";

/**
 * §4 — how an engagement runs and what a founder buys. COPY.md §6, verbatim:
 * the three steps (a genuine sequence, so they are numbered), the engagement
 * models table (no price column — COPY.md §6) and the pilot lines.
 *
 * The table carries `id="services"`: the navigation's "Services" link lands on
 * what someone actually buys, which is also what the Service structured data
 * describes (content/services.ts).
 */
export default function HowWeWork() {
  return (
    <section id="how-we-work" className="tw-band tw-band--white" aria-labelledby="how-title">
      <div className="tw-band__inner">
        <div className="tw-heading" data-tw-reveal>
          <h2 id="how-title" className="tw-title-wrapper">
            <span className="title-section">How a project actually runs.</span>
          </h2>
        </div>

        <ol className="tw-steps">
          {processSteps.map((step, i) => (
            <li key={step.id} className="tw-step" data-tw-reveal>
              <span className="tw-step__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="tw-title-wrapper">
                <span className="title-small">{step.title}</span>
              </h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>

        {/* Scrolls sideways on a phone, so it takes focus: a keyboard user can
            scroll it too. */}
        <div id="services" className="tw-table" role="region" aria-label="Engagement models" tabIndex={0} data-tw-reveal>
          <table>
            <caption className="sr-only">Engagement models</caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Shape</th>
                <th scope="col">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>{s.shape}</td>
                  <td>
                    <FigureText text={s.timeline} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tw-pilot">
          <p>
            Most engagements start with the two-week pilot below. We&rsquo;ll give you a full quote for the wider build at the
            end of it, once we&rsquo;ve seen the real codebase.
          </p>
          <p>
            Two-week sprints, a demo at the end of each, a named escalation contact, and a written weekly report. Ask for a
            sample report and we&rsquo;ll send a real one.
          </p>
          <p className="tw-actions">
            <Button href="#contact" variant="primary">
              <FigureText text="Start a 2-week pilot" />
            </Button>
            <Button href="#recent-work" variant="outline">
              See recent work
            </Button>
          </p>
        </div>
      </div>
    </section>
  );
}
