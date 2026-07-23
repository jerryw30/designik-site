export type SeoSettings = {
  // General
  siteTitle: string;
  titleTemplate: string;
  description: string;
  canonicalBase: string;
  keywords: string;
  // Social
  ogImage: string;
  twitterHandle: string;
  twitterCardType: "summary" | "summary_large_image";
  facebookAppId: string;
  // Organization / schema
  orgName: string;
  orgLogo: string;
  orgSameAs: string; // newline/comma separated social profile URLs
  schemaJson: string; // custom JSON-LD (raw)
  // Webmaster verification
  googleVerification: string;
  bingVerification: string;
  pinterestVerification: string;
  yandexVerification: string;
  baiduVerification: string;
  // Robots
  index: boolean;
  follow: boolean;
  sitemapEnabled: boolean;
  // Advanced
  headCode: string; // raw HTML injected into <head>
};

export const seoDefaults: SeoSettings = {
  siteTitle: "Designik — Creative Agency",
  titleTemplate: "%s | Designik",
  description:
    "Designik drives brand engagement with innovative digital solutions. We drive your brand to new heights.",
  canonicalBase: "https://designik-site.vercel.app",
  keywords: "",
  ogImage: "",
  twitterHandle: "",
  twitterCardType: "summary_large_image",
  facebookAppId: "",
  orgName: "Designik",
  orgLogo: "",
  orgSameAs: "",
  schemaJson: "",
  googleVerification: "",
  bingVerification: "",
  pinterestVerification: "",
  yandexVerification: "",
  baiduVerification: "",
  index: true,
  follow: true,
  sitemapEnabled: true,
  headCode: "",
};

export function seoSettings(value: unknown): SeoSettings {
  const input =
    value && typeof value === "object" ? (value as Partial<SeoSettings>) : {};
  return {
    ...seoDefaults,
    ...input,
    twitterCardType:
      input.twitterCardType === "summary" ? "summary" : "summary_large_image",
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

/** Extra verification <meta> names for Next's Metadata.verification.other. */
export function verificationMeta(s: SeoSettings): Record<string, string> {
  const m: Record<string, string> = {};
  if (s.bingVerification) m["msvalidate.01"] = s.bingVerification;
  if (s.pinterestVerification) m["p:domain_verify"] = s.pinterestVerification;
  if (s.baiduVerification) m["baidu-site-verification"] = s.baiduVerification;
  if (s.facebookAppId) m["fb:app_id"] = s.facebookAppId;
  return m;
}

/** Organization JSON-LD from the settings (or null if not enough data). */
export function organizationSchema(s: SeoSettings): object | null {
  if (!s.orgName) return null;
  const sameAs = s.orgSameAs
    .split(/[\n,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.orgName,
    url: s.canonicalBase,
  };
  if (s.orgLogo) schema.logo = s.orgLogo;
  if (sameAs.length) schema.sameAs = sameAs;
  return schema;
}
