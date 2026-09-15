import Image from "next/image";

import { figureLabels } from "@/content/figure-labels";
import { yearsText, type SiteContent } from "@/content/site-schema";

import { ArrowUpRightIcon } from "./icons";

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
      {m.role ? <p className="tw-person__role">{m.role}</p> : null}
      {yearsExempt || stack.length ? (
        <p className="tw-person__tags">
          {yearsExempt ? (
            <span className="tw-person__tag" data-figure-exempt={yearsExempt.exempt}>
              {yearsExempt.text}
            </span>
          ) : null}
          {stack.map((s) => (
            <span key={s} className="tw-person__tag">
              {s}
            </span>
          ))}
        </p>
      ) : null}
    </>
  );
}

/**
 * §5 — the team: ten engineers (owner, 2026-09-15). Text-forward: no
 * photograph exists yet, so there is no photo slot — never a template avatar,
 * a stock face or a generated one.
 *
 * A VERIFIED member's card is their LinkedIn profile link, and the Person
 * structured data is built from the same roster. A PENDING member — a named
 * team member with no verified profile yet — gets a card with no link: the
 * name, an initials monogram in the corner where a verified card carries its
 * arrow, and the pending label where a verified card shows its handle. So every
 * card shares its edges and its name and bottom-line baselines, whichever state
 * it is in (verify-site checks 14 and 27).
 *
 * Role, years and stack are empty until each engineer supplies real values;
 * each renders only when present, never as a placeholder. A photo renders only
 * for a verified member who has one.
 */
export default function Team({ team }: { team: SiteContent["team"] }) {
  const roster = team.roster;
  const verified = roster.filter((m) => m.status === "verified").length;
  return (
    <section id="team" className="tw-band tw-band--navy tw-on-dark" aria-labelledby="team-title">
      <div className="tw-band__inner">
        <div className="tw-team__head" data-tw-reveal>
          <div className="tw-team__intro">
            <p className="tw-team__eyebrow">
              <span>{team.benchLabel}</span>
              <span className="tw-team__comment">{team.codeComment}</span>
            </p>
            <h2 id="team-title" className="tw-title-wrapper">
              <span className="title-section tw-team__line">{team.headlineLine1}</span>{" "}
              <span className="title-section tw-team__line">{team.headlineLine2}</span>
            </h2>
            <p className="tw-team__sub">{team.subtext}</p>
          </div>
          {/* Plain text, counted from the roster: the real numbers are in the server HTML. */}
          <div className="tw-team__stats">
            <p className="tw-team__stat">
              <span className="tw-team__count">{roster.length}</span> <span className="tw-team__count-label">{team.statLabel}</span>
            </p>
            <p className="tw-team__verified">
              {verified} {team.verifiedLabel}
            </p>
          </div>
        </div>

        <ul className="tw-team__grid">
          {roster.map((m) =>
            m.status === "verified" ? (
              <li key={m.id} data-tw-reveal>
                <a href={m.profileUrl} target="_blank" rel="noopener noreferrer" data-person-card data-person-status="verified" className="tw-person">
                  {m.photo ? <Image src={m.photo} alt={`Photo of ${m.name}`} width={56} height={56} className="tw-person__photo" /> : null}
                  <h3 className="tw-person__name">{m.name}</h3>
                  <Details m={m} />
                  <p className="tw-person__handle">{m.handle}</p>
                  <span className="tw-person__icon" aria-hidden="true">
                    <ArrowUpRightIcon />
                  </span>
                  <span className="sr-only">, LinkedIn profile (opens in a new tab)</span>
                </a>
              </li>
            ) : (
              <li key={m.id} data-tw-reveal>
                <div data-person-card data-person-status="pending" className="tw-person tw-person--pending">
                  <h3 className="tw-person__name">{m.name}</h3>
                  <Details m={m} />
                  <p className="tw-person__status">{team.pendingLabel}</p>
                  <span className="tw-person__monogram" aria-hidden="true">
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
