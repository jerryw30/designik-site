import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { publishedDesign, type GlobalDesign } from "@/cms/design-resources";

export type BlogChrome = {
  headerContent?: Record<string, unknown>;
  footerContent?: Record<string, unknown>;
  popup: GlobalDesign | null;
};

/**
 * Published Header/Footer/Popup designs as they apply to the blog
 * (location "blog" or "entire-site"), shaped for <Nav>/<Footer> content
 * props. Fails open to the built-in design.
 */
export async function blogChrome(): Promise<BlogChrome> {
  try {
    const rows = await db
      .select()
      .from(adminResources)
      .where(
        and(
          inArray(adminResources.module, ["headers", "footers", "popups"]),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      );
    const wrap = (module: "headers" | "footers") => {
      const design = publishedDesign(rows, module, "blog");
      return design ? { ...design.content, _globalStyle: design.style } : undefined;
    };
    return {
      headerContent: wrap("headers"),
      footerContent: wrap("footers"),
      popup: publishedDesign(rows, "popups", "blog"),
    };
  } catch {
    return { headerContent: undefined, footerContent: undefined, popup: null };
  }
}
