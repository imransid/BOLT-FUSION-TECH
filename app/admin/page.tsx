import { redirect } from "next/navigation";

import { isAdminAuthed } from "@/lib/require-admin";
import { loadAdminContent } from "@/lib/load-site-content";
import AdminEditor from "./AdminEditor";

/** Admin must never be cached and always reflects the latest stored content. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const { content, version } = await loadAdminContent();
  const durable = Boolean(
    process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL,
  );
  return <AdminEditor initial={content} version={version} durable={durable} />;
}
