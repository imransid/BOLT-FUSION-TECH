import FigureText from "@/components/FigureText";
import type { SiteContent } from "@/content/site-schema";

import Button from "./Button";
import { MailIcon } from "./icons";

/**
 * §6, second half — the routes to a conversation: the clone's navy contact
 * panel (its gradient delimiter included) carrying the site's own call to
 * action (content/site.ts, `cta`): the calendar and the team's email. The
 * theme's placeholder phone number is gone.
 */
export function Contact({ cta }: { cta: SiteContent["cta"] }) {
  return (
    <section id="contact" className="tw-contact" aria-labelledby="contact-title">
      <div className="tw-contact__panel tw-on-dark" data-tw-reveal>
        <div className="tw-contact__lead">
          <span className="tw-contact__bar" aria-hidden="true" />
          <div>
            <p className="tw-contact__status">
              <span className="tw-contact__dot" aria-hidden="true" />
              {cta.statusLabel}
            </p>
            <h2 id="contact-title" className="tw-contact__title">
              {cta.title}
            </h2>
            <p className="tw-contact__body">{cta.body}</p>
          </div>
        </div>
        <p className="tw-actions tw-contact__actions">
          <Button href={cta.scheduleHref} variant="light">
            <FigureText text={cta.scheduleLabel} />
          </Button>
          <Button href={cta.emailHref} variant="secondary">
            <MailIcon className="tw-btn__icon" />
            {cta.emailLabel}
          </Button>
        </p>
      </div>
    </section>
  );
}

/* The Calendly booking calendar as an iframe — no widget.js, so none of
   Calendly's script runs in this page. Lazy: it is the last thing on the page.
   Its colours follow the white band it sits on. */
const CALENDLY_SRC =
  "https://calendly.com/bolttechfusion/30min?background_color=ffffff&text_color=0e0e0e&primary_color=086ad8";

export function Schedule({ blurb }: { blurb: string }) {
  return (
    <section id="schedule" className="tw-band tw-band--white tw-schedule" aria-label="Book a call">
      <div className="tw-band__inner">
        <p className="tw-schedule__blurb">
          <FigureText text={blurb} />
        </p>
        <div className="tw-schedule__frame">
          <iframe
            title="Schedule a 30-minute call — Bolt Fusion Tech"
            src={CALENDLY_SRC}
            loading="lazy"
            allow="camera; microphone; fullscreen; payment"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
