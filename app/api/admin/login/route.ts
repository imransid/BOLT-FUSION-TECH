import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getAdminPassword,
  getSessionSecret,
  signAdminSession,
} from "@/lib/admin-session-token";

function equalPassword(a: string, b: string): boolean {
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export async function POST(request: Request) {
  const secret = getSessionSecret();
  const expected = getAdminPassword();
  if (!secret || !expected) {
    return NextResponse.json(
      { error: "Admin is not configured. Set SITE_ADMIN_SECRET and SITE_ADMIN_PASSWORD." },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!equalPassword(password, expected)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signAdminSession(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
