import { asc, eq } from "drizzle-orm";
import { heroContent } from "@/cms/defaults";
import SiteHome from "@/components/SiteHome";
import { db } from "@/db";
import { sections } from "@/db/schema";

export const revalidate = 60;

export default async function Home() {
  const list = await db.select().from(sections).where(eq(sections.pageId, (await db.query.pages.findFirst({ where: (p,{eq}) => eq(p.slug,"home") }))?.id ?? "00000000-0000-0000-0000-000000000000")).orderBy(asc(sections.position));
  const hero = list.find((item) => item.type === "hero");
  return <SiteHome hero={heroContent(hero?.publishedContent)} sections={list.map((s) => ({ id:s.id,type:s.type,visible:s.visible && (s.publishedContent as {_cmsPublished?:boolean})._cmsPublished !== false,content:s.publishedContent }))} />;
}
