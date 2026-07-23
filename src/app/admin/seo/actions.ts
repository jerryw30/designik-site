"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminResources, pages, siteSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";
import { seoSettings } from "@/cms/seo";
const KEY = "seo_settings";
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
    draft: seoSettings(value?.draft),
    published: seoSettings(value?.published),
  };
}
function fromForm(form: FormData) {
  const g = (k: string) => String(form.get(k) || "").trim();
  return seoSettings({
    siteTitle: g("siteTitle"),
    titleTemplate: g("titleTemplate"),
    description: g("description"),
    canonicalBase: g("canonicalBase"),
    keywords: g("keywords"),
    ogImage: g("ogImage"),
    twitterHandle: g("twitterHandle"),
    twitterCardType: g("twitterCardType") === "summary" ? "summary" : "summary_large_image",
    facebookAppId: g("facebookAppId"),
    orgName: g("orgName"),
    orgLogo: g("orgLogo"),
    orgSameAs: g("orgSameAs"),
    schemaJson: g("schemaJson"),
    googleVerification: g("googleVerification"),
    bingVerification: g("bingVerification"),
    pinterestVerification: g("pinterestVerification"),
    yandexVerification: g("yandexVerification"),
    baiduVerification: g("baiduVerification"),
    index: form.get("index") === "on",
    follow: form.get("follow") === "on",
    sitemapEnabled: form.get("sitemapEnabled") === "on",
    headCode: String(form.get("headCode") || ""),
  });
}
export async function saveSeoDraft(form: FormData) {
  const user = await requirePermission("manage_seo"),
    old = await existing(),
    draft = fromForm(form);
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
  await logActivity(user, "seo", "updated", "global SEO");
  revalidatePath("/admin/seo");
}
export async function publishSeo(form: FormData) {
  const user = await requirePermission("manage_seo"),
    published = fromForm(form);
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
  await logActivity(user, "seo", "published", "global SEO");
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
export async function resetSeoDraft() {
  const user = await requirePermission("manage_seo"),
    old = await existing();
  // Discard unpublished edits: the draft returns to what is currently live,
  // so an accidental publish afterwards cannot wipe the live configuration.
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft: old.published, published: old.published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft: old.published, published: old.published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  await logActivity(user, "seo", "reset", "global SEO");
  revalidatePath("/admin/seo");
}
export async function updatePageSeo(form: FormData) {
  const user = await requirePermission("manage_seo");
  const id = String(form.get("id"));
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);
  if (!page) return;
  // Merge with the stored object so fields managed from the page builder
  // (focus keyphrase, OG/X title overrides, …) survive a save from here.
  const seo = {
    ...(page.seo as object),
    title: String(form.get("title") || ""),
    description: String(form.get("description") || ""),
    canonical: String(form.get("canonical") || ""),
    ogImage: String(form.get("ogImage") || ""),
    noindex: form.get("noindex") === "on",
  };
  await db
    .update(pages)
    .set({ seo, updatedAt: new Date() })
    .where(eq(pages.id, id));
  await logActivity(user, "seo", "updated", page.title, id);
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
}
export async function updatePostSeo(form: FormData) {
  const user = await requirePermission("manage_seo");
  const id = String(form.get("id"));
  const [post] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")))
    .limit(1);
  if (!post) return;
  const data = {
    ...(post.data as object),
    seoTitle: String(form.get("title") || ""),
    seoDescription: String(form.get("description") || ""),
    seoCanonical: String(form.get("canonical") || ""),
    seoOgImage: String(form.get("ogImage") || ""),
    seoNoindex: form.get("noindex") === "on",
  };
  await db
    .update(adminResources)
    .set({ data, updatedAt: new Date() })
    .where(eq(adminResources.id, id));
  await logActivity(user, "seo", "updated", post.slug, id);
  revalidatePath("/admin/seo");
  revalidatePath(`/blog/${post.slug}`);
}
