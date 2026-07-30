import Link from "next/link";
import { and, count, desc, eq, max } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, formSubmissions, leads } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T, statusPill, wpDate } from "../theme";
import {
  createForm,
  deleteFormForever,
  duplicateForm,
  saveNotifyEmails,
  setFormStatus,
} from "./actions";
import { getNotifyEmails } from "@/lib/site-config";

function pretty(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function FormsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "forms")) redirect("/admin");
  const [forms, submissions, siteForms, [getStartedForm], [newsletterForm], notifyEmails] = await Promise.all([
    db
      .select()
      .from(adminResources)
      .where(eq(adminResources.module, "forms"))
      .orderBy(desc(adminResources.updatedAt)),
    db
      .select({
        formId: formSubmissions.formId,
        status: formSubmissions.status,
      })
      .from(formSubmissions),
    db
      .select({ source: leads.source, total: count(), latest: max(leads.createdAt) })
      .from(leads)
      .groupBy(leads.source),
    db
      .select({ id: adminResources.id })
      .from(adminResources)
      .where(and(eq(adminResources.module, "forms"), eq(adminResources.slug, "start-a-project")))
      .limit(1),
    db
      .select({ id: adminResources.id })
      .from(adminResources)
      .where(and(eq(adminResources.module, "forms"), eq(adminResources.slug, "newsletter-signup")))
      .limit(1),
    getNotifyEmails(),
  ]);

  // The forms built into the website itself — their submissions land in Leads.
  const BUILT_IN = [
    {
      source: "get-started",
      name: "Start a Project popup",
      where: "Header · Hero · Footer Contact · Case studies",
      editHref: getStartedForm ? `/admin/forms/${getStartedForm.id}/edit` : "/admin/popups#start-a-project",
      editLabel: "Edit fields",
    },
    {
      source: "newsletter",
      name: "Newsletter signup",
      where: "Footer",
      editHref: newsletterForm ? `/admin/forms/${newsletterForm.id}/edit` : null,
      editLabel: "Edit fields",
    },
    { source: "contact", name: "Contact form", where: "Shared contact endpoint (no visual form of its own)", editHref: null, editLabel: null },
  ];
  const bySource = new Map(siteForms.map((s) => [s.source || "contact", s]));
  return (
    <AdminShell user={user} title="Forms">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={T.screenTitle}>Forms</h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Build validated public forms with stored submissions.
          </p>
        </div>
        <form action={createForm} className="flex items-center gap-2">
          <input
            name="title"
            required
            placeholder="Form name"
            className={`${T.input} w-56`}
          />
          <button className={T.btnPrimary}>Create form</button>
        </form>
      </div>

      {/* Built-in site forms — live on the website, submissions stored as Leads */}
      <section className={`${T.card} mt-5`}>
        <div className={T.cardHeader}>
          <h3 className="text-[15px] font-semibold">Site forms (built in)</h3>
          <p className="text-[12px] text-neutral-400">These live on the website itself — every submission lands in Leads.</p>
        </div>
        <ul className="divide-y">
          {BUILT_IN.map((f) => {
            const stat = bySource.get(f.source);
            return (
              <li key={f.source} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-[13.5px] font-medium">{f.name}</p>
                  <p className="text-[12px] text-neutral-400">{f.where}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12.5px] text-neutral-500">
                    {stat?.total || 0} submissions
                    {stat?.latest ? ` · last ${wpDate(stat.latest)}` : ""}
                  </span>
                  {f.editHref && (
                    <Link href={f.editHref} className={T.link}>
                      {f.editLabel}
                    </Link>
                  )}
                  <Link href="/admin/leads" className={T.link}>
                    View in Leads
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Where submission + chat notification emails go */}
      <section className={`${T.card} mt-5`}>
        <div className={T.cardHeader}>
          <h3 className="text-[15px] font-semibold">Submission notifications</h3>
          <p className="text-[12px] text-neutral-400">
            Every form submission and new chat is emailed to these addresses (first is To, the rest are CC). One email per line.
          </p>
        </div>
        <form action={saveNotifyEmails} className="flex flex-wrap items-end gap-3 p-5">
          <textarea
            name="emails"
            rows={3}
            defaultValue={notifyEmails.join("\n")}
            placeholder={"you@designik.agency\nteam@designik.agency"}
            className={`${T.input} w-full max-w-md`}
          />
          <button className={T.btnPrimary}>Save emails</button>
          {!notifyEmails.length && (
            <p className="w-full text-[12px] text-neutral-400">
              Currently using the CONTACT_TO / CONTACT_CC environment variables — saving a list here overrides them.
            </p>
          )}
        </form>
      </section>

      <div className={T.tableWrap}>
        <table className={T.table}>
          <thead>
            <tr className={T.theadRow}>
              <th className={T.th}>Title</th>
              <th className={T.th}>Status</th>
              <th className={T.th}>Submissions</th>
              <th className={T.th}>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => {
              const count = submissions.filter(
                  (item) => item.formId === form.id,
                ).length,
                unread = submissions.filter(
                  (item) => item.formId === form.id && item.status === "UNREAD",
                ).length;
              return (
                <tr key={form.id} className={T.row}>
                  <td className={T.td}>
                    <Link
                      href={`/admin/forms/${form.id}/edit`}
                      className={T.rowTitle}
                    >
                      {form.title}
                    </Link>
                    {form.status === "PUBLISHED" && (
                      <a
                        href={`/forms/${form.slug}`}
                        target="_blank"
                        className="block text-[12px] text-neutral-400 hover:text-[#a10140] hover:underline"
                      >
                        /forms/{form.slug}
                      </a>
                    )}
                    <div className={T.rowActions}>
                      {form.status !== "TRASH" ? (
                        <>
                          <Link
                            href={`/admin/forms/${form.id}/edit`}
                            className={T.link}
                          >
                            Edit
                          </Link>
                          <span className={T.dot}>·</span>
                          <Link
                            href={`/admin/forms/${form.id}/preview`}
                            target="_blank"
                            className={T.link}
                          >
                            Preview
                          </Link>
                          <span className={T.dot}>·</span>
                          <Link
                            href={`/admin/forms/${form.id}/submissions`}
                            className={T.link}
                          >
                            Submissions
                          </Link>
                          <span className={T.dot}>·</span>
                          <form action={duplicateForm.bind(null, form.id)}>
                            <button className={T.link}>Duplicate</button>
                          </form>
                          <span className={T.dot}>·</span>
                          <form
                            action={setFormStatus.bind(
                              null,
                              form.id,
                              form.status === "PUBLISHED"
                                ? "DRAFT"
                                : "PUBLISHED",
                            )}
                          >
                            <button className={T.link}>
                              {form.status === "PUBLISHED"
                                ? "Move to draft"
                                : "Publish"}
                            </button>
                          </form>
                          <span className={T.dot}>·</span>
                          <form
                            action={setFormStatus.bind(null, form.id, "TRASH")}
                          >
                            <button className={T.dangerLink}>Trash</button>
                          </form>
                        </>
                      ) : (
                        <>
                          <form
                            action={setFormStatus.bind(null, form.id, "DRAFT")}
                          >
                            <button className={T.link}>Restore</button>
                          </form>
                          <span className={T.dot}>·</span>
                          <form action={deleteFormForever.bind(null, form.id)}>
                            <button className={T.dangerLink}>
                              Delete forever
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                  <td className={T.td}>
                    <span className={statusPill(form.status)}>
                      {pretty(form.status)}
                    </span>
                  </td>
                  <td className={T.td}>
                    <Link
                      href={`/admin/forms/${form.id}/submissions`}
                      className={T.link}
                    >
                      {count}
                    </Link>
                    {unread > 0 && (
                      <span className={`ml-2 ${T.pillNew}`}>
                        {unread} unread
                      </span>
                    )}
                  </td>
                  <td className={`${T.td} whitespace-nowrap text-neutral-500`}>
                    {wpDate(form.updatedAt)}
                  </td>
                </tr>
              );
            })}
            {!forms.length && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-14 text-center text-[13px] text-neutral-500"
                >
                  No forms yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
