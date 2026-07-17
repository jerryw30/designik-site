import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { safeBase, seoSettings } from "@/cms/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "seo_settings"))
    .limit(1);
  const stored = row?.value as { published?: unknown } | undefined;
  const seo = seoSettings(stored?.published);
  const base = safeBase(seo.canonicalBase).origin;
  return {
    rules: {
      userAgent: "*",
      allow: seo.index ? "/" : undefined,
      disallow: seo.index ? ["/admin/", "/api/"] : "/",
    },
    sitemap: seo.sitemapEnabled ? `${base}/sitemap.xml` : undefined,
    host: base,
  };
}
