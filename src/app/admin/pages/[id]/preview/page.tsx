import { and, asc, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { heroContent } from "@/cms/defaults";
import SiteHome from "@/components/SiteHome";
import { db } from "@/db";
import { adminResources, pages, sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function PagePreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await currentUser())) redirect("/admin/login");
  const { id } = await params;
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);
  if (!page) notFound();
  const list = await db
    .select()
    .from(sections)
    .where(eq(sections.pageId, id))
    .orderBy(asc(sections.position));
  const hero = list.find((item) => item.type === "hero");
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
  return (
    <SiteHome
      builder
      hero={heroContent(hero?.draftContent)}
      sections={list.map((s) => ({
        id: s.id,
        type: s.type,
        visible: s.visible,
        content: s.draftContent,
      }))}
      forms={formRows.map((form) => ({
        id: form.id,
        title: form.title,
        definition:
          form.data as import("@/app/admin/forms/actions").FormDefinition,
      }))}
    />
  );
}
