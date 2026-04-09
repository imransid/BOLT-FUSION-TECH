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
          className="px-5 md:px-20 pb-24 max-w-[1200px] mx-auto w-full scroll-mt-24 md:scroll-mt-28"
        >
          <p className="mb-4 text-center text-sm text-white/45">
            Or grab an open slot below — same 30‑minute intro call.
          </p>
          <CalendlyInlineEmbed />
        </div>
      </main>
      <Footer />
    </>
  );
}
