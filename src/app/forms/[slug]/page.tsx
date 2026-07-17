import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import PublicForm from "@/components/forms/PublicForm";
import type { FormDefinition } from "@/app/admin/forms/actions";
export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [form] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "forms"),
        eq(adminResources.slug, slug),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!form) notFound();
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 font-display text-5xl uppercase text-wine-800">
          {form.title}
        </h1>
        <PublicForm formId={form.id} definition={form.data as FormDefinition} />
      </div>
    </main>
  );
}
