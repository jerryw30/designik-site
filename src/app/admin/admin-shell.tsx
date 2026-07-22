import { count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, leads } from "@/db/schema";
import { logout } from "./actions";
import { AdminChrome } from "./admin-chrome";

async function badgeCounts() {
  try {
    const [[newLeads], [unreadChats]] = await Promise.all([
      db.select({ value: count() }).from(leads).where(eq(leads.status, "NEW")),
      db.select({ value: count() }).from(chatConversations).where(gt(chatConversations.unreadAdmin, 0)),
    ]);
    return { leads: newLeads.value || 0, chat: unreadChats.value || 0 };
  } catch {
    return {};
  }
}

export async function AdminShell({
  user,
  title,
  children,
  wide = false,
}: {
  user: { name: string; role: string };
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const badges = await badgeCounts();
  return (
    <AdminChrome user={user} title={title} badges={badges} wide={wide} logoutAction={logout}>
      {children}
    </AdminChrome>
  );
}
