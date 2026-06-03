import type { Metadata } from "next";
import Link from "next/link";

import { getSiteUrl } from "@/lib/site-url";
import { LogoMark } from "@/components/Logo";

const LAST_UPDATED = "3 June 2026";
const CONTACT_EMAIL = "hello@boltfusiontech.com";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteUrl();
  const canonical = new URL("/privacy-policy", site).toString();
  return {
    title: "Privacy Policy",
    description: "Privacy Policy for Bolt Fusion Tech (boltfusiontech.com).",
    alternates: { canonical },
    openGraph: {
      title: "Privacy Policy | Bolt Fusion Tech",
      description: "Privacy Policy for Bolt Fusion Tech (boltfusiontech.com).",
      type: "article",
      url: canonical,
      siteName: "Bolt Fusion Tech",
      locale: "en_US",
    },
    robots: { index: true, follow: true },
  };
}

type Section = {
  heading: string;
  body: React.ReactNode;
};

const sections: Section[] = [
  {
    heading: "1. Who we are",
    body: (
      <p>
        Bolt Fusion Tech · Offices: United Kingdom · Malaysia · Bangladesh ·
        Contact:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    ),
  },
  {
    heading: "2. Information we collect",
    body: (
      <p>
        We collect only what we need: information you give us (name, email,
        company, message details when you contact us or book a call); basic
        anonymised usage data (pages visited, browser type, approximate region);
        and cookies that help the site function and measure traffic. We do{" "}
        <strong className="text-white">not</strong> sell your personal
        information.
      </p>
    ),
  },
  {
    heading: "3. How we use your information",
    body: (
      <p>
        To respond to enquiries and provide our services; to send information you
        have requested; to operate and improve our website; and to meet legal
        obligations.
      </p>
    ),
  },
  {
    heading: "4. Social media and publishing tools",
    body: (
      <p>
        We operate official Bolt Fusion Tech pages on platforms including
        LinkedIn and Facebook. We use approved platform APIs and internal tools
        solely to publish our own marketing content to our own company pages. We
        do not access, collect, or store the personal data of other users or
        third parties through these tools, and we do not post on behalf of anyone
        other than Bolt Fusion Tech.
      </p>
    ),
  },
  {
    heading: "5. How we share information",
    body: (
      <p>
        Only with service providers who help us operate (hosting, email,
        analytics) under confidentiality terms, and with authorities where
        required by law. We do not sell or rent personal data.
      </p>
    ),
  },
  {
    heading: "6. Data retention",
    body: (
      <p>
        We keep personal information only as long as necessary for the purposes
        above or as required by law, then delete or anonymise it.
      </p>
    ),
  },
  {
    heading: "7. Your rights",
    body: (
      <p>
        Depending on your location (including under the UK GDPR and similar
        laws), you may have the right to access, correct, delete, or restrict the
        use of your personal data, and to object to certain processing. Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to exercise these
        rights.
      </p>
    ),
  },
  {
    heading: "8. Data security",
    body: (
      <p>
        We apply reasonable technical and organisational measures to protect your
        information and review our practices regularly.
      </p>
    ),
  },
  {
    heading: "9. International transfers",
    body: (
      <p>
        As we operate across the UK, Malaysia, and Bangladesh, your information
        may be processed in these countries, with appropriate safeguards where
        required.
      </p>
    ),
  },
  {
    heading: "10. Children's privacy",
    body: (
      <p>
        Our website and services are not directed to children under 16, and we do
        not knowingly collect their personal data.
      </p>
    ),
  },
  {
    heading: "11. Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The &ldquo;Last
        updated&rdquo; date reflects the latest revision.
      </p>
    ),
  },
  {
    heading: "12. Contact us",
    body: (
      <p>
        Questions? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or write to one of
        our offices in the United Kingdom, Malaysia, or Bangladesh.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-[760px] items-center px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
          >
            <LogoMark className="h-7 w-7 opacity-90" />
            <span className="text-sm">Bolt Fusion Tech</span>
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-[760px] px-5 py-14 [&_a]:text-amber-300/90 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-amber-200">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy — Bolt Fusion Tech
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-8 leading-relaxed text-white/75">
          Bolt Fusion Tech (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;) operates{" "}
          <a href="https://boltfusiontech.com">boltfusiontech.com</a> and provides
          custom software and product engineering services. This Privacy Policy
          explains what information we collect, how we use it, and the choices you
          have. By using our website or contacting us, you agree to the practices
          described here.
        </p>

        <div className="mt-4 space-y-1 text-white/75 [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_p]:leading-relaxed">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body}
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-white/5 pt-6">
          <Link
            href="/"
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            ← Back to boltfusiontech.com
          </Link>
        </div>
      </article>
    </main>
  );
}
