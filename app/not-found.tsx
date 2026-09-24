import type { Metadata } from "next";
import Link from "next/link";

import PageHead from "@/components/site/PageHead";
import SiteShell from "@/components/site/SiteShell";

/* The 404 for every URL that matches no page, and for notFound(): the standard
   app/not-found.tsx under the one root layout, so it is in the site's design,
   with its header and footer, and answers with status 404. Its words are the
   ones the site's 404 always showed — Next's "404" and "This page could not be
   found." — and the way home is the privacy policy's own link text. Next adds
   `noindex` to it. The literal link to "/" is a <Link> (eslint's
   no-html-link-for-pages; verify-site check 24). */
export const metadata: Metadata = {
  title: { absolute: "404: This page could not be found." },
};

export default function NotFound() {
  return (
    <SiteShell ground="graphite">
      <div className="bf-notfound">
        <PageHead id="not-found-title" title="This page could not be found." eyebrow="404">
          <p className="bf-actions">
            <Link href="/" prefetch={false} className="bf-btn bf-btn--ghost bf-btn--md">
              ← Back to boltfusiontech.com
            </Link>
          </p>
        </PageHead>
      </div>
    </SiteShell>
  );
}
