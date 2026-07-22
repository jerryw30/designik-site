"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";
import {
  websiteSettings,
  websiteSettingsDefaults,
} from "@/cms/website-settings";
const KEY = "website_settings";
async function existing() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, KEY))
    .limit(1);
  const value = row?.value as
    | { draft?: unknown; published?: unknown }
    | undefined;
  return {
    draft: websiteSettings(value?.draft),
    published: websiteSettings(value?.published),
  };
}
function formValue(form: FormData) {
  return websiteSettings({
    identity: {
      siteName: String(form.get("siteName") || ""),
      tagline: String(form.get("tagline") || ""),
      logoUrl: String(form.get("logoUrl") || ""),
      faviconUrl: String(form.get("faviconUrl") || ""),
    },
    contact: {
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      address: String(form.get("address") || ""),
    },
    social: {
      instagram: String(form.get("instagram") || ""),
      linkedin: String(form.get("linkedin") || ""),
      facebook: String(form.get("facebook") || ""),
      x: String(form.get("x") || ""),
      youtube: String(form.get("youtube") || ""),
    },
    regional: {
      language:
        String(form.get("language") || "en")
          .replace(/[^a-zA-Z-]/g, "")
          .slice(0, 20) || "en",
      timezone: String(form.get("timezone") || "UTC").slice(0, 100),
      dateFormat: String(form.get("dateFormat") || "").slice(0, 100),
    },
    behavior: {
      maintenance: form.get("maintenance") === "on",
      maintenanceMessage: String(form.get("maintenanceMessage") || "").slice(
        0,
        1000,
      ),
    },
    custom: {
      css: String(form.get("css") || "").slice(0, 50000),
      headCode: String(form.get("headCode") || "").slice(0, 50000),
      footerCode: String(form.get("footerCode") || "").slice(0, 50000),
    },
  });
}
export async function saveSettingsDraft(form: FormData) {
  const user = await requirePermission("manage_settings"),
    old = await existing(),
    draft = formValue(form);
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft, published: old.published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft, published: old.published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  await logActivity(user, "settings", "updated", "website settings");
  revalidatePath("/admin/settings");
}
export async function publishSettings(form: FormData) {
  const user = await requirePermission("manage_settings"),
    published = formValue(form);
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
  await logActivity(user, "settings", "published", "website settings");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
export async function resetSettingsDraft() {
  const user = await requirePermission("manage_settings"),
    old = await existing();
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft: websiteSettingsDefaults, published: old.published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft: websiteSettingsDefaults, published: old.published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  await logActivity(user, "settings", "reset", "website settings");
  revalidatePath("/admin/settings");
}
