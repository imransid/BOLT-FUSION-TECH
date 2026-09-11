"use client";

import { useSiteContent } from "@/context/SiteContentContext";
import { reveal } from "@/lib/reveal";

/* The answers are in the served HTML. Each item is a <details>: the browser
   opens and closes it — one at a time, through the shared `name` — with or
   without script, and reports its expanded state to assistive technology
   itself. The open/close animation is CSS (FAQ in app/globals.css). The
   FAQPage structured data is built from these same items. */
export default function FAQ() {
  const { faq } = useSiteContent();
  const faqs = faq.items;

  return (
    <section className="py-20 px-5 md:px-20">
      <div className="max-w-[900px] mx-auto flex flex-col gap-8">
        {/* Section heading */}
        <div
          {...reveal({ y: 20, duration: 0.5 })}
          className="flex flex-col gap-4 items-center text-center"
        >
          <div
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0d0d0d]"
            style={{
              boxShadow:
                "16px 24px 20px 8px rgba(0,0,0,0.4), inset 0 2px 0 0 rgba(184,180,180,0.08)",
            }}
          >
            <span className="w-[11px] h-[11px] rounded-[10px] bg-white flex items-center justify-center">
              <span className="w-[8px] h-[9px] rounded-[10px] bg-[#0d0d0d] flex items-center justify-center">
                <span className="w-[5px] h-[5px] rounded-[10px] bg-white" />
              </span>
            </span>
            <span className="text-sm text-white">{faq.badge}</span>
          </div>

          <h2
            className="px-1 text-[clamp(2rem,8vw,3.5rem)] font-normal leading-[1.05] text-balance sm:text-7xl sm:leading-[1em] lg:text-[80px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {faq.title}
          </h2>
        </div>

        {/* FAQ items */}
        <div className="flex flex-col gap-0">
          {faqs.map((item, i) => (
            <details
              key={i}
              name="faq"
              {...reveal({ y: 20, duration: 0.4, delay: i * 0.08 })}
              className="faq-item group border-b border-white/10"
            >
              <summary className="w-full flex items-center justify-between py-6 text-left cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg text-white/90 pr-6">{item.q}</span>
                <span
                  className="flex flex-shrink-0 motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45"
                  aria-hidden
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 256 256"
                    fill="white"
                    className="opacity-50"
                  >
                    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
                  </svg>
                </span>
              </summary>
              <p className="text-sm text-white/60 pb-6 leading-relaxed max-w-[640px]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
