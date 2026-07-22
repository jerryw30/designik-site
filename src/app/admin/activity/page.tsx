import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T, wpDate } from "../theme";

export const dynamic = "force-dynamic";

const ACTION_TONES: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-700",
  published: "bg-emerald-500/10 text-emerald-700",
  updated: "bg-blue-500/10 text-blue-700",
  restored: "bg-blue-500/10 text-blue-700",
  uploaded: "bg-violet-500/10 text-violet-700",
  duplicated: "bg-violet-500/10 text-violet-700",
  unpublished: "bg-amber-500/10 text-amber-700",
  drafted: "bg-amber-500/10 text-amber-700",
  trashed: "bg-red-500/10 text-red-600",
  deleted: "bg-red-500/10 text-red-600",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "activity")) redirect("/admin");

  const moduleFilter = (await searchParams).module || "";
  const rows = await db
    .select()
    .from(activityLog)
    .where(moduleFilter ? eq(activityLog.module, moduleFilter) : undefined)
    .orderBy(desc(activityLog.createdAt))
    .limit(300);

  const modules = ["pages", "posts", "media", "menus", "forms", "leads", "chat", "users", "settings", "seo", "styles", "design", "tools"];

  return (
    <AdminShell user={user} title="Activity">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={T.screenTitle}>Activity</h2>
        <span className="text-[13px] text-neutral-400">Everything your team changes, with who and when.</span>
      </div>

      {/* module filter */}
      <ul className="mt-4 flex flex-wrap items-center gap-1.5 text-[13px]">
        <li>
          <Link href="/admin/activity" className={!moduleFilter ? T.filterActive : T.filterLink}>
            All
          </Link>
        </li>
        {modules.map((m) => (
          <li key={m} className="flex items-center gap-1.5">
            <span className="text-neutral-300">|</span>
            <Link href={`/admin/activity?module=${m}`} className={moduleFilter === m ? T.filterActive : T.filterLink}>
              <span className="capitalize">{m}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={`${T.card} mt-3`}>
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-[13px] text-neutral-400">
            No activity recorded yet — team changes will appear here from now on.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.04]">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3.5 px-5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-[11px] font-bold text-white">
                  {r.userName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-snug">
                    <span className="font-semibold">{r.userName}</span>{" "}
                    <span className={`mx-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACTION_TONES[r.action] || "bg-neutral-500/10 text-neutral-600"}`}>
                      {r.action}
                    </span>{" "}
                    <span className="capitalize text-neutral-500">{r.module.replace(/s$/, "")}</span>
                    {r.targetLabel && <span className="font-medium"> “{r.targetLabel}”</span>}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-neutral-400">
                    {r.userRole.replaceAll("_", " ").toLowerCase()} · {wpDate(r.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[11.5px] text-neutral-400">{timeAgo(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
