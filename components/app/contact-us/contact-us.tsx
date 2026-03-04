import Link from "next/link";

const ContactUs = async () => {
  return (
    <div id="contact" className="scroll-mt-20 min-h-screen bg-surface text-white flex flex-col justify-content items-center py-12 sm:py-16 lg:py-20 px-4">
      <div className="flex flex-1 flex-col justify-center items-center w-full max-w-xl">
        <Link
          href="/"
          className="font-display font-semibold tracking-wide text-white/80 hover:text-accent transition-colors mb-8 sm:mb-10 text-sm sm:text-base"
        >
          BOLT FUSION TECH
        </Link>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-center">
          Contact Us
        </h2>
        <p className="text-white/60 mt-2 sm:mt-3 text-center text-sm sm:text-base px-2">
          Tell us about your project. We&apos;ll get back within 24 hours.
        </p>
        <form className="w-full min-w-0 flex flex-col gap-4 sm:gap-5 px-2 sm:px-4 mt-8 sm:mt-12 max-w-[400px] sm:min-w-[320px]">
          <input
            id="companyName"
            name="companyName"
            className="bg-white/5 text-white placeholder:text-white/40 outline-none border border-white/20 rounded-xl px-4 py-3.5 sm:px-5 min-h-[48px] focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            required
            maxLength={128}
            type="text"
            placeholder="Company Name"
          />
          <input
            id="email"
            name="email"
            className="bg-white/5 text-white placeholder:text-white/40 outline-none border border-white/20 rounded-xl px-4 py-3.5 sm:px-5 min-h-[48px] focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            required
            maxLength={128}
            type="email"
            placeholder="Your email"
          />
          <textarea
            name="message"
            id="message"
            required
            maxLength={1048576}
            placeholder="Tell us about your project..."
            className="min-h-[12rem] sm:min-h-[14rem] bg-white/5 text-white placeholder:text-white/40 outline-none border border-white/20 rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-y min-h-[120px]"
          />
          <div className="text-center pt-2">
            <button
              className="w-full sm:w-auto bg-accent text-surface font-semibold rounded-xl px-8 py-3.5 min-h-[48px] hover:bg-accent/90 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface touch-manipulation"
              type="submit"
            >
              Send message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
