import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import Link from "next/link";
import { designLabels, type DesignModule } from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { AdminShell } from "./admin-shell";
import { T, statusPill, wpDate } from "./theme";
import {
  createDesign,
  deleteDesignPermanently,
  duplicateDesign,
  restoreDesign,
  trashDesign,
} from "./design-actions";

export async function DesignList({
  module,
  user,
  trash,
}: {
  module: DesignModule;
  user: { name: string; role: string };
  trash: boolean;
}) {
  const meta = designLabels[module];
  const items = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, module),
        trash
          ? isNotNull(adminResources.deletedAt)
          : isNull(adminResources.deletedAt),
      ),
    )
    .orderBy(desc(adminResources.updatedAt));
  return (
    <AdminShell user={user} title={meta.title}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={T.screenTitle}>
            {trash ? `${meta.title} — Trash` : meta.title}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {meta.description}
          </p>
        </div>
        <Link
          href={trash ? `/admin/${module}` : `/admin/${module}?trash=1`}
          className={T.btn}
        >
          {trash ? "Back" : "Trash"}
        </Link>
      </div>
      {!trash && (
        <form
          action={createDesign}
          className={`${T.cardPad} grid gap-3 md:grid-cols-[1fr_auto]`}
        >
          <input type="hidden" name="module" value={module} />
          <input
            name="title"
            required
            placeholder={`New ${meta.singular} name`}
            className={T.input}
          />
          <button className={T.btnPrimary}>Create {meta.singular}</button>
        </form>
      )}
      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.theadRow}>
              <th className={T.th}>Name</th>
              <th className={`${T.th} w-32`}>Status</th>
              <th className={`${T.th} w-44`}>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id} className={T.row}>
                  <td className={T.td}>
                    <Link
                      href={`/admin/${module}/${item.id}/edit`}
                      className={T.rowTitle}
                    >
                      {item.title}
                    </Link>
                    <div className={T.rowActions}>
                      {trash ? (
                        <>
                          <form action={restoreDesign} className="inline">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              type="hidden"
                              name="module"
                              value={module}
                            />
                            <button className={T.link}>Restore</button>
                          </form>
                          <span className={T.dot}>|</span>
                          <form
                            action={deleteDesignPermanently}
                            className="inline"
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              type="hidden"
                              name="module"
                              value={module}
                            />
                            <button className={T.dangerLink}>
                              Delete Permanently
                            </button>
                          </form>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/admin/${module}/${item.id}/edit`}
                            className={T.link}
                          >
                            Edit
                          </Link>
                          <span className={T.dot}>|</span>
                          <Link
                            href={`/admin/${module}/${item.id}/preview`}
                            target="_blank"
                            className={T.link}
                          >
                            Preview
                          </Link>
                          <span className={T.dot}>|</span>
                          <form action={duplicateDesign} className="inline">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              type="hidden"
                              name="module"
                              value={module}
                            />
                            <button className={T.link}>Duplicate</button>
                          </form>
                          <span className={T.dot}>|</span>
                          <form action={trashDesign} className="inline">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              type="hidden"
                              name="module"
                              value={module}
                            />
                            <button className={T.dangerLink}>Trash</button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                  <td className={T.td}>
                    <span className={statusPill(item.status)}>
                      {item.status}
                    </span>
                  </td>
                  <td
                    className={`${T.td} whitespace-nowrap text-neutral-500`}
                  >
                    Last Modified
                    <br />
                    {wpDate(item.updatedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-14 text-center text-[13px] text-neutral-400"
                >
                  {trash
                    ? "Trash is empty."
                    : `No ${meta.title.toLowerCase()} yet.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
