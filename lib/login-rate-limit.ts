import "server-only";

/**
 * Minimal in-process login throttle: 8 failed attempts per IP per 15 min.
 * Note: on multi-instance serverless this is per-instance, so it raises the bar
 * rather than being a hard global limit — pair with a WAF/Turnstile for a
 * production-grade guarantee. Sufficient as a first line against brute force.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Record = { count: number; first: number };
const attempts = new Map<string, Record>();

function sweep(now: number): void {
  for (const [ip, rec] of attempts) {
    if (now - rec.first > WINDOW_MS) attempts.delete(ip);
  }
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (attempts.size > 5000) sweep(now); // bound memory
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) return { allowed: true, retryAfter: 0 };
  if (rec.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((WINDOW_MS - (now - rec.first)) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
  } else {
    rec.count += 1;
  }
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}

/**
 * Best-effort client IP. Prefer `x-real-ip` (set by the trusted platform proxy
 * on Vercel) over the leftmost `x-forwarded-for`, which is client-spoofable and
 * would let an attacker mint a fresh bucket per request to bypass the throttle.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return "unknown";
}
