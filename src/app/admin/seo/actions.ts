"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminResources, pages, siteSettings } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { seoDefaults, seoSettings } from "@/cms/seo";
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
  return seoSettings({
    siteTitle: String(form.get("siteTitle") || ""),
    titleTemplate: String(form.get("titleTemplate") || ""),
    description: String(form.get("description") || ""),
    canonicalBase: String(form.get("canonicalBase") || ""),
    ogImage: String(form.get("ogImage") || ""),
    twitterHandle: String(form.get("twitterHandle") || ""),
    index: form.get("index") === "on",
    follow: form.get("follow") === "on",
    googleVerification: String(form.get("googleVerification") || ""),
    sitemapEnabled: form.get("sitemapEnabled") === "on",
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
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
export async function resetSeoDraft() {
  const user = await requirePermission("manage_seo"),
    old = await existing();
  await db
    .insert(siteSettings)
    .values({
      key: KEY,
      value: { draft: seoDefaults, published: old.published },
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: { draft: seoDefaults, published: old.published },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/admin/seo");
}
export async function updatePageSeo(form: FormData) {
  await requirePermission("manage_seo");
  const id = String(form.get("id")),
    seo = {
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
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
}
export async function updatePostSeo(form: FormData) {
  await requirePermission("manage_seo");
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
  revalidatePath("/admin/seo");
  revalidatePath(`/blog/${post.slug}`);
}
