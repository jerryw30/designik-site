import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages, revisions } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { T, wpDate } from "../theme";
import { deleteRevision, restoreRevision } from "./actions";
export default async function RevisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const params = await searchParams;
  const list = await db
    .select({
      id: revisions.id,
      label: revisions.label,
      pageId: revisions.pageId,
      pageTitle: pages.title,
      snapshot: revisions.snapshot,
      createdAt: revisions.createdAt,
    })
    .from(revisions)
    .leftJoin(pages, eq(revisions.pageId, pages.id))
    .orderBy(desc(revisions.createdAt))
    .limit(200);
  return (
    <AdminShell user={user} title="Revisions">
      {params.restored && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          Revision restored. A safety backup was created first.
        </div>
      )}
      <div className="mb-3">
        <h2 className={T.screenTitle}>Revision history</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Restore published page or section states safely.
        </p>
      </div>
      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.theadRow}>
              <th className={T.th}>Revision</th>
              <th className={`${T.th} hidden md:table-cell`}>Page</th>
              <th className={`${T.th} hidden sm:table-cell`}>Type</th>
              <th className={T.th}>Date</th>
              <th className={`${T.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const snapshot = item.snapshot as {
                sectionId?: string;
                content?: unknown;
              };
              const type = snapshot.sectionId ? "Section" : "Page";
              return (
                <tr key={item.id} className={T.row}>
                  <td className={T.td}>
                    <Link
                      href={`/admin/revisions/${item.id}`}
                      className={T.rowTitle}
                    >
                      {item.label || `${type} revision`}
                    </Link>
                    <div className={T.rowActions}>
                      <Link
                        href={`/admin/revisions/${item.id}`}
                        className={T.link}
                      >
                        View details
                      </Link>
                    </div>
                  </td>
                  <td
                    className={`${T.td} hidden text-neutral-600 md:table-cell`}
                  >
                    {item.pageTitle || "Deleted page"}
                  </td>
                  <td className={`${T.td} hidden sm:table-cell`}>
                    <span className={T.pillNeutral}>{type}</span>
                  </td>
                  <td className={`${T.td} whitespace-nowrap text-neutral-500`}>
                    {wpDate(item.createdAt)}
                  </td>
                  <td className={T.td}>
                    <div className="flex flex-wrap justify-end gap-2">
                      {item.pageTitle && (
                        <form action={restoreRevision.bind(null, item.id)}>
                          <button className={T.btn}>Restore</button>
                        </form>
                      )}
                      <form action={deleteRevision.bind(null, item.id)}>
                        <button className={T.btnDanger}>Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-14 text-center text-[13px] text-neutral-400"
                >
                  No revisions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
