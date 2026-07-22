import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminShell } from "../admin-shell";
import { T, wpDate } from "../theme";
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

const inlineName =
  "w-full max-w-[240px] rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[14px] font-semibold text-[#1b1c20] outline-none transition hover:border-neutral-200 focus:border-[#a10140] focus:bg-white focus:ring-2 focus:ring-[#a10140]/15";
const inlineEmail =
  "w-full max-w-[240px] rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[12.5px] text-neutral-500 outline-none transition hover:border-neutral-200 focus:border-[#a10140] focus:bg-white focus:text-[#1b1c20] focus:ring-2 focus:ring-[#a10140]/15";
const pillSelect =
  "rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-700 outline-none transition focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15 disabled:bg-neutral-100 disabled:text-neutral-400";

function initials(name: string, email: string) {
  const src = name.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default async function UsersPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const list = await db.select().from(users).orderBy(desc(users.createdAt)),
    allowed = can(user.role, "manage_users");
  return (
    <AdminShell user={user} title="Users and Roles">
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <section className={`${T.cardPad} h-fit`}>
          <h2 className="text-[16px] font-semibold text-[#1b1c20]">Add user</h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Create a secured administrator or editorial account.
          </p>
          <form action={createUser} className="mt-5 space-y-4">
            <div>
              <label className={T.label} htmlFor="new-user-name">
                Full name
              </label>
              <input
                id="new-user-name"
                name="name"
                required
                placeholder="Full name"
                className={T.input}
              />
            </div>
            <div>
              <label className={T.label} htmlFor="new-user-email">
                Email
              </label>
              <input
                id="new-user-email"
                name="email"
                required
                type="email"
                placeholder="Email"
                className={T.input}
              />
            </div>
            <div>
              <label className={T.label} htmlFor="new-user-password">
                Temporary password
              </label>
              <input
                id="new-user-password"
                name="password"
                required
                type="password"
                minLength={10}
                placeholder="Temporary password"
                className={T.input}
              />
              <p className={T.help}>Minimum 10 characters.</p>
            </div>
            <div>
              <label className={T.label} htmlFor="new-user-role">
                Role
              </label>
              <select id="new-user-role" name="role" className={`${T.select} w-full`}>
                {roles
                  .filter(
                    (role) =>
                      user.role === "SUPER_ADMIN" || role !== "SUPER_ADMIN",
                  )
                  .map((role) => (
                    <option key={role}>{role}</option>
                  ))}
              </select>
            </div>
            <button
              disabled={!allowed}
              className={`${T.btnPrimary} w-full disabled:opacity-40`}
            >
              Create user
            </button>
          </form>
        </section>
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={T.screenTitle}>All users</h2>
            <span className={T.pillNeutral}>{list.length}</span>
          </div>
          <div className={T.tableWrap}>
            <table className={T.table}>
              <thead>
                <tr className={T.theadRow}>
                  <th className={T.th}>User</th>
                  <th className={T.th}>Role</th>
                  <th className={T.th}>Status</th>
                  <th className={T.th}>Created</th>
                  <th className={T.th}>
                    <span className="sr-only">Save</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => {
                  const formId = `user-form-${item.id}`;
                  return (
                    <tr key={item.id} className={T.row}>
                      <td className={T.td}>
                        <form id={formId} action={updateUser}>
                          <input type="hidden" name="id" value={item.id} />
                        </form>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#c81a5e] text-[12px] font-semibold text-white">
                            {initials(item.name, item.email)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              name="name"
                              form={formId}
                              defaultValue={item.name}
                              aria-label="Name"
                              className={inlineName}
                            />
                            <input
                              name="email"
                              form={formId}
                              type="email"
                              defaultValue={item.email}
                              aria-label="Email"
                              className={inlineEmail}
                            />
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
                              <details>
                                <summary
                                  className={`cursor-pointer list-none ${T.mutedLink}`}
                                >
                                  Reset password
                                </summary>
                                <form
                                  action={resetUserPassword}
                                  className="mt-2 flex items-center gap-2"
                                >
                                  <input type="hidden" name="id" value={item.id} />
                                  <input
                                    name="password"
                                    type="password"
                                    minLength={10}
                                    required
                                    placeholder="New password"
                                    className={`${T.input} w-44 px-2.5 py-1.5 text-[13px]`}
                                  />
                                  <button
                                    disabled={!allowed}
                                    className={`${T.btnSmall} disabled:opacity-40`}
                                  >
                                    Reset password
                                  </button>
                                </form>
                              </details>
                              {item.id !== user.id && !item.active && (
                                <>
                                  <span className={T.dot}>·</span>
                                  <form action={deleteUser.bind(null, item.id)}>
                                    <button
                                      disabled={!allowed}
                                      className={`${T.dangerLink} disabled:opacity-40`}
                                    >
                                      Delete inactive user
                                    </button>
                                  </form>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={T.td}>
                        <select
                          name="role"
                          form={formId}
                          defaultValue={item.role}
                          disabled={!allowed || item.id === user.id}
                          aria-label="Role"
                          className={pillSelect}
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
                      </td>
                      <td className={T.td}>
                        <select
                          name="active"
                          form={formId}
                          defaultValue={String(item.active)}
                          disabled={!allowed || item.id === user.id}
                          aria-label="Status"
                          className={pillSelect}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </td>
                      <td className={`${T.td} whitespace-nowrap text-neutral-500`}>
                        {wpDate(item.createdAt)}
                      </td>
                      <td className={`${T.td} text-right`}>
                        <button
                          form={formId}
                          disabled={!allowed}
                          className={`${T.btnSmall} disabled:opacity-40`}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
