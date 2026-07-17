import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { pages, revisions, sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../admin-shell";
import { restoreRevision } from "../actions";
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
export default async function RevisionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const [revision] = await db
    .select()
    .from(revisions)
    .where(eq(revisions.id, id))
    .limit(1);
  if (!revision) notFound();
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, revision.pageId))
    .limit(1);
  const snapshot = revision.snapshot as {
    sectionId?: string;
    content?: unknown;
  };
  let current: unknown = page;
  if (snapshot.sectionId) {
    const [section] = await db
      .select()
      .from(sections)
      .where(
        and(
          eq(sections.id, snapshot.sectionId),
          eq(sections.pageId, revision.pageId),
        ),
      )
      .limit(1);
    current = section?.publishedContent;
  }
  return (
    <AdminShell user={user} title="Revision details">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {revision.label || "Revision"}
          </h2>
          <p className="text-sm text-neutral-500">
            {page?.title || "Deleted page"} ·{" "}
            {revision.createdAt.toLocaleString()}
          </p>
        </div>
        {page && (
          <form action={restoreRevision.bind(null, revision.id)}>
            <button className="admin-button">Restore this revision</button>
          </form>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border bg-white p-5">
          <h3 className="mb-3 font-semibold">Saved revision</h3>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-950 p-4 text-xs text-emerald-300">
            {pretty(snapshot.content ?? snapshot)}
          </pre>
        </section>
        <section className="min-w-0 rounded-2xl border bg-white p-5">
          <h3 className="mb-3 font-semibold">Current published state</h3>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-950 p-4 text-xs text-sky-300">
            {pretty(current)}
          </pre>
        </section>
      </div>
    </AdminShell>
  );
}
