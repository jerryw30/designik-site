import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { chatConversations } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Bulk conversation actions: delete several at once, mark spam, mark read. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || !can(user.role, "manage_forms")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const ids = (body.ids || []).filter((v) => typeof v === "string").slice(0, 200);
  const action = body.action;
  if (!ids.length || !action) {
    return NextResponse.json({ error: "ids and action are required." }, { status: 422 });
  }

  if (action === "delete") {
    await db.delete(chatConversations).where(inArray(chatConversations.id, ids));
    await logActivity(user, "chat", "bulk deleted", `${ids.length} conversations`, ids[0]);
  } else if (action === "spam") {
    await db
      .update(chatConversations)
      .set({ status: "SPAM", aiEnabled: false, unreadAdmin: 0 })
      .where(inArray(chatConversations.id, ids));
    await logActivity(user, "chat", "marked spam", `${ids.length} conversations`, ids[0]);
  } else if (action === "not-spam") {
    await db
      .update(chatConversations)
      .set({ status: "OPEN" })
      .where(inArray(chatConversations.id, ids));
  } else if (action === "read") {
    await db
      .update(chatConversations)
      .set({ unreadAdmin: 0 })
      .where(inArray(chatConversations.id, ids));
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 422 });
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
