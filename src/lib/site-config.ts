import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources, siteSettings } from "@/db/schema";

/**
 * Public site configuration stored in the site_settings key/value table and
 * edited from the admin (Chat settings, Popups). Every field has a safe
 * default so the site works with an empty table.
 */

export type ChatSettings = {
  enabled: boolean;
  teaser: boolean; // the small "last message" preview bubble
  sound: boolean; // visitor-side chime
};

export type PopupSettings = {
  getStartedTitle: string;
  getStartedSuccess: string;
  /** Budget dropdown options in the Start a Project form. */
  budgetOptions: string[];
  /** "What do you need?" dropdown options in the Start a Project form. */
  serviceOptions: string[];
  termsTitle: string;
  termsUpdated: string;
  /** Simple markup: "## Section title" starts a section, "- item" is a bullet. Empty → built-in default terms. */
  termsBody: string;
};

export type PublicFormField = {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
};
export type PublicFormDefinition = {
  fields: PublicFormField[];
  submitLabel: string;
  successMessage: string;
};

export type SiteConfig = {
  chat: ChatSettings;
  calendlyUrl: string;
  phone: string;
  popups: PopupSettings;
  /** Field definition of the Start a Project popup — editable in the Forms builder. */
  getStartedForm: PublicFormDefinition | null;
};

/** The Forms-builder slug that powers the Start a Project popup. */
export const GET_STARTED_FORM_SLUG = "start-a-project";

async function getStartedFormDefinition(): Promise<PublicFormDefinition | null> {
  try {
    const [row] = await db
      .select({ data: adminResources.data, status: adminResources.status })
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "forms"),
          eq(adminResources.slug, GET_STARTED_FORM_SLUG),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      )
      .limit(1);
    if (!row) return null;
    const def = row.data as Partial<PublicFormDefinition> | null;
    if (!def || !Array.isArray(def.fields) || !def.fields.length) return null;
    return {
      fields: def.fields as PublicFormField[],
      submitLabel: def.submitLabel || "Send message",
      successMessage: def.successMessage || "",
    };
  } catch {
    return null;
  }
}

export const DEFAULT_CONFIG: SiteConfig = {
  chat: { enabled: true, teaser: true, sound: true },
  calendlyUrl: "https://calendly.com/luke-designingenious/",
  phone: "412-206-1270",
  popups: {
    getStartedTitle: "Let's build\nsomething great",
    getStartedSuccess: "Thanks for reaching out — we'll get back to you within 24 hours.",
    budgetOptions: ["Under $1,000", "$1,000 – $5,000", "$5,000 – $10,000", "$10,000+"],
    serviceOptions: [
      "Product Design",
      "Website Development",
      "Mobile App Development",
      "Brand Identity & Design",
      "Digital Marketing",
      "SEO",
      "Something else",
    ],
    termsTitle: "Terms & Conditions",
    termsUpdated: "August 10, 2026",
    termsBody: "",
  },
  getStartedForm: null,
};

const KEYS = ["chat_settings", "site_contact", "popup_settings"] as const;

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const [rows, getStartedForm] = await Promise.all([
      db
        .select()
        .from(siteSettings)
        .where(inArray(siteSettings.key, [...KEYS])),
      getStartedFormDefinition(),
    ]);
    const byKey = new Map(rows.map((r) => [r.key, r.value as Record<string, unknown>]));
    const chat = { ...DEFAULT_CONFIG.chat, ...(byKey.get("chat_settings") || {}) } as ChatSettings;
    const contact = byKey.get("site_contact") as { calendlyUrl?: string; phone?: string } | undefined;
    const popups = { ...DEFAULT_CONFIG.popups, ...(byKey.get("popup_settings") || {}) } as PopupSettings;
    return {
      chat,
      calendlyUrl: contact?.calendlyUrl || DEFAULT_CONFIG.calendlyUrl,
      phone: contact?.phone || DEFAULT_CONFIG.phone,
      popups,
      getStartedForm,
    };
  } catch {
    return { ...DEFAULT_CONFIG, getStartedForm: null };
  }
}

export async function saveSiteSetting(key: (typeof KEYS)[number], value: unknown, userId?: string) {
  await db
    .insert(siteSettings)
    .values({ key, value: value as object, updatedBy: userId || null })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: value as object, updatedBy: userId || null, updatedAt: new Date() },
    });
}
