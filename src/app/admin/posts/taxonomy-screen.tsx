import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
import { createTaxonomy, deleteTaxonomy } from "./actions";

export async function TaxonomyScreen({
  kind,
}: {
  kind: "categories" | "tags";
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "posts")) redirect("/admin");
  const items = await db
    .select()
    .from(adminResources)
    .where(eq(adminResources.module, kind))
    .orderBy(desc(adminResources.updatedAt));
  const label = kind === "categories" ? "Category" : "Tag";
  return (
    <AdminShell
      user={user}
      title={kind === "categories" ? "Categories" : "Tags"}
    >
      <div className="mb-6">
        <h2 className={T.screenTitle}>
          {kind === "categories" ? "Categories" : "Tags"}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Organize your posts with {kind}.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h2 className="text-[15px] font-semibold text-[#1b1c20]">
              Add {label.toLowerCase()}
            </h2>
          </div>
          <form
            action={createTaxonomy.bind(null, kind)}
            className="space-y-4 p-5"
          >
            <label className="block">
              <span className={T.label}>Name</span>
              <input name="title" required className={T.input} />
              <p className={T.help}>
                The name is how it appears on your site.
              </p>
            </label>
            <label className="block">
              <span className={T.label}>Description</span>
              <textarea
                name="description"
                className={`${T.input} min-h-24`}
              />
              <p className={T.help}>
                Optional — shown where the theme supports it.
              </p>
            </label>
            <button className={`${T.btnPrimary} w-full`}>
              Add {label.toLowerCase()}
            </button>
          </form>
        </section>
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold text-[#1b1c20]">
              All {kind}
            </h2>
            <span className="text-[12.5px] text-neutral-400">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className={T.tableWrap}>
            <table className={T.table}>
              <thead>
                <tr className={T.theadRow}>
                  <th className={T.th}>Name</th>
                  <th className={`${T.th} w-48`}>Slug</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={T.row}>
                    <td className={T.td}>
                      <span className="text-[14px] font-semibold text-[#1b1c20]">
                        {item.title}
                      </span>
                      <div className={T.rowActions}>
                        <form action={deleteTaxonomy.bind(null, kind, item.id)}>
                          <button className={T.dangerLink}>Delete</button>
                        </form>
                      </div>
                    </td>
                    <td className={`${T.td} text-neutral-500`}>{item.slug}</td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-14 text-center text-[13px] text-neutral-400"
                    >
                      No {kind} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
