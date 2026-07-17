import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { heroContent } from "@/cms/defaults";
import { db } from "@/db";
import { pages, sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { logout } from "@/app/admin/actions";
import EditorClient from "@/app/admin/editor-client";

export const dynamic = "force-dynamic";
export default async function Builder({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) redirect("/admin/login"); const { id } = await params;
  const [page] = await db.select().from(pages).where(eq(pages.id,id)).limit(1); if (!page || page.deletedAt) notFound();
  const list = await db.select().from(sections).where(eq(sections.pageId,id)).orderBy(sections.position); const hero = list.find((item) => item.type === "hero");
  return <main className="min-h-screen bg-[#111216] text-white"><header className="flex h-16 items-center justify-between border-b border-white/10 px-5"><div className="flex items-center gap-4"><Link href="/admin/pages" className="text-white/50 hover:text-white">← Pages</Link><div><b>DESIGNIK</b> <span className="text-pink-400">BUILDER</span></div><span className="text-sm text-white/40">{page.title}</span></div><div className="flex items-center gap-4 text-sm text-white/60"><span>{user.name}</span><a href={page.slug === "home" ? "/" : `/${page.slug}`} target="_blank" className="admin-button">View live</a><form action={logout}><button>Sign out</button></form></div></header><EditorClient page={{ id:page.id,title:page.title,slug:page.slug,status:page.status }} sections={list.map(({id,name,type,draftContent})=>({id,name,type,draftContent}))} initialHero={heroContent(hero?.draftContent)} previewUrl={`/admin/pages/${page.id}/preview`} /></main>;
}
