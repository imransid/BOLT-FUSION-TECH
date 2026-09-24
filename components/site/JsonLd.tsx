import { jsonLdHtml } from "@/lib/structured-data";

/** A JSON-LD block. `<` is escaped (lib/structured-data.ts, jsonLdHtml), so a
 *  "</script>" in any content string cannot break out of it. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />;
}
