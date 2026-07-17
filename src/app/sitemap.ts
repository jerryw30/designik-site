import type { MetadataRoute } from "next";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources, pages, siteSettings } from "@/db/schema";
import { safeBase, seoSettings } from "@/cms/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, pageList, posts] = await Promise.all([
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "seo_settings"))
      .limit(1),
    db
      .select()
      .from(pages)
      .where(and(eq(pages.status, "PUBLISHED"), isNull(pages.deletedAt))),
    db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "posts"),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      ),
  ]);
  const stored = settings[0]?.value as { published?: unknown } | undefined;
  const seo = seoSettings(stored?.published);
  if (!seo.sitemapEnabled) return [];
  const base = safeBase(seo.canonicalBase).origin;
  return [
    ...pageList
      .filter((page) => !(page.seo as { noindex?: boolean }).noindex)
      .map((page) => ({
        url: page.slug === "home" ? base : `${base}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "weekly" as const,
        priority: page.slug === "home" ? 1 : 0.8,
      })),
    ...posts
      .filter((post) => !(post.data as { seoNoindex?: boolean }).seoNoindex)
      .map((post) => ({
        url: `${base}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}
