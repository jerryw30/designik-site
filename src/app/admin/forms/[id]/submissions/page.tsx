import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, formSubmissions } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../../../admin-shell";
import { T, wpDate } from "../../../theme";
import { deleteSubmission, setSubmissionStatus } from "../../actions";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "forms")) redirect("/admin");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={T.screenTitle}>
            {submissions.length} submissions
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Review and export saved form entries.
          </p>
        </div>
        <a
          href={`/admin/forms/${id}/submissions/export`}
          className={T.btn}
        >
          Export CSV
        </a>
      </div>
      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.theadRow}>
              <th className={T.th}>Submission</th>
              <th className={T.th}>Status</th>
              <th className={T.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className={T.row}>
                <td className={T.td}>
                  <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
                    {Object.entries(
                      submission.data as Record<string, unknown>,
                    ).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                          {key}
                        </dt>
                        <dd className="whitespace-pre-wrap text-[13px] text-[#1b1c20]">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className={T.rowActions}>
                    <form
                      action={setSubmissionStatus.bind(
                        null,
                        submission.id,
                        submission.status === "READ" ? "UNREAD" : "READ",
                      )}
                    >
                      <button className={T.link}>
                        Mark {submission.status === "READ" ? "unread" : "read"}
                      </button>
                    </form>
                    <span className={T.dot}>·</span>
                    <form action={deleteSubmission.bind(null, submission.id)}>
                      <button className={T.dangerLink}>Delete</button>
                    </form>
                  </div>
                </td>
                <td className={T.td}>
                  <span
                    className={
                      submission.status === "UNREAD" ? T.pillNew : T.pillNeutral
                    }
                  >
                    {submission.status.charAt(0) +
                      submission.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className={`${T.td} whitespace-nowrap text-neutral-500`}>
                  {wpDate(submission.createdAt)}
                </td>
              </tr>
            ))}
            {!submissions.length && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-14 text-center text-[13px] text-neutral-500"
                >
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
