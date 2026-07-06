import "server-only";

import fs from "fs/promises";
import path from "path";
import { neon } from "@neondatabase/serverless";

/**
 * Durable, serverless-safe storage for the site content document.
 *
 * The content is one JSON document (an override object deep-merged onto code
 * defaults at read time — see load-site-content.ts). It is wrapped in an
 * envelope `{ version, updatedAt, content }` so the admin can do optimistic
 * concurrency (compare-and-swap on `version`) and keep a small undo history.
 *
 * Two backends, chosen at runtime:
 *  - NeonStore  — when a Postgres connection string is present (production /
 *    Vercel). Real compare-and-swap via `UPDATE ... WHERE version = $expected`.
 *  - FileStore  — local-dev fallback (`data/site-content.json`). No cloud
 *    credentials needed to run and verify the whole admin locally.
 */

const HISTORY_CAP = 20;

/** An empty override object ({}) is the pre-seed baseline; not worth snapshotting. */
function isEmptyContent(c: unknown): boolean {
  return (
    !c ||
    (typeof c === "object" && !Array.isArray(c) && Object.keys(c as object).length === 0)
  );
}

/** Concurrent `CREATE TABLE IF NOT EXISTS` across cold instances can raise a
 *  benign catalog race on a fresh DB — treat those as success. */
function isBenignDdlError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? e ?? "").toLowerCase();
  return (
    code === "23505" ||
    code === "42P07" ||
    msg.includes("already exists") ||
    msg.includes("concurrently updated") ||
    msg.includes("duplicate key")
  );
}

export type StoredEnvelope = {
  version: number;
  updatedAt: string | null;
  content: unknown;
};

export type WriteResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true; version: number };

export type HistoryEntry = {
  version: number;
  updatedAt: string;
  content: unknown;
};

export interface ContentStore {
  read(): Promise<StoredEnvelope>;
  /**
   * Persist `content`. If `expectedVersion` is a number, the write only
   * succeeds when the stored version still equals it (optimistic concurrency);
   * otherwise it returns `{ ok: false, conflict: true }`. Pass `null` to force.
   */
  write(content: unknown, expectedVersion: number | null): Promise<WriteResult>;
  history(): Promise<HistoryEntry[]>;
}

function connectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    undefined
  );
}

/* ─────────────────────────── Neon (Postgres) ─────────────────────────── */

type NeonSql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

class NeonStore implements ContentStore {
  private sql: NeonSql;
  private ready: Promise<void> | null = null;

  constructor(url: string) {
    this.sql = neon(url) as unknown as NeonSql;
  }

  private async runDdl(query: Promise<unknown>): Promise<void> {
    try {
      await query;
    } catch (e) {
      if (!isBenignDdlError(e)) throw e;
    }
  }

  private ensure(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await this.runDdl(this.sql`
          CREATE TABLE IF NOT EXISTS site_content (
            id text PRIMARY KEY,
            content jsonb NOT NULL,
            version integer NOT NULL DEFAULT 0,
            updated_at timestamptz NOT NULL DEFAULT now()
          )`);
        await this.runDdl(this.sql`
          CREATE TABLE IF NOT EXISTS site_content_history (
            id serial PRIMARY KEY,
            version integer NOT NULL,
            content jsonb NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
          )`);
        await this.runDdl(
          this
            .sql`INSERT INTO site_content (id, content, version) VALUES ('published', '{}'::jsonb, 0) ON CONFLICT (id) DO NOTHING`,
        );
      })().catch((e) => {
        // Reset so a transient failure can be retried on the next call.
        this.ready = null;
        throw e;
      });
    }
    return this.ready;
  }

  async read(): Promise<StoredEnvelope> {
    await this.ensure();
    const rows = await this
      .sql`SELECT content, version, updated_at FROM site_content WHERE id = 'published'`;
    const row = rows[0];
    if (!row) return { version: 0, updatedAt: null, content: {} };
    return {
      version: Number(row.version),
      updatedAt: row.updated_at ? new Date(row.updated_at as string).toISOString() : null,
      content: row.content ?? {},
    };
  }

  async write(content: unknown, expectedVersion: number | null): Promise<WriteResult> {
    await this.ensure();
    const current = await this.read();
    if (expectedVersion !== null && current.version !== expectedVersion) {
      return { ok: false, conflict: true, version: current.version };
    }

    const json = JSON.stringify(content);
    const rows =
      expectedVersion === null
        ? await this.sql`
            UPDATE site_content
            SET content = ${json}::jsonb, version = version + 1, updated_at = now()
            WHERE id = 'published'
            RETURNING version`
        : await this.sql`
            UPDATE site_content
            SET content = ${json}::jsonb, version = version + 1, updated_at = now()
            WHERE id = 'published' AND version = ${expectedVersion}
            RETURNING version`;

    if (rows.length === 0) {
      // Lost the race between read and update.
      const now = await this.read();
      return { ok: false, conflict: true, version: now.version };
    }

    // Best-effort history + trim (audit/undo; not required for correctness).
    // Skip the empty pre-seed baseline so "restore" never offers a blank snapshot.
    if (!isEmptyContent(current.content)) {
      try {
        await this
          .sql`INSERT INTO site_content_history (version, content) VALUES (${current.version}, ${JSON.stringify(current.content)}::jsonb)`;
        await this.sql`
          DELETE FROM site_content_history
          WHERE id NOT IN (
            SELECT id FROM site_content_history ORDER BY id DESC LIMIT ${HISTORY_CAP}
          )`;
      } catch {
        // ignore history failures
      }
    }

    return { ok: true, version: Number(rows[0].version) };
  }

  async history(): Promise<HistoryEntry[]> {
    await this.ensure();
    const rows = await this.sql`
      SELECT version, content, created_at FROM site_content_history
      ORDER BY id DESC LIMIT ${HISTORY_CAP}`;
    return rows.map((r) => ({
      version: Number(r.version),
      updatedAt: new Date(r.created_at as string).toISOString(),
      content: r.content ?? {},
    }));
  }
}

/* ─────────────────────────── File (local dev) ────────────────────────── */

const FILE = path.join(process.cwd(), "data", "site-content.json");
const HISTORY_FILE = path.join(process.cwd(), "data", "site-content-history.json");

class FileStore implements ContentStore {
  private async readRaw(): Promise<StoredEnvelope> {
    try {
      const raw = await fs.readFile(FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoredEnvelope>;
      if (parsed && typeof parsed === "object" && "content" in parsed) {
        return {
          version: typeof parsed.version === "number" ? parsed.version : 0,
          updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
          content: parsed.content ?? {},
        };
      }
      // Back-compat: an old bare-overrides file (pre-envelope).
      return { version: 0, updatedAt: null, content: parsed ?? {} };
    } catch (e) {
      if ((e as { code?: string }).code === "ENOENT") {
        return { version: 0, updatedAt: null, content: {} };
      }
      throw e;
    }
  }

  read(): Promise<StoredEnvelope> {
    return this.readRaw();
  }

  async write(content: unknown, expectedVersion: number | null): Promise<WriteResult> {
    // The filesystem is read-only/ephemeral on serverless — a silent fallback
    // here would lose data. Fail loudly so misconfiguration is obvious.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "No durable datastore configured. Set DATABASE_URL (Neon Postgres) for production writes.",
      );
    }
    const current = await this.readRaw();
    if (expectedVersion !== null && current.version !== expectedVersion) {
      return { ok: false, conflict: true, version: current.version };
    }
    const next: StoredEnvelope = {
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      content,
    };
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");

    // Best-effort history; skip the empty pre-seed baseline.
    if (!isEmptyContent(current.content)) {
      try {
        const history = await this.history();
        const entry: HistoryEntry = {
          version: current.version,
          updatedAt: current.updatedAt ?? new Date().toISOString(),
          content: current.content,
        };
        const trimmed = [entry, ...history].slice(0, HISTORY_CAP);
        await fs.writeFile(HISTORY_FILE, `${JSON.stringify(trimmed, null, 2)}\n`, "utf8");
      } catch {
        // ignore
      }
    }

    return { ok: true, version: next.version };
  }

  async history(): Promise<HistoryEntry[]> {
    try {
      const raw = await fs.readFile(HISTORY_FILE, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  }
}

/* ───────────────────────────── selection ─────────────────────────────── */

let store: ContentStore | null = null;

export function getContentStore(): ContentStore {
  if (store) return store;
  const url = connectionString();
  store = url ? new NeonStore(url) : new FileStore();
  return store;
}
