import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import ChatClient from "./chat-client";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return (
    <AdminShell user={user} title="Chat" wide>
      <ChatClient adminName={user.name} />
    </AdminShell>
  );
}
