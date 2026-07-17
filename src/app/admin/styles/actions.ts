"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import {
  globalStyleDefaults,
  globalStyles,
  type GlobalStyles,
} from "@/cms/global-styles";
import { requirePermission } from "@/lib/permissions";
const KEY = "global_styles";
async function current() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, KEY))
    .limit(1);
  const value = row?.value as
    | { draft?: unknown; published?: unknown }
    | undefined;
  return {
    draft: globalStyles(value?.draft),
    published: globalStyles(value?.published),
  };
}
export async function saveGlobalStylesDraft(value: GlobalStyles) {
  const user = await requirePermission("manage_settings"),
    existing = await current(),
    draft = globalStyles(value);
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft, published: existing.published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft, published: existing.published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/admin/styles");
}
export async function publishGlobalStyles(value: GlobalStyles) {
  const user = await requirePermission("manage_settings"),
    published = globalStyles(value);
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft: published, published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft: published, published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/admin/styles");
  revalidatePath("/", "layout");
}
export async function resetGlobalStylesDraft() {
  const user = await requirePermission("manage_settings"),
    existing = await current();
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft: globalStyleDefaults, published: existing.published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft: globalStyleDefaults, published: existing.published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/admin/styles");
  return globalStyleDefaults;
}
