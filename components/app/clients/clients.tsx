import ClientsLogos from "components/app/clients/clients-logos/clients-logos";

const Clients = async () => {
  return (
    <section id="clients" className="scroll-mt-20 min-h-screen bg-white text-black flex flex-col justify-content items-center py-12 sm:py-16 md:py-24">
      <div className="flex flex-1 flex-col justify-center items-center mb-8 sm:mb-12 px-4">
        <p className="font-display text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-black/50 text-center">
          <span className="whitespace-nowrap">Built for</span>{" "}
          <span className="whitespace-nowrap">startups, enterprises & government</span>
        </p>
      </div>
      <ClientsLogos />
      <div className="flex flex-1 flex-col justify-center items-center mt-12 sm:mt-16 md:mt-20">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <p className="font-display text-xl sm:text-2xl font-medium leading-relaxed tracking-tight text-center text-black/85 lg:text-3xl">
            Transparent development, from architecture to deployment. HR & payroll,
            fintech, CMS, and consumer apps—delivered on time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Clients;
