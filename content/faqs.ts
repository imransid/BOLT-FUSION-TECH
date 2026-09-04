import { faqSchema, parseContent, type Faq } from "./schema";
import { z } from "zod";

/** COPY.md §9 "Objections", verbatim. Rendered in section 9 and as FAQPage JSON-LD. */
export const faqs: Faq[] = parseContent(
  z.array(faqSchema),
  [
    {
      id: "who-writes-code",
      question: "Who exactly writes my code?",
      answer:
        "Named engineers, assigned before the contract, with public LinkedIn profiles. Your first technical call is with them. If we ever need to change who is on your project, we tell you before it happens.",
    },
    {
      id: "overlap-hours",
      question: "What happens outside overlap hours?",
      answer:
        "You get 4–8 hours of overlap with US and EU working days. Outside that window, work continues asynchronously against the agreed sprint scope, and there is a named escalation contact for anything urgent.",
    },
    {
      id: "ip-ownership",
      question: "Who owns the IP, and when?",
      answer:
        "You do. IP is assigned on payment, and we sign an NDA before scoping — before you share anything sensitive.",
    },
    {
      id: "bring-in-house",
      question: "What if we want to bring this in-house in a year?",
      answer:
        "That's a normal outcome and we plan for it. Every engagement ends with handover documentation, architecture decision records, and a walkthrough with your team.",
    },
    {
      id: "existing-codebase",
      question: "Can you work in a codebase you didn't write?",
      answer:
        "Yes. We start with a short audit — dependencies, test coverage, deployment path, known risks — and give you a written assessment before proposing any work.",
    },
    {
      id: "week-one",
      question: "What does week one look like?",
      answer:
        "Kickoff, access and environment setup, an architecture session, and a scoped backlog for sprint one. You see working software by the end of week two.",
    },
  ],
  "faqs.ts",
);
