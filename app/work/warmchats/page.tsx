import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site-url";
import WarmChatsCaseStudy from "@/components/case-studies/WarmChatsCaseStudy";

const TITLE = "WarmChats — AI appointment booking | Case study";
const DESCRIPTION =
  "How we built WarmChats: an always-on AI sales assistant that qualifies leads with Claude, replies instantly with GPT-4.1, and books appointments automatically — on an event-driven microservice stack (Next.js, NestJS, Django, PostgreSQL).";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  const canonical = new URL("/work/warmchats", site).toString();
  const ogImage = new URL("/projects/warmchats-ai-booking.png", site).toString();
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "article",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [{ url: ogImage, alt: "WarmChats — AI appointment booking" }],
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
  return <WarmChatsCaseStudy />;
}
