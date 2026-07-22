import { redirect } from "next/navigation";
import { currentUser } from "./auth";
import { can, type Permission } from "./roles";

export type { Permission };
export { can };

export async function requirePermission(permission: Permission) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission))
    throw new Error("Forbidden: insufficient role permission");
  return user;
}
