import FigureText from "@/components/FigureText";
import type { SiteContent } from "@/content/site-schema";

/**
 * The questions. Each is a <details name="faq">, decided 2026-09-11 (CLAUDE.md,
 * "Do not touch"): the answers are in the served HTML, the browser opens them
 * one at a time with or without script, and <summary> reports open and closed
 * to assistive technology itself — there is no aria-expanded to keep in sync.
 * The FAQPage structured data is built from these same items (app/page.tsx).
 *
 * An answer's figure carries its label or exemption where it sits, as every
 * figure does (<FigureText>, content/figure-labels.ts): since 2026-09-28 the
 * overlap answer holds "4–8 hours of overlap", exempt for that instance.
 *
 * The section holds nothing clickable but the questions: verify-site check 14
 * finds the FAQ as the <section> around them, and reads each answer as the
 * <details> text after its question.
 */
export default function Faq({ faq }: { faq: SiteContent["faq"] }) {
  return (
    <section id="faq" className="bf-section" aria-labelledby="faq-title">
      <div className="bf-wrap bf-faq">
        <div className="bf-head bf-faq__head" data-bf-reveal>
          <p className="bf-eyebrow">{faq.badge}</p>
          <h2 id="faq-title" className="bf-h2">
            {faq.title}
          </h2>
        </div>
        <div className="bf-faq__list">
          {faq.items.map((item) => (
            <details key={item.q} name="faq" className="bf-faq__item">
              <summary className="bf-faq__q">
                <span>{item.q}</span>
                <svg className="bf-faq__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M8 2.5v11M2.5 8h11" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </summary>
              <p className="bf-faq__a">
                <FigureText text={item.a} />
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
