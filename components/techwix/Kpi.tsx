import type { ReactNode } from "react";

import type { MetricStatus } from "@/content/schema";

import StatusChip from "./StatusChip";

/**
 * KPI cards: a figure, its own visible shipped/target chip, what it measures
 * and a hint. Every figure carries a status (CLAUDE.md, "Every metric carries a
 * shipped or target label"); the types that feed these — the case-study KPI
 * schema and the WarmChats KPI type — refuse one without it. A capability
 * ("Multi-tenant") is a word, not a metric, and takes no chip at all.
 *
 * The chip sits in the top row beside the figure, ahead of any chip inside
 * the hint, so the first status in the card is the figure's own.
 */
export function KpiGrid({ children, cols = 4, labelledBy }: { children: ReactNode; cols?: 3 | 4; labelledBy?: string }) {
  return (
    <ul className={cols === 3 ? "tw-kpis tw-kpis--3" : "tw-kpis"} aria-labelledby={labelledBy}>
      {children}
    </ul>
  );
}

export function KpiCard({
  value,
  label,
  hint,
  status,
}: {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
  status?: MetricStatus;
}) {
  return (
    <li className="tw-kpi" data-tw-reveal>
      <p className="tw-kpi__top">
        <span className={status ? "tw-kpi__value" : "tw-kpi__value tw-kpi__value--word"}>{value}</span>
        {status ? <StatusChip status={status} /> : null}
      </p>
      <p className="tw-kpi__label">{label}</p>
      {hint ? <p className="tw-kpi__hint">{hint}</p> : null}
    </li>
  );
}
