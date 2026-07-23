import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHome, { type SiteSection } from "@/components/SiteHome";
import { publishedDesign } from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources, pages, sections } from "@/db/schema";
import type { FormDefinition } from "@/app/admin/forms/actions";

export const revalidate = 60;

async function publishedPage(slug: string) {
  return (
    await db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.slug, slug),
          eq(pages.status, "PUBLISHED"),
          isNull(pages.deletedAt),
        ),
      )
      .limit(1)
  )[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const page = await publishedPage((await params).slug);
  if (!page) return {};
  const seo = page.seo as {
    title?: string;
    description?: string;
    canonical?: string;
    noindex?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    xTitle?: string;
    xDescription?: string;
  };
  const title = seo.title || page.title;
  const description = seo.description;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;
  return {
    title,
    description,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      title: seo.xTitle || ogTitle,
      description: seo.xDescription || ogDescription,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export default async function PublishedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const page = await publishedPage((await params).slug);
  if (!page || page.slug === "home") notFound();
  const [pageSections, resources, homeChrome] = await Promise.all([
    db
      .select()
      .from(sections)
      .where(eq(sections.pageId, page.id))
      .orderBy(asc(sections.position)),
    db
      .select()
      .from(adminResources)
      .where(
        and(
          inArray(adminResources.module, [
            "headers",
            "footers",
            "popups",
            "forms",
          ]),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      ),
    // the homepage's header/footer — the real site chrome, used as the global
    // fallback so every page (incl. brand-new ones) shows them automatically
    db
      .select({ type: sections.type, content: sections.publishedContent })
      .from(sections)
      .innerJoin(pages, eq(sections.pageId, pages.id))
      .where(and(eq(pages.slug, "home"), inArray(sections.type, ["header", "footer"]))),
  ]);
  const homeHeader = homeChrome.find((s) => s.type === "header")?.content ?? {};
  const homeFooter = homeChrome.find((s) => s.type === "footer")?.content ?? {};
  const header = publishedDesign(resources, "headers", "pages");
  const footer = publishedDesign(resources, "footers", "pages");
  const popup = publishedDesign(resources, "popups", "pages");
  const overrideContent = (kind: "header" | "footer", original: unknown) => {
    const design = kind === "header" ? header : footer;
    if (!design) return original;
    return {
      ...design.content,
      _globalStyle: design.style,
      _layout: {
        ...((design.content._layout as object) || {}),
        paddingTop: design.style.paddingTop,
        paddingBottom: design.style.paddingBottom,
        marginTop: design.style.marginTop,
        marginBottom: design.style.marginBottom,
        alignment: design.style.alignment,
        desktopVisible: design.style.desktopVisible,
        tabletVisible: design.style.tabletVisible,
        mobileVisible: design.style.mobileVisible,
        animation: design.style.animation,
      },
    };
  };
  const mapped: SiteSection[] = pageSections
    .filter(
      (section) =>
        section.visible &&
        (section.publishedContent as { _cmsPublished?: boolean })
          ._cmsPublished !== false,
    )
    .map((section) => ({
      id: section.id,
      type: section.type,
      visible: true,
      content:
        section.type === "header" || section.type === "footer"
          ? overrideContent(section.type, section.publishedContent)
          : section.publishedContent,
    }));
  // Every page always gets a header and footer: the published Header/Footer
  // Builder design if one exists, otherwise the homepage's real chrome.
  if (!mapped.some((section) => section.type === "header"))
    mapped.unshift({
      id: "global-header",
      type: "header",
      visible: true,
      content: header ? overrideContent("header", {}) : homeHeader,
    });
  if (!mapped.some((section) => section.type === "footer"))
    mapped.push({
      id: "global-footer",
      type: "footer",
      visible: true,
      content: footer ? overrideContent("footer", {}) : homeFooter,
    });
  const forms = resources
    .filter((row) => row.module === "forms")
    .map((form) => ({
      id: form.id,
      title: form.title,
      definition: form.data as FormDefinition,
    }));
  return <SiteHome sections={mapped} forms={forms} popup={popup} />;
}
