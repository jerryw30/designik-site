import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T, wpDate } from "../theme";
import { deleteLead, markLeadNew, markLeadRead } from "./actions";

export const dynamic = "force-dynamic";

const SOURCE_STYLES: Record<string, string> = {
  "get-started": "bg-[#a10140]/10 text-[#a10140]",
  newsletter: "bg-sky-500/10 text-sky-700",
  contact: "bg-amber-500/10 text-amber-700",
};

function initials(name: string | null, email: string) {
  const src = name?.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "leads")) redirect("/admin");

  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const source = typeof query.source === "string" ? query.source : "all";

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const newCount = rows.filter((r) => r.status === "NEW").length;
  // This is a force-dynamic server component, so reading the clock per
  // request is intentional (the "this week" stat must use the current time).
  // eslint-disable-next-line react-hooks/purity
  const weekCutoff = Date.now() - 7 * 24 * 3600 * 1000;
  const weekCount = rows.filter(
    (r) => r.createdAt.getTime() > weekCutoff,
  ).length;
  const needle = search.toLowerCase();
  const visible = rows.filter((lead) => {
    if (source !== "all" && lead.source !== source) return false;
    if (!needle) return true;
    return [lead.name, lead.email, lead.phone, lead.service, lead.message]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const filtering = Boolean(needle) || source !== "all";

  return (
    <AdminShell user={user} title="Leads" wide>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={T.screenTitle}>Leads</h2>
        {newCount > 0 && <span className={T.pillNew}>{newCount} new</span>}
      </div>

      {/* stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Total leads", rows.length],
          ["New", newCount],
          ["This week", weekCount],
          ["Newsletter", rows.filter((r) => r.source === "newsletter").length],
        ].map(([label, value]) => (
          <div key={label} className={T.cardPad}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
              {label}
            </p>
            <p className="mt-1.5 text-[26px] font-semibold leading-none text-[#1b1c20]">{value}</p>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <form
          className={`${T.card} mt-4 grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_190px_auto]`}
        >
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name, email, phone, or message…"
            className={T.input}
          />
          <select name="source" defaultValue={source} className={T.select}>
            <option value="all">All sources</option>
            <option value="get-started">Get started</option>
            <option value="contact">Contact</option>
            <option value="newsletter">Newsletter</option>
          </select>
          <button className={T.btn}>Filter</button>
        </form>
      )}

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-neutral-300 bg-white py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#a10140]/10 text-2xl text-[#a10140]">
            ◎
          </span>
          <h2 className="mt-4 text-[16px] font-semibold text-[#1b1c20]">No leads yet</h2>
          <p className="mt-1 max-w-[40ch] text-[13px] text-neutral-500">
            Submissions from the Get Started form and the newsletter will land here the moment they
            arrive.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-[13px] text-neutral-500">
          No leads match this {filtering ? "filter" : "view"}.{" "}
          <Link href="/admin/leads" className={T.link}>
            Clear filters
          </Link>
        </div>
      ) : (
        <div className={T.tableWrap}>
          <table className={T.table}>
            <thead>
              <tr className={T.theadRow}>
                <th className={T.th}>Lead</th>
                <th className={T.th}>Source</th>
                <th className={T.th}>Service</th>
                <th className={T.th}>Budget</th>
                <th className={T.th}>Status</th>
                <th className={T.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => (
                <tr key={lead.id} className={T.row}>
                  <td className={T.td}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#c81a5e] text-[12px] font-semibold text-white">
                        {initials(lead.name, lead.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#1b1c20]">
                          {lead.name || "—"}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-neutral-500">
                          <a href={`mailto:${lead.email}`} className="hover:text-[#a10140]">
                            {lead.email}
                          </a>
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="hover:text-[#a10140]">
                              {lead.phone}
                            </a>
                          )}
                        </div>
                        {lead.message && (
                          <p className="mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-neutral-500 line-clamp-2">
                            {lead.message}
                          </p>
                        )}
                        <div className={T.rowActions}>
                          {lead.status === "NEW" ? (
                            <form action={markLeadRead}>
                              <input type="hidden" name="id" value={lead.id} />
                              <button className={T.link}>Mark read</button>
                            </form>
                          ) : (
                            <form action={markLeadNew}>
                              <input type="hidden" name="id" value={lead.id} />
                              <button className={T.link}>Mark new</button>
                            </form>
                          )}
                          <span className={T.dot}>·</span>
                          <form action={deleteLead}>
                            <input type="hidden" name="id" value={lead.id} />
                            <button className={T.dangerLink}>Delete</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={T.td}>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold capitalize ${
                        SOURCE_STYLES[lead.source] || "bg-neutral-500/10 text-neutral-600"
                      }`}
                    >
                      {lead.source.replace("-", " ")}
                    </span>
                  </td>
                  <td className={`${T.td} text-neutral-600`}>
                    {lead.service || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className={`${T.td} text-neutral-600`}>
                    {lead.budget || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className={T.td}>
                    {lead.status === "NEW" ? (
                      <span className={T.pillNew}>New</span>
                    ) : (
                      <span className={T.pillNeutral}>Read</span>
                    )}
                  </td>
                  <td className={`${T.td} whitespace-nowrap text-neutral-500`}>
                    {wpDate(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
