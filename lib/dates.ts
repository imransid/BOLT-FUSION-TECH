/** An ISO date ("2026-09-16") as the site writes it: "16 September 2026".
 *  UTC, so the server and every visitor print the same day. A date is not a
 *  figure (verify-site check 8's grammar reads it as a date). */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
