import type { Metadata } from "next";
import { Oswald, Inter, Akshar } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, siteSettings } from "@/db/schema";
import {
  customFontCss,
  globalStyles,
  globalStyleVariables,
} from "@/cms/global-styles";
import { safeBase, seoSettings } from "@/cms/seo";

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
  return {
    metadataBase: safeBase(global.canonicalBase),
    title: { default: title, template: global.titleTemplate || "%s" },
    description,
    alternates: { canonical: pageSeo.canonical || "/" },
    robots: {
      index: pageSeo.noindex ? false : global.index,
      follow: global.follow,
    },
    verification: global.googleVerification
      ? { google: global.googleVerification }
      : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      url: pageSeo.canonical || "/",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
      creator: global.twitterHandle || undefined,
    },
  };
}

export const revalidate = 60;
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [record] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "global_styles"))
    .limit(1);
  const stored = record?.value as { published?: unknown } | undefined;
  const published = globalStyles(stored?.published);
  const variables = globalStyleVariables(published) as React.CSSProperties;
  const fontCss = customFontCss(published);
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${inter.variable} ${akshar.variable}`}
      style={variables}
    >
      {fontCss && (
        <head>
          <style dangerouslySetInnerHTML={{ __html: fontCss }} />
        </head>
      )}
      <body className="bg-white text-ink font-sans">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
