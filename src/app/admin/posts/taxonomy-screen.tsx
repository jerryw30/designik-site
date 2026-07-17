import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { createTaxonomy, deleteTaxonomy } from "./actions";

export async function TaxonomyScreen({
  kind,
}: {
  kind: "categories" | "tags";
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
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
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Add {label.toLowerCase()}</h2>
          <form
            action={createTaxonomy.bind(null, kind)}
            className="mt-5 space-y-3"
          >
            <label className="block text-sm">
              Name
              <input
                name="title"
                required
                className="mt-1.5 block w-full rounded-xl border px-4 py-3"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                name="description"
                className="mt-1.5 block min-h-24 w-full rounded-xl border p-3"
              />
            </label>
            <button className="admin-button w-full">
              Add {label.toLowerCase()}
            </button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">All {kind}</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b p-4 last:border-0"
              >
                <div>
                  <strong>{item.title}</strong>
                  <p className="text-xs text-neutral-500">/{item.slug}</p>
                </div>
                <form action={deleteTaxonomy.bind(null, kind, item.id)}>
                  <button className="text-sm text-red-600">Delete</button>
                </form>
              </div>
            ))}
            {!items.length && (
              <p className="p-10 text-center text-neutral-500">
                No {kind} yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
