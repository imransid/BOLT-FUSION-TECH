import type { SiteContent } from "@/content/site-schema";

import { PlusIcon } from "./icons";

/**
 * §6, first half — the five questions. Each is a <details name="faq">, decided
 * 2026-09-11 (CLAUDE.md, "Do not touch"): the answers are in the served HTML,
 * the browser opens them one at a time with or without script, and <summary>
 * reports open and closed to assistive technology itself — there is no
 * aria-expanded to keep in sync. The FAQPage structured data is built from
 * these same items (app/(home)/page.tsx).
 *
 * The section holds nothing clickable but the questions: verify-site check 14
 * finds the FAQ as the <section> around them, and reads each answer as the
 * <details> text after its question.
 */
export default function Faq({ faq }: { faq: SiteContent["faq"] }) {
  return (
    <section id="faq" className="tw-band tw-band--light" aria-labelledby="faq-title">
      <div className="tw-band__inner">
        <div className="tw-heading tw-heading--center" data-tw-reveal>
          <p className="tw-faq__badge">{faq.badge}</p>
          <h2 id="faq-title" className="tw-title-wrapper">
            <span className="title-section">{faq.title}</span>
          </h2>
        </div>
        <div className="tw-faq__list" data-tw-reveal>
          {faq.items.map((item) => (
            <details key={item.q} name="faq" className="tw-faq__item">
              <summary className="tw-faq__q">
                <span>{item.q}</span>
                <span className="tw-faq__icon" aria-hidden="true">
                  <PlusIcon />
                </span>
              </summary>
              <p className="tw-faq__a">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
