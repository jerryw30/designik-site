"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const allowedTypes =
  /^(image|video|audio)\/[a-z0-9.+-]+$|^application\/pdf$|^font\/[a-z0-9.+-]+$/i;

function cleanFilename(value: string) {
  return (
    value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "asset"
  );
}

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function uploadMedia(form: FormData) {
  const user = await requirePermission("manage_media");
  const files = form
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length) throw new Error("Select at least one file to upload.");
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE)
      throw new Error(`${file.name} exceeds the 4 MB upload limit.`);
    if (!allowedTypes.test(file.type))
      throw new Error(`${file.name} is not a supported media type.`);
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
  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function updateMedia(form: FormData) {
  await requirePermission("manage_media");
  const id = text(form, "id");
  const tags = text(form, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30);
  await db
    .update(mediaAssets)
    .set({
      title: text(form, "title") || "Untitled asset",
      altText: text(form, "altText"),
      caption: text(form, "caption"),
      description: text(form, "description"),
      tags,
      updatedAt: new Date(),
    })
    .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)));
  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}/edit`);
}

export async function trashMedia(form: FormData) {
  await requirePermission("manage_media");
  const id = text(form, "id");
  await db
    .update(mediaAssets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)));
  revalidatePath("/admin/media");
  redirect("/admin/media");
}

export async function restoreMedia(form: FormData) {
  await requirePermission("manage_media");
  const id = text(form, "id");
  await db
    .update(mediaAssets)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(mediaAssets.id, id), isNotNull(mediaAssets.deletedAt)));
  revalidatePath("/admin/media");
}

export async function deleteMediaPermanently(form: FormData) {
  await requirePermission("manage_media");
  const id = text(form, "id");
  await db
    .delete(mediaAssets)
    .where(and(eq(mediaAssets.id, id), isNotNull(mediaAssets.deletedAt)));
  revalidatePath("/admin/media");
  redirect("/admin/media?trash=1");
}
