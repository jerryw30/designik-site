/**
 * Role → permission map, importable from both server and client code.
 * (src/lib/permissions.ts adds the server-only helpers on top.)
 */

export type Permission =
  | "edit_pages"
  | "edit_posts"
  | "manage_media"
  | "manage_menus"
  | "manage_forms"
  | "manage_seo"
  | "manage_settings"
  | "manage_users";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ["edit_pages", "edit_posts", "manage_media", "manage_menus", "manage_forms", "manage_seo", "manage_settings", "manage_users"],
  ADMIN: ["edit_pages", "edit_posts", "manage_media", "manage_menus", "manage_forms", "manage_seo", "manage_settings", "manage_users"],
  DESIGNER: ["edit_pages", "manage_media", "manage_menus"],
  EDITOR: ["edit_pages", "edit_posts", "manage_media", "manage_menus"],
  CONTENT_EDITOR: ["edit_posts", "manage_media"],
  MARKETING_MANAGER: ["edit_posts", "manage_media", "manage_forms", "manage_seo"],
  VIEWER: [],
};

export function can(role: string, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Which permission unlocks each admin area (first path segment after
 * /admin). `null` = any signed-in user (dashboard, analytics).
 */
export const AREA_PERMISSIONS: Record<string, Permission | null> = {
  "": null,
  analytics: null,
  pages: "edit_pages",
  revisions: "edit_pages",
  templates: "edit_pages",
  "saved-sections": "edit_pages",
  headers: "edit_pages",
  footers: "edit_pages",
  popups: "edit_pages",
  styles: "manage_settings",
  posts: "edit_posts",
  media: "manage_media",
  menus: "manage_menus",
  forms: "manage_forms",
  leads: "manage_forms",
  chat: "manage_forms",
  seo: "manage_seo",
  settings: "manage_settings",
  tools: "manage_settings",
  users: "manage_users",
  activity: "manage_users",
};

/** Can this role open the given admin area? Unknown areas stay open. */
export function canViewArea(role: string, area: string) {
  const permission = AREA_PERMISSIONS[area];
  return permission == null ? true : can(role, permission);
}
