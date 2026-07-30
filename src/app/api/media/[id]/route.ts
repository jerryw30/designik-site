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
      filePath: mediaAssets.filePath,
      mimeType: mediaAssets.mimeType,
      filename: mediaAssets.filename,
      updatedAt: mediaAssets.updatedAt,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!asset) return new Response("Media not found", { status: 404 });
  // Assets registered from public/ carry no bytes — hand off to the static
  // file, which already gets the year-long immutable caching from next.config.
  // The leading-slash test keeps the redirect target same-origin.
  //
  // The Location stays relative and is written by hand: Response.redirect()
  // demands an absolute URL, and building one from request.url sends browsers
  // to http://0.0.0.0:3000/... on any host that runs Node behind a reverse
  // proxy (Hostinger does). A relative Location is valid per RFC 7231 and lets
  // the browser resolve against whatever origin it actually asked for.
  if (asset.filePath) {
    if (!asset.filePath.startsWith("/") || asset.filePath.startsWith("//"))
      return new Response("Media not found", { status: 404 });
    return new Response(null, {
      status: 308,
      headers: {
        Location: encodeURI(asset.filePath),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }
  if (!asset.content) return new Response("Media not found", { status: 404 });
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
