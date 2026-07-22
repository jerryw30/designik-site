import { db } from "@/db";
import {
  adminResources,
  mediaAssets,
  pages,
  sections,
  siteSettings,
} from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!can(user.role, "manage_settings"))
    return new Response("Forbidden", { status: 403 });
  const [pageRows, sectionRows, resourceRows, settingRows, mediaRows] =
    await Promise.all([
      db.select().from(pages),
      db.select().from(sections),
      db.select().from(adminResources),
      db.select().from(siteSettings),
      db.select().from(mediaAssets),
    ]);
  const backup = {
    format: "designik-cms-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    pages: pageRows,
    sections: sectionRows,
    resources: resourceRows,
    settings: settingRows,
    media: mediaRows,
  };
  await logActivity(user, "tools", "exported backup");
  return new Response(JSON.stringify(backup), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="designik-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
