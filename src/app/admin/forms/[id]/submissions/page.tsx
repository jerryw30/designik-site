import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, formSubmissions } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../../admin-shell";
import { deleteSubmission, setSubmissionStatus } from "../../actions";
export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const [form] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .limit(1);
  if (!form) notFound();
  const submissions = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, id))
    .orderBy(desc(formSubmissions.createdAt));
  return (
    <AdminShell user={user} title={`Submissions · ${form.title}`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {submissions.length} submissions
          </h2>
          <p className="text-sm text-neutral-500">
            Review and export saved form entries.
          </p>
        </div>
        <a
          href={`/admin/forms/${id}/submissions/export`}
          className="admin-button"
        >
          Export CSV
        </a>
      </div>
      <div className="space-y-3">
        {submissions.map((submission) => (
          <article
            key={submission.id}
            className={`rounded-2xl border bg-white p-5 ${submission.status === "UNREAD" ? "border-l-4 border-l-pink-500" : ""}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">
                {submission.status} · {submission.createdAt.toLocaleString()}
              </span>
              <div className="flex gap-3">
                <form
                  action={setSubmissionStatus.bind(
                    null,
                    submission.id,
                    submission.status === "READ" ? "UNREAD" : "READ",
                  )}
                >
                  <button className="text-sm text-pink-600">
                    Mark {submission.status === "READ" ? "unread" : "read"}
                  </button>
                </form>
                <form action={deleteSubmission.bind(null, submission.id)}>
                  <button className="text-sm text-red-600">Delete</button>
                </form>
              </div>
            </div>
            <dl className="grid gap-3 md:grid-cols-2">
              {Object.entries(submission.data as Record<string, unknown>).map(
                ([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-semibold uppercase text-neutral-400">
                      {key}
                    </dt>
                    <dd className="whitespace-pre-wrap text-sm">
                      {String(value)}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </article>
        ))}
        {!submissions.length && (
          <p className="rounded-2xl border border-dashed bg-white p-12 text-center text-neutral-500">
            No submissions yet.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
