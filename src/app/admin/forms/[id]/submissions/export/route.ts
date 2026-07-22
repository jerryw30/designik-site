import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminResources, formSubmissions } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
const csv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || !can(user.role, "manage_forms"))
    return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const [form] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .limit(1);
  if (!form) return new Response("Not found", { status: 404 });
  const entries = await db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, id));
  // Columns follow the form definition order, then any legacy keys that only
  // exist on older submissions.
  const definition = form.data as { fields?: { name?: unknown }[] };
  const definedKeys = (definition.fields ?? [])
    .map((field) => String(field?.name || ""))
    .filter(Boolean);
  const keys = [
    ...new Set([
      ...definedKeys,
      ...entries.flatMap((entry) => Object.keys(entry.data as object)),
    ]),
  ];
  const output = [
    ["id", "status", "createdAt", ...keys].map(csv).join(","),
    ...entries.map((entry) =>
      [
        entry.id,
        entry.status,
        entry.createdAt.toISOString(),
        ...keys.map((key) => (entry.data as Record<string, unknown>)[key]),
      ]
        .map(csv)
        .join(","),
    ),
  ].join("\r\n");
  return new Response(output, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${form.slug}-submissions.csv"`,
    },
  });
}
