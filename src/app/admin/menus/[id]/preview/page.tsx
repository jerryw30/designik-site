import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import type { MenuItem } from "../../actions";
export default async function PreviewMenu({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "menus")) redirect("/admin");
  const { id } = await params;
  const [menu] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "menus")))
    .limit(1);
  if (!menu) notFound();
  const items = (menu.data as { items?: MenuItem[] }).items || [],
    roots = items.filter((item) => !item.parentId);
  return (
    <main className="min-h-screen bg-wine-900 p-10 text-white">
      <p className="mb-8 rounded-lg bg-amber-100 p-3 text-sm text-black">
        Menu preview · {menu.status}
      </p>
      <nav className="mx-auto max-w-5xl rounded-full bg-white/10 px-8 py-5">
        <ul className="flex items-center justify-center gap-10">
          {roots.map((item) => (
            <li key={item.id} className="group relative">
              <a
                href={item.url}
                target={item.target}
                className="font-display uppercase"
              >
                {item.label}
              </a>
              {items.some((child) => child.parentId === item.id) && (
                <ul className="absolute left-0 top-full hidden min-w-48 rounded-xl bg-white p-3 text-black shadow-xl group-hover:block">
                  {items
                    .filter((child) => child.parentId === item.id)
                    .map((child) => (
                      <li key={child.id}>
                        <a
                          href={child.url}
                          target={child.target}
                          className="block rounded-lg p-2 hover:bg-neutral-100"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
