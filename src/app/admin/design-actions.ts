"use server";

import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  designDefault,
  designValue,
  type DesignModule,
  type GlobalDesign,
} from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";

const modules = new Set<DesignModule>([
  "headers",
  "footers",
  "popups",
  "templates",
  "saved-sections",
]);
function moduleOf(value: string): DesignModule {
  if (!modules.has(value as DesignModule))
    throw new Error("Invalid design module");
  return value as DesignModule;
}
function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "design"
  );
}
async function authorize() {
  return requirePermission("edit_pages");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
/**
 * Saved sections are also consumed by the page builder, which reads the flat
 * {type, name, content, draftContent} snapshot shape. Mirror those keys next
 * to the draft/published wrapper so editing a saved section here never breaks
 * "insert saved section" in the builder.
 */
function savedSectionMirror(
  designModule: DesignModule,
  draft: GlobalDesign,
): Record<string, unknown> {
  if (designModule !== "saved-sections") return {};
  const content = object(draft.content);
  const inner = object(content.content);
  return {
    type: String(content.type || "widgets"),
    name: String(content.name || "Saved section"),
    content: inner,
    draftContent: inner,
  };
}

export async function createDesign(form: FormData) {
  const user = await authorize();
  const designModule = moduleOf(String(form.get("module")));
  const title = String(form.get("title") || "Untitled").trim() || "Untitled";
  const value = designDefault(designModule);
  const [created] = await db
    .insert(adminResources)
    .values({
      module: designModule,
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      createdBy: user.id,
      data: {
        ...savedSectionMirror(designModule, value),
        draft: value,
        published: null,
      },
    })
    .returning({ id: adminResources.id });
  await logActivity(user, designModule, "created", title, created.id);
  redirect(`/admin/${designModule}/${created.id}/edit`);
}

export async function saveDesignDraft(
  id: string,
  moduleInput: string,
  title: string,
  draft: GlobalDesign,
) {
  const user = await authorize();
  const designModule = moduleOf(moduleInput);
  const [row] = await db
    .select({ data: adminResources.data })
    .from(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Design not found");
  const value = designValue(designModule, row.data);
  await db
    .update(adminResources)
    .set({
      title: title.trim() || "Untitled",
      data: {
        ...savedSectionMirror(designModule, draft),
        draft,
        published: value.published,
      },
      updatedAt: new Date(),
    })
    .where(eq(adminResources.id, id));
  await logActivity(user, designModule, "updated", title.trim() || "Untitled", id);
  revalidatePath(`/admin/${designModule}`);
  revalidatePath(`/admin/${designModule}/${id}/edit`);
  revalidatePath(`/admin/${designModule}/${id}/preview`);
}

export async function publishDesign(
  id: string,
  moduleInput: string,
  title: string,
  draft: GlobalDesign,
) {
  const user = await authorize();
  const designModule = moduleOf(moduleInput);
  if (["headers", "footers"].includes(designModule)) {
    const active = await db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, designModule),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      );
    for (const row of active) {
      const value = designValue(designModule, row.data);
      await db
        .update(adminResources)
        .set({
          status: "DRAFT",
          data: { ...value, published: value.published },
          updatedAt: new Date(),
        })
        .where(and(eq(adminResources.id, row.id), ne(adminResources.id, id)));
    }
  }
  await db
    .update(adminResources)
    .set({
      title: title.trim() || "Untitled",
      status: "PUBLISHED",
      data: {
        ...savedSectionMirror(designModule, draft),
        draft,
        published: draft,
      },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNull(adminResources.deletedAt),
      ),
    );
  await logActivity(user, designModule, "published", title.trim() || "Untitled", id);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/${designModule}`);
  revalidatePath(`/admin/${designModule}/${id}/edit`);
}

export async function unpublishDesign(id: string, moduleInput: string) {
  const user = await authorize();
  const designModule = moduleOf(moduleInput);
  await db
    .update(adminResources)
    .set({ status: "DRAFT", updatedAt: new Date() })
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNull(adminResources.deletedAt),
      ),
    );
  await logActivity(user, designModule, "unpublished", id, id);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/${designModule}`);
  revalidatePath(`/admin/${designModule}/${id}/edit`);
}

export async function duplicateDesign(form: FormData) {
  const user = await authorize();
  const id = String(form.get("id"));
  const designModule = moduleOf(String(form.get("module")));
  const [source] = await db
    .select()
    .from(adminResources)
    .where(
      and(eq(adminResources.id, id), eq(adminResources.module, designModule)),
    )
    .limit(1);
  if (!source) return;
  const value = designValue(designModule, source.data);
  await db.insert(adminResources).values({
    module: designModule,
    title: `${source.title} Copy`,
    slug: `${source.slug}-copy-${Date.now().toString(36)}`,
    status: "DRAFT",
    data: {
      ...savedSectionMirror(designModule, value.draft),
      draft: value.draft,
      published: null,
    },
    createdBy: user.id,
  });
  await logActivity(user, designModule, "duplicated", source.title, id);
  revalidatePath(`/admin/${designModule}`);
}

export async function trashDesign(form: FormData) {
  const user = await authorize();
  const id = String(form.get("id"));
  const designModule = moduleOf(String(form.get("module")));
  await db
    .update(adminResources)
    .set({ deletedAt: new Date(), status: "DRAFT", updatedAt: new Date() })
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNull(adminResources.deletedAt),
      ),
    );
  await logActivity(user, designModule, "trashed", id, id);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/${designModule}`);
  redirect(`/admin/${designModule}`);
}

export async function restoreDesign(form: FormData) {
  const user = await authorize();
  const id = String(form.get("id"));
  const designModule = moduleOf(String(form.get("module")));
  await db
    .update(adminResources)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNotNull(adminResources.deletedAt),
      ),
    );
  await logActivity(user, designModule, "restored", id, id);
  revalidatePath(`/admin/${designModule}`);
}

export async function deleteDesignPermanently(form: FormData) {
  const user = await authorize();
  const id = String(form.get("id"));
  const designModule = moduleOf(String(form.get("module")));
  await db
    .delete(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNotNull(adminResources.deletedAt),
      ),
    );
  await logActivity(user, designModule, "deleted", id, id);
  revalidatePath(`/admin/${designModule}`);
}
