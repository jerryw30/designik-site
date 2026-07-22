import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** List conversations, newest activity first. */
export async function GET() {
  const user = await currentUser();
  if (!user || !can(user.role, "manage_forms"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await db
    .select()
    .from(chatConversations)
    .orderBy(desc(chatConversations.lastMessageAt));

  return NextResponse.json({ conversations });
}
