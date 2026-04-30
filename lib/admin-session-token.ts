export const ADMIN_COOKIE_NAME = "bft_admin";

/** HMAC signing still works with short strings; use a long random value in production. */
const MIN_ADMIN_SECRET_LENGTH = 6;

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function signAdminSession(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  const payload = String(exp);
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminSession(
  secret: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token || secret.length < MIN_ADMIN_SECRET_LENGTH) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;
  const expected = await hmacSha256Hex(secret, payload);
  if (!timingSafeEqualHex(sig.toLowerCase(), expected.toLowerCase())) return false;
  const exp = Number.parseInt(payload, 10);
  if (!Number.isFinite(exp)) return false;
  return exp > Math.floor(Date.now() / 1000);
}

export function getSessionSecret(): string | undefined {
  const s = process.env.SITE_ADMIN_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < MIN_ADMIN_SECRET_LENGTH) return undefined;
  return s;
}

export function getAdminPassword(): string | null {
  return process.env.SITE_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? null;
}
