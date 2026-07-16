import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "@/app/admin/admin-shell";
import { updatePage } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) redirect("/admin/login"); const { id } = await params;
  const [page] = await db.select().from(pages).where(eq(pages.id,id)).limit(1); if (!page) notFound();
  return <AdminShell user={user} title={`Edit page · ${page.title}`}><form action={updatePage} className="max-w-3xl space-y-6 rounded-2xl border bg-white p-7"><input type="hidden" name="id" value={page.id} /><label className="block text-sm font-medium">Page title<input name="title" defaultValue={page.title} required className="admin-input mt-2" /></label><label className="block text-sm font-medium">URL slug<input name="slug" defaultValue={page.slug} required className="admin-input mt-2" /></label><div className="rounded-xl bg-neutral-50 p-4 text-sm"><span className="text-neutral-500">Current status:</span> <b>{page.status}</b></div><div className="flex gap-3"><button className="admin-button">Save page</button><Link href={`/admin/pages/${page.id}/builder`} className="rounded-lg border px-5 py-2.5">Edit visually</Link><Link href="/admin/pages" className="px-3 py-2.5 text-neutral-500">Back</Link></div></form></AdminShell>;
}
