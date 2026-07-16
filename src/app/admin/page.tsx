import Link from "next/link";
import { count, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages, revisions, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { ensureHomepage } from "./actions";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await currentUser(); if (!user) redirect("/admin/login");
  await ensureHomepage();
  const [[all], [published], [drafts], [userCount], recent] = await Promise.all([
    db.select({ value: count() }).from(pages).where(isNull(pages.deletedAt)),
    db.select({ value: count() }).from(pages).where(eq(pages.status, "PUBLISHED")),
    db.select({ value: count() }).from(pages).where(eq(pages.status, "DRAFT")),
    db.select({ value: count() }).from(users),
    db.select().from(revisions).orderBy(desc(revisions.createdAt)).limit(5),
  ]);
  const cards = [["Pages", all.value, "/admin/pages"], ["Published", published.value, "/admin/pages?status=published"], ["Drafts", drafts.value, "/admin/pages?status=draft"], ["Users", userCount.value, "/admin/users"]] as const;
  return <AdminShell user={user} title="Dashboard"><section className="rounded-2xl bg-gradient-to-r from-[#4d0b29] to-[#c10852] p-8 text-white"><p className="text-white/70">Welcome back, {user.name}</p><h2 className="mt-1 text-3xl font-semibold">Manage the complete Designik website</h2><div className="mt-6 flex flex-wrap gap-3"><Link href="/admin/pages" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-pink-700">Manage pages</Link><Link href="/admin/pages" className="rounded-lg border border-white/30 px-4 py-2 text-sm">Edit homepage</Link><a href="/" target="_blank" className="rounded-lg border border-white/30 px-4 py-2 text-sm">View live website</a></div></section><section className="mt-6 grid grid-cols-4 gap-5">{cards.map(([label,value,href]) => <Link href={href} key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="text-sm text-neutral-500">{label}</div><div className="mt-2 text-3xl font-semibold">{value}</div></Link>)}</section><div className="mt-6 grid grid-cols-[1.3fr_.7fr] gap-6"><section className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-semibold">Quick actions</h3><div className="mt-4 grid grid-cols-2 gap-3">{[["Create new page","/admin/pages?new=1"],["Create blog post","/admin/posts?new=1"],["Upload media","/admin/media?upload=1"],["Manage menus","/admin/menus"]].map(([label,href]) => <Link href={href} key={label} className="rounded-xl border p-4 text-sm font-medium hover:border-pink-300 hover:bg-pink-50">{label}</Link>)}</div></section><section className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-semibold">Latest revisions</h3><div className="mt-4 space-y-3">{recent.length ? recent.map((item) => <div key={item.id} className="border-b pb-3 text-sm"><div className="font-medium">{item.label || "Revision"}</div><div className="text-xs text-neutral-400">{item.createdAt.toLocaleString()}</div></div>) : <p className="text-sm text-neutral-400">No revisions yet.</p>}</div></section></div></AdminShell>;
}
