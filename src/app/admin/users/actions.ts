"use server";
import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";
const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "DESIGNER",
  "EDITOR",
  "CONTENT_EDITOR",
  "MARKETING_MANAGER",
  "VIEWER",
] as const;
type Role = (typeof roles)[number];
function roleValue(value: FormDataEntryValue | null): Role {
  return roles.includes(String(value) as Role)
    ? (String(value) as Role)
    : "VIEWER";
}
function assertAssignable(actorRole: string, nextRole: Role) {
  if (nextRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN")
    throw new Error("Only a super administrator can assign that role");
}
/** Only super admins may touch super admin accounts. */
async function assertCanModify(actorRole: string, targetId: string) {
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) throw new Error("User not found");
  if (target.role === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN")
    throw new Error("Only a super administrator can modify a super administrator");
  return target;
}
export async function createUser(form: FormData) {
  const actor = await requirePermission("manage_users");
  const name = String(form.get("name") || "").trim(),
    email = String(form.get("email") || "")
      .trim()
      .toLowerCase(),
    password = String(form.get("password") || ""),
    role = roleValue(form.get("role"));
  assertAssignable(actor.role, role);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10)
    throw new Error(
      "Name, valid email, and a 10-character password are required",
    );
  await db
    .insert(users)
    .values({ name, email, passwordHash: await hash(password, 12), role });
  await logActivity(actor, "users", "created", name || email);
  revalidatePath("/admin/users");
}
export async function updateUser(form: FormData) {
  const actor = await requirePermission("manage_users");
  const id = String(form.get("id")),
    name = String(form.get("name") || "").trim(),
    email = String(form.get("email") || "")
      .trim()
      .toLowerCase(),
    role = roleValue(form.get("role")),
    active = String(form.get("active")) === "true";
  assertAssignable(actor.role, role);
  await assertCanModify(actor.role, id);
  const self = id === actor.id;
  await db
    .update(users)
    .set({
      name,
      email,
      ...(!self ? { role, active } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
  if (!active && !self)
    await db.delete(sessions).where(eq(sessions.userId, id));
  await logActivity(actor, "users", "updated", name || email, id);
  revalidatePath("/admin/users");
}
export async function resetUserPassword(form: FormData) {
  const actor = await requirePermission("manage_users");
  const id = String(form.get("id")),
    password = String(form.get("password") || "");
  if (password.length < 10)
    throw new Error("Password must contain at least 10 characters");
  await assertCanModify(actor.role, id);
  await db
    .update(users)
    .set({ passwordHash: await hash(password, 12), updatedAt: new Date() })
    .where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
  await logActivity(actor, "users", "reset password", id, id);
  revalidatePath("/admin/users");
}
export async function deleteUser(id: string) {
  const actor = await requirePermission("manage_users");
  if (id === actor.id) throw new Error("You cannot delete your own account");
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return;
  if ((target.role === "SUPER_ADMIN" || target.role === "ADMIN") && actor.role !== "SUPER_ADMIN")
    throw new Error("Only a super administrator can delete administrators");
  await db.delete(sessions).where(eq(sessions.userId, id));
  await db.delete(users).where(eq(users.id, id));
  await logActivity(actor, "users", "deleted", target.name || target.email, id);
  revalidatePath("/admin/users");
}
