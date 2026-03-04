import Member from "components/app/about-team/member/member";
import MarcFace from "public/team/marc-face.svg";
import SzymonFace from "public/team/szymon-face.svg";
import ThomasFace from "public/team/thomas-face.svg";
import ChristophFace from "public/team/christoph-face.svg";
import JanicFace from "public/team/janic-face.svg";
import CatalinFace from "public/team/catalin-face.svg";
import MoFace from "public/team/mo-face.svg";
import EricFace from "public/team/eric-face.svg";
import MateiFace from "public/team/matei-face.svg";
import ViktoriaFace from "public/team/viktoria-face.svg";

const AboutTeam = async () => {
  return (
    <section id="team" className="scroll-mt-20 bg-[#fafafa] text-black flex flex-col py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <p className="font-display text-xl sm:text-2xl leading-snug tracking-tight text-black/90 mx-auto lg:text-3xl">
          <strong className="text-black">7+ years building secure, scalable software.</strong> We deliver
          mobile apps, backends, AI, robotics, ERP & SaaS—Stripe, real-time sync, CI/CD, GraphQL, and enterprise-grade APIs.
        </p>
      </div>
      <div className="container text-center mx-auto mt-12 sm:mt-16 px-4 sm:px-6">
        <div className="mb-8 sm:mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight md:text-4xl">
            Our Expertise
          </h2>
          <p className="text-black/60 mt-1 text-lg">Mobile • Backend • AI • Robotics • ERP • SaaS • React Native • NestJS • PostgreSQL • GraphQL</p>
        </div>
        <section className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-10">
          <Member name="Marc" image={MarcFace} socialId="@mrousavy" />
          <Member name="Szymon" image={SzymonFace} socialId="@szymon20000" />
          <Member
            name="Thomas"
            image={ThomasFace}
            socialId="@thomas-coldwell"
          />
          <Member
            name="Christoph"
            image={ChristophFace}
            socialId="@chrispader"
          />
          <Member name="Janic" image={JanicFace} socialId="@janicduplessis" />
          <Member name="Catalin" image={CatalinFace} socialId="@catalinmiron" />
          <Member name="Mo" image={MoFace} socialId="@gorhom" />
          <Member name="Eric" image={EricFace} socialId="@ericvicenti" />
          <Member name="Matei" image={MateiFace} socialId="@mateioprea" />
          <Member
            name="Viktoria"
            image={ViktoriaFace}
            socialId="@viktoria.psd"
          />
        </section>
      </div>
    </section>
  );
};

export default AboutTeam;
