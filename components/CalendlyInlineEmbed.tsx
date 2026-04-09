/**
 * Iframe embed — no Calendly widget.js on this node, so React hydration always
 * matches the server (avoids initInlineWidget mutating a React-owned div).
 * Add your production host under Calendly → Integrations → “Allowed domains” if embed is blocked.
 */
const CALENDLY_IFRAME_SRC =
  "https://calendly.com/bolttechfusion/30min?background_color=1a1a1a&text_color=ffffff&primary_color=0069ff";

export default function CalendlyInlineEmbed() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-[0_24px_64px_-32px_rgba(0,0,0,0.85)]">
      <iframe
        title="Schedule a 30-minute call — Bolt Fusion Tech"
        src={CALENDLY_IFRAME_SRC}
        width="100%"
        height={700}
        className="block w-full min-w-[320px] border-0 bg-white"
        style={{ minHeight: 700 }}
        loading="lazy"
      />
    </div>
  );
}
