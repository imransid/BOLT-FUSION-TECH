import type { Metadata } from "next";
import { Fragment } from "react";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AIDrivenExcellence from "@/components/AIDrivenExcellence";
import Projects from "@/components/Projects";
import AboutMe from "@/components/AboutMe";
import Team from "@/components/Team";
import RecentWorks from "@/components/RecentWorks";
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

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await loadSiteContent();
  return {
    title: c.meta.title,
    description: c.meta.description,
    openGraph: {
      title: c.meta.ogTitle,
      description: c.meta.ogDescription,
      type: "website",
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

export default async function Home() {
  const content = await loadSiteContent();
  const { sectionOrder, sectionVisibility } = content.site;

  return (
    <SiteContentProvider value={content}>
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
