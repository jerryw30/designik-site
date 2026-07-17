import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [asset] = await db
    .select({
      content: mediaAssets.contentBase64,
      mimeType: mediaAssets.mimeType,
      filename: mediaAssets.filename,
      updatedAt: mediaAssets.updatedAt,
    })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
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
