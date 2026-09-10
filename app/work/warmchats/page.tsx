import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site-url";
import WarmChatsCaseStudy from "@/components/case-studies/WarmChatsCaseStudy";

const TITLE = "WarmChats — AI that books real estate appointments";
const DESCRIPTION =
  "How we built WarmChats: an always-on AI assistant that qualifies every new real estate lead with Claude and books showings automatically.";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  const canonical = new URL("/work/warmchats", site).toString();
  const ogImage = new URL("/projects/warmchats-ai-booking-og.png", site).toString();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "article",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "WarmChats — AI appointment booking" }],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export default function WarmChatsCaseStudyPage() {
  const site = getSiteUrl().toString();
  const url = new URL("/work/warmchats", site).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: site },
          { "@type": "ListItem", position: 2, name: "Work", item: new URL("/#recent-work", site).toString() },
          { "@type": "ListItem", position: 3, name: "WarmChats case study", item: url },
        ],
      },
      {
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        image: new URL("/projects/warmchats-ai-booking.png", site).toString(),
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Bolt Fusion Tech", url: site },
        publisher: { "@type": "Organization", name: "Bolt Fusion Tech", url: site },
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <WarmChatsCaseStudy />
    </>
  );
}
