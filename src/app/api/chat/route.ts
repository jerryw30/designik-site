import { NextResponse, after } from "next/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { sendNotification } from "@/lib/mailer";
import { generateIkoraReply } from "@/ai/ikora";

export const dynamic = "force-dynamic";
// Headroom for the background IKORA reply after the response is sent.
export const maxDuration = 60;

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
  let conversation: { id: string; name: string | null; email: string | null; aiEnabled: boolean } | undefined;

  // Validate an existing conversation, or create a new one.
  if (conversationId) {
    const [conv] = await db
      .select({
        id: chatConversations.id,
        name: chatConversations.name,
        email: chatConversations.email,
        aiEnabled: chatConversations.aiEnabled,
      })
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);
    if (conv) conversation = conv;
    else conversationId = undefined;
  }
  if (!conversationId || !conversation) {
    const [conv] = await db
      .insert(chatConversations)
      .values({
        name: body.name?.trim().slice(0, 120) || null,
        email: body.email?.trim().slice(0, 200) || null,
      })
      .returning({
        id: chatConversations.id,
        name: chatConversations.name,
        email: chatConversations.email,
        aiEnabled: chatConversations.aiEnabled,
      });
    conversation = conv;
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

  // Notify the team by email (best-effort — never blocks the chat reply).
  const who = body.name?.trim() || conversation.name || body.email?.trim() || conversation.email || "A website visitor";
  await sendNotification({
    subject: `New Designik chat message from ${who}`,
    text: [
      `${who} sent a message via the website chat:`,
      "",
      text,
      "",
      body.email ? `Visitor email: ${body.email}` : null,
      `Reply in the admin: Chat → this conversation.`,
    ]
      .filter(Boolean)
      .join("\n"),
    replyTo: body.email?.trim() || undefined,
  });

  // IKORA answers in the background after the response is sent, so the
  // visitor's send never waits on the model. The widget's poll picks the
  // reply up within a few seconds. Skipped once a human has taken over.
  const conv = conversation;
  if (conv.aiEnabled && process.env.ANTHROPIC_API_KEY) {
    after(async () => {
      try {
        const history = await db
          .select({ sender: chatMessages.sender, body: chatMessages.body })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id))
          .orderBy(asc(chatMessages.createdAt));
        const reply = await generateIkoraReply(history, { name: conv.name, email: conv.email });
        if (!reply) return;
        // A human may have joined while the model was thinking — re-check.
        const [fresh] = await db
          .select({ aiEnabled: chatConversations.aiEnabled })
          .from(chatConversations)
          .where(eq(chatConversations.id, conv.id))
          .limit(1);
        if (!fresh?.aiEnabled) return;
        await db
          .insert(chatMessages)
          .values({ conversationId: conv.id, sender: "assistant", body: reply });
        await db
          .update(chatConversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(chatConversations.id, conv.id));
      } catch (err) {
        console.error("[ikora] background reply failed:", err);
      }
    });
  }

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
