"use client";

import type { FormEvent } from "react";

import type { SiteContent } from "@/content/site-schema";

/**
 * The short project form on /contact: three fields that open the visitor's
 * email app with a message to the team — the site's existing contact
 * mechanism (mailto). There is no backend and nothing is stored or sent by the
 * site.
 *
 *  · Without JavaScript the browser submits it itself: a GET to a mailto:
 *    address turns `subject` and `body` into the message (the `name` field is
 *    left out by mail apps, and is in the body when script runs).
 *  · With JavaScript the three fields are composed into one message — the
 *    name signs the body — and the mail app opens with it.
 * Labels are visible and tied to their fields; required fields use the
 * browser's own validation.
 */
export default function ContactForm({ copy, email }: { copy: SiteContent["contact"]["project"]; email: string }) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    const signed = name ? `${body}\n\n— ${name}` : body;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(signed)}`;
  };

  return (
    <form className="bf-form" action={`mailto:${email}`} method="get" onSubmit={onSubmit}>
      <div className="bf-field">
        <label htmlFor="project-name">{copy.nameLabel}</label>
        <input id="project-name" name="name" type="text" autoComplete="name" required />
      </div>
      <div className="bf-field">
        <label htmlFor="project-subject">{copy.subjectLabel}</label>
        <input id="project-subject" name="subject" type="text" required />
      </div>
      <div className="bf-field">
        <label htmlFor="project-body">{copy.bodyLabel}</label>
        <p id="project-body-hint" className="bf-field__hint">
          {copy.bodyHint}
        </p>
        <textarea id="project-body" name="body" rows={6} aria-describedby="project-body-hint" required />
      </div>
      <button type="submit" className="bf-btn bf-btn--primary bf-btn--md">
        {copy.submitLabel}
      </button>
    </form>
  );
}
