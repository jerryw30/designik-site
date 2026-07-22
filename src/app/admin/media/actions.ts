"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function updateMedia(form: FormData) {
  const user = await requirePermission("manage_media");
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
  await logActivity(
    user,
    "media",
    "updated",
    text(form, "title") || "Untitled asset",
    id,
  );
  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}/edit`);
  redirect(`/admin/media/${id}/edit?saved=1`);
}

export async function trashMedia(form: FormData) {
  const user = await requirePermission("manage_media");
  const id = text(form, "id");
  await db
    .update(mediaAssets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)));
  await logActivity(user, "media", "trashed", id, id);
  revalidatePath("/admin/media");
  redirect("/admin/media?trashed=1");
}

export async function restoreMedia(form: FormData) {
  const user = await requirePermission("manage_media");
  const id = text(form, "id");
  await db
    .update(mediaAssets)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(mediaAssets.id, id), isNotNull(mediaAssets.deletedAt)));
  await logActivity(user, "media", "restored", id, id);
  revalidatePath("/admin/media");
  redirect("/admin/media?trash=1&restored=1");
}

export async function deleteMediaPermanently(form: FormData) {
  const user = await requirePermission("manage_media");
  const id = text(form, "id");
  await db
    .delete(mediaAssets)
    .where(and(eq(mediaAssets.id, id), isNotNull(mediaAssets.deletedAt)));
  await logActivity(user, "media", "deleted", id, id);
  revalidatePath("/admin/media");
  redirect("/admin/media?trash=1&deleted=1");
}
