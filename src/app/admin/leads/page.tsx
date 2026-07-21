import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { deleteLead, markLeadNew, markLeadRead } from "./actions";

export const dynamic = "force-dynamic";

const SOURCE_STYLES: Record<string, string> = {
  "get-started": "bg-pink-100 text-pink-700",
  newsletter: "bg-blue-100 text-blue-700",
  contact: "bg-amber-100 text-amber-700",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string | null, email: string) {
  const src = name?.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default async function LeadsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const newCount = rows.filter((r) => r.status === "NEW").length;
  const weekCount = rows.filter(
    (r) => Date.now() - r.createdAt.getTime() < 7 * 24 * 3600 * 1000,
  ).length;

  return (
    <AdminShell user={user} title="Leads" wide>
      {/* stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Total leads", rows.length],
          ["New", newCount],
          ["This week", weekCount],
          ["Newsletter", rows.filter((r) => r.source === "newsletter").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-5">
            <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
            <p className="mt-1 text-3xl font-bold text-[#202126]">{value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-white py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-2xl">◎</span>
          <h2 className="mt-4 text-lg font-semibold">No leads yet</h2>
          <p className="mt-1 max-w-[40ch] text-sm text-neutral-500">
            Submissions from the Get Started form and the newsletter will land here the moment they arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((lead) => (
            <div
              key={lead.id}
              className={`rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md ${
                lead.status === "NEW" ? "border-pink-200 ring-1 ring-pink-100" : ""
              }`}
            >
              <div className="flex flex-wrap items-start gap-4">
                {/* avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] font-semibold text-white">
                  {initials(lead.name, lead.email)}
                </div>

                {/* identity */}
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#202126]">{lead.name || "—"}</p>
                    {lead.status === "NEW" && (
                      <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        SOURCE_STYLES[lead.source] || "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {lead.source.replace("-", " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-neutral-500">
                    <a href={`mailto:${lead.email}`} className="hover:text-pink-600">
                      {lead.email}
                    </a>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="hover:text-pink-600">
                        {lead.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* meta chips */}
                <div className="flex flex-wrap items-center gap-2">
                  {lead.service && (
                    <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                      {lead.service}
                    </span>
                  )}
                  {lead.budget && (
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {lead.budget}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">{timeAgo(lead.createdAt)}</span>
                </div>

                {/* actions */}
                <div className="flex items-center gap-2">
                  {lead.status === "NEW" ? (
                    <form action={markLeadRead}>
                      <input type="hidden" name="id" value={lead.id} />
                      <button className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50">
                        Mark read
                      </button>
                    </form>
                  ) : (
                    <form action={markLeadNew}>
                      <input type="hidden" name="id" value={lead.id} />
                      <button className="rounded-lg border px-3 py-1.5 text-xs font-medium text-neutral-400 transition hover:bg-neutral-50">
                        Mark new
                      </button>
                    </form>
                  )}
                  <form action={deleteLead}>
                    <input type="hidden" name="id" value={lead.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50">
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              {lead.message && (
                <p className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600">
                  {lead.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
