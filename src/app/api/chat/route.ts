import { NextResponse, after } from "next/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { sendNotification } from "@/lib/mailer";
import { generateIkoraReply, ikoraProvider } from "@/ai/ikora";

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
  const provider = ikoraProvider();
  const aiActive = conv.aiEnabled && provider !== null;
  if (!provider) {
    console.warn("[ikora] SKIPPED — no AI key set (add ANTHROPIC_API_KEY or GROQ_API_KEY)");
  } else if (!conv.aiEnabled) {
    console.info(`[ikora] skipped — human has taken over conversation ${conv.id.slice(0, 8)}`);
  }
  if (aiActive) {
    after(async () => {
      const started = Date.now();
      try {
        const history = await db
          .select({ id: chatMessages.id, sender: chatMessages.sender, body: chatMessages.body })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id))
          .orderBy(asc(chatMessages.createdAt));
        // Freshness guard: if the visitor already sent a newer message, let
        // that request's run answer with the fuller context instead of
        // producing two replies.
        if (history[history.length - 1]?.id !== message.id) {
          console.info("[ikora] superseded by a newer message — skipping");
          return;
        }
        const reply = await generateIkoraReply(history, { name: conv.name, email: conv.email });
        if (!reply) {
          console.warn(`[ikora] no reply generated (${Date.now() - started}ms) — see earlier error for cause`);
          return;
        }
        // A human may have joined while the model was thinking — re-check.
        const [fresh] = await db
          .select({ aiEnabled: chatConversations.aiEnabled })
          .from(chatConversations)
          .where(eq(chatConversations.id, conv.id))
          .limit(1);
        if (!fresh?.aiEnabled) {
          console.info("[ikora] human took over mid-generation — discarding reply");
          return;
        }
        await db
          .insert(chatMessages)
          .values({ conversationId: conv.id, sender: "assistant", body: reply });
        await db
          .update(chatConversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(chatConversations.id, conv.id));
        console.info(`[ikora] replied in ${Date.now() - started}ms (${reply.length} chars)`);
      } catch (err) {
        console.error("[ikora] background reply failed:", err);
      }
    });
  }

  return NextResponse.json({ conversationId, message, aiActive });
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
