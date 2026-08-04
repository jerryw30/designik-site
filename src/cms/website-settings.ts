export type WebsiteSettings = {
  identity: {
    siteName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
  };
  contact: { email: string; phone: string; address: string };
  social: {
    instagram: string;
    linkedin: string;
    facebook: string;
    x: string;
    youtube: string;
  };
  regional: { language: string; timezone: string; dateFormat: string };
  behavior: { maintenance: boolean; maintenanceMessage: string };
  custom: { css: string; headCode: string; footerCode: string };
};
export const websiteSettingsDefaults: WebsiteSettings = {
  identity: {
    siteName: "Designik",
    tagline: "Creative Agency",
    logoUrl: "/api/static/figma/vector1.svg",
    faviconUrl: "/favicon.ico",
  },
  contact: { email: "designguyluke@gmail.com", phone: "", address: "" },
  social: { instagram: "", linkedin: "", facebook: "", x: "", youtube: "" },
  regional: { language: "en", timezone: "UTC", dateFormat: "MMM d, yyyy" },
  behavior: {
    maintenance: false,
    maintenanceMessage:
      "We are making improvements. Please check back shortly.",
  },
  custom: { css: "", headCode: "", footerCode: "" },
};
export function websiteSettings(value: unknown): WebsiteSettings {
  const input =
    value && typeof value === "object"
      ? (value as Partial<WebsiteSettings>)
      : {};
  return {
    ...websiteSettingsDefaults,
    ...input,
    identity: { ...websiteSettingsDefaults.identity, ...input.identity },
    contact: { ...websiteSettingsDefaults.contact, ...input.contact },
    social: { ...websiteSettingsDefaults.social, ...input.social },
    regional: { ...websiteSettingsDefaults.regional, ...input.regional },
    behavior: { ...websiteSettingsDefaults.behavior, ...input.behavior },
    custom: { ...websiteSettingsDefaults.custom, ...input.custom },
  };
}
