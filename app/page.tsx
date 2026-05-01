import type { Metadata } from "next";
import { Fragment } from "react";

import { getSiteUrl } from "@/lib/site-url";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AIDrivenExcellence from "@/components/AIDrivenExcellence";
import Projects from "@/components/Projects";
import AboutMe from "@/components/AboutMe";
import Team from "@/components/Team";
import RecentWorks from "@/components/RecentWorks";
import CaseStudy from "@/components/CaseStudy";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Industries from "@/components/Industries";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import CalendlyInlineEmbed from "@/components/CalendlyInlineEmbed";
import Footer from "@/components/Footer";
import { SiteContentProvider } from "@/context/SiteContentContext";
import { loadSiteContent } from "@/lib/load-site-content";
import type { SectionId } from "@/lib/site-content-schema";

/** ISR: rebuilds this page periodically so HTML/metadata stay cache-friendly for crawlers. Lower if CMS edits must appear faster. */
export const revalidate = 60;

const defaultOgImagePath = "/section-services.png";

export async function generateMetadata(): Promise<Metadata> {
  const c = await loadSiteContent();
  const site = getSiteUrl();
  const canonical = site.toString();
  const ogImageUrl = new URL(defaultOgImagePath, site).toString();

  return {
    title: { absolute: c.meta.title },
    description: c.meta.description,
    alternates: { canonical },
    openGraph: {
      title: c.meta.ogTitle,
      description: c.meta.ogDescription,
      type: "website",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
      images: [{ url: ogImageUrl, alt: c.meta.ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.meta.ogTitle,
      description: c.meta.ogDescription,
      images: [ogImageUrl],
    },
  };
}

function isVisible(
  visibility: Record<string, boolean>,
  id: SectionId,
): boolean {
  return visibility[id] !== false;
}

function renderSection(id: SectionId, blurb: string) {
  switch (id) {
    case "hero":
      return <Hero />;
    case "ai_excellence":
      return <AIDrivenExcellence />;
    case "projects":
      return <Projects />;
    case "about":
      return <AboutMe />;
    case "team":
      return <Team />;
    case "recent_works":
      return <RecentWorks />;
    case "case_study":
      return <CaseStudy />;
    case "process":
      return <Process />;
    case "services":
      return <Services />;
    case "industries":
      return <Industries />;
    case "testimonials":
      return <Testimonials />;
    case "faq":
      return <FAQ />;
    case "cta":
      return <CTA />;
    case "schedule_embed":
      return (
        <div
          id="schedule"
          className="mx-auto w-full min-w-0 max-w-[min(100%,1200px)] scroll-mt-20 px-4 pb-16 pt-2 sm:scroll-mt-24 sm:px-6 sm:pb-20 md:scroll-mt-28 md:px-10 lg:px-12 xl:px-16"
        >
          <p className="mb-4 px-1 text-center text-sm leading-snug text-white/45 text-balance sm:text-base sm:leading-normal">
            {blurb}
          </p>
          <CalendlyInlineEmbed />
        </div>
      );
    default:
      return null;
  }
}

function siteJsonLd(siteUrl: string, sameAs: string[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "Bolt Fusion Tech",
        url: siteUrl,
        logo: new URL("/favicon.svg", siteUrl).toString(),
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Bolt Fusion Tech",
        publisher: { "@id": `${siteUrl}#organization` },
      },
    ],
  };
}

export default async function Home() {
  const content = await loadSiteContent();
  const { sectionOrder, sectionVisibility } = content.site;
  const siteUrl = getSiteUrl().toString();
  const sameAs = content.footer.socialLinks.map((l) => l.url);

  return (
    <SiteContentProvider value={content}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(siteJsonLd(siteUrl, sameAs)),
        }}
      />
      <Navbar />
      <main>
        {sectionOrder.map((id) => {
          if (!isVisible(sectionVisibility, id)) return null;
          return (
            <Fragment key={id}>{renderSection(id, content.scheduleEmbed.blurb)}</Fragment>
          );
        })}
      </main>
      <Footer />
    </SiteContentProvider>
  );
}
