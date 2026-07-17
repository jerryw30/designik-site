import { redirect } from "next/navigation";
import { currentUser } from "./auth";

export type Permission =
  | "edit_pages"
  | "edit_posts"
  | "manage_media"
  | "manage_menus"
  | "manage_forms"
  | "manage_seo"
  | "manage_settings"
  | "manage_users";
const permissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "edit_pages",
    "edit_posts",
    "manage_media",
    "manage_menus",
    "manage_forms",
    "manage_seo",
    "manage_settings",
    "manage_users",
  ],
  ADMIN: [
    "edit_pages",
    "edit_posts",
    "manage_media",
    "manage_menus",
    "manage_forms",
    "manage_seo",
    "manage_settings",
    "manage_users",
  ],
  DESIGNER: ["edit_pages", "manage_media", "manage_menus"],
  EDITOR: ["edit_pages", "edit_posts", "manage_media", "manage_menus"],
  CONTENT_EDITOR: ["edit_posts", "manage_media"],
  MARKETING_MANAGER: [
    "edit_posts",
    "manage_media",
    "manage_forms",
    "manage_seo",
  ],
  VIEWER: [],
};
export function can(role: string, permission: Permission) {
  return permissions[role]?.includes(permission) ?? false;
}
export async function requirePermission(permission: Permission) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission))
    throw new Error("Forbidden: insufficient role permission");
  return user;
}
