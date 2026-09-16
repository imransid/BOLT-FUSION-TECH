"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The booking calendar on /contact: Calendly in an iframe, on a light panel we
 * place deliberately (app/site.css, "The booking calendar").
 *
 * An iframe whose request never arrives still paints its own opaque white, so a
 * placeholder BEHIND it is invisible exactly when it is needed. This raises the
 * placeholder above the frame when the calendar has not loaded a few seconds
 * after the panel comes into view — a browser blocking Calendly, an extension,
 * an offline visitor — so the panel says what it is instead of being a blank
 * white rectangle.
 *
 *  · The height is reserved by CSS either way, so nothing shifts (CLS 0).
 *  · Without JavaScript the placeholder stays behind the frame, as it was: the
 *    iframe still loads, and the visible note under the panel carries the email
 *    and the project form.
 *  · The placeholder is `aria-hidden`: the note below says the same thing, once.
 *  · The timer starts when the panel is in view, so a lazy iframe that has
 *    simply not been scrolled to is never called stalled.
 */
const STALLED_AFTER_MS = 6000;

export default function BookingCalendar({
  caption,
  placeholder,
  stalled,
  frameTitle,
  src,
}: {
  caption: string;
  placeholder: string;
  stalled: string;
  frameTitle: string;
  src: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"waiting" | "loaded" | "stalled">("waiting");

  useEffect(() => {
    if (state !== "waiting") return;
    const el = frameRef.current;
    if (!el) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timer = window.setTimeout(() => setState((s) => (s === "waiting" ? "stalled" : s)), STALLED_AFTER_MS);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [state]);

  return (
    <figure className="bf-calendar">
      <figcaption className="bf-calendar__caption">{caption}</figcaption>
      <div ref={frameRef} className="bf-calendar__frame">
        <p className={`bf-calendar__placeholder${state === "stalled" ? " is-stalled" : ""}`} aria-hidden="true">
          {state === "stalled" ? stalled : placeholder}
        </p>
        <iframe
          title={frameTitle}
          src={src}
          loading="lazy"
          allow="camera; microphone; fullscreen; payment"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setState("loaded")}
        />
      </div>
    </figure>
  );
}
