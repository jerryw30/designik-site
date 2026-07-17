import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
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
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Create menu</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Build navigation with nested dropdown items.
          </p>
          <form action={createMenu} className="mt-5 space-y-3">
            <input
              name="title"
              required
              placeholder="Menu name"
              className="block w-full rounded-xl border p-3"
            />
            <button className="admin-button w-full">Create menu</button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">All menus</h2>
          <div className="mt-4 space-y-3">
            {menus.map((menu) => (
              <article
                key={menu.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"
              >
                <div>
                  <b>{menu.title}</b>
                  <p className="text-xs text-neutral-500">
                    {menu.status} ·{" "}
                    {((menu.data as { items?: unknown[] }).items || []).length}{" "}
                    items
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {menu.status !== "TRASH" ? (
                    <>
                      <Link
                        href={`/admin/menus/${menu.id}/edit`}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/menus/${menu.id}/preview`}
                        target="_blank"
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Preview
                      </Link>
                      <form action={duplicateMenu.bind(null, menu.id)}>
                        <button className="rounded-lg border px-3 py-2 text-sm">
                          Duplicate
                        </button>
                      </form>
                      <form
                        action={setMenuStatus.bind(
                          null,
                          menu.id,
                          menu.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                        )}
                      >
                        <button className="admin-button">
                          {menu.status === "PUBLISHED"
                            ? "Move to draft"
                            : "Publish to header"}
                        </button>
                      </form>
                      <form action={setMenuStatus.bind(null, menu.id, "TRASH")}>
                        <button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">
                          Trash
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <form action={setMenuStatus.bind(null, menu.id, "DRAFT")}>
                        <button className="rounded-lg border px-3 py-2 text-sm">
                          Restore
                        </button>
                      </form>
                      <form action={deleteMenuForever.bind(null, menu.id)}>
                        <button className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">
                          Delete forever
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </article>
            ))}
            {!menus.length && (
              <p className="rounded-2xl border border-dashed bg-white p-12 text-center text-neutral-500">
                No menus yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
