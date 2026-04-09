import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import AboutMe from "@/components/AboutMe";
import Team from "@/components/Team";
import RecentWorks from "@/components/RecentWorks";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import CalendlyInlineEmbed from "@/components/CalendlyInlineEmbed";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />
        <AboutMe />
        <Team />
        <RecentWorks />
        <Process />
        <Services />
        <Testimonials />
        <FAQ />
        <CTA />

        <div
          id="schedule"
          className="mx-auto w-full min-w-0 max-w-[min(100%,1200px)] scroll-mt-20 px-4 pb-16 pt-2 sm:scroll-mt-24 sm:px-6 sm:pb-20 md:scroll-mt-28 md:px-10 lg:px-12 xl:px-16"
        >
          <p className="mb-4 px-1 text-center text-sm leading-snug text-white/45 text-balance sm:text-base sm:leading-normal">
            Or grab an open slot below — same 30‑minute intro call.
          </p>
          <CalendlyInlineEmbed />
        </div>
      </main>
      <Footer />
    </>
  );
}
