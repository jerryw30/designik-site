import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function chatUser() {
  const user = await currentUser();
  if (!user || !can(user.role, "manage_forms")) return null;
  return user;
}

/** Read a conversation's messages (and clear its unread counter). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await chatUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, id))
    .orderBy(asc(chatMessages.createdAt));

  await db
    .update(chatConversations)
    .set({ unreadAdmin: 0 })
    .where(eq(chatConversations.id, id));

  return NextResponse.json({ messages });
}

/** Admin sends a reply. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await chatUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const text = (body.body || "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "Empty message." }, { status: 422 });

  const [message] = await db
    .insert(chatMessages)
    .values({ conversationId: id, sender: "admin", body: text })
    .returning();

  // Human takeover: the moment an admin replies, IKORA stops answering
  // this conversation (re-enable via PATCH { ai: true }).
  await db
    .update(chatConversations)
    .set({ lastMessageAt: new Date(), aiEnabled: false })
    .where(eq(chatConversations.id, id));

  return NextResponse.json({ message });
}

/** Update conversation flags (mark important / read state). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await chatUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: { important?: boolean; unread?: boolean; ai?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const patch: Partial<{ important: boolean; unreadAdmin: number; aiEnabled: boolean }> = {};
  if (typeof body.important === "boolean") patch.important = body.important;
  if (typeof body.unread === "boolean") patch.unreadAdmin = body.unread ? 1 : 0;
  if (typeof body.ai === "boolean") patch.aiEnabled = body.ai;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const [conversation] = await db
    .update(chatConversations)
    .set(patch)
    .where(eq(chatConversations.id, id))
    .returning();
  if (typeof body.important === "boolean") {
    await logActivity(user, "chat", body.important ? "marked important" : "unmarked important", conversation?.name || `conversation ${id.slice(0, 6)}`, id);
  }
  return NextResponse.json({ conversation });
}

/** Delete a conversation (its messages cascade). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await chatUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [conversation] = await db
    .delete(chatConversations)
    .where(eq(chatConversations.id, id))
    .returning();
  await logActivity(user, "chat", "deleted", conversation?.name || `conversation ${id.slice(0, 6)}`, id);
  return NextResponse.json({ ok: true });
}
