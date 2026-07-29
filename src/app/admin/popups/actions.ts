"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { getSiteConfig, saveSiteSetting } from "@/lib/site-config";

async function requireEditor() {
  const user = await currentUser();
  if (!user || !can(user.role, "manage_forms")) redirect("/admin");
  return user;
}

export async function savePopupSettings(formData: FormData) {
  const user = await requireEditor();
  const current = await getSiteConfig();
  await saveSiteSetting(
    "popup_settings",
    {
      getStartedTitle: String(formData.get("getStartedTitle") || "").slice(0, 200) || current.popups.getStartedTitle,
      getStartedSuccess: String(formData.get("getStartedSuccess") || "").slice(0, 500) || current.popups.getStartedSuccess,
      termsTitle: String(formData.get("termsTitle") || "").slice(0, 200) || current.popups.termsTitle,
      termsUpdated: String(formData.get("termsUpdated") || "").slice(0, 100) || current.popups.termsUpdated,
      termsBody: String(formData.get("termsBody") || "").slice(0, 40000),
    },
    user.id,
  );
  await logActivity(user, "settings", "updated", "site popups", "popup-settings");
  revalidatePath("/admin/popups");
}

export async function saveContactSettings(formData: FormData) {
  const user = await requireEditor();
  const current = await getSiteConfig();
  await saveSiteSetting(
    "site_contact",
    {
      calendlyUrl: String(formData.get("calendlyUrl") || "").trim() || current.calendlyUrl,
      phone: String(formData.get("phone") || "").trim() || current.phone,
    },
    user.id,
  );
  await logActivity(user, "settings", "updated", "booking & phone", "site-contact");
  revalidatePath("/admin/popups");
}
