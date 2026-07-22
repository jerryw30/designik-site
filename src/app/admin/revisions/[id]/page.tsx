import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { pages, revisions, sections } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../admin-shell";
import { T, wpDate } from "../../theme";
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className={T.screenTitle}>{revision.label || "Revision"}</h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {page?.title || "Deleted page"} <span className={T.dot}>·</span>{" "}
            {wpDate(revision.createdAt)}
          </p>
        </div>
        {page && (
          <form action={restoreRevision.bind(null, revision.id)}>
            <button className={T.btnPrimary}>Restore this revision</button>
          </form>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`min-w-0 ${T.card}`}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold text-[#1b1c20]">
              Saved revision
            </h3>
          </div>
          <div className="p-5">
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg bg-[#16171c] p-4 font-mono text-xs leading-relaxed text-emerald-300">
              {pretty(snapshot.content ?? snapshot)}
            </pre>
          </div>
        </section>
        <section className={`min-w-0 ${T.card}`}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold text-[#1b1c20]">
              Current published state
            </h3>
          </div>
          <div className="p-5">
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg bg-[#16171c] p-4 font-mono text-xs leading-relaxed text-sky-300">
              {pretty(current)}
            </pre>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
