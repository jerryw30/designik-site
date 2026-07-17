import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, formSubmissions } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import {
  createForm,
  deleteFormForever,
  duplicateForm,
  setFormStatus,
} from "./actions";
export default async function FormsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const [forms, submissions] = await Promise.all([
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
  ]);
  return (
    <AdminShell user={user} title="Forms">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Create form</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Build a validated public form with stored submissions.
          </p>
          <form action={createForm} className="mt-5 space-y-3">
            <input
              name="title"
              required
              placeholder="Form name"
              className="block w-full rounded-xl border p-3"
            />
            <button className="admin-button w-full">Create form</button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">All forms</h2>
          <div className="mt-4 space-y-3">
            {forms.map((form) => {
              const count = submissions.filter(
                  (item) => item.formId === form.id,
                ).length,
                unread = submissions.filter(
                  (item) => item.formId === form.id && item.status === "UNREAD",
                ).length;
              return (
                <article
                  key={form.id}
                  className="rounded-2xl border bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <b>{form.title}</b>
                      <p className="text-xs text-neutral-500">
                        {form.status} · {count} submissions · {unread} unread
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.status !== "TRASH" ? (
                        <>
                          <Link
                            href={`/admin/forms/${form.id}/edit`}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/forms/${form.id}/preview`}
                            target="_blank"
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/admin/forms/${form.id}/submissions`}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            Submissions
                          </Link>
                          <form action={duplicateForm.bind(null, form.id)}>
                            <button className="rounded-lg border px-3 py-2 text-sm">
                              Duplicate
                            </button>
                          </form>
                          <form
                            action={setFormStatus.bind(
                              null,
                              form.id,
                              form.status === "PUBLISHED"
                                ? "DRAFT"
                                : "PUBLISHED",
                            )}
                          >
                            <button className="admin-button">
                              {form.status === "PUBLISHED"
                                ? "Move to draft"
                                : "Publish"}
                            </button>
                          </form>
                          <form
                            action={setFormStatus.bind(null, form.id, "TRASH")}
                          >
                            <button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">
                              Trash
                            </button>
                          </form>
                        </>
                      ) : (
                        <>
                          <form
                            action={setFormStatus.bind(null, form.id, "DRAFT")}
                          >
                            <button className="rounded-lg border px-3 py-2 text-sm">
                              Restore
                            </button>
                          </form>
                          <form action={deleteFormForever.bind(null, form.id)}>
                            <button className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">
                              Delete forever
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                  {form.status === "PUBLISHED" && (
                    <a
                      href={`/forms/${form.slug}`}
                      target="_blank"
                      className="mt-3 block text-xs text-pink-600"
                    >
                      Public URL: /forms/{form.slug}
                    </a>
                  )}
                </article>
              );
            })}
            {!forms.length && (
              <p className="rounded-2xl border border-dashed bg-white p-12 text-center text-neutral-500">
                No forms yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
