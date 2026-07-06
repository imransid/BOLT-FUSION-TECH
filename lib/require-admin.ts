import "server-only";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getSessionSecret,
  verifyAdminSession,
} from "@/lib/admin-session-token";

/**
 * Central admin authorization. Every /api/admin/* handler and every admin
 * Server Action must go through this — the proxy (formerly middleware) only
 * guards the /admin *pages*, not the API, and is explicitly "not a security
 * boundary". Auth is re-checked at the point of mutation.
 */

export async function isAdminAuthed(): Promise<boolean> {
  const secret = getSessionSecret();
  if (!secret) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSession(secret, token);
}

/** Route-handler guard: returns a Response to short-circuit, or null if allowed. */
export async function requireAdmin(): Promise<Response | null> {
  const secret = getSessionSecret();
  if (!secret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * CSRF defense for state-changing requests: reject when an Origin header is
 * present and is not same-origin. (sameSite=lax already blocks classic form
 * CSRF; this covers the rest cheaply.)
 */
export async function assertSameOrigin(): Promise<Response | null> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return null; // same-origin navigations / non-browser callers omit Origin
  const host = h.get("host");
  try {
    if (host && new URL(origin).host === host) return null;
  } catch {
    /* fall through to reject */
  }
  return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
}

/** Server-Action guard: throws on failure (auth + same-origin). */
export async function requireAdminAction(): Promise<void> {
  if (!(await isAdminAuthed())) throw new Error("Unauthorized");
  if (await assertSameOrigin()) throw new Error("Cross-origin request rejected");
}

/** Wrap a route handler so a new /api/admin/* route can't ship unauthenticated. */
export function withAdmin(
  handler: (request: Request) => Promise<Response> | Response,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const denied = await requireAdmin();
    if (denied) return denied;
    return handler(request);
  };
}
