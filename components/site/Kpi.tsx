import type { ReactNode } from "react";

import type { MetricStatus } from "@/content/schema";

import StatusChip from "./StatusChip";

/**
 * KPI cells: a figure, its own visible shipped/target chip, what it measures
 * and a hint. Every figure carries a status (CLAUDE.md, "Every metric carries a
 * shipped or target label"); the types that feed these — the case-study KPI
 * schema and the WarmChats KPI type — refuse one without it. A capability
 * ("Multi-tenant") is a word, not a metric, and takes no chip at all.
 *
 * The chip sits in the top row beside the figure, ahead of any chip inside
 * the hint, so the first status in the cell is the figure's own. A ruled grid,
 * the cells sharing hairlines.
 */
export function KpiGrid({ children, cols = 4, labelledBy }: { children: ReactNode; cols?: 3 | 4; labelledBy?: string }) {
  return (
    <ul className={`bf-kpis bf-kpis--${cols}`} aria-labelledby={labelledBy}>
      {children}
    </ul>
  );
}

export function KpiCard({ value, label, hint, status }: { value: string; label: ReactNode; hint?: ReactNode; status?: MetricStatus }) {
  return (
    <li className="bf-kpi" data-bf-reveal>
      <p className="bf-kpi__top">
        <span className={status ? "bf-kpi__value" : "bf-kpi__value bf-kpi__value--word"}>{value}</span>
        {status ? <StatusChip status={status} /> : null}
      </p>
      <p className="bf-kpi__label">{label}</p>
      {hint ? <p className="bf-kpi__hint">{hint}</p> : null}
    </li>
  );
}
