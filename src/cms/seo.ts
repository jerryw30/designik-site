export type SeoSettings = {
  siteTitle: string;
  titleTemplate: string;
  description: string;
  canonicalBase: string;
  ogImage: string;
  twitterHandle: string;
  index: boolean;
  follow: boolean;
  googleVerification: string;
  sitemapEnabled: boolean;
};
export const seoDefaults: SeoSettings = {
  siteTitle: "Designik — Creative Agency",
  titleTemplate: "%s | Designik",
  description:
    "Designik drives brand engagement with innovative digital solutions. We drive your brand to new heights.",
  canonicalBase: "https://designik-site.vercel.app",
  ogImage: "",
  twitterHandle: "",
  index: true,
  follow: true,
  googleVerification: "",
  sitemapEnabled: true,
};
export function seoSettings(value: unknown): SeoSettings {
  const input =
    value && typeof value === "object" ? (value as Partial<SeoSettings>) : {};
  return {
    ...seoDefaults,
    ...input,
    index: input.index !== false,
    follow: input.follow !== false,
    sitemapEnabled: input.sitemapEnabled !== false,
  };
}
export function safeBase(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url
      : new URL(seoDefaults.canonicalBase);
  } catch {
    return new URL(seoDefaults.canonicalBase);
  }
}
