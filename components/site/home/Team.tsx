import Image from "next/image";

import { figureLabels } from "@/content/figure-labels";
import { yearsText, type SiteContent } from "@/content/site-schema";

type Member = SiteContent["team"]["roster"][number];

/** A pending member's monogram: the first letter of the name's first and last
 *  words. Text, never a picture. */
function initials(name: string) {
  const words = name.trim().split(/\s+/);
  const ends = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return ends.map((w) => w.charAt(0).toUpperCase()).join("");
}

/** What the owner supplies later — role, years, stack — each only when present. */
function Details({ m }: { m: Member }) {
  const stack = m.stack ?? [];
  /* "8 years" is a figure: it renders inside the exemption content/figure-labels.ts
     holds for that exact text. The schema refuses a years value without one. */
  const years = m.years === undefined ? undefined : figureLabels.find((l) => l.text === yearsText(m.years as number));
  const yearsExempt = years && "exempt" in years ? years : undefined;
  return (
    <>
      {m.role ? <p className="bf-person__role">{m.role}</p> : null}
      {yearsExempt || stack.length ? (
        <p className="bf-person__tags">
          {yearsExempt ? (
            <span className="bf-person__tag" data-figure-exempt={yearsExempt.exempt}>
              {yearsExempt.text}
            </span>
          ) : null}
          {stack.map((s) => (
            <span key={s} className="bf-person__tag">
              {s}
            </span>
          ))}
        </p>
      ) : null}
    </>
  );
}

/**
 * The team: ten engineers (owner, 2026-09-15), restyled for the redesign with
 * every rule kept (CLAUDE.md, Hard rules). Text-forward: no photograph exists
 * yet, so there is no photo slot — never a template avatar, a stock face or a
 * generated one.
 *
 * A VERIFIED member's card is their LinkedIn profile link, and the Person
 * structured data is built from the same roster. A PENDING member gets a card
 * with no link and no picture of any kind: the name, an initials monogram (text)
 * where a verified card carries its arrow, and "Profile coming soon" where a
 * verified card shows its handle. `data-person-card` and `data-person-status`
 * are verify-site checks 14 and 27's handles. Both counts are the roster's.
 */
export default function Team({ team }: { team: SiteContent["team"] }) {
  const roster = team.roster;
  const verified = roster.filter((m) => m.status === "verified").length;
  return (
    <section id="team" className="bf-section" aria-labelledby="team-title">
      <div className="bf-wrap">
        <div className="bf-team__head" data-bf-reveal>
          <div className="bf-head">
            <p className="bf-eyebrow">
              <span>{team.benchLabel}</span> <span className="bf-team__comment">{team.codeComment}</span>
            </p>
            <h2 id="team-title" className="bf-h2">
              <span className="bf-team__line">{team.headlineLine1}</span>{" "}
              <span className="bf-team__line">{team.headlineLine2}</span>
            </h2>
            <p className="bf-lead">{team.subtext}</p>
          </div>
          {/* Plain text, counted from the roster: the real numbers are in the server HTML. */}
          <div className="bf-team__stats">
            <p className="bf-team__stat">
              <span className="bf-team__count">{roster.length}</span> <span className="bf-team__count-label">{team.statLabel}</span>
            </p>
            <p className="bf-team__verified">
              {verified} {team.verifiedLabel}
            </p>
          </div>
        </div>

        <ul className="bf-team__grid">
          {roster.map((m) =>
            m.status === "verified" ? (
              <li key={m.id}>
                <a href={m.profileUrl} target="_blank" rel="noopener noreferrer" data-person-card data-person-status="verified" className="bf-person">
                  {m.photo ? <Image src={m.photo} alt={`Photo of ${m.name}`} width={56} height={56} className="bf-person__photo" /> : null}
                  <h3 className="bf-person__name">{m.name}</h3>
                  <Details m={m} />
                  <p className="bf-person__handle">{m.handle}</p>
                  <svg className="bf-person__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                    <path d="M4.5 11.5l7-7M6 4.5h5.5V10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                  <span className="sr-only">, LinkedIn profile (opens in a new tab)</span>
                </a>
              </li>
            ) : (
              <li key={m.id}>
                <div data-person-card data-person-status="pending" className="bf-person bf-person--pending">
                  <h3 className="bf-person__name">{m.name}</h3>
                  <Details m={m} />
                  <p className="bf-person__status">{team.pendingLabel}</p>
                  <span className="bf-person__monogram" aria-hidden="true">
                    {initials(m.name)}
                  </span>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
