import { desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const allowedTypes = /^(image|video|audio)\/[a-z0-9.+-]+$|^application\/pdf$|^font\/[a-z0-9.+-]+$/i;

function cleanFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "asset";
}

/** JSON media library for the WordPress-style picker modal. */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const assets = await db
    .select({
      id: mediaAssets.id,
      title: mediaAssets.title,
      filename: mediaAssets.filename,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      altText: mediaAssets.altText,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt))
    .orderBy(desc(mediaAssets.createdAt))
    .limit(200);
  return Response.json({
    assets: assets.map((a) => ({ ...a, url: `/api/media/${a.id}` })),
  });
}

/** JSON upload used by the picker's Upload tab. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!can(user.role, "manage_media")) return new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return Response.json({ error: "No files received." }, { status: 400 });
  const created: { id: string; url: string; title: string; mimeType: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: `${file.name} is over 4MB.` }, { status: 400 });
    if (!allowedTypes.test(file.type)) return Response.json({ error: `${file.name}: unsupported type.` }, { status: 400 });
    const filename = cleanFilename(file.name);
    const title =
      filename.replace(/\.[a-z0-9]+$/i, "").replaceAll("-", " ") || filename;
    const [row] = await db
      .insert(mediaAssets)
      .values({
        filename,
        mimeType: file.type,
        byteSize: file.size,
        contentBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        title,
        altText: file.type.startsWith("image/") ? title : "",
        uploadedBy: user.id,
      })
      .returning({ id: mediaAssets.id, title: mediaAssets.title, mimeType: mediaAssets.mimeType });
    await logActivity(user, "media", "uploaded", filename, row.id);
    created.push({ id: row.id, url: `/api/media/${row.id}`, title: row.title, mimeType: row.mimeType });
  }
  return Response.json({ assets: created });
}
