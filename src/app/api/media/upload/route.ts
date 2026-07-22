import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { logActivity } from "@/lib/activity";
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
  // Fetch-based submits (the admin upload form) ask for JSON so validation
  // errors surface inline; plain form posts keep the redirect fallback.
  const wantsJson = (request.headers.get("accept") || "").includes(
    "application/json",
  );
  const fail = (param: string, message: string, status: number) =>
    wantsJson
      ? Response.json({ error: message }, { status })
      : Response.redirect(
          new URL(`/admin/media?error=${param}`, request.url),
          303,
        );
  const user = await currentUser();
  if (!user)
    return wantsJson
      ? Response.json({ error: "Please sign in again." }, { status: 401 })
      : Response.redirect(new URL("/admin/login", request.url), 303);
  if (!can(user.role, "manage_media"))
    return new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const files = form
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length)
    return fail("missing", "Select at least one file to upload.", 400);
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE)
      return fail("size", `${file.name} exceeds the 4 MB upload limit.`, 400);
    if (!allowedTypes.test(file.type))
      return fail("type", `${file.name} is not a supported media type.`, 400);
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
    await logActivity(user, "media", "uploaded", filename);
  }
  return wantsJson
    ? Response.json({ ok: true, count: files.length })
    : Response.redirect(new URL("/admin/media?uploaded=1", request.url), 303);
}
