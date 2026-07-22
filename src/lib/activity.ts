import { db } from "@/db";
import { activityLog } from "@/db/schema";

type Actor = { id: string; name: string; role: string };

/**
 * Append an entry to the admin audit trail. Never throws — a logging
 * failure must not break the action being logged.
 */
export async function logActivity(
  actor: Actor,
  module: string,
  action: string,
  targetLabel = "",
  targetId?: string,
) {
  try {
    await db.insert(activityLog).values({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      module,
      action,
      targetLabel,
      targetId: targetId || null,
    });
  } catch {
    /* ignore */
  }
}
