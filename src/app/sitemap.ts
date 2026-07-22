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
  const visiblePosts = posts.filter(
    (post) => !(post.data as { seoNoindex?: boolean }).seoNoindex,
  );
  const latestPost = visiblePosts.reduce<Date | null>(
    (latest, post) =>
      !latest || post.updatedAt > latest ? post.updatedAt : latest,
    null,
  );
  return [
    // The blog archive is a static route that always exists; only skip it if
    // a CMS page already claims the /blog slug.
    ...(pageList.some((page) => page.slug === "blog")
      ? []
      : [
          {
            url: `${base}/blog`,
            lastModified: latestPost || new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          },
        ]),
    ...pageList
      .filter((page) => !(page.seo as { noindex?: boolean }).noindex)
      .map((page) => ({
        url: page.slug === "home" ? base : `${base}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "weekly" as const,
        priority: page.slug === "home" ? 1 : 0.8,
      })),
    ...visiblePosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
