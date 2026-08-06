import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingCustomers, hostingOrders } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../../admin-shell";
import { T, wpDate } from "../../theme";
import { setCustomerBlocked } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomersAdmin() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "hosting")) redirect("/admin");

  const customers = await db
    .select({
      id: hostingCustomers.id,
      name: hostingCustomers.name,
      email: hostingCustomers.email,
      blocked: hostingCustomers.blocked,
      createdAt: hostingCustomers.createdAt,
      sites: sql<number>`(select count(*)::int from ${hostingOrders} where ${hostingOrders.customerId} = ${hostingCustomers.id})`,
    })
    .from(hostingCustomers)
    .orderBy(desc(hostingCustomers.createdAt));

  return (
    <AdminShell user={user} title="Hosting customers">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/hosting" className={T.mutedLink}>← Hosting orders</Link>
          <h1 className={`${T.screenTitle} mt-1`}>Customer accounts ({customers.length})</h1>
        </div>
      </div>
      <p className={`${T.help} mt-1`}>
        Accounts created on the storefront. Blocking logs the customer out everywhere,
        stops new orders, and hides nothing you&apos;ve already built — suspend their
        site in hPanel separately if needed.
      </p>

      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.theadRow}>
              <th className={T.th}>Customer</th>
              <th className={T.th}>Websites</th>
              <th className={T.th}>Joined</th>
              <th className={T.th}>Status</th>
              <th className={T.th}></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className={T.row}>
                <td className={T.td}>
                  <div className="font-medium text-[#1b1c20]">{c.name}</div>
                  <div className="text-neutral-400">{c.email}</div>
                </td>
                <td className={T.td}>{c.sites}</td>
                <td className={`${T.td} whitespace-nowrap text-neutral-400`}>{wpDate(c.createdAt)}</td>
                <td className={T.td}>
                  <span className={c.blocked ? T.pillTrash : T.pillPublished}>{c.blocked ? "BLOCKED" : "ACTIVE"}</span>
                </td>
                <td className={T.td}>
                  <form action={setCustomerBlocked.bind(null, c.id, !c.blocked)}>
                    <button className={c.blocked ? T.btnSmall : T.dangerLink}>
                      {c.blocked ? "Unblock" : "Block"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  No customer accounts yet — they appear when someone signs up on /hosting.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
