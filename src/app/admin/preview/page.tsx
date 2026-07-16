import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { heroContent } from "@/cms/defaults";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";

export const dynamic = "force-dynamic";

export default async function Preview() {
  if (!(await currentUser())) redirect("/admin/login");
  const [hero] = await db.select({ content: sections.draftContent }).from(sections).where(eq(sections.type, "hero")).limit(1);
  return <main className="relative overflow-x-hidden"><Nav /><Hero content={heroContent(hero?.content)} /></main>;
}
