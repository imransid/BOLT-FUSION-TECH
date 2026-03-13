"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "What services do you offer?",
    a: "I specialize in Brand Identity Design, Package Design, Brand Design, and Mockup Design. From logos and visual systems to product packaging, I craft bold visuals that elevate your brand.",
  },
  {
    q: "How long does a project take?",
    a: "Most projects are delivered within 2-3 days. Complex brand identity projects may take up to a week depending on scope and revisions needed.",
  },
  {
    q: "What is your design process?",
    a: "My process follows three steps: Define Your Vision (understanding your needs), Submit Your Request (sharing requirements through our portal), and Project Delivered (receiving polished, on-brand deliverables).",
  },
  {
    q: "Do you offer revisions?",
    a: "Yes! Every project includes revision rounds to ensure the final deliverables perfectly match your vision. I work closely with you until you're fully satisfied.",
  },
  {
    q: "How do I get started?",
    a: "Simply book a free call through the contact section, or submit your design request through our portal. I'll review your needs and get back to you promptly.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-5 md:px-20">
      <div className="max-w-[900px] mx-auto flex flex-col gap-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
            <span className="text-sm text-white">FAQ</span>
          </div>

          <h2
            className="text-5xl sm:text-7xl lg:text-[80px] font-normal leading-[1em]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Questions? Answers.
          </h2>
        </motion.div>

        {/* FAQ items */}
        <div className="flex flex-col gap-0">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="border-b border-white/10"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left cursor-pointer"
              >
                <span className="text-lg text-white/90 pr-6">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
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
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-white/60 pb-6 leading-relaxed max-w-[640px]">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
