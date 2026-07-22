"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, formSubmissions } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";
export type FormField = {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
};
export type FormDefinition = {
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
  notificationEmail: string;
};
const defaults: FormDefinition = {
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      name: "name",
      placeholder: "Your name",
      required: true,
      options: [],
    },
    {
      id: "email",
      type: "email",
      label: "Email",
      name: "email",
      placeholder: "you@example.com",
      required: true,
      options: [],
    },
    {
      id: "message",
      type: "textarea",
      label: "Message",
      name: "message",
      placeholder: "How can we help?",
      required: true,
      options: [],
    },
  ],
  submitLabel: "Send message",
  successMessage: "Thank you. Your submission has been received.",
  notificationEmail: "",
};
async function authorize() {
  return requirePermission("manage_forms");
}
function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "form"
  );
}
export async function createForm(form: FormData) {
  const user = await authorize(),
    title =
      String(form.get("title") || "Contact Form").trim() || "Contact Form";
  const [record] = await db
    .insert(adminResources)
    .values({
      module: "forms",
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      createdBy: user.id,
      data: defaults,
    })
    .returning({ id: adminResources.id });
  await logActivity(user, "forms", "created", title, record.id);
  redirect(`/admin/forms/${record.id}/edit`);
}
export async function saveForm(
  id: string,
  title: string,
  definition: FormDefinition,
) {
  const user = await authorize();
  const names = new Set<string>();
  const fields = definition.fields.slice(0, 50).map((field, index) => {
    let name = slugify(field.name || field.label || `field-${index}`);
    while (names.has(name)) name = `${name}-${index + 1}`;
    names.add(name);
    return {
      id: String(field.id),
      type: [
        "text",
        "email",
        "phone",
        "textarea",
        "select",
        "checkbox",
      ].includes(field.type)
        ? field.type
        : "text",
      label: String(field.label).slice(0, 100),
      name,
      placeholder: String(field.placeholder || "").slice(0, 200),
      required: Boolean(field.required),
      options: (field.options || []).map(String).filter(Boolean).slice(0, 50),
    };
  });
  const [record] = await db
    .update(adminResources)
    .set({
      title: title.trim() || "Untitled Form",
      data: { ...definition, fields },
      updatedAt: new Date(),
    })
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .returning({ slug: adminResources.slug });
  await logActivity(user, "forms", "updated", title.trim() || "Untitled Form", id);
  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}/edit`);
  if (record) revalidatePath(`/forms/${record.slug}`);
}
export async function setFormStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "TRASH",
) {
  const user = await authorize();
  const [record] = await db
    .update(adminResources)
    .set({
      status,
      deletedAt: status === "TRASH" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .returning({ title: adminResources.title, slug: adminResources.slug });
  await logActivity(
    user,
    "forms",
    status === "PUBLISHED"
      ? "published"
      : status === "TRASH"
        ? "trashed"
        : "drafted",
    record?.title || id,
    id,
  );
  revalidatePath("/admin/forms");
  if (record) revalidatePath(`/forms/${record.slug}`);
}
export async function duplicateForm(id: string) {
  const user = await authorize();
  const [record] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .limit(1);
  if (!record) return;
  await db
    .insert(adminResources)
    .values({
      module: "forms",
      title: `${record.title} Copy`,
      slug: `${record.slug}-copy-${Date.now().toString(36)}`,
      status: "DRAFT",
      data: record.data,
      createdBy: user.id,
    });
  await logActivity(user, "forms", "duplicated", record.title, id);
  revalidatePath("/admin/forms");
}
export async function deleteFormForever(id: string) {
  const user = await authorize();
  const [record] = await db
    .delete(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, "forms"),
        eq(adminResources.status, "TRASH"),
      ),
    )
    .returning({ title: adminResources.title });
  await logActivity(user, "forms", "deleted", record?.title || id, id);
  revalidatePath("/admin/forms");
}
export async function setSubmissionStatus(
  id: string,
  status: "READ" | "UNREAD",
) {
  const user = await authorize();
  const [record] = await db
    .update(formSubmissions)
    .set({ status })
    .where(eq(formSubmissions.id, id))
    .returning({ formId: formSubmissions.formId });
  await logActivity(
    user,
    "forms",
    status === "READ" ? "marked read" : "marked unread",
    `submission ${id}`,
    id,
  );
  revalidatePath("/admin/forms");
  if (record) revalidatePath(`/admin/forms/${record.formId}/submissions`);
}
export async function deleteSubmission(id: string) {
  const user = await authorize();
  const [record] = await db
    .delete(formSubmissions)
    .where(eq(formSubmissions.id, id))
    .returning({ formId: formSubmissions.formId });
  await logActivity(user, "forms", "deleted", `submission ${id}`, id);
  revalidatePath("/admin/forms");
  if (record) revalidatePath(`/admin/forms/${record.formId}/submissions`);
}
