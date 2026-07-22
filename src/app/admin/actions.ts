"use server";

import { compare, hash } from "bcryptjs";
import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminResources, pages, revisions, sections, users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { heroContent } from "@/cms/defaults";
import {
  sectionContent,
  sectionDefaults,
  type EditableSectionType,
} from "@/cms/section-defaults";
import { designValue } from "@/cms/design-resources";

export async function setupAdmin(form: FormData) {
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (total) redirect("/admin/login");
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10)
    redirect("/admin/setup?error=invalid");
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: await hash(password, 12),
      role: "SUPER_ADMIN",
    })
    .returning({ id: users.id });
  await createSession(user.id);
  redirect("/admin");
}

export async function login(form: FormData) {
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user || !user.active || !(await compare(password, user.passwordHash)))
    redirect("/admin/login?error=invalid");
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function ensureHomepage() {
  const [existing] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, "home"))
    .limit(1);
  if (existing) {
    const current = await db
      .select()
      .from(sections)
      .where(eq(sections.pageId, existing.id))
      .orderBy(asc(sections.position));
    const marqueeCount = current.filter(
      (item) => item.type === "agency-marquee",
    ).length;
    if (marqueeCount < 5) {
      const desired = [
        "header",
        "hero",
        "agency-marquee",
        "stats",
        "about",
        "agency-marquee",
        "services",
        "brand-heights",
        "experience",
        "agency-marquee",
        "portfolio",
        "team",
        "interactive",
        "agency-marquee",
        "testimonials",
        "agency-marquee",
        "footer",
      ];
      const buckets = new Map<string, typeof current>();
      current.forEach((item) =>
        buckets.set(item.type, [...(buckets.get(item.type) || []), item]),
      );
      for (const [position, type] of desired.entries()) {
        const item = buckets.get(type)?.shift();
        if (item)
          await db
            .update(sections)
            .set({ position })
            .where(eq(sections.id, item.id));
        else
          await db.insert(sections).values({
            pageId: existing.id,
            type,
            name:
              type === "agency-marquee"
                ? `Agency Marquee ${position}`
                : type
                    .replaceAll("-", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
            position,
          });
      }
    }
    return existing.id;
  }
  const [page] = await db
    .insert(pages)
    .values({
      title: "Home",
      slug: "home",
      status: "PUBLISHED",
      publishedAt: new Date(),
      seo: { title: "Designik — Creative Agency" },
    })
    .returning({ id: pages.id });
  const names = [
    "Header",
    "Hero",
    "Agency Marquee",
    "Stats",
    "About",
    "Agency Marquee",
    "Services",
    "Brand Heights",
    "Experience",
    "Agency Marquee",
    "Portfolio",
    "Team",
    "Interactive",
    "Agency Marquee",
    "Testimonials",
    "Agency Marquee",
    "Footer",
  ];
  await db.insert(sections).values(
    names.map((name, position) => ({
      pageId: page.id,
      name,
      type: name.toLowerCase().replaceAll(" ", "-"),
      position,
    })),
  );
  return page.id;
}

/** Public URL for a page slug (front page lives at "/"). */
function publicPagePath(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}

/** Return `slug` or, when another page already uses it, a deduped variant. */
async function uniquePageSlug(slug: string, excludeId: string) {
  let candidate = slug;
  for (let n = 2; n < 100; n += 1) {
    const [taken] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.slug, candidate))
      .limit(1);
    if (!taken || taken.id === excludeId) return candidate;
    candidate = `${slug}-${n}`;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export async function updatePage(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id"));
  const title = String(form.get("title") || "").trim();
  let slug = String(form.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  const status = String(form.get("status") || "");
  const seo = {
    focusKeyphrase: String(form.get("focusKeyphrase") || "").trim(),
    title: String(form.get("seoTitle") || "").trim(),
    description: String(form.get("seoDescription") || "").trim(),
    canonical: String(form.get("canonical") || "").trim(),
    noindex: form.get("noindex") === "on",
    ogTitle: String(form.get("ogTitle") || "").trim(),
    ogDescription: String(form.get("ogDescription") || "").trim(),
    ogImage: String(form.get("ogImage") || "").trim(),
    xTitle: String(form.get("xTitle") || "").trim(),
    xDescription: String(form.get("xDescription") || "").trim(),
  };
  if (id && title && slug) {
    const [existing] = await db
      .select({ slug: pages.slug, publishedAt: pages.publishedAt })
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);
    if (!existing) return;
    // The front page is looked up by the "home" slug — never rename it.
    if (existing.slug === "home") slug = "home";
    else slug = await uniquePageSlug(slug, id);
    const statusChange =
      status === "PUBLISHED" || status === "DRAFT"
        ? {
            status: status as "PUBLISHED" | "DRAFT",
            publishedAt:
              status === "PUBLISHED" ? new Date() : existing.publishedAt,
          }
        : {};
    await db
      .update(pages)
      .set({ title, slug, seo, ...statusChange, updatedAt: new Date() })
      .where(eq(pages.id, id));
    await logActivity(user, "pages", "updated", title, id);
    revalidatePath(`/admin/pages/${id}/edit`);
    revalidatePath(publicPagePath(slug));
    if (existing.slug !== slug) revalidatePath(publicPagePath(existing.slug));
  }
  revalidatePath("/admin/pages");
}

async function requireUser() {
  return requirePermission("edit_pages");
}

export async function createPage(form: FormData) {
  const user = await requireUser();
  const title =
    String(form.get("title") || "Untitled page").trim() || "Untitled page";
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "page";
  const slug = `${base}-${Date.now().toString(36)}`;
  const [page] = await db
    .insert(pages)
    .values({ title, slug, authorId: user.id })
    .returning({ id: pages.id });
  await logActivity(user, "pages", "created", title, page.id);
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${page.id}/builder`);
}

export async function duplicatePage(id: string) {
  const user = await requireUser();
  const [source] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);
  if (!source) return;
  const [copy] = await db
    .insert(pages)
    .values({
      title: `${source.title} Copy`,
      slug: `${source.slug}-copy-${Date.now().toString(36)}`,
      status: "DRAFT",
      authorId: user.id,
      seo: source.seo,
      settings: source.settings,
    })
    .returning({ id: pages.id });
  const sourceSections = await db
    .select()
    .from(sections)
    .where(eq(sections.pageId, id));
  if (sourceSections.length)
    await db.insert(sections).values(
      sourceSections.map((section) => ({
        pageId: copy.id,
        type: section.type,
        name: section.name,
        position: section.position,
        content: section.content,
        draftContent: section.draftContent,
        publishedContent: section.publishedContent,
        styles: section.styles,
        responsive: section.responsive,
        animation: section.animation,
        visible: section.visible,
        locked: section.locked,
      })),
    );
  await logActivity(user, "pages", "duplicated", source.title, copy.id);
  revalidatePath("/admin/pages");
}

export async function setPageStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  const user = await requireUser();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return;
  await db.insert(revisions).values({
    pageId: id,
    authorId: user.id,
    label: status === "PUBLISHED" ? "Page published" : "Page changed to draft",
    snapshot: page,
  });
  await db
    .update(pages)
    .set({
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : page.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id));
  await logActivity(
    user,
    "pages",
    status === "PUBLISHED" ? "published" : "drafted",
    page.title,
    id,
  );
  revalidatePath("/admin/pages");
  revalidatePath(publicPagePath(page.slug));
  revalidatePath("/");
}

export async function trashPage(id: string) {
  const user = await requireUser();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  // The front page can never be trashed.
  if (!page || page.slug === "home") return;
  await db
    .update(pages)
    .set({ deletedAt: new Date(), status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(pages.id, id));
  await logActivity(user, "pages", "trashed", page.title, id);
  revalidatePath("/admin/pages");
  revalidatePath(publicPagePath(page.slug));
}
/** Trash from the edit screen, then land back on the list. */
export async function trashPageFromEditor(id: string) {
  await trashPage(id);
  redirect("/admin/pages");
}
export async function restorePage(id: string) {
  const user = await requireUser();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return;
  await db
    .update(pages)
    .set({ deletedAt: null, status: "DRAFT", updatedAt: new Date() })
    .where(eq(pages.id, id));
  await logActivity(user, "pages", "restored", page.title, id);
  revalidatePath("/admin/pages");
}
export async function deletePageForever(id: string) {
  const user = await requireUser();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page || page.slug === "home" || !page.deletedAt) return;
  await db
    .delete(pages)
    .where(and(eq(pages.id, id), isNotNull(pages.deletedAt)));
  await logActivity(user, "pages", "deleted", page.title, id);
  revalidatePath("/admin/pages");
}

/** WordPress-style bulk actions from the Pages list table. */
export async function bulkPages(form: FormData) {
  const user = await requireUser();
  // Two selects (tablenav top + bottom) can submit; use whichever is set.
  const pick = (name: string) => {
    const value = String(form.get(name) || "");
    return value && value !== "-1" ? value : "";
  };
  const action = pick("bulk") || pick("bulk2");
  const ids = form.getAll("ids").map(String).filter(Boolean);
  if (!action || ids.length === 0) return;
  const touched: string[] = [];
  for (const id of ids) {
    const [row] = await db.select().from(pages).where(eq(pages.id, id));
    if (!row) continue;
    if (action === "trash" && row.slug !== "home") {
      await db.update(pages).set({ deletedAt: new Date(), status: "ARCHIVED", updatedAt: new Date() }).where(eq(pages.id, id));
      await logActivity(user, "pages", "trashed", row.title, id);
      touched.push(row.slug);
    } else if (action === "restore") {
      await db.update(pages).set({ deletedAt: null, status: "DRAFT", updatedAt: new Date() }).where(eq(pages.id, id));
      await logActivity(user, "pages", "restored", row.title, id);
    } else if (action === "delete" && row.slug !== "home" && row.deletedAt) {
      await db.delete(pages).where(eq(pages.id, id));
      await logActivity(user, "pages", "deleted", row.title, id);
    } else if (action === "publish") {
      await db.update(pages).set({ status: "PUBLISHED", publishedAt: new Date(), updatedAt: new Date() }).where(eq(pages.id, id));
      await logActivity(user, "pages", "published", row.title, id);
      touched.push(row.slug);
    } else if (action === "draft") {
      await db.update(pages).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(pages.id, id));
      await logActivity(user, "pages", "drafted", row.title, id);
      touched.push(row.slug);
    }
  }
  revalidatePath("/admin/pages");
  revalidatePath("/");
  for (const slug of touched) revalidatePath(publicPagePath(slug));
}

export async function saveHeroDraft(sectionId: string, value: unknown) {
  const user = await requirePermission("edit_pages");
  const content = heroContent(value);
  await db
    .update(sections)
    .set({ draftContent: content, updatedAt: new Date() })
    .where(eq(sections.id, sectionId));
  await logActivity(user, "pages", "updated", "Hero draft", sectionId);
  return content;
}

export async function publishHero(sectionId: string) {
  const user = await requirePermission("edit_pages");
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1);
  if (!section) throw new Error("Section not found");
  const content = heroContent(section.draftContent);
  // The Neon HTTP driver used by Vercel does not support SQL transactions.
  // Preserve the old published value first, then publish the validated draft.
  await db.insert(revisions).values({
    pageId: section.pageId,
    authorId: user.id,
    label: "Published Hero",
    snapshot: { sectionId, content: section.publishedContent },
  });
  await db
    .update(sections)
    .set({ publishedContent: content, updatedAt: new Date() })
    .where(eq(sections.id, sectionId));
  await logActivity(user, "pages", "published", section.name, sectionId);
  revalidatePath("/");
  return content;
}

export async function reorderSections(pageId: string, orderedIds: string[]) {
  const user = await requireUser();
  const owned = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.pageId, pageId));
  const allowed = new Set(owned.map((item) => item.id));
  if (
    orderedIds.length !== owned.length ||
    orderedIds.some((id) => !allowed.has(id))
  )
    throw new Error("Invalid section order");
  await Promise.all(
    orderedIds.map((id, position) =>
      db
        .update(sections)
        .set({ position, updatedAt: new Date() })
        .where(and(eq(sections.id, id), eq(sections.pageId, pageId))),
    ),
  );
  await logActivity(
    user,
    "pages",
    "reordered",
    `${orderedIds.length} sections`,
    pageId,
  );
  revalidatePath("/");
}

export async function addSection(pageId: string, type: string) {
  const user = await requireUser();
  const allowed = new Set([
    "agency-marquee",
    "stats",
    "about",
    "services",
    "brand-heights",
    "experience",
    "portfolio",
    "team",
    "interactive",
    "testimonials",
    "widgets",
  ]);
  if (!allowed.has(type)) throw new Error("Unknown section type");
  const current = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.pageId, pageId));
  const name = type
    .replaceAll("-", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const draftContent = sectionContent(type as EditableSectionType, {});
  await db.insert(sections).values({
    pageId,
    type,
    name,
    position: current.length,
    draftContent,
    publishedContent: { _cmsPublished: false },
  });
  await logActivity(user, "pages", "created", `${name} section`, pageId);
  revalidatePath(`/admin/pages/${pageId}/builder`);
}

export async function duplicateSection(sectionId: string) {
  const user = await requireUser();
  const [source] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1);
  if (!source) return;
  const current = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.pageId, source.pageId));
  await db.insert(sections).values({
    pageId: source.pageId,
    type: source.type,
    name: `${source.name} Copy`,
    position: current.length,
    content: source.content,
    draftContent: source.draftContent,
    publishedContent: source.publishedContent,
    styles: source.styles,
    responsive: source.responsive,
    animation: source.animation,
    visible: source.visible,
    locked: false,
  });
  await logActivity(user, "pages", "duplicated", source.name, sectionId);
  revalidatePath(`/admin/pages/${source.pageId}/builder`);
}

export async function deleteSection(sectionId: string) {
  const user = await requireUser();
  const [source] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1);
  if (!source || source.locked || ["header", "footer"].includes(source.type))
    return;
  await db.delete(sections).where(eq(sections.id, sectionId));
  await logActivity(user, "pages", "deleted", source.name, sectionId);
  revalidatePath(`/admin/pages/${source.pageId}/builder`);
}
export async function setSectionState(
  sectionId: string,
  field: "visible" | "locked",
  value: boolean,
) {
  const user = await requireUser();
  await db
    .update(sections)
    .set(
      field === "visible"
        ? { visible: value, updatedAt: new Date() }
        : { locked: value, updatedAt: new Date() },
    )
    .where(eq(sections.id, sectionId));
  await logActivity(user, "pages", "updated", sectionId, sectionId);
}

export async function saveSectionDraft(
  sectionId: string,
  type: EditableSectionType,
  value: unknown,
) {
  const user = await requireUser();
  const content = sectionContent(type, value);
  await db
    .update(sections)
    .set({ draftContent: content, updatedAt: new Date() })
    .where(and(eq(sections.id, sectionId), eq(sections.type, type)));
  await logActivity(user, "pages", "updated", `${type} draft`, sectionId);
  return content;
}
export async function publishSection(
  sectionId: string,
  type: EditableSectionType,
) {
  const user = await requireUser();
  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.type, type)))
    .limit(1);
  if (!section) throw new Error("Section not found");
  const content = sectionContent(type, section.draftContent);
  await db.insert(revisions).values({
    pageId: section.pageId,
    authorId: user.id,
    label: `Published ${section.name}`,
    snapshot: { sectionId, content: section.publishedContent },
  });
  await db
    .update(sections)
    .set({ publishedContent: content, updatedAt: new Date() })
    .where(eq(sections.id, sectionId));
  await logActivity(user, "pages", "published", section.name, sectionId);
  revalidatePath("/");
  return content;
}

export async function copySectionToPage(
  sourceSectionId: string,
  pageId: string,
) {
  const user = await requireUser();
  const [source] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sourceSectionId))
    .limit(1);
  if (!source) return;
  const current = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.pageId, pageId));
  await db.insert(sections).values({
    pageId,
    type: source.type,
    name: `${source.name} Copy`,
    position: current.length,
    content: source.content,
    draftContent: source.draftContent,
    publishedContent: { _cmsPublished: false },
    styles: source.styles,
    responsive: source.responsive,
    animation: source.animation,
    visible: source.visible,
    locked: false,
  });
  await logActivity(user, "pages", "duplicated", source.name, pageId);
  revalidatePath(`/admin/pages/${pageId}/builder`);
}

export async function saveSectionAsTemplate(sectionId: string) {
  const user = await requireUser();
  const [source] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1);
  if (!source) return;
  await db.insert(adminResources).values({
    module: "saved-sections",
    title: source.name,
    slug: `${source.type}-${Date.now().toString(36)}`,
    status: "PUBLISHED",
    createdBy: user.id,
    data: {
      type: source.type,
      name: source.name,
      content: source.content,
      draftContent: source.draftContent,
      publishedContent: source.publishedContent,
      styles: source.styles,
      responsive: source.responsive,
      animation: source.animation,
      visible: source.visible,
    },
  });
  await logActivity(user, "saved-sections", "created", source.name, sectionId);
  revalidatePath("/admin/saved-sections");
}

export async function addSavedSectionToPage(
  templateId: string,
  pageId: string,
) {
  const user = await requireUser();
  const [template] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.id, templateId),
        eq(adminResources.module, "saved-sections"),
      ),
    )
    .limit(1);
  if (!template) return;
  const data = template.data as Record<string, unknown>;
  const current = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.pageId, pageId));
  await db.insert(sections).values({
    pageId,
    type: String(data.type || "widgets"),
    name: String(data.name || template.title),
    position: current.length,
    content: (data.content || {}) as Record<string, unknown>,
    draftContent: (data.draftContent || data.content || {}) as Record<
      string,
      unknown
    >,
    publishedContent: { _cmsPublished: false },
    styles: (data.styles || {}) as Record<string, unknown>,
    responsive: (data.responsive || {}) as Record<string, unknown>,
    animation: (data.animation || {}) as Record<string, unknown>,
    visible: data.visible !== false,
    locked: false,
  });
  await logActivity(user, "pages", "created", template.title, pageId);
  revalidatePath(`/admin/pages/${pageId}/builder`);
}

export async function applyPageTemplate(templateId: string, pageId: string) {
  const user = await requireUser();
  const [template] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.id, templateId),
        eq(adminResources.module, "templates"),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!template) return;
  const value = designValue("templates", template.data);
  const source = (value.published || value.draft).content.sections;
  if (!Array.isArray(source) || !source.length) return;
  const current = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.pageId, pageId));
  let position = current.length;
  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const data = item as Record<string, unknown>;
    const type = String(data.type || "widgets") as EditableSectionType;
    if (!(type in sectionDefaults) || ["header", "footer"].includes(type))
      continue;
    const content = sectionContent(type, data.content);
    await db.insert(sections).values({
      pageId,
      type,
      name: String(data.name || `${type.replaceAll("-", " ")} section`),
      position: position++,
      content,
      draftContent: content,
      publishedContent: { _cmsPublished: false },
      visible: true,
      locked: false,
    });
  }
  await logActivity(user, "pages", "updated", template.title, pageId);
  revalidatePath(`/admin/pages/${pageId}/builder`);
}
