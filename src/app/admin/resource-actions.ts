"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { requirePermission, type Permission } from "@/lib/permissions";

const modules = new Set([
  "posts",
  "media",
  "templates",
  "saved-sections",
  "headers",
  "footers",
  "popups",
  "forms",
  "menus",
  "styles",
  "seo",
  "settings",
]);
const modulePermission: Record<string, Permission> = {
  media: "manage_media",
  templates: "edit_pages",
  "saved-sections": "edit_pages",
  headers: "edit_pages",
  footers: "edit_pages",
  popups: "edit_pages",
  forms: "manage_forms",
  styles: "manage_settings",
  seo: "manage_seo",
  settings: "manage_settings",
  posts: "edit_posts",
  menus: "manage_menus",
};
async function authorize(module?: string) {
  if (module)
    return requirePermission(modulePermission[module] || "manage_settings");
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}
function cleanModule(value: string) {
  if (!modules.has(value)) throw new Error("Invalid module");
  return value;
}
function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

export async function createResource(form: FormData) {
  const resourceModule = cleanModule(String(form.get("module")));
  const user = await authorize(resourceModule);
  const title = String(form.get("title") || "Untitled").trim() || "Untitled";
  const slug = `${slugify(title)}-${Date.now().toString(36)}`;
  await db
    .insert(adminResources)
    .values({
      module: resourceModule,
      title,
      slug,
      createdBy: user.id,
      data: { description: String(form.get("description") || "") },
    });
  await logActivity(user, resourceModule, "created", title);
  revalidatePath(`/admin/${resourceModule}`);
}

export async function updateResource(form: FormData) {
  const resourceModule = cleanModule(String(form.get("module")));
  const user = await authorize(resourceModule);
  const id = String(form.get("id"));
  const title = String(form.get("title") || "Untitled").trim() || "Untitled";
  const status =
    String(form.get("status")) === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  await db
    .update(adminResources)
    .set({
      title,
      status,
      data: {
        description: String(form.get("description") || ""),
        url: String(form.get("url") || ""),
      },
      updatedAt: new Date(),
    })
    .where(
      and(eq(adminResources.id, id), eq(adminResources.module, resourceModule)),
    );
  await logActivity(user, resourceModule, "updated", title, id);
  revalidatePath(`/admin/${resourceModule}`);
}

export async function deleteResource(form: FormData) {
  const resourceModule = cleanModule(String(form.get("module")));
  const user = await authorize(resourceModule);
  const id = String(form.get("id"));
  await db
    .delete(adminResources)
    .where(
      and(eq(adminResources.id, id), eq(adminResources.module, resourceModule)),
    );
  await logActivity(user, resourceModule, "deleted", id, id);
  revalidatePath(`/admin/${resourceModule}`);
}

export async function toggleUser(form: FormData) {
  const actor = await authorize();
  if (actor.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = String(form.get("id"));
  if (id === actor.id) return;
  const active = String(form.get("active")) === "true";
  await db
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, id));
  await logActivity(
    actor,
    "users",
    active ? "activated" : "deactivated",
    id,
    id,
  );
  revalidatePath("/admin/users");
}
