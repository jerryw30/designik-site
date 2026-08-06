import { desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingOrders, hostingPlans } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { formatUsd } from "@/lib/hosting";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T, wpDate } from "../theme";

export const dynamic = "force-dynamic";

function orderPill(status: string, blocked: boolean) {
  if (blocked) return T.pillTrash;
  if (status === "ACTIVE") return T.pillPublished;
  if (status === "PENDING") return T.pillNew;
  if (status === "PROVISIONING") return T.pillDraft;
  return T.pillNeutral;
}

export default async function HostingAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "hosting")) redirect("/admin");

  const filter = String((await searchParams).status || "all");
  const [orders, plans] = await Promise.all([
    db.select().from(hostingOrders).orderBy(desc(hostingOrders.createdAt)),
    db.select().from(hostingPlans),
  ]);
  const shown =
    filter === "all"
      ? orders
      : filter === "blocked"
        ? orders.filter((o) => o.blocked)
        : orders.filter((o) => o.status === filter && !o.blocked);

  const stats = [
    ["Awaiting setup", orders.filter((o) => o.status === "PENDING" && !o.blocked).length],
    ["Active sites", orders.filter((o) => o.status === "ACTIVE" && !o.blocked).length],
    ["Blocked", orders.filter((o) => o.blocked).length],
    ["Monthly revenue", formatUsd(orders.filter((o) => o.status === "ACTIVE" && !o.blocked).reduce((s, o) => s + o.planPrice, 0))],
  ] as const;

  return (
    <AdminShell user={user} title="Hosting" wide>
      <div className="flex items-center justify-between">
        <h1 className={T.screenTitle}>Hosting orders</h1>
        <div className="flex gap-2">
          <Link href="/admin/hosting/customers" className={T.btn}>Customers</Link>
          <Link href="/hosting" target="_blank" className={T.btn}>View storefront ↗</Link>
          <Link href="/admin/hosting/plans" className={T.btnPrimary}>Manage plans ({plans.length})</Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className={T.cardPad}>
            <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
            <p className="mt-1 text-[24px] font-semibold text-[#1b1c20]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
        {[
          ["all", "All"],
          ["PENDING", "Awaiting setup"],
          ["PROVISIONING", "Provisioning"],
          ["ACTIVE", "Active"],
          ["CANCELLED", "Cancelled"],
          ["blocked", "Blocked"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={key === "all" ? "/admin/hosting" : `/admin/hosting?status=${key}`}
            className={filter === key ? T.filterActive : T.filterLink}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.theadRow}>
              <th className={T.th}>Order</th>
              <th className={T.th}>Customer</th>
              <th className={T.th}>Website</th>
              <th className={T.th}>Plan</th>
              <th className={T.th}>Paid</th>
              <th className={T.th}>Status</th>
              <th className={T.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id} className={T.row}>
                <td className={T.td}>
                  <Link href={`/admin/hosting/${o.id}`} className={T.rowTitle}>{o.orderRef}</Link>
                  {(o.paymentStatus === "TEST_PAID" || o.paymentStatus === "FREE") && (
                    <span className="ml-2 inline-flex rounded bg-amber-500/10 px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-amber-700">Free</span>
                  )}
                </td>
                <td className={T.td}>
                  <div className="font-medium text-[#1b1c20]">{o.customerName}</div>
                  <div className="text-neutral-400">{o.customerEmail}</div>
                </td>
                <td className={T.td}>
                  <span className="font-medium">{o.domainName}</span>
                  <div className="text-[12px] text-neutral-400">
                    {o.domainType === "temp" ? "free subdomain" : o.domainType === "new" ? "registered via us" : "customer's domain"}
                  </div>
                </td>
                <td className={T.td}>
                  {o.planName}
                  <div className="text-[12px] text-neutral-400">
                    {o.storageGbOverride
                      ? `${o.storageGbOverride} GB (custom)`
                      : `${plans.find((p) => p.id === o.planId)?.storageGb ?? "—"} GB`}
                  </div>
                </td>
                <td className={T.td}>{formatUsd(o.totalPaid)}</td>
                <td className={T.td}>
                  <span className={orderPill(o.status, o.blocked)}>{o.blocked ? "BLOCKED" : o.status}</span>
                </td>
                <td className={`${T.td} whitespace-nowrap text-neutral-400`}>{wpDate(o.createdAt)}</td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                  No orders here yet. New orders from /hosting appear in this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
