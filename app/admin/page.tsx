"use client";

import Link from "next/link";
import type { SiteContent } from "@/lib/site-content-schema";
import { type SectionId } from "@/lib/site-content-schema";
import { useCallback, useEffect, useState } from "react";

const BRANCH_KEYS: (keyof SiteContent)[] = [
  "meta",
  "site",
  "navbar",
  "footer",
  "hero",
  "aiExcellence",
  "projects",
  "about",
  "team",
  "recentWorks",
  "process",
  "services",
  "industries",
  "testimonials",
  "faq",
  "cta",
  "scheduleEmbed",
];

export default function AdminHomePage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [branch, setBranch] = useState<keyof SiteContent>("hero");
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      if (!res.ok) {
        setStatus("Could not load content (unauthorized or server error).");
        setContent(null);
        return;
      }
      const data = (await res.json()) as SiteContent;
      setContent(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!content) return;
    setText(JSON.stringify(content[branch], null, 2));
    setParseError(null);
  }, [content, branch]);

  function applyLocal() {
    if (!content) return;
    try {
      const parsed = JSON.parse(text) as unknown;
      setContent({ ...content, [branch]: parsed } as SiteContent);
      setParseError(null);
      setStatus("Applied locally — click Save to write to disk.");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  async function saveAll() {
    if (!content) return;
    setStatus(null);
    setParseError(null);
    let payload: SiteContent;
    try {
      const parsed = JSON.parse(text) as unknown;
      payload = { ...content, [branch]: parsed } as SiteContent;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON for this branch");
      return;
    }
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: unknown;
      };
      setParseError(
        typeof data.details === "object"
          ? JSON.stringify(data.details, null, 2)
          : (data.error ?? "Save failed"),
      );
      return;
    }
    setContent(payload);
    setText(JSON.stringify(payload[branch], null, 2));
    setStatus("Saved. Refresh the homepage to see changes.");
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  function moveSection(id: SectionId, dir: -1 | 1) {
    setContent((prev) => {
      if (!prev) return prev;
      const order = [...prev.site.sectionOrder];
      const i = order.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      const next = [...order];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...prev, site: { ...prev.site, sectionOrder: next } };
    });
    setBranch("site");
    setStatus("Section order updated locally — Save to persist.");
  }

  function toggleSection(id: SectionId, visible: boolean) {
    if (!content) return;
    const vis = { ...content.site.sectionVisibility };
    if (visible) {
      delete vis[id];
    } else {
      vis[id] = false;
    }
    const next: SiteContent = {
      ...content,
      site: { ...content.site, sectionVisibility: vis },
    };
    setContent(next);
    if (branch === "site") {
      setText(JSON.stringify(next.site, null, 2));
    }
  }

  return (
    <div className="min-h-dvh bg-[#070708] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Admin</p>
            <h1 className="text-lg font-medium text-white">Homepage content</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white/85 hover:border-white/25"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={applyLocal}
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white/85 hover:border-white/25"
            >
              Apply JSON
            </button>
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={!content}
              className="rounded-lg border border-cyan-200/35 bg-cyan-200/15 px-4 py-2 text-sm font-medium text-cyan-50 hover:border-cyan-100/50 disabled:opacity-40"
            >
              Save to disk
            </button>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/12 px-3 py-2 text-sm text-white/75 hover:border-white/25"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/55 hover:text-white/80"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-8 md:grid-cols-[260px_1fr] md:px-8">
        <aside className="space-y-6 md:sticky md:top-24 md:self-start">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/40">Sections</p>
            <nav className="flex flex-col gap-1">
              {BRANCH_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBranch(key)}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                    branch === key
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white/90"
                  }`}
                >
                  {key}
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/40">Order & visibility</p>
            <p className="mb-3 text-xs leading-relaxed text-white/45">
              Use arrows to reorder. Toggle hides a block on the public homepage (navbar/footer stay
              visible).
            </p>
            <ul className="max-h-[min(52vh,520px)] space-y-1 overflow-y-auto pr-1 text-sm">
              {content?.site.sectionOrder.map((id) => {
                const hidden = content.site.sectionVisibility[id] === false;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-black/40 px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-white/75">
                      {id}
                    </span>
                    <button
                      type="button"
                      aria-label="Move up"
                      className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-white/60 hover:border-white/25"
                      onClick={() => moveSection(id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-white/60 hover:border-white/25"
                      onClick={() => moveSection(id, 1)}
                    >
                      ↓
                    </button>
                    <label className="flex items-center gap-1 whitespace-nowrap text-[11px] text-white/50">
                      <input
                        type="checkbox"
                        checked={!hidden}
                        onChange={(e) => toggleSection(id, e.target.checked)}
                      />
                      on
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="min-w-0 space-y-3">
          {loading && <p className="text-sm text-white/50">Loading…</p>}
          {status && (
            <p className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100/90">
              {status}
            </p>
          )}
          {parseError && branch !== "site" && (
            <p className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-100/90 whitespace-pre-wrap">
              {parseError}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-white/55">
              Editing <span className="font-mono text-white/85">{branch}</span> — valid JSON required
              before Save.
            </p>
            <p className="text-xs text-white/35">
              Arrays (FAQ, team, tiles) support add/remove by editing JSON. Industry{" "}
              <span className="font-mono text-white/55">iconKey</span>: edtech, fintech, ecommerce,
              pharma, telecom, retail, software, startup.
            </p>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setParseError(null);
            }}
            spellCheck={false}
            className="min-h-[min(70vh,720px)] w-full resize-y rounded-xl border border-white/12 bg-black/50 p-4 font-mono text-[13px] leading-relaxed text-white/90 outline-none ring-cyan-200/30 focus:border-cyan-200/35 focus:ring-2"
          />
        </main>
      </div>
    </div>
  );
}
