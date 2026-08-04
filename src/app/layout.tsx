import type { Metadata } from "next";
import { Oswald, Inter, Akshar, Raleway } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, siteSettings } from "@/db/schema";
import {
  customFontCss,
  globalStyles,
  globalStyleVariables,
} from "@/cms/global-styles";
import { organizationSchema, safeBase, seoSettings, verificationMeta } from "@/cms/seo";
import { websiteSettings } from "@/cms/website-settings";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const akshar = Akshar({
  variable: "--font-akshar",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [[setting], [home]] = await Promise.all([
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "seo_settings"))
      .limit(1),
    db.select().from(pages).where(eq(pages.slug, "home")).limit(1),
  ]);
  const stored = setting?.value as { published?: unknown } | undefined;
  const global = seoSettings(stored?.published);
  const pageSeo = (home?.seo || {}) as {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
    noindex?: boolean;
  };
  const title = pageSeo.title || global.siteTitle;
  const description = pageSeo.description || global.description;
  const image = pageSeo.ogImage || global.ogImage;
  const otherMeta = verificationMeta(global);
  return {
    metadataBase: safeBase(global.canonicalBase),
    title: { default: title, template: global.titleTemplate || "%s" },
    description,
    keywords: global.keywords || undefined,
    alternates: { canonical: pageSeo.canonical || "/" },
    robots: {
      index: pageSeo.noindex ? false : global.index,
      follow: global.follow,
    },
    verification: {
      google: global.googleVerification || undefined,
      yandex: global.yandexVerification || undefined,
      other: Object.keys(otherMeta).length ? otherMeta : undefined,
    },
    other: Object.keys(otherMeta).length ? otherMeta : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: pageSeo.canonical || "/",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? global.twitterCardType : "summary",
      title,
      description,
      images: image ? [image] : undefined,
      creator: global.twitterHandle || undefined,
    },
  };
}

// Was ISR (revalidate=60): on Hostinger the persisted prerender cache served
// stale HTML indefinitely (stale-while-revalidate + failed revalidations
// against cold Neon), surviving deploys and DB fixes. Render per request.
export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [[record], [websiteRecord], [seoRecord]] = await Promise.all([
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "global_styles"))
      .limit(1),
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "website_settings"))
      .limit(1),
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "seo_settings"))
      .limit(1),
  ]);
  const stored = record?.value as { published?: unknown } | undefined;
  const websiteStored = websiteRecord?.value as
    | { published?: unknown }
    | undefined;
  const seoStored = seoRecord?.value as { published?: unknown } | undefined;
  const published = globalStyles(stored?.published);
  const website = websiteSettings(websiteStored?.published);
  const seo = seoSettings(seoStored?.published);
  const orgSchema = organizationSchema(seo);
  const variables = globalStyleVariables(published) as React.CSSProperties;
  const fontCss = customFontCss(published);
  return (
    <html
      lang={website.regional.language}
      className={`${oswald.variable} ${inter.variable} ${akshar.variable} ${raleway.variable}`}
      style={variables}
    >
      <head>
        <link rel="icon" href={website.identity.faviconUrl} />
        {(fontCss || website.custom.css) && (
          <style
            dangerouslySetInnerHTML={{
              __html: `${fontCss}\n${website.custom.css}`,
            }}
          />
        )}
        {website.custom.headCode && (
          <script
            dangerouslySetInnerHTML={{ __html: website.custom.headCode }}
          />
        )}
        {/* SEO Center: header scripts (analytics, tag managers) */}
        {seo.headCode && (
          <script dangerouslySetInnerHTML={{ __html: seo.headCode }} />
        )}
        {/* Organization JSON-LD */}
        {orgSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
        )}
        {/* Custom JSON-LD from the SEO Center */}
        {seo.schemaJson.trim() && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: seo.schemaJson }}
          />
        )}
      </head>
      <body className="bg-white text-ink font-sans">
        <SiteShell settings={website}>{children}</SiteShell>
      </body>
    </html>
  );
}
