"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages, revisions, sections } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/permissions";
type Snapshot = Record<string, unknown>;
export async function restoreRevision(id: string) {
  const user = await requirePermission("edit_pages");
  const [revision] = await db
    .select()
    .from(revisions)
    .where(eq(revisions.id, id))
    .limit(1);
  if (!revision) throw new Error("Revision not found");
  const snapshot = revision.snapshot as Snapshot;
  if (
    typeof snapshot.sectionId === "string" &&
    snapshot.content &&
    typeof snapshot.content === "object"
  ) {
    const [section] = await db
      .select()
      .from(sections)
      .where(
        and(
          eq(sections.id, snapshot.sectionId),
          eq(sections.pageId, revision.pageId),
        ),
      )
      .limit(1);
    if (!section) throw new Error("Section for this revision no longer exists");
    await db
      .insert(revisions)
      .values({
        pageId: revision.pageId,
        authorId: user.id,
        label: `Safety backup before restoring ${revision.label || "revision"}`,
        snapshot: { sectionId: section.id, content: section.publishedContent },
      });
    await db
      .update(sections)
      .set({
        draftContent: snapshot.content,
        publishedContent: snapshot.content,
        updatedAt: new Date(),
      })
      .where(eq(sections.id, section.id));
  } else if (
    snapshot.id === revision.pageId ||
    snapshot.title ||
    snapshot.slug
  ) {
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, revision.pageId))
      .limit(1);
    if (!page) throw new Error("Page for this revision no longer exists");
    await db
      .insert(revisions)
      .values({
        pageId: page.id,
        authorId: user.id,
        label: `Safety backup before restoring ${revision.label || "revision"}`,
        snapshot: page,
      });
    const allowedStatus = [
      "DRAFT",
      "PUBLISHED",
      "SCHEDULED",
      "ARCHIVED",
    ].includes(String(snapshot.status))
      ? (snapshot.status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED")
      : page.status;
    await db
      .update(pages)
      .set({
        title: typeof snapshot.title === "string" ? snapshot.title : page.title,
        slug: typeof snapshot.slug === "string" ? snapshot.slug : page.slug,
        status: allowedStatus,
        seo:
          snapshot.seo && typeof snapshot.seo === "object"
            ? snapshot.seo
            : page.seo,
        settings:
          snapshot.settings && typeof snapshot.settings === "object"
            ? snapshot.settings
            : page.settings,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, page.id));
  } else throw new Error("Unsupported legacy revision format");
  await logActivity(user, "pages", "restored revision", revision.label || id, id);
  revalidatePath("/admin/revisions");
  revalidatePath(`/admin/pages/${revision.pageId}/builder`);
  revalidatePath(`/admin/pages/${revision.pageId}/preview`);
  revalidatePath("/");
  redirect(`/admin/revisions?restored=${id}`);
}
export async function deleteRevision(id: string) {
  const user = await requirePermission("edit_pages");
  const [revision] = await db
    .select({ label: revisions.label })
    .from(revisions)
    .where(eq(revisions.id, id))
    .limit(1);
  if (!revision) return;
  await db.delete(revisions).where(eq(revisions.id, id));
  await logActivity(
    user,
    "pages",
    "deleted revision",
    revision.label || id,
    id,
  );
  revalidatePath("/admin/revisions");
}
