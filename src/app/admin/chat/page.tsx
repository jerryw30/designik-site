import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import ChatClient from "./chat-client";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "chat")) redirect("/admin");
  return (
    <AdminShell user={user} title="Chat" wide>
      <ChatClient adminName={user.name} />
    </AdminShell>
  );
}
