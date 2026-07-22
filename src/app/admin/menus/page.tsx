import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { statusPill, T, wpDate } from "../theme";
import {
  createMenu,
  deleteMenuForever,
  duplicateMenu,
  setMenuStatus,
} from "./actions";
export default async function MenusPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const menus = await db
    .select()
    .from(adminResources)
    .where(eq(adminResources.module, "menus"))
    .orderBy(desc(adminResources.updatedAt));
  return (
    <AdminShell user={user} title="Menus">
      <div className="mb-6">
        <h2 className={T.screenTitle}>Menus</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Build navigation with nested dropdown items.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[14px] font-semibold text-[#1b1c20]">
              Create menu
            </h3>
          </div>
          <div className="px-5 py-5">
            <form action={createMenu} className="space-y-3">
              <label className="block">
                <span className={T.label}>Menu name</span>
                <input
                  name="title"
                  required
                  placeholder="Menu name"
                  className={T.input}
                />
              </label>
              <button className={`${T.btnPrimary} w-full`}>Create menu</button>
            </form>
          </div>
        </section>
        <section>
          {menus.length ? (
            <div className={`${T.tableWrap} mt-0`}>
              <table className={T.table}>
                <thead>
                  <tr className={T.theadRow}>
                    <th className={T.th}>Name</th>
                    <th className={T.th}>Status</th>
                    <th className={T.th}>Items</th>
                    <th className={T.th}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((menu) => (
                    <tr key={menu.id} className={T.row}>
                      <td className={T.td}>
                        {menu.status !== "TRASH" ? (
                          <Link
                            href={`/admin/menus/${menu.id}/edit`}
                            className={T.rowTitle}
                          >
                            {menu.title}
                          </Link>
                        ) : (
                          <span className="text-[14px] font-semibold text-neutral-500">
                            {menu.title}
                          </span>
                        )}
                        <div className={T.rowActions}>
                          {menu.status !== "TRASH" ? (
                            <>
                              <Link
                                href={`/admin/menus/${menu.id}/edit`}
                                className={T.link}
                              >
                                Edit
                              </Link>
                              <span className={T.dot}>·</span>
                              <Link
                                href={`/admin/menus/${menu.id}/preview`}
                                target="_blank"
                                className={T.link}
                              >
                                Preview
                              </Link>
                              <span className={T.dot}>·</span>
                              <form
                                action={duplicateMenu.bind(null, menu.id)}
                                className="inline"
                              >
                                <button className={T.link}>Duplicate</button>
                              </form>
                              <span className={T.dot}>·</span>
                              <form
                                action={setMenuStatus.bind(
                                  null,
                                  menu.id,
                                  menu.status === "PUBLISHED"
                                    ? "DRAFT"
                                    : "PUBLISHED",
                                )}
                                className="inline"
                              >
                                <button className={T.link}>
                                  {menu.status === "PUBLISHED"
                                    ? "Move to draft"
                                    : "Publish to header"}
                                </button>
                              </form>
                              <span className={T.dot}>·</span>
                              <form
                                action={setMenuStatus.bind(
                                  null,
                                  menu.id,
                                  "TRASH",
                                )}
                                className="inline"
                              >
                                <button className={T.dangerLink}>Trash</button>
                              </form>
                            </>
                          ) : (
                            <>
                              <form
                                action={setMenuStatus.bind(
                                  null,
                                  menu.id,
                                  "DRAFT",
                                )}
                                className="inline"
                              >
                                <button className={T.link}>Restore</button>
                              </form>
                              <span className={T.dot}>·</span>
                              <form
                                action={deleteMenuForever.bind(null, menu.id)}
                                className="inline"
                              >
                                <button className={T.dangerLink}>
                                  Delete forever
                                </button>
                              </form>
                            </>
                          )}
                        </div>
                      </td>
                      <td className={T.td}>
                        <span className={statusPill(menu.status)}>
                          {menu.status}
                        </span>
                      </td>
                      <td className={`${T.td} text-neutral-600`}>
                        {
                          ((menu.data as { items?: unknown[] }).items || [])
                            .length
                        }
                      </td>
                      <td className={`${T.td} whitespace-nowrap text-neutral-500`}>
                        {wpDate(menu.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-[13px] text-neutral-500">
              No menus yet.
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
