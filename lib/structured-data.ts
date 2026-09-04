import { faqs, services, team } from "@/content";

/**
 * JSON-LD — PLAN.md §7.
 *
 * EMITS ONLY WHAT THE CONTENT LAYER HOLDS. Three fields a generator would
 * normally add are deliberately absent, because no verified value exists:
 *
 *  · `foundingDate`   — not in /content, and not stated on the LinkedIn page.
 *  · `address`        — not in /content.
 *  · `numberOfEmployees` — OMITTED BECAUSE THE SOURCES CONTRADICT. The site says
 *    "Ten engineers"; LinkedIn's visible band says "11-50 employees"; LinkedIn's
 *    own embedded JSON-LD says `numberOfEmployees: 1`. Three values, two sources.
 *    PLAN.md §7: "Contradictions cause LLMs to drop or dilute the source." Emitting
 *    any one of them would assert a number we cannot stand behind, so the property
 *    is left out until the owner reconciles it.
 *
 * `Person` is emitted only for engineers with a verified LinkedIn URL — six of
 * ten. A Person node with no `sameAs` is an unverifiable name, which is the exact
 * claim section 5 exists to disprove.
 */

type Json = Record<string, unknown>;

/** Canonical company description — COPY.md §"Company description". The same
 *  text goes on the LinkedIn page and in llms.txt, so all three agree. It asserts
 *  no headcount, which is what lets the schema stay silent on a contradicted number. */
const ORG_DESCRIPTION =
  "We build AI systems that are still running in six months. Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh. We build production AI, custom software and platform work for teams who need systems that hold up after launch — not demos. How we work: named engineers assigned before you sign, 4–8 hours of overlap with US and EU working days, IP assigned on payment, and an NDA before scoping. Your first call is with the engineer who writes the code. Most engagements start with a two-week paid pilot: a scoped slice of your real product, fixed price, full IP, no obligation. Live work: warmchats.com";

export function organizationLd(siteUrl: string, sameAs: string[]): Json {
  return {
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: "Bolt Fusion Tech",
    url: siteUrl,
    logo: new URL("/favicon.svg", siteUrl).toString(),
    description: ORG_DESCRIPTION,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function serviceLd(siteUrl: string): Json[] {
  return services.map((s) => ({
    "@type": "Service",
    "@id": `${siteUrl}#service-${s.id}`,
    name: s.name,
    description: s.shape,
    provider: { "@id": `${siteUrl}#organization` },
  }));
}

export function faqPageLd(siteUrl: string): Json {
  return {
    "@type": "FAQPage",
    "@id": `${siteUrl}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Only engineers whose profile has been verified. */
export function personLd(siteUrl: string): Json[] {
  return team
    .filter((m) => m.linkedin)
    .map((m) => ({
      "@type": "Person",
      "@id": `${siteUrl}#person-${m.id}`,
      name: m.name,
      sameAs: [m.linkedin],
      worksFor: { "@id": `${siteUrl}#organization` },
      ...(m.role ? { jobTitle: m.role } : {}),
    }));
}

export function breadcrumbLd(
  siteUrl: string,
  trail: { name: string; path: string }[],
): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: new URL(t.path, siteUrl).toString(),
    })),
  };
}

export function buildGraph(siteUrl: string, sameAs: string[], extra: Json[] = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(siteUrl, sameAs),
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Bolt Fusion Tech",
        publisher: { "@id": `${siteUrl}#organization` },
      },
      ...serviceLd(siteUrl),
      faqPageLd(siteUrl),
      ...personLd(siteUrl),
      ...extra,
    ],
  };
}

/** Escapes `<` so an author-entered "</script>" cannot break out of the block. */
export function jsonLdHtml(graph: unknown): string {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
