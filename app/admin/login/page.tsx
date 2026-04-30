"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hint =
    reason === "config"
      ? "Set SITE_ADMIN_SECRET (6+ chars) and SITE_ADMIN_PASSWORD in your environment, then restart the dev server."
      : reason === "session"
        ? "Session expired. Sign in again."
        : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Login failed");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.12),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(251,191,36,0.1),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          Bolt Fusion Tech
        </p>
        <h1 className="text-3xl font-normal tracking-tight text-white">Site admin</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Sign in to edit homepage copy, reorder sections, and publish changes to{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">
            data/site-content.json
          </code>
          .
        </p>
        {hint && (
          <p className="mt-4 rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-sm text-amber-100/90">
            {hint}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-white/60">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none ring-cyan-200/40 placeholder:text-white/30 focus:border-cyan-200/40 focus:ring-2"
              placeholder="••••••••"
              required
            />
          </label>
          {error && (
            <p className="text-sm text-red-300/90" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-cyan-200/35 bg-gradient-to-br from-cyan-200/20 to-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-100/50 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link
          href="/"
          className="mt-10 text-center text-sm text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
