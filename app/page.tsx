import Landing from "components/app/landing/landing";
import AboutTeam from "components/app/about-team/about-team";
import Skills from "components/app/skills/skills";
import Clients from "components/app/clients/clients";
import Testimonials from "components/app/testimonials/testimonials";
import BookMeeting from "components/app/book-meeting/book-meeting";
import ContactUs from "components/app/contact-us/contact-us";
import StickyNav from "components/layout/sticky-nav/sticky-nav";

const HomePage = async () => {
  return (
    <>
      <StickyNav />
      <Landing />
      <AboutTeam />
      <Skills />
      <Clients />
      <Testimonials />
      <BookMeeting />
      <ContactUs />
    </>
  );
};

export default HomePage;
