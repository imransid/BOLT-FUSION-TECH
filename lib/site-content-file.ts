import "server-only";

import fs from "fs/promises";
import path from "path";

/** Persists under `data/site-content.json` — requires a writable filesystem (local/VPS/Docker). Serverless hosts without disk need an external store. */
const FILE = path.join(process.cwd(), "data", "site-content.json");

export async function readSiteContentOverrides(): Promise<unknown> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as unknown;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ENOENT") return {};
    throw e;
  }
}

export async function writeSiteContentOverrides(data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
