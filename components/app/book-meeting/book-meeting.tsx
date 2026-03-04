"use client";

import { useState } from "react";

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

type BookingState = "idle" | "loading" | "success" | "error";

const BookMeeting = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<BookingState>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    // Simulate API call – replace with your Calendly/Cal.com or backend
    await new Promise((r) => setTimeout(r, 800));
    setState("success");
    setDate("");
    setTime("");
    setName("");
    setEmail("");
    setNote("");
  };

  if (state === "success") {
    return (
      <section
        id="book"
        className="scroll-mt-20 bg-gradient-to-b from-surface to-surface/95 text-white py-16 px-4 sm:py-20 md:py-24 lg:py-28"
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 text-accent mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Meeting requested
          </h2>
          <p className="text-white/70 mt-3 text-sm sm:text-base">
            We&apos;ll send a calendar invite to your email shortly.
          </p>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="mt-8 text-accent font-medium hover:text-accent/80 transition-colors"
          >
            Book another meeting
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="book"
      className="scroll-mt-2 bg-gradient-to-b from-surface to-surface/95 text-white py-16 px-4 sm:py-20 md:py-24 lg:py-0  border-t border-white/10"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block text-accent text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Schedule a call
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Book a meeting
          </h2>
          <p className="text-white/60 mt-2 text-sm sm:text-base max-w-md mx-auto">
            Pick a time that works. We&apos;ll confirm via email.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 sm:p-8 md:p-10 shadow-xl"
        >
          <div className="grid gap-6 sm:gap-8">
            <div className="grid gap-4 sm:gap-6">
              <label className="block">
                <span className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                  Date
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-base min-h-[48px]"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                  Time (your timezone)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`px-2 py-2.5 sm:px-3 sm:py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] touch-manipulation ${time === slot
                        ? "bg-accent text-surface ring-2 ring-accent/50"
                        : "bg-white/10 text-white/90 hover:bg-white/15 active:scale-[0.98] border border-white/10"
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <label className="block">
                <span className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                  Your name
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[48px]"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[48px]"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                What would you like to discuss? (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Project kickoff, technical review..."
                rows={3}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-y min-h-[100px]"
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={state === "loading" || !date || !time}
                className="w-full sm:w-auto sm:min-w-[200px] bg-accent text-surface font-semibold rounded-xl px-8 py-4 hover:bg-accent/90 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none"
              >
                {state === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Booking…
                  </span>
                ) : (
                  "Confirm meeting"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default BookMeeting;
