import { eq } from "drizzle-orm";
import { heroContent } from "@/cms/defaults";
import SiteHome from "@/components/SiteHome";
import { db } from "@/db";
import { sections } from "@/db/schema";

export const revalidate = 60;

export default async function Home() {
  const [hero] = await db.select({ content: sections.publishedContent }).from(sections).where(eq(sections.type, "hero")).limit(1);
  return <SiteHome hero={heroContent(hero?.content)} />;
}
