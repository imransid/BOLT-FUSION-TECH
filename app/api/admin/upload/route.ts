import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { isAdminAuthed } from "@/lib/require-admin";

/**
 * Client-direct image uploads to Vercel Blob. The browser calls this route to
 * mint a short-lived upload token, uploads bytes straight to Blob (keeping them
 * off the function), then the signed completion callback returns here.
 *
 * Authorization is enforced in `onBeforeGenerateToken` (only an admin can get a
 * token); the completion callback is authenticated by Vercel's signature via
 * `handleUpload`, so we must NOT gate the whole route on our own cookie.
 *
 * Requires BLOB_READ_WRITE_TOKEN in the environment (production / Vercel Blob).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        if (!(await isAdminAuthed())) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        /* no-op; the returned URL is stored by the client into the content field */
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
