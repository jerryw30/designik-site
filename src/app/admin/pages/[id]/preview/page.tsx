import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { heroContent } from "@/cms/defaults";
import SiteHome from "@/components/SiteHome";
import { db } from "@/db";
import { adminResources, pages, sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";

export const dynamic = "force-dynamic";
export default async function PagePreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "pages")) redirect("/admin");
  const { id } = await params;
  // pages.id is a uuid column — malformed ids must 404, not crash.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);
  if (!page) notFound();
  const [list, formRows, homeChrome] = await Promise.all([
    db.select().from(sections).where(eq(sections.pageId, id)).orderBy(asc(sections.position)),
    db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "forms"),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      ),
    // homepage header/footer — the global chrome, so previews look like the live site
    db
      .select({ type: sections.type, content: sections.draftContent })
      .from(sections)
      .innerJoin(pages, eq(sections.pageId, pages.id))
      .where(and(eq(pages.slug, "home"), inArray(sections.type, ["header", "footer"]))),
  ]);
  const hero = list.find((item) => item.type === "hero");
  const homeHeader = homeChrome.find((s) => s.type === "header")?.content ?? {};
  const homeFooter = homeChrome.find((s) => s.type === "footer")?.content ?? {};
  const mapped = list.map((s) => ({
    id: s.id,
    type: s.type,
    visible: s.visible,
    content: s.draftContent,
  }));
  if (!mapped.some((s) => s.type === "header"))
    mapped.unshift({ id: "global-header", type: "header", visible: true, content: homeHeader });
  if (!mapped.some((s) => s.type === "footer"))
    mapped.push({ id: "global-footer", type: "footer", visible: true, content: homeFooter });
  return (
    <SiteHome
      builder
      hero={heroContent(hero?.draftContent)}
      sections={mapped}
      forms={formRows.map((form) => ({
        id: form.id,
        title: form.title,
        definition:
          form.data as import("@/app/admin/forms/actions").FormDefinition,
      }))}
    />
  );
}
