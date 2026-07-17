import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import Link from "next/link";
import { designLabels, type DesignModule } from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { AdminShell } from "./admin-shell";
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">
            {trash ? `${meta.title} trash` : meta.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{meta.description}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={trash ? `/admin/${module}` : `/admin/${module}?trash=1`}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium"
          >
            {trash ? "Back" : "Trash"}
          </Link>
        </div>
      </div>
      {!trash && (
        <form
          action={createDesign}
          className="mb-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-[1fr_auto]"
        >
          <input type="hidden" name="module" value={module} />
          <input
            name="title"
            required
            placeholder={`New ${meta.singular} name`}
            className="admin-input"
          />
          <button className="admin-button">Create {meta.singular}</button>
        </form>
      )}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-[1fr_130px_190px] gap-4 border-b bg-neutral-50 px-5 py-3 text-xs font-semibold uppercase text-neutral-500">
          <span>Name</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid items-center gap-4 border-b px-5 py-4 last:border-0 md:grid-cols-[1fr_130px_190px]"
            >
              <div>
                <Link
                  href={`/admin/${module}/${item.id}/edit`}
                  className="font-semibold hover:text-pink-600"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-neutral-400">
                  Updated {item.updatedAt.toLocaleString()}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {item.status}
              </span>
              <div className="flex flex-wrap gap-2">
                {trash ? (
                  <>
                    <form action={restoreDesign}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="module" value={module} />
                      <button className="rounded-lg border px-3 py-2 text-xs">
                        Restore
                      </button>
                    </form>
                    <form action={deleteDesignPermanently}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="module" value={module} />
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">
                        Delete
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/admin/${module}/${item.id}/edit`}
                      className="rounded-lg border px-3 py-2 text-xs"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/${module}/${item.id}/preview`}
                      target="_blank"
                      className="rounded-lg border px-3 py-2 text-xs"
                    >
                      Preview
                    </Link>
                    <form action={duplicateDesign}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="module" value={module} />
                      <button className="rounded-lg border px-3 py-2 text-xs">
                        Duplicate
                      </button>
                    </form>
                    <form action={trashDesign}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="module" value={module} />
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">
                        Trash
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-14 text-center text-neutral-500">
            {trash ? "Trash is empty." : `No ${meta.title.toLowerCase()} yet.`}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
