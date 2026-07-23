import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources, pages, sections } from "@/db/schema";
import { publishedDesign, type GlobalDesign } from "@/cms/design-resources";

export type BlogChrome = {
  headerContent?: Record<string, unknown>;
  footerContent?: Record<string, unknown>;
  popup: GlobalDesign | null;
};

/**
 * The global site chrome (header/footer/popup) as it applies to the blog:
 * a published Header/Footer Builder design (location "blog"/"entire-site")
 * if one exists, otherwise the homepage's real header/footer — so the blog
 * always matches the rest of the site. Fails open to the built-in design.
 */
export async function blogChrome(): Promise<BlogChrome> {
  try {
    const [rows, homeChrome] = await Promise.all([
      db
        .select()
        .from(adminResources)
        .where(
          and(
            inArray(adminResources.module, ["headers", "footers", "popups"]),
            eq(adminResources.status, "PUBLISHED"),
            isNull(adminResources.deletedAt),
          ),
        ),
      db
        .select({ type: sections.type, content: sections.publishedContent })
        .from(sections)
        .innerJoin(pages, eq(sections.pageId, pages.id))
        .where(and(eq(pages.slug, "home"), inArray(sections.type, ["header", "footer"]))),
    ]);
    const home = (t: string) => homeChrome.find((s) => s.type === t)?.content as Record<string, unknown> | undefined;
    const wrap = (module: "headers" | "footers", fallback?: Record<string, unknown>) => {
      const design = publishedDesign(rows, module, "blog");
      return design ? { ...design.content, _globalStyle: design.style } : fallback;
    };
    return {
      headerContent: wrap("headers", home("header")),
      footerContent: wrap("footers", home("footer")),
      popup: publishedDesign(rows, "popups", "blog"),
    };
  } catch {
    return { headerContent: undefined, footerContent: undefined, popup: null };
  }
}
