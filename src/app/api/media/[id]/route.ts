import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Junk ids would fail the uuid cast in Postgres with a 500 — 404 instead.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return new Response("Media not found", { status: 404 });
  // Trashed assets are still served (matching WordPress) so the admin trash
  // grid can preview them; permanent delete removes the row and the URL dies.
  const [asset] = await db
    .select({
      content: mediaAssets.contentBase64,
      mimeType: mediaAssets.mimeType,
      filename: mediaAssets.filename,
      updatedAt: mediaAssets.updatedAt,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!asset) return new Response("Media not found", { status: 404 });
  return new Response(Buffer.from(asset.content, "base64"), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": `inline; filename="${asset.filename.replace(/["\\]/g, "")}"`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Last-Modified": asset.updatedAt.toUTCString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
