import type { Metadata } from "next";

import PageBanner from "@/components/techwix/PageBanner";
import PageShell from "@/components/techwix/PageShell";
import { getSiteUrl } from "@/lib/site-url";

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
      images: [
        {
          url: new URL("/opengraph-image", site).toString(),
          width: 1200,
          height: 630,
          alt: "Bolt Fusion Tech — We build AI systems that are still running in six months.",
        },
      ],
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
        Bolt Fusion Tech, with offices in the United Kingdom, Malaysia and Bangladesh.
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
        <strong>not</strong> sell your personal
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

/* The privacy policy, in the site's design: the navy page banner with the
   title and the date, then the policy as legal prose (app/techwix.css, "Legal
   prose") on a white band. The words are unchanged. */
export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <PageBanner titleId="privacy-title" title="Privacy Policy — Bolt Fusion Tech">
        <p className="tw-banner__meta">Last updated: {LAST_UPDATED}</p>
      </PageBanner>

      <div className="tw-band tw-band--white">
        <div className="tw-band__inner">
          <article className="tw-prose" aria-labelledby="privacy-title">
            <p>
              Bolt Fusion Tech (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;) operates{" "}
              <a href="https://boltfusiontech.com">boltfusiontech.com</a> and provides
              custom software and product engineering services. This Privacy Policy
              explains what information we collect, how we use it, and the choices you
              have. By using our website or contacting us, you agree to the practices
              described here.
            </p>

            {sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.body}
              </section>
            ))}

            <p className="tw-prose__foot">
              <a href="/">← Back to boltfusiontech.com</a>
            </p>
          </article>
        </div>
      </div>
    </PageShell>
  );
}
