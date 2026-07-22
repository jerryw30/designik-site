"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { designValue } from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources, pages, revisions, sections } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";

export type MenuItem = {
  id: string;
  label: string;
  url: string;
  parentId: string | null;
  target: "_self" | "_blank";
};
async function authorize() {
  return requirePermission("manage_menus");
}
function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "menu"
  );
}

export async function createMenu(form: FormData) {
  const user = await authorize();
  const title = String(form.get("title") || "Main Menu").trim() || "Main Menu";
  const [menu] = await db
    .insert(adminResources)
    .values({
      module: "menus",
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      createdBy: user.id,
      data: { items: [] },
    })
    .returning({ id: adminResources.id });
  await logActivity(user, "menus", "created", title, menu.id);
  redirect(`/admin/menus/${menu.id}/edit`);
}
export async function saveMenu(id: string, title: string, items: MenuItem[]) {
  const user = await authorize();
  const clean = items.slice(0, 100).map((item) => ({
    id: String(item.id),
    label: String(item.label).slice(0, 100),
    url: String(item.url).slice(0, 500),
    parentId: item.parentId ? String(item.parentId) : null,
    target: item.target === "_blank" ? ("_blank" as const) : ("_self" as const),
  }));
  const ids = new Set(clean.map((item) => item.id));
  clean.forEach((item) => {
    if (item.parentId && !ids.has(item.parentId)) item.parentId = null;
  });
  await db
    .update(adminResources)
    .set({
      title: title.trim() || "Untitled Menu",
      data: { items: clean },
      updatedAt: new Date(),
    })
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "menus")));
  await logActivity(
    user,
    "menus",
    "updated",
    title.trim() || "Untitled Menu",
    id,
  );
  revalidatePath(`/admin/menus/${id}/edit`);
  revalidatePath(`/admin/menus/${id}/preview`);
  revalidatePath("/admin/menus");
}
export async function setMenuStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "TRASH",
) {
  const user = await authorize();
  const [menu] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "menus")))
    .limit(1);
  if (!menu) return;
  if (status === "PUBLISHED") {
    const items = (menu.data as { items?: MenuItem[] }).items || [];
    const roots = items.filter((item) => !item.parentId);
    const links = roots.map((root) => ({
      label: root.label,
      href: root.url,
      target: root.target,
      children: items
        .filter((item) => item.parentId === root.id)
        .map((child) => ({
          label: child.label,
          href: child.url,
          target: child.target,
        })),
    }));
    const [home] = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, "home"))
      .limit(1);
    if (home) {
      const [header] = await db
        .select()
        .from(sections)
        .where(and(eq(sections.pageId, home.id), eq(sections.type, "header")))
        .limit(1);
      if (header) {
        const draft = { ...(header.draftContent as object), links };
        await db.insert(revisions).values({
          pageId: home.id,
          authorId: user.id,
          label: `Published menu: ${menu.title}`,
          snapshot: {
            sectionId: header.id,
            content: header.publishedContent,
          },
        });
        await db
          .update(sections)
          .set({
            draftContent: draft,
            publishedContent: draft,
            updatedAt: new Date(),
          })
          .where(eq(sections.id, header.id));
      }
    }
    // A published Header Builder header overrides the home header section on
    // the live site — push the menu links into those headers too, otherwise
    // "Publish to header" would have no visible effect.
    const activeHeaders = await db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "headers"),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      );
    for (const row of activeHeaders) {
      const value = designValue("headers", row.data);
      await db
        .update(adminResources)
        .set({
          data: {
            draft: {
              ...value.draft,
              content: { ...value.draft.content, links },
            },
            published: value.published
              ? {
                  ...value.published,
                  content: { ...value.published.content, links },
                }
              : value.published,
          },
          updatedAt: new Date(),
        })
        .where(eq(adminResources.id, row.id));
    }
  }
  await db
    .update(adminResources)
    .set({
      status,
      deletedAt: status === "TRASH" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(adminResources.id, id));
  await logActivity(
    user,
    "menus",
    status === "PUBLISHED"
      ? "published"
      : status === "TRASH"
        ? "trashed"
        : "drafted",
    menu.title,
    id,
  );
  revalidatePath("/admin/menus");
  revalidatePath("/", "layout");
}
export async function duplicateMenu(id: string) {
  const user = await authorize();
  const [menu] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "menus")))
    .limit(1);
  if (!menu) return;
  await db.insert(adminResources).values({
    module: "menus",
    title: `${menu.title} Copy`,
    slug: `${menu.slug}-copy-${Date.now().toString(36)}`,
    status: "DRAFT",
    data: menu.data,
    createdBy: user.id,
  });
  await logActivity(user, "menus", "duplicated", menu.title, id);
  revalidatePath("/admin/menus");
}
export async function deleteMenuForever(id: string) {
  const user = await authorize();
  await db
    .delete(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, "menus"),
        eq(adminResources.status, "TRASH"),
      ),
    );
  await logActivity(user, "menus", "deleted", id, id);
  revalidatePath("/admin/menus");
}
