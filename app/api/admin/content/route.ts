import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { assertSameOrigin, requireAdmin } from "@/lib/require-admin";
import { loadAdminContent, normalizeSectionOrder } from "@/lib/load-site-content";
import { siteContentSchema } from "@/lib/site-content-schema";
import { writeSiteContent } from "@/lib/site-content-file";

/** GET: fresh content + current version, for the admin editor to bootstrap/reload. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { content, version } = await loadAdminContent();
  return NextResponse.json({ content, version });
}

/**
 * PUT: whole-document save with optimistic concurrency. Body MUST be
 * `{ content: SiteContent, version: number }`. Kept for API/tooling parity;
 * the editor uses the Server Action in app/admin/actions.ts.
 */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const badOrigin = await assertSameOrigin();
  if (badOrigin) return badOrigin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Require the { content, version } envelope — never silently force-overwrite
  // (that would defeat the optimistic-concurrency guard the design relies on).
  const isEnvelope =
    !!body &&
    typeof body === "object" &&
    "content" in body &&
    typeof (body as { version?: unknown }).version === "number";
  if (!isEnvelope) {
    return NextResponse.json(
      { error: "Expected { content, version } with a numeric version." },
      { status: 400 },
    );
  }
  const wrapped = body as { content: unknown; version: number };

  const parsed = siteContentSchema.safeParse(wrapped.content);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  parsed.data.site.sectionOrder = normalizeSectionOrder(parsed.data.site.sectionOrder);

  const result = await writeSiteContent(parsed.data, wrapped.version);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Version conflict — reload and retry.", version: result.version },
      { status: 409 },
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, version: result.version });
}
