import FigureText from "@/components/FigureText";

/* Two lists the write-ups use everywhere: tags (a stack, a set of patterns) and
   bullets. Every item goes through <FigureText>, so a figure in one carries its
   chip or its exemption where it stands (content/figure-labels.ts); an item
   with no figure renders as plain text. */

export function Tags({ items, label }: { items: readonly string[]; label?: string }) {
  return (
    <ul className="tw-tags" aria-label={label}>
      {items.map((t) => (
        <li key={t} className="tw-tag">
          <FigureText text={t} />
        </li>
      ))}
    </ul>
  );
}

export function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="tw-bullets">
      {items.map((b) => (
        <li key={b}>
          <FigureText text={b} />
        </li>
      ))}
    </ul>
  );
}
