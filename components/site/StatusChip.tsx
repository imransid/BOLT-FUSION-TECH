import type { MetricStatus } from "@/content/schema";

/* A figure's shipped/target label, as text — verify-site check 8 reads it.
   Lowercase and untracked (no tracked-out capitals). A pill in the two
   semantic colours, which nothing else on the site uses: green = shipped
   (measured), amber = target (app/site.css, "Status chips"). Never confusable
   with an evidence tier (components/site/TierChip), which is square, neutral
   and carries a meter. */
export default function StatusChip({ status }: { status: MetricStatus }) {
  return <span className={`bf-status bf-status--${status}`}>{status}</span>;
}
