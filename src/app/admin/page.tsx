import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { activityLog, adminResources, chatConversations, leads, mediaAssets, pages, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { ensureHomepage } from "./actions";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STAT_STYLES: Record<string, { bg: string; fg: string }> = {
  Pages: { bg: "bg-[#a10140]/10", fg: "text-[#a10140]" },
  Posts: { bg: "bg-blue-500/10", fg: "text-blue-600" },
  Media: { bg: "bg-violet-500/10", fg: "text-violet-600" },
  Leads: { bg: "bg-emerald-500/10", fg: "text-emerald-600" },
  Chats: { bg: "bg-amber-500/10", fg: "text-amber-600" },
  Users: { bg: "bg-cyan-500/10", fg: "text-cyan-600" },
};

const STAT_ICONS: Record<string, string> = {
  Pages: "M6 2h9l5 5v15H6z M14 2v6h6",
  Posts: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  Media: "M3 5h18v14H3z M3 15l5-5 4 4 3-3 6 6",
  Leads: "M12 12a4 4 0 1 0-.01 0 M4 21a8 8 0 0 1 16 0",
  Chats: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12",
  Users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
};

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  await ensureHomepage();

  // Only surface data this role could open from the sidebar — lead details
  // and the audit trail must not leak to e.g. viewers or content editors.
  const canLeads = canViewArea(user.role, "leads");
  const canActivity = canViewArea(user.role, "activity");

  const [
    [allPages],
    [published],
    [drafts],
    [postCount],
    [mediaCount],
    [leadCount],
    [newLeads],
    [chatCount],
    [userCount],
    recentLeads,
    recentActivity,
  ] = await Promise.all([
    db.select({ value: count() }).from(pages).where(isNull(pages.deletedAt)),
    db.select({ value: count() }).from(pages).where(eq(pages.status, "PUBLISHED")),
    db.select({ value: count() }).from(pages).where(eq(pages.status, "DRAFT")),
    db.select({ value: count() }).from(adminResources).where(and(eq(adminResources.module, "posts"), isNull(adminResources.deletedAt))),
    db.select({ value: count() }).from(mediaAssets).where(isNull(mediaAssets.deletedAt)),
    db.select({ value: count() }).from(leads),
    db.select({ value: count() }).from(leads).where(eq(leads.status, "NEW")),
    db.select({ value: count() }).from(chatConversations),
    db.select({ value: count() }).from(users),
    canLeads
      ? db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6)
      : Promise.resolve([]),
    canActivity
      ? db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(6)
      : Promise.resolve([]),
  ]);

  const stats = [
    { label: "Pages", value: allPages.value, sub: `${published.value} published · ${drafts.value} drafts`, href: "/admin/pages" },
    { label: "Posts", value: postCount.value, sub: "blog content", href: "/admin/posts" },
    { label: "Media", value: mediaCount.value, sub: "library assets", href: "/admin/media" },
    { label: "Leads", value: leadCount.value, sub: `${newLeads.value} new`, href: "/admin/leads", alert: newLeads.value > 0 },
    { label: "Chats", value: chatCount.value, sub: "conversations", href: "/admin/chat" },
    { label: "Users", value: userCount.value, sub: "team accounts", href: "/admin/users" },
  ].filter((s) => canViewArea(user.role, s.href.split("/")[2] || ""));

  const quickActions = [
    { label: "Create new page", href: "/admin/pages?new=1", icon: "M12 5v14 M5 12h14" },
    { label: "Write a post", href: "/admin/posts?new=1", icon: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
    { label: "Upload media", href: "/admin/media", icon: "M12 16V4 M6 10l6-6 6 6 M4 20h16" },
    { label: "Edit navigation", href: "/admin/menus", icon: "M4 6h16 M4 12h16 M4 18h16" },
    { label: "Site settings", href: "/admin/settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" },
    { label: "SEO settings", href: "/admin/seo", icon: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16 M21 21l-4.3-4.3" },
  ].filter((a) => canViewArea(user.role, a.href.split("/")[2].split("?")[0]));

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <AdminShell user={user} title="Dashboard">
      {/* welcome hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3d0119] via-[#7c0134] to-[#c81a5e] p-7 text-white sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 h-64 w-64 bg-white opacity-[0.06]"
          style={{
            WebkitMaskImage: "url(/figma/vector1.svg)",
            maskImage: "url(/figma/vector1.svg)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/60">{today}</p>
        <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Welcome back, {user.name.split(" ")[0]} 👋</h2>
        <p className="mt-1.5 max-w-xl text-[14px] text-white/70">
          Everything about the Designik website — content, design, leads and conversations — is managed from here.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/admin/pages" className="rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#a10140] transition hover:scale-[1.03]">
            Manage pages
          </Link>
          {canLeads && (
            <Link href="/admin/leads" className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-[13px] font-medium backdrop-blur transition hover:bg-white/20">
              Review leads {newLeads.value > 0 && <span className="ml-1 rounded-full bg-[#ff2e73] px-1.5 py-0.5 text-[10px] font-bold">{newLeads.value}</span>}
            </Link>
          )}
          <a href="/" target="_blank" className="rounded-full border border-white/25 px-5 py-2 text-[13px] font-medium transition hover:bg-white/10">
            View live site ↗
          </a>
        </div>
      </section>

      {/* stat cards */}
      <section className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const st = STAT_STYLES[s.label];
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-2xl border border-black/[0.05] bg-white p-4 shadow-[0_1px_3px_rgba(16,17,22,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(16,17,22,0.09)]"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${st.bg} ${st.fg}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
                  {STAT_ICONS[s.label].split(" M").map((p, i) => (
                    <path key={i} d={(i === 0 ? "" : "M") + p} />
                  ))}
                </svg>
              </div>
              <div className="mt-3 text-[26px] font-semibold leading-none">{s.value}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-neutral-500">
                {s.label}
                {"alert" in s && s.alert ? <span className="h-1.5 w-1.5 rounded-full bg-[#ff2e73]" /> : null}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-neutral-400">{s.sub}</div>
            </Link>
          );
        })}
      </section>

      <div className={`mt-5 grid gap-5 ${canLeads ? "xl:grid-cols-[1.15fr_0.85fr]" : ""}`}>
        {/* recent leads */}
        {canLeads && (
        <section className="rounded-2xl border border-black/[0.05] bg-white shadow-[0_1px_3px_rgba(16,17,22,0.05)]">
          <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-4">
            <h3 className="text-[15px] font-semibold">Recent leads</h3>
            <Link href="/admin/leads" className="text-[13px] font-medium text-[#a10140] hover:underline">
              View all →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No leads yet — they appear here when the contact or Get Started form is submitted.</p>
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center gap-3.5 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-[11px] font-bold text-white">
                    {(l.name || l.email).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{l.name || l.email}</p>
                    <p className="truncate text-[12px] text-neutral-400">
                      {l.service || l.source}
                      {l.budget ? ` · ${l.budget}` : ""}
                    </p>
                  </div>
                  {l.status === "NEW" && <span className="rounded-full bg-[#ff2e73]/10 px-2 py-0.5 text-[10.5px] font-bold text-[#d61860]">NEW</span>}
                  <span className="shrink-0 text-[11.5px] text-neutral-400">{timeAgo(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        <div className="space-y-5">
          {/* quick actions */}
          <section className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-[0_1px_3px_rgba(16,17,22,0.05)]">
            <h3 className="text-[15px] font-semibold">Quick actions</h3>
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-black/[0.06] p-3.5 transition hover:border-[#a10140]/30 hover:bg-[#a10140]/[0.03]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition group-hover:bg-[#a10140]/10 group-hover:text-[#a10140]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                      {a.icon.split(" M").map((p, i) => (
                        <path key={i} d={(i === 0 ? "" : "M") + p} />
                      ))}
                    </svg>
                  </span>
                  <span className="text-[12.5px] font-medium leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* activity */}
          {canActivity && (
          <section className="rounded-2xl border border-black/[0.05] bg-white shadow-[0_1px_3px_rgba(16,17,22,0.05)]">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-4">
              <h3 className="text-[15px] font-semibold">Recent activity</h3>
              <Link href="/admin/activity" className="text-[13px] font-medium text-[#a10140] hover:underline">
                All activity →
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-neutral-400">No activity recorded yet — team changes appear here.</p>
            ) : (
              <ul className="px-5 py-3">
                {recentActivity.map((r, i) => (
                  <li key={r.id} className="relative flex gap-3.5 pb-4 last:pb-1">
                    {i < recentActivity.length - 1 && <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-neutral-200" />}
                    <span className="mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-[#a10140] bg-white" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px]">
                        <span className="font-semibold">{r.userName}</span>{" "}
                        <span className="text-neutral-500">{r.action}</span>{" "}
                        <span className="capitalize text-neutral-500">{r.module.replace(/s$/, "")}</span>
                        {r.targetLabel && <span className="font-medium"> “{r.targetLabel}”</span>}
                      </p>
                      <p className="text-[11.5px] text-neutral-400">{timeAgo(r.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
