import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminShell } from "../admin-shell";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  updateUser,
} from "./actions";
const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "DESIGNER",
  "EDITOR",
  "CONTENT_EDITOR",
  "MARKETING_MANAGER",
  "VIEWER",
];
export default async function UsersPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const list = await db.select().from(users).orderBy(desc(users.createdAt)),
    allowed = can(user.role, "manage_users");
  return (
    <AdminShell user={user} title="Users and Roles">
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Add user</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Create a secured administrator or editorial account.
          </p>
          <form action={createUser} className="mt-5 space-y-3">
            <input
              name="name"
              required
              placeholder="Full name"
              className="block w-full rounded-xl border p-3"
            />
            <input
              name="email"
              required
              type="email"
              placeholder="Email"
              className="block w-full rounded-xl border p-3"
            />
            <input
              name="password"
              required
              type="password"
              minLength={10}
              placeholder="Temporary password"
              className="block w-full rounded-xl border p-3"
            />
            <select name="role" className="block w-full rounded-xl border p-3">
              {roles
                .filter(
                  (role) =>
                    user.role === "SUPER_ADMIN" || role !== "SUPER_ADMIN",
                )
                .map((role) => (
                  <option key={role}>{role}</option>
                ))}
            </select>
            <button
              disabled={!allowed}
              className="admin-button w-full disabled:opacity-40"
            >
              Create user
            </button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">All users</h2>
          <div className="mt-4 space-y-3">
            {list.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border bg-white p-5"
              >
                <form action={updateUser}>
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-3 lg:grid-cols-2">
                    <input
                      name="name"
                      defaultValue={item.name}
                      className="rounded-lg border p-2"
                    />
                    <input
                      name="email"
                      type="email"
                      defaultValue={item.email}
                      className="rounded-lg border p-2"
                    />
                    <select
                      name="role"
                      defaultValue={item.role}
                      disabled={!allowed || item.id === user.id}
                      className="rounded-lg border p-2 disabled:bg-neutral-100"
                    >
                      {roles
                        .filter(
                          (role) =>
                            user.role === "SUPER_ADMIN" ||
                            role !== "SUPER_ADMIN",
                        )
                        .map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                    </select>
                    <select
                      name="active"
                      defaultValue={String(item.active)}
                      disabled={!allowed || item.id === user.id}
                      className="rounded-lg border p-2 disabled:bg-neutral-100"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      Created {item.createdAt.toLocaleString()}
                    </span>
                    <button
                      disabled={!allowed}
                      className="admin-button disabled:opacity-40"
                    >
                      Save user
                    </button>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
                  <form action={resetUserPassword} className="flex gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      name="password"
                      type="password"
                      minLength={10}
                      required
                      placeholder="New password"
                      className="rounded-lg border p-2 text-sm"
                    />
                    <button
                      disabled={!allowed}
                      className="rounded-lg border px-3 text-sm disabled:opacity-40"
                    >
                      Reset password
                    </button>
                  </form>
                  {item.id !== user.id && !item.active && (
                    <form action={deleteUser.bind(null, item.id)}>
                      <button
                        disabled={!allowed}
                        className="text-sm text-red-600 disabled:opacity-40"
                      >
                        Delete inactive user
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
