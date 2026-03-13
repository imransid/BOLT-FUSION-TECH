import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import AboutMe from "@/components/AboutMe";
import RecentWorks from "@/components/RecentWorks";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />
        <AboutMe />
        <RecentWorks />
        <Process />
        <Services />
        <Testimonials />
        <FAQ />
        <CTA />

        <div
          className="calendly-inline-widget"
          data-url="https://calendly.com/bolttechfusion/30min?background_color=1a1a1a&text_color=ffffff&primary_color=0069FF"
          style={{ minWidth: "320px", width: "100%", height: "700px" }}
        ></div>
        <script
          type="text/javascript"
          src="https://assets.calendly.com/assets/external/widget.js"
          async
        ></script>
      </main>
      <Footer />
    </>
  );
}
