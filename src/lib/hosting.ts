/**
 * Hosting storefront domain logic: pricing, subdomain rules, availability.
 *
 * Payments run in TEST mode (see src/lib/payments.ts) until real gateway
 * keys are added; prices here are still the real prices shown to customers.
 */

/** What we pay per TLD per year, in cents (edit when reseller pricing lands). */
export const TLD_BASE_PRICES: Record<string, number> = {
  com: 1099,
  net: 1299,
  org: 1199,
  us: 899,
  co: 2499,
  io: 3999,
  agency: 2199,
  site: 1499,
  online: 1699,
  store: 1999,
};

/** Customer pays base + this markup (cents). */
export const DOMAIN_MARKUP = 500;

/** Suffix for free temporary sites: <name>.designik.us */
export const TEMP_DOMAIN_SUFFIX = "designik.us";

/** Names that must never become customer subdomains of designik.us. */
const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "mail", "email", "smtp", "imap", "pop", "ftp",
  "blog", "shop", "store", "app", "portal", "panel", "cpanel", "webmail",
  "ns1", "ns2", "dns", "mx", "static", "cdn", "assets", "media", "dev",
  "staging", "test", "demo", "designik", "hosting", "support", "help",
  "billing", "pay", "checkout", "account", "login", "dashboard",
]);

export function domainPriceFor(domain: string): number | null {
  const tld = domain.split(".").slice(1).join(".").toLowerCase();
  const base = TLD_BASE_PRICES[tld];
  return base ? base + DOMAIN_MARKUP : null;
}

export function validDomain(domain: string) {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.[a-z.]{2,12}$/.test(
    domain.toLowerCase().trim(),
  );
}

export function normalizeSubdomain(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function subdomainProblem(name: string): string | null {
  if (name.length < 3) return "At least 3 characters.";
  if (name.length > 40) return "40 characters maximum.";
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name))
    return "Letters, numbers and hyphens only.";
  if (RESERVED_SUBDOMAINS.has(name)) return "That name is reserved.";
  return null;
}

export function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function makeOrderRef() {
  // DGK-XXXXXX, unambiguous alphabet.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return `DGK-${s}`;
}

/**
 * RDAP availability probe — free, no account needed. 404 = available,
 * 200 = registered. Unknown (network trouble / odd TLD) returns null so
 * the UI can say "couldn't verify" instead of lying.
 */
export async function domainAvailable(
  domain: string,
): Promise<boolean | null> {
  try {
    const res = await fetch(
      `https://rdap.org/domain/${encodeURIComponent(domain)}`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" },
    );
    if (res.status === 404) return true;
    if (res.ok) return false;
    return null;
  } catch {
    return null;
  }
}

/** Fee for "we connect your own domain for you" (cents). */
export const DOMAIN_CONNECT_FEE = 1000;

/**
 * Starter templates the team builds from. Card previews are CSS gradients so
 * the storefront needs no screenshot assets; swap in real previews later.
 */
export const SITE_TEMPLATES = [
  { key: "business", name: "Business Pro", blurb: "Corporate pages, services grid, team & testimonials.", colors: ["#1d4ed8", "#0f172a"] },
  { key: "portfolio", name: "Portfolio", blurb: "Visual-first showcase for creatives and studios.", colors: ["#a10140", "#db2f73"] },
  { key: "restaurant", name: "Restaurant", blurb: "Menu, reservations, gallery and location.", colors: ["#b45309", "#7c2d12"] },
  { key: "shop", name: "Online Shop", blurb: "WooCommerce storefront ready for products.", colors: ["#047857", "#064e3b"] },
  { key: "blog", name: "Magazine / Blog", blurb: "Editorial layout built around your writing.", colors: ["#6d28d9", "#312e81"] },
  { key: "landing", name: "Landing Page", blurb: "Single high-converting page for one offer.", colors: ["#0891b2", "#164e63"] },
] as const;

export type TemplateKey = (typeof SITE_TEMPLATES)[number]["key"];

export const SITE_PAGE_OPTIONS = ["Home", "About", "Services", "Portfolio", "Contact", "Blog", "Shop"] as const;
