import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations, chatMessages } from "@/db/schema";
import { sendNotification } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const CALENDLY_URL = "https://calendly.com/luke-designingenious/";

/**
 * Visitor asks to talk with a real person. Captures name + email, flips the
 * conversation to human mode (IKORA stops answering), notifies the team by
 * email, and drops a confirmation into the thread.
 */
export async function POST(request: Request) {
  let body: { conversationId?: string; name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 120);
  const email = (body.email || "").trim().slice(0, 200);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });

  // Reuse the visitor's conversation, or start one for a direct request.
  let conversationId = body.conversationId;
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
      .values({ name, email })
      .returning({ id: chatConversations.id });
    conversationId = conv.id;
  }

  // Human mode: the team owns this conversation now.
  await db
    .update(chatConversations)
    .set({
      name,
      email,
      aiEnabled: false,
      status: "OPEN",
      lastMessageAt: new Date(),
      unreadAdmin: sql`${chatConversations.unreadAdmin} + 1`,
    })
    .where(eq(chatConversations.id, conversationId));

  // Marker + confirmation live in the thread so both sides see the handoff.
  await db.insert(chatMessages).values({
    conversationId,
    sender: "visitor",
    body: `[Requested to connect with the team — ${name}, ${email}]`,
  });
  const [confirmation] = await db
    .insert(chatMessages)
    .values({
      conversationId,
      sender: "assistant",
      body: `Thanks ${name}! The Designik team has been notified and a real person will reply right here or at ${email}. You can keep chatting in the meantime, or book a call with Luke directly: ${CALENDLY_URL}`,
    })
    .returning();

  await sendNotification({
    subject: `${name} wants to chat with a real person`,
    text: [
      `${name} asked to connect with the team via the website chat.`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "IKORA has been turned off for this conversation — a human needs to reply.",
      "Reply in the admin: Chat → this conversation (or email them directly).",
    ].join("\n"),
    replyTo: email,
  });

  return NextResponse.json({ ok: true, conversationId, message: confirmation });
}
