import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { heroContent } from "@/cms/defaults";
import SiteHome from "@/components/SiteHome";
import { db } from "@/db";
import { pages, sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function PagePreview({ params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) redirect("/admin/login"); const { id } = await params;
  const [page] = await db.select({ id: pages.id }).from(pages).where(eq(pages.id,id)).limit(1); if (!page) notFound();
  const [hero] = await db.select({ content: sections.draftContent }).from(sections).where(and(eq(sections.pageId,id), eq(sections.type,"hero"))).limit(1);
  return <SiteHome hero={heroContent(hero?.content)} />;
}
