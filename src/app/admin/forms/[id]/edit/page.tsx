import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../../../admin-shell";
import { T } from "../../../theme";
import FormEditor from "../../form-editor";
import type { FormDefinition } from "../../actions";
export default async function EditForm({
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
  return (
    <AdminShell user={user} title={`Edit form · ${form.title}`}>
      <div className="mb-5 flex flex-wrap items-baseline gap-3">
        <h2 className={T.screenTitle}>Edit form</h2>
        <Link href="/admin/forms" className={`${T.mutedLink} text-[13px]`}>
          ← All forms
        </Link>
        <Link
          href={`/admin/forms/${form.id}/preview`}
          target="_blank"
          className={`${T.mutedLink} text-[13px]`}
        >
          Preview ↗
        </Link>
        <Link
          href={`/admin/forms/${form.id}/submissions`}
          className={`${T.mutedLink} text-[13px]`}
        >
          Submissions
        </Link>
      </div>
      <FormEditor
        id={form.id}
        initialTitle={form.title}
        initialDefinition={form.data as FormDefinition}
      />
    </AdminShell>
  );
}
