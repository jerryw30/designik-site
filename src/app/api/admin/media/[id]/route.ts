import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Inline title/alt edits from the picker modal, so alt text can be written
 * without leaving the visual editor. Mirrors the fields on the full media
 * edit screen; anything omitted is left untouched.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!can(user.role, "manage_media"))
    return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found." }, { status: 404 });

  let body: { title?: unknown; altText?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const patch: { title?: string; altText?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (typeof body.title === "string") {
    const title = body.title.trim().slice(0, 300);
    if (!title) return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    patch.title = title;
  }
  if (typeof body.altText === "string") patch.altText = body.altText.trim().slice(0, 500);

  const [row] = await db
    .update(mediaAssets)
    .set(patch)
    .where(eq(mediaAssets.id, id))
    .returning({
      id: mediaAssets.id,
      title: mediaAssets.title,
      altText: mediaAssets.altText,
    });
  if (!row) return Response.json({ error: "Not found." }, { status: 404 });

  await logActivity(user, "media", "updated", row.title, row.id);
  return Response.json({ asset: row });
}
