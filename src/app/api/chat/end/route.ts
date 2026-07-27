import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Visitor ends the chat, optionally leaving a 1-5 rating of the bot.
 * Marks the conversation CLOSED; the visitor can start a fresh one after.
 */
export async function POST(request: Request) {
  let body: { conversationId?: string; rating?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.conversationId) return NextResponse.json({ ok: true }); // nothing to close

  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;

  await db
    .update(chatConversations)
    .set({ status: "CLOSED", ...(rating ? { rating } : {}) })
    .where(eq(chatConversations.id, body.conversationId));

  return NextResponse.json({ ok: true });
}
