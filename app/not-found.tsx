import type { Metadata } from "next";

import Button from "@/components/techwix/Button";
import PageBanner from "@/components/techwix/PageBanner";
import PageShell from "@/components/techwix/PageShell";

/* The 404 for every URL that matches no page, and for notFound(): the standard
   app/not-found.tsx under the one root layout, so it is in the site's design,
   with its header and footer, and answers with status 404. Its words are the
   ones the site's 404 always showed — Next's "404" and "This page could not be
   found." — and the way home is the privacy policy's own link text. Next adds
   `noindex` to it. */
export const metadata: Metadata = {
  title: { absolute: "404: This page could not be found." },
};

export default function NotFound() {
  return (
    <PageShell>
      <div className="tw-notfound">
        <PageBanner titleId="not-found-title" title="This page could not be found." eyebrow="404">
          <p className="tw-actions">
            <Button href="/" variant="light">
              ← Back to boltfusiontech.com
            </Button>
          </p>
        </PageBanner>
      </div>
    </PageShell>
  );
}
