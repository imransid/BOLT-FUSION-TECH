import { parseContent, teamMemberSchema, type TeamMember } from "./schema";
import { z } from "zod";

/**
 * COPY.md §5 requires photo, name, role, stack, years and LinkedIn on all ten.
 *
 * THREE FIELDS ARE UNSUPPLIED AND ARE THEREFORE null / [], NOT INVENTED:
 *
 *  1. `photo` — a PLACEHOLDER ILLUSTRATION, not a photograph. /team/avatar-01..10
 *     are line-art drawings from the original template, renamed so the template is
 *     not identifiable, one distinct file per person (one file in the old set stood
 *     in for three engineers). Replace with real photographs; PLAN.md §9
 *     still lists "10 real team photos" as an open prerequisite.
 *
 *  2. `role`, `years`, `stack` — blank for all ten. Fabricated credentials on a
 *     page built around verifiable evidence are worse than absent ones.
 *
 *  3. `linkedin` — null for four. Nadim and Tareq previously pointed at
 *     x.com/<handle> accounts belonging to strangers; Arifur Rahman and Joinal
 *     shared one LinkedIn numeric id, so one of the two was wrong. All four were
 *     removed rather than guessed, and are still unresolved.
 *
 * The card renders each member with whatever is real and omits the rest. Fill
 * these in here and every section picks them up — no component changes.
 */
export const team: TeamMember[] = parseContent(
  z.array(teamMemberSchema),
  [
    { id: "rafa", name: "Rafa", role: null, years: null, stack: [], photo: "/team/avatar-01.svg", photoAlt: null, linkedin: "https://www.linkedin.com/in/imran1993/" },
    { id: "nadim", name: "Nadim", role: null, years: null, stack: [], photo: "/team/avatar-02.svg", photoAlt: null, linkedin: null },
    { id: "shourab", name: "Shourab", role: null, years: null, stack: [], photo: "/team/avatar-03.svg", photoAlt: null, linkedin: "https://www.linkedin.com/in/ashraful-abedin-shourab-a50697122/" },
    { id: "arifur", name: "Arifur Rahman", role: null, years: null, stack: [], photo: "/team/avatar-04.svg", photoAlt: null, linkedin: null },
    { id: "tareq", name: "Tareq", role: null, years: null, stack: [], photo: "/team/avatar-05.svg", photoAlt: null, linkedin: null },
    { id: "nazirul", name: "Nazirul", role: null, years: null, stack: [], photo: "/team/avatar-06.svg", photoAlt: null, linkedin: "https://www.linkedin.com/in/imnazirul/" },
    { id: "talha", name: "Talha", role: null, years: null, stack: [], photo: "/team/avatar-07.svg", photoAlt: null, linkedin: "https://www.linkedin.com/in/talhajubair100/" },
    { id: "nihal", name: "Nihal", role: null, years: null, stack: [], photo: "/team/avatar-08.svg", photoAlt: null, linkedin: "https://www.linkedin.com/in/asif-nihal" },
    { id: "joinal", name: "Joinal", role: null, years: null, stack: [], photo: "/team/avatar-09.svg", photoAlt: null, linkedin: null },
    { id: "sabbir", name: "Sabbir", role: null, years: null, stack: [], photo: "/team/avatar-10.svg", photoAlt: null, linkedin: "https://www.linkedin.com/in/sabbir-ahmed-4a500321b/" },
  ],
  "team.ts",
);
