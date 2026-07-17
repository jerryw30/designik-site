import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const allowedTypes =
  /^(image|video|audio)\/[a-z0-9.+-]+$|^application\/pdf$|^font\/[a-z0-9.+-]+$/i;

function cleanFilename(value: string) {
  return (
    value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "asset"
  );
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return Response.redirect(new URL("/admin/login", request.url), 303);
  if (!can(user.role, "manage_media"))
    return new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const files = form
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length)
    return Response.redirect(
      new URL("/admin/media?error=missing", request.url),
      303,
    );
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE)
      return Response.redirect(
        new URL("/admin/media?error=size", request.url),
        303,
      );
    if (!allowedTypes.test(file.type))
      return Response.redirect(
        new URL("/admin/media?error=type", request.url),
        303,
      );
  }
  for (const file of files) {
    const filename = cleanFilename(file.name);
    const title = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    await db.insert(mediaAssets).values({
      filename,
      mimeType: file.type,
      byteSize: file.size,
      contentBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      title,
      altText: file.type.startsWith("image/") ? title : "",
      uploadedBy: user.id,
    });
  }
  return Response.redirect(
    new URL("/admin/media?uploaded=1", request.url),
    303,
  );
}
