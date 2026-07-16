import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { ensureHomepage, getHomepageSections, logout, updatePage } from "./actions";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const pageId = await ensureHomepage();
  const [page] = await db.select().from(pages).then((rows) => rows.filter((item) => item.id === pageId));
  const sectionList = await getHomepageSections(pageId);
  return <main className="min-h-screen bg-[#111216] text-white">
    <header className="flex h-16 items-center justify-between border-b border-white/10 px-5">
      <div><b>DESIGNIK</b> <span className="text-pink-400">EDITOR</span></div>
      <div className="flex items-center gap-4 text-sm text-white/60"><span>{user.name} · {user.role.replaceAll("_", " ")}</span><a href="/" target="_blank" className="admin-button">View site</a><form action={logout}><button>Sign out</button></form></div>
    </header>
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[260px_minmax(500px,1fr)_300px]">
      <aside className="border-r border-white/10 bg-[#17181d] p-4"><h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Navigator</h2><div className="mb-3 rounded-lg bg-pink-500/15 px-3 py-2 text-sm font-medium">Page · {page.title}</div><div className="space-y-1">{sectionList.map((section) => <div key={section.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5"><span className="text-white/30">⋮⋮</span>{section.name}<span className="ml-auto text-white/20">•••</span></div>)}</div><button className="mt-4 w-full rounded-lg border border-dashed border-white/20 p-3 text-sm text-white/50">+ Add section</button></aside>
      <section className="bg-[#25262c] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex gap-2 rounded-lg bg-black/30 p-1 text-xs"><button className="rounded bg-white/10 px-3 py-1.5">Desktop</button><button className="px-3 py-1.5">Tablet</button><button className="px-3 py-1.5">Mobile</button></div><span className="text-xs text-white/40">100%</span></div><div className="mx-auto h-[calc(100vh-9rem)] overflow-hidden rounded-xl bg-white shadow-2xl"><iframe title="Live website preview" src="/" className="h-full w-full border-0" /></div></section>
      <aside className="border-l border-white/10 bg-[#17181d] p-5"><h2 className="text-lg font-semibold">Page settings</h2><div className="mt-5 flex gap-4 border-b border-white/10 text-xs text-white/50"><span className="border-b-2 border-pink-400 pb-3 text-white">Content</span><span>Style</span><span>Advanced</span></div><form action={updatePage} className="mt-6 space-y-5"><input type="hidden" name="id" value={page.id} /><label className="block text-xs text-white/50">Page title<input name="title" defaultValue={page.title} className="admin-input mt-2" /></label><label className="block text-xs text-white/50">URL slug<input name="slug" defaultValue={page.slug} className="admin-input mt-2" /></label><label className="block text-xs text-white/50">Status<div className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-emerald-300">{page.status}</div></label><button className="admin-button w-full">Save draft</button></form></aside>
    </div>
  </main>;
}
