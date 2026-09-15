import { TIER_LABEL, TIER_LEVEL, TIER_MEANING, evidenceTiers, type EvidenceTier } from "@/content/engineering-schema";

/**
 * An evidence tier (CLAUDE.md, "Evidence tiers"): Proven, Core, Capable, Lab.
 *
 * A THIRD visual family, deliberately unlike the shipped/target chips of a
 * figure (components/site/StatusChip): square corners, a neutral outline, the
 * text colour, and a four-step meter — full for Proven, one step for Lab — in
 * the brand blue. Never green or amber, never a pill, and never `data-status`,
 * which verify-site check 8 reads as a figure's label. It carries `data-tier`.
 *
 * The meter is decoration; the words say the tier ("Evidence: Lab").
 */
export default function TierChip({ tier, scope }: { tier: EvidenceTier; scope?: string }) {
  const level = TIER_LEVEL[tier];
  return (
    <span className="bf-tier" data-tier={tier}>
      <span className="bf-tier__meter" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={i <= level ? "is-on" : undefined} />
        ))}
      </span>
      <span className="sr-only">Evidence: </span>
      <span className="bf-tier__label">{TIER_LABEL[tier]}</span>
      {scope ? <span className="bf-tier__scope">{scope}</span> : null}
    </span>
  );
}

/** What the four tiers mean — shown once, where the tiers are first used. */
export function TierLegend() {
  return (
    <dl className="bf-tier-legend" aria-label="Evidence tiers">
      {evidenceTiers.map((t) => (
        <div key={t} className="bf-tier-legend__row">
          <dt>
            <TierChip tier={t} />
          </dt>
          <dd>{TIER_MEANING[t]}</dd>
        </div>
      ))}
    </dl>
  );
}
