import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages, revisions } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
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
        <p className="mb-4 rounded-xl bg-emerald-100 p-4 text-emerald-800">
          Revision restored. A safety backup was created first.
        </p>
      )}
      <div className="mb-5">
        <h2 className="text-2xl font-semibold">Revision history</h2>
        <p className="text-sm text-neutral-500">
          Restore published page or section states safely.
        </p>
      </div>
      <div className="space-y-3">
        {list.map((item) => {
          const snapshot = item.snapshot as {
            sectionId?: string;
            content?: unknown;
          };
          const type = snapshot.sectionId ? "Section" : "Page";
          return (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"
            >
              <div>
                <b>{item.label || `${type} revision`}</b>
                <p className="text-sm text-neutral-500">
                  {item.pageTitle || "Deleted page"} · {type} ·{" "}
                  {item.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/revisions/${item.id}`}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  View details
                </Link>
                {item.pageTitle && (
                  <form action={restoreRevision.bind(null, item.id)}>
                    <button className="admin-button">Restore</button>
                  </form>
                )}
                <form action={deleteRevision.bind(null, item.id)}>
                  <button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">
                    Delete
                  </button>
                </form>
              </div>
            </article>
          );
        })}
        {!list.length && (
          <p className="rounded-2xl border border-dashed bg-white p-12 text-center text-neutral-500">
            No revisions recorded yet.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
