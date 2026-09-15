import { CANONICAL_DESCRIPTION, COMPANY_LINE } from "@/content/canonical";
import { capabilities } from "@/content/engineering";

/**
 * JSON-LD — PLAN.md §7, and the owner's redesign of 2026-09-16 (SPEC §4).
 *
 * EMITS ONLY WHAT THE CONTENT LAYER HOLDS. Three fields a generator would
 * normally add are deliberately absent, because no verified value exists:
 *
 *  · `foundingDate`   — not in /content, and not stated on the LinkedIn page.
 *  · `address`        — not in /content.
 *  · `numberOfEmployees` — OMITTED BECAUSE THE SOURCES CONTRADICT. The site
 *    lists ten engineers, six of them with a verified profile (since
 *    2026-09-15); LinkedIn's visible band says "11-50 employees"; LinkedIn's
 *    own embedded JSON-LD says `numberOfEmployees: 1`. Several values, two
 *    sources.
 *    PLAN.md §7: "Contradictions cause LLMs to drop or dilute the source." Emitting
 *    any one of them would assert a number we cannot stand behind, so the property
 *    is left out until the owner reconciles it.
 *
 * `Person` is emitted for the VERIFIED people the Team section lists — each has
 * a verified LinkedIn URL — and for no pending member. A Person node with no
 * `sameAs` is an unverifiable name, which is the exact claim the Team section
 * exists to disprove.
 *
 * `Service` is one node per capability, from content/engineering.ts — the same
 * entries the capability sections render. Robotics' description carries its
 * honesty line: it is Lab, and nothing there is a shipped system.
 */

type Json = Record<string, unknown>;

/** Canonical company description — COPY.md, "Company description — canonical",
 *  changed by the owner on 2026-09-16. Its first sentence is the canonical line
 *  (content/canonical.ts), which verify-site check 12 finds everywhere else. The
 *  same text goes in llms.txt. It asserts no headcount, which is what lets the
 *  schema stay silent on a contradicted number. */
const ORG_DESCRIPTION = [
  CANONICAL_DESCRIPTION,
  COMPANY_LINE,
  "We build web and mobile platforms, AI and automation, HR and point-of-sale systems, and the infrastructure under them; full ERP is designed but not yet delivered, and we haven't delivered robotics work yet.",
  "How we work: named engineers assigned before you sign, 4–8 hours of overlap with US and EU working days, IP assigned on payment, and an NDA before scoping. Your first call is with the engineer who writes the code.",
  "Most engagements start with a two-week paid pilot: a scoped slice of your real product, fixed price, full IP, no obligation.",
  "Live work: warmchats.com",
].join(" ");

export function organizationLd(siteUrl: string, sameAs: string[]): Json {
  return {
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: "Bolt Fusion Tech",
    url: siteUrl,
    logo: new URL("/apple-touch-icon.png", siteUrl).toString(),
    description: ORG_DESCRIPTION,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** One Service per capability — what the capability sections on / render. */
export function serviceLd(siteUrl: string): Json[] {
  return capabilities.map((c) => ({
    "@type": "Service",
    "@id": `${siteUrl}#service-${c.id}`,
    name: c.name,
    serviceType: c.name,
    description: c.honesty ? `${c.body} ${c.honesty}` : c.body,
    url: new URL(`/#${c.id}`, siteUrl).toString(),
    provider: { "@id": `${siteUrl}#organization` },
  }));
}

/** The FAQ the page renders, and nothing else. Pass the SAME items the FAQ
 *  section is given (`content.faq.items`). There is deliberately no second copy
 *  of the FAQ anywhere, so the markup and the page cannot disagree. Pass an
 *  empty array when the section is hidden: no visible FAQ, no FAQPage. */
export type RenderedFaq = { q: string; a: string }[];

export function faqPageLd(siteUrl: string, renderedFaq: RenderedFaq): Json[] {
  if (renderedFaq.length === 0) return [];
  return [
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}#faq`,
      mainEntity: renderedFaq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}

/** The people the Team section renders, and nothing else. Pass the SAME roster
 *  the section is given (`content.team.roster`), or [] when it is hidden.
 *  Only a VERIFIED member becomes a Person: a pending one has no verified
 *  profile, and a Person with no `sameAs` is an unverifiable name. The filter
 *  lives here, where Person is built, so no caller can emit one for a pending
 *  member (decided 2026-09-15). Only fields that exist are emitted: role becomes
 *  jobTitle and stack becomes knowsAbout the moment real values are supplied,
 *  and an empty one is left out, never sent blank. Years of experience has no
 *  schema.org property on Person, so it stays on the card only. */
export type RenderedTeam = (
  | { status: "verified"; id: string; name: string; profileUrl: string; role?: string; stack?: string[] }
  | { status: "pending"; id: string; name: string }
)[];

export function personLd(siteUrl: string, renderedTeam: RenderedTeam): Json[] {
  return renderedTeam.flatMap((m) => {
    if (m.status !== "verified") return [];
    const role = m.role?.trim();
    const stack = (m.stack ?? []).map((t) => t.trim()).filter(Boolean);
    return [
      {
        "@type": "Person",
        "@id": `${siteUrl}#person-${m.id}`,
        name: m.name,
        sameAs: [m.profileUrl],
        worksFor: { "@id": `${siteUrl}#organization` },
        ...(role ? { jobTitle: role } : {}),
        ...(stack.length > 0 ? { knowsAbout: stack } : {}),
      },
    ];
  });
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

/** The homepage's graph. `withServices` is false when the capability sections
 *  are hidden: no rendered capability, no Service node. */
export function buildGraph(
  siteUrl: string,
  sameAs: string[],
  renderedFaq: RenderedFaq,
  renderedTeam: RenderedTeam,
  extra: Json[] = [],
  withServices = true,
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(siteUrl, sameAs),
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Bolt Fusion Tech",
        description: CANONICAL_DESCRIPTION,
        publisher: { "@id": `${siteUrl}#organization` },
      },
      ...(withServices ? serviceLd(siteUrl) : []),
      ...faqPageLd(siteUrl, renderedFaq),
      ...personLd(siteUrl, renderedTeam),
      ...extra,
    ],
  };
}

/** Escapes `<` so an author-entered "</script>" cannot break out of the block. */
export function jsonLdHtml(graph: unknown): string {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
