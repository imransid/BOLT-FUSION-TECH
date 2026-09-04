import { parseContent, teamMemberSchema, type TeamMember } from "./schema";
import { z } from "zod";

/**
 * COPY.md §5 requires photo, name, role, stack, years and LinkedIn on all ten.
 *
 * THREE FIELDS ARE UNSUPPLIED AND ARE THEREFORE null / [], NOT INVENTED:
 *
 *  1. `photo` — null for all ten. PLAN.md §9 lists "10 real team photos" as an
 *     open prerequisite. The six files still on disk (marc-face, thomas-face,
 *     eric-face, mo-face) are the same template avatar set triage deleted four
 *     of, and mo-face.svg was doing duty for THREE different engineers. Shipping
 *     them is the exact "this company might be fake" signal PLAN.md §1 names, on
 *     the one section whose job is to kill it.
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
    { id: "rafa", name: "Rafa", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: "https://www.linkedin.com/in/imran1993/" },
    { id: "nadim", name: "Nadim", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: null },
    { id: "shourab", name: "Shourab", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: "https://www.linkedin.com/in/ashraful-abedin-shourab-a50697122/" },
    { id: "arifur", name: "Arifur Rahman", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: null },
    { id: "tareq", name: "Tareq", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: null },
    { id: "nazirul", name: "Nazirul", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: "https://www.linkedin.com/in/imnazirul/" },
    { id: "talha", name: "Talha", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: "https://www.linkedin.com/in/talhajubair100/" },
    { id: "nihal", name: "Nihal", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: "https://www.linkedin.com/in/asif-nihal" },
    { id: "joinal", name: "Joinal", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: null },
    { id: "sabbir", name: "Sabbir", role: null, years: null, stack: [], photo: null, photoAlt: null, linkedin: "https://www.linkedin.com/in/sabbir-ahmed-4a500321b/" },
  ],
  "team.ts",
);
