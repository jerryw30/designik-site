import { NextResponse } from "next/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Visitor sends a message (creating the conversation on first contact). */
export async function POST(request: Request) {
  let body: { conversationId?: string; name?: string; email?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const text = (body.body || "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 422 });

  let conversationId = body.conversationId;

  // Validate an existing conversation, or create a new one.
  if (conversationId) {
    const [conv] = await db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);
    if (!conv) conversationId = undefined;
  }
  if (!conversationId) {
    const [conv] = await db
      .insert(chatConversations)
      .values({
        name: body.name?.trim().slice(0, 120) || null,
        email: body.email?.trim().slice(0, 200) || null,
      })
      .returning({ id: chatConversations.id });
    conversationId = conv.id;
  }

  const [message] = await db
    .insert(chatMessages)
    .values({ conversationId, sender: "visitor", body: text })
    .returning();

  await db
    .update(chatConversations)
    .set({
      lastMessageAt: new Date(),
      unreadAdmin: sql`${chatConversations.unreadAdmin} + 1`,
      status: "OPEN",
    })
    .where(eq(chatConversations.id, conversationId));

  return NextResponse.json({ conversationId, message });
}

/** Visitor polls for new messages after a timestamp. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const after = searchParams.get("after");
  if (!conversationId) return NextResponse.json({ messages: [] });

  const conditions = [eq(chatMessages.conversationId, conversationId)];
  if (after) conditions.push(gt(chatMessages.createdAt, new Date(after)));

  const messages = await db
    .select()
    .from(chatMessages)
    .where(and(...conditions))
    .orderBy(asc(chatMessages.createdAt));

  return NextResponse.json({ messages });
}
