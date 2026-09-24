import type { InsightDiagram } from "@/content/insights-schema";

/**
 * An article's diagram, drawn as what it is: an ordered flow. Each step is a
 * node on one rail, in order; a step with `branches` (a router's lanes, the
 * server's two answers) lays its alternatives side by side under it. It is
 * text — an <ol> a screen reader reads in order and a crawler indexes — not a
 * picture of text. The rail is the cyan of every data-flow line on the site
 * (never on text); the zero-padded step numbers are decoration, the list is
 * the order.
 */
export default function FlowSteps({ diagram, id }: { diagram: InsightDiagram; id: string }) {
  return (
    <figure className="bf-flowsteps" aria-labelledby={id}>
      <ol className="bf-flowsteps__list">
        {diagram.steps.map((s, i) => (
          <li key={s.label} className="bf-flowsteps__step">
            <span className="bf-flowsteps__num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="bf-flowsteps__label">{s.label}</p>
            {s.detail ? <p className="bf-flowsteps__detail">{s.detail}</p> : null}
            {s.branches ? (
              <ul className={`bf-flowsteps__branches bf-flowsteps__branches--${Math.min(s.branches.length, 3)}`}>
                {s.branches.map((b) => (
                  <li key={b.label} className="bf-flowsteps__branch">
                    <p className="bf-flowsteps__label">{b.label}</p>
                    {b.detail ? <p className="bf-flowsteps__detail">{b.detail}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
      <figcaption id={id} className="bf-flowsteps__caption">
        {diagram.caption}
      </figcaption>
    </figure>
  );
}
