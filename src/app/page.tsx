import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { heroContent } from "@/cms/defaults";
import { publishedDesign } from "@/cms/design-resources";
import SiteHome from "@/components/SiteHome";
import { db } from "@/db";
import { adminResources, sections } from "@/db/schema";

export const revalidate = 60;

export default async function Home() {
  const list = await db
    .select()
    .from(sections)
    .where(
      eq(
        sections.pageId,
        (
          await db.query.pages.findFirst({
            where: (p, { eq }) => eq(p.slug, "home"),
          })
        )?.id ?? "00000000-0000-0000-0000-000000000000",
      ),
    )
    .orderBy(asc(sections.position));
  const globalRows = await db
    .select()
    .from(adminResources)
    .where(
      and(
        inArray(adminResources.module, ["headers", "footers", "popups"]),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    );
  const formRows = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "forms"),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    );
  const header = publishedDesign(globalRows, "headers", "homepage"),
    footer = publishedDesign(globalRows, "footers", "homepage"),
    popup = publishedDesign(globalRows, "popups", "homepage");
  const mapped = list.map((s) => {
    const override =
      s.type === "header" ? header : s.type === "footer" ? footer : null;
    const content = override
      ? {
          ...override.content,
          _globalStyle: override.style,
          _layout: {
            ...((override.content._layout as object) || {}),
            paddingTop: override.style.paddingTop,
            paddingBottom: override.style.paddingBottom,
            marginTop: override.style.marginTop,
            marginBottom: override.style.marginBottom,
            maxWidth: 0,
            alignment: override.style.alignment,
            desktopVisible: override.style.desktopVisible,
            tabletVisible: override.style.tabletVisible,
            mobileVisible: override.style.mobileVisible,
            animation: override.style.animation,
          },
        }
      : s.publishedContent;
    return {
      id: s.id,
      type: s.type,
      visible:
        s.visible &&
        (s.publishedContent as { _cmsPublished?: boolean })._cmsPublished !==
          false,
      content,
    };
  });
  const hero = list.find((item) => item.type === "hero");
  return (
    <SiteHome
      hero={heroContent(hero?.publishedContent)}
      sections={mapped}
      popup={popup}
      forms={formRows.map((form) => ({
        id: form.id,
        title: form.title,
        definition:
          form.data as import("@/app/admin/forms/actions").FormDefinition,
      }))}
    />
  );
}
