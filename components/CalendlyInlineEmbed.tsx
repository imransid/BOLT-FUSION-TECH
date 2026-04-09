/**
 * Iframe embed — no Calendly widget.js on this node (stable SSR + hydration).
 * Height uses min + dvh so short phones still get a usable calendar area without forcing page-wide horizontal scroll.
 */
const CALENDLY_IFRAME_SRC =
  "https://calendly.com/bolttechfusion/30min?background_color=1a1a1a&text_color=ffffff&primary_color=0069ff";

export default function CalendlyInlineEmbed() {
  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] shadow-[0_24px_64px_-32px_rgba(0,0,0,0.85)] sm:rounded-xl">
      <iframe
        title="Schedule a 30-minute call — Bolt Fusion Tech"
        src={CALENDLY_IFRAME_SRC}
        width="100%"
        className="block h-[min(700px,max(520px,68dvh))] w-full min-w-0 max-w-full border-0 bg-white sm:h-[min(700px,max(580px,70dvh))] md:h-[700px]"
        loading="lazy"
        allow="camera; microphone; fullscreen; payment"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
