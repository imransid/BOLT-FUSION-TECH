import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getSessionSecret,
  verifyAdminSession,
} from "@/lib/admin-session-token";
import { loadSiteContent } from "@/lib/load-site-content";
import { siteContentSchema } from "@/lib/site-content-schema";
import { writeSiteContentOverrides } from "@/lib/site-content-file";

async function requireAdmin(): Promise<Response | null> {
  const secret = getSessionSecret();
  if (!secret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  const ok = await verifyAdminSession(secret, token);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const content = await loadSiteContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = siteContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await writeSiteContentOverrides(parsed.data);
  return NextResponse.json({ ok: true });
}
