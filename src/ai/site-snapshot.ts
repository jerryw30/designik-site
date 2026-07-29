import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources, sections } from "@/db/schema";
import { heroContent } from "@/cms/defaults";
import { sectionDefaults } from "@/cms/section-defaults";
import { getSiteConfig } from "@/lib/site-config";

/**
 * Compact, always-fresh digest of the live website for IKORA: every page and
 * section link plus the actual published content, so she can answer from the
 * real site and share exact links. Cached for a few minutes per origin.
 */

const CACHE_MS = 5 * 60_000;
const cache = new Map<string, { text: string; at: number }>();

type Dict = Record<string, unknown>;
const str = (v: unknown, max = 220) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
const line = (v: unknown, max = 220) => str(v, max).replace(/\n/g, " ");

function merged(type: string, published: unknown): Dict {
  const defaults = (sectionDefaults as Record<string, Dict>)[type] || {};
  const pub = typeof published === "object" && published ? (published as Dict) : {};
  return { ...defaults, ...pub };
}

export async function getSiteSnapshot(origin: string): Promise<string> {
  const hit = cache.get(origin);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.text;

  try {
    const home = await db.query.pages.findFirst({ where: (p, { eq: eq2 }) => eq2(p.slug, "home") });
    const rows = home
      ? await db.select().from(sections).where(eq(sections.pageId, home.id)).orderBy(asc(sections.position))
      : [];
    const byType = new Map(rows.map((r) => [r.type, r.publishedContent]));
    const posts = await db
      .select({ title: adminResources.title, slug: adminResources.slug, data: adminResources.data })
      .from(adminResources)
      .where(and(eq(adminResources.module, "posts"), eq(adminResources.status, "PUBLISHED"), isNull(adminResources.deletedAt)))
      .orderBy(desc(adminResources.updatedAt))
      .limit(8);
    const config = await getSiteConfig();

    const hero = heroContent(byType.get("hero") as Partial<import("@/cms/defaults").HeroContent> | undefined);
    const about = merged("about", byType.get("about"));
    const stats = merged("stats", byType.get("stats"));
    const services = merged("services", byType.get("services"));
    const portfolio = merged("portfolio", byType.get("portfolio"));
    const team = merged("team", byType.get("team"));
    const testimonials = merged("testimonials", byType.get("testimonials"));

    const out: string[] = [];
    out.push("SITE MAP (real pages on this website — share these exact links when relevant):");
    out.push(`- Home: ${origin}/`);
    out.push(`- About section: ${origin}/#about`);
    out.push(`- Services section: ${origin}/#services`);
    out.push(`- Work / portfolio section: ${origin}/#portfolio`);
    out.push(`- Full portfolio page: ${origin}/portfolio`);
    out.push(`- Contact (footer + Start a Project form): ${origin}/#contact`);
    out.push(`- Blog: ${origin}/blog`);
    for (const p of posts) out.push(`  - Blog post "${line(p.title, 90)}": ${origin}/blog/${p.slug}`);
    out.push(`- Book a call with Luke: ${config.calendlyUrl}`);
    out.push(`- Phone: ${config.phone}`);

    out.push("");
    out.push("SITE CONTENT (published content from the live website — answer from this, never invent):");
    out.push(`Hero: "${line(hero.heading, 120)}" — ${line(hero.description, 200)}`);
    if (about.description) out.push(`About (${line(about.headingAccent, 40)} ${line(about.heading, 40)}): ${line(about.description, 250)}`);

    const statItems = Array.isArray(stats.items) ? (stats.items as Dict[]) : [];
    if (statItems.length)
      out.push(`Stats: ${statItems.map((s) => `${s.value}${str(s.suffix, 4)}${s.unit ? ` ${str(s.unit, 10)}` : ""} ${line(s.label, 40)}`).join("; ")}`);

    const svcCards = typeof services.cards === "object" && services.cards ? (services.cards as Record<string, Dict>) : {};
    const svcTitles = Object.values(svcCards)
      .map((c) => line(String(c.title || "").replace(/\n/g, " "), 60))
      .filter(Boolean);
    if (svcTitles.length) out.push(`Services shown on the site: ${svcTitles.join("; ")}`);

    const pfCards = Array.isArray(portfolio.cards) ? (portfolio.cards as Dict[]) : [];
    if (pfCards.length) {
      out.push("Featured work (portfolio section — each opens a full case study on the site):");
      for (const c of pfCards) {
        const liveLink = str(c.link, 80);
        out.push(
          `- ${line(c.accent, 50)} — ${line(c.heading, 80)}: ${line(c.description, 200)}${liveLink ? ` Live site: ${liveLink}` : ""}`,
        );
      }
    }

    const members = Array.isArray(team.members) ? (team.members as Dict[]) : [];
    if (members.length) out.push(`Team: ${members.map((m) => `${line(m.name, 40)} (${line(m.role, 50)})`).join(", ")}`);

    const reviews = Array.isArray(testimonials.reviews) ? (testimonials.reviews as Dict[]) : [];
    if (reviews.length) {
      out.push("Client reviews on the site:");
      for (const r of reviews.slice(0, 4)) out.push(`- ${line(r.author, 40)} (${line(r.role, 30)}): "${line(r.quote, 160)}"`);
    }

    const text = out.join("\n").slice(0, 6000);
    cache.set(origin, { text, at: Date.now() });
    return text;
  } catch (err) {
    console.warn("[ikora] site snapshot failed:", err);
    return "";
  }
}
