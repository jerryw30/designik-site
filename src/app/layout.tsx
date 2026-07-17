import type { Metadata } from "next";
import { Oswald, Inter, Akshar } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import {
  customFontCss,
  globalStyles,
  globalStyleVariables,
} from "@/cms/global-styles";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://designik.agency"),
  title: "Designik — Creative Agency",
  description:
    "Designik drives brand engagement with innovative digital solutions. We drive your brand to new heights.",
  openGraph: {
    title: "Designik — Creative Agency",
    description:
      "Designik drives brand engagement with innovative digital solutions.",
    type: "website",
  },
};

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
