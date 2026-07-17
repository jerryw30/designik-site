import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../../admin-shell";
import MenuEditor from "../../menu-editor";
import type { MenuItem } from "../../actions";
export default async function EditMenu({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const [menu] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "menus")))
    .limit(1);
  if (!menu) notFound();
  return (
    <AdminShell user={user} title={`Edit menu · ${menu.title}`}>
      <MenuEditor
        id={menu.id}
        initialTitle={menu.title}
        initialItems={(menu.data as { items?: MenuItem[] }).items || []}
      />
    </AdminShell>
  );
}
