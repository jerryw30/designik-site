import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { ensureHomepage, getHomepageSections, logout } from "./actions";
import EditorClient from "./editor-client";
import { heroContent } from "@/cms/defaults";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const pageId = await ensureHomepage();
  const [page] = await db.select().from(pages).then((rows) => rows.filter((item) => item.id === pageId));
  const sectionList = await getHomepageSections(pageId);
  const heroSection = sectionList.find((item) => item.type === "hero");
  return <main className="min-h-screen bg-[#111216] text-white">
    <header className="flex h-16 items-center justify-between border-b border-white/10 px-5">
      <div><b>DESIGNIK</b> <span className="text-pink-400">EDITOR</span></div>
      <div className="flex items-center gap-4 text-sm text-white/60"><span>{user.name} · {user.role.replaceAll("_", " ")}</span><a href="/" target="_blank" className="admin-button">View site</a><form action={logout}><button>Sign out</button></form></div>
    </header>
    <EditorClient page={{ id: page.id, title: page.title, slug: page.slug, status: page.status }} sections={sectionList.map(({ id, name, type }) => ({ id, name, type }))} initialHero={heroContent(heroSection?.draftContent)} />
  </main>;
}
