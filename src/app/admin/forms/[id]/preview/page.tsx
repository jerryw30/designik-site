import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import PublicForm from "@/components/forms/PublicForm";
import type { FormDefinition } from "../../actions";
export default async function PreviewForm({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await currentUser())) redirect("/admin/login");
  const { id } = await params;
  const [form] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .limit(1);
  if (!form) notFound();
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 rounded-lg bg-amber-100 p-3 text-sm">
          Draft preview · submissions created here are real
        </p>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 font-display text-4xl uppercase">{form.title}</h1>
          <PublicForm
            formId={form.id}
            definition={form.data as FormDefinition}
          />
        </div>
      </div>
    </main>
  );
}
