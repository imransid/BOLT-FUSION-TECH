"use client";

import { useEffect, useRef, useState } from "react";

const CALENDLY_URL =
  "https://calendly.com/bolttechfusion/30min?background_color=1a1a1a&text_color=ffffff&primary_color=0069FF";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string;
        parentElement: HTMLElement;
      }) => void;
    };
  }
}

export default function CalendlyInlineEmbed() {
  const [mounted, setMounted] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = parentRef.current;
    if (!el) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const init = () => {
      if (cancelled || !el || !window.Calendly) return;
      el.replaceChildren();
      window.Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement: el,
      });
    };

    if (window.Calendly) {
      init();
    } else {
      intervalId = setInterval(() => {
        if (window.Calendly) {
          if (intervalId) clearInterval(intervalId);
          init();
        }
      }, 50);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      el.replaceChildren();
    };
  }, [mounted]);

  if (!mounted) {
    return (
      <div
        className="w-full rounded-xl bg-white/[0.03] border border-white/10"
        style={{ minWidth: 320, minHeight: 700 }}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={parentRef}
      className="w-full min-w-[320px]"
      style={{ minHeight: 700 }}
    />
  );
}
