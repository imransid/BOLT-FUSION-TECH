import type { MetricStatus } from "@/content/schema";

/* The visible shipped/target label, as text — verify-site check 8 reads it.
   Lowercase and untracked: CLAUDE.md bans tracked-out capital labels. The
   colours carry the meaning they carry everywhere on the site (teal-cyan =
   shipped, measured; amber = target) and follow the band the chip sits on
   (app/(home)/techwix.css, "Status chips"). */
export default function StatusChip({ status }: { status: MetricStatus }) {
  return <span className={`tw-chip tw-chip--${status}`}>{status}</span>;
}
