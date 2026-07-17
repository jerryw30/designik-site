"use server";

import { compare, hash } from "bcryptjs";
import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminResources, pages, revisions, sections, users } from "@/db/schema";
import { createSession, currentUser, destroySession } from "@/lib/auth";
import { heroContent } from "@/cms/defaults";
import {
  sectionContent,
  type EditableSectionType,
} from "@/cms/section-defaults";

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
          await db
            .insert(sections)
            .values({
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
  await db
    .insert(sections)
    .values(
      names.map((name, position) => ({
        pageId: page.id,
        name,
        type: name.toLowerCase().replaceAll(" ", "-"),
        position,
      })),
    );
  return page.id;
}

export async function updatePage(form: FormData) {
  await requireUser();
  const id = String(form.get("id"));
  const title = String(form.get("title") || "").trim();
  const slug = String(form.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  if (id && title && slug)
    await db
      .update(pages)
      .set({ title, slug, updatedAt: new Date() })
      .where(eq(pages.id, id));
  revalidatePath("/admin/pages");
}

async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
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
  revalidatePath("/admin/pages");
}

export async function setPageStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  const user = await requireUser();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return;
  await db
    .insert(revisions)
    .values({
      pageId: id,
      authorId: user.id,
      label:
        status === "PUBLISHED" ? "Page published" : "Page changed to draft",
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
  revalidatePath("/admin/pages");
  revalidatePath("/");
}

export async function trashPage(id: string) {
  await requireUser();
  await db
    .update(pages)
    .set({ deletedAt: new Date(), status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(pages.id, id));
  revalidatePath("/admin/pages");
}
export async function restorePage(id: string) {
  await requireUser();
  await db
    .update(pages)
    .set({ deletedAt: null, status: "DRAFT", updatedAt: new Date() })
    .where(eq(pages.id, id));
  revalidatePath("/admin/pages");
}
export async function deletePageForever(id: string) {
  await requireUser();
  await db
    .delete(pages)
    .where(and(eq(pages.id, id), isNotNull(pages.deletedAt)));
  revalidatePath("/admin/pages");
}

export async function getHomepageSections(pageId: string) {
  return db
    .select()
    .from(sections)
    .where(eq(sections.pageId, pageId))
    .orderBy(asc(sections.position));
}

export async function saveHeroDraft(sectionId: string, value: unknown) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const content = heroContent(value);
  await db
    .update(sections)
    .set({ draftContent: content, updatedAt: new Date() })
    .where(eq(sections.id, sectionId));
  return content;
}

export async function publishHero(sectionId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1);
  if (!section) throw new Error("Section not found");
  const content = heroContent(section.draftContent);
  // The Neon HTTP driver used by Vercel does not support SQL transactions.
  // Preserve the old published value first, then publish the validated draft.
  await db
    .insert(revisions)
    .values({
      pageId: section.pageId,
      authorId: user.id,
      label: "Published Hero",
      snapshot: { sectionId, content: section.publishedContent },
    });
  await db
    .update(sections)
    .set({ publishedContent: content, updatedAt: new Date() })
    .where(eq(sections.id, sectionId));
  revalidatePath("/");
  return content;
}

export async function reorderSections(pageId: string, orderedIds: string[]) {
  await requireUser();
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
  revalidatePath("/");
}

export async function addSection(pageId: string, type: string) {
  await requireUser();
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
  await db
    .insert(sections)
    .values({
      pageId,
      type,
      name,
      position: current.length,
      draftContent,
      publishedContent: { _cmsPublished: false },
    });
  revalidatePath(`/admin/pages/${pageId}/builder`);
}

export async function duplicateSection(sectionId: string) {
  await requireUser();
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
  await db
    .insert(sections)
    .values({
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
  revalidatePath(`/admin/pages/${source.pageId}/builder`);
}

export async function deleteSection(sectionId: string) {
  await requireUser();
  const [source] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1);
  if (!source || source.locked || ["header", "footer"].includes(source.type))
    return;
  await db.delete(sections).where(eq(sections.id, sectionId));
  revalidatePath(`/admin/pages/${source.pageId}/builder`);
}
export async function setSectionState(
  sectionId: string,
  field: "visible" | "locked",
  value: boolean,
) {
  await requireUser();
  await db
    .update(sections)
    .set(
      field === "visible"
        ? { visible: value, updatedAt: new Date() }
        : { locked: value, updatedAt: new Date() },
    )
    .where(eq(sections.id, sectionId));
}

export async function saveSectionDraft(
  sectionId: string,
  type: EditableSectionType,
  value: unknown,
) {
  await requireUser();
  const content = sectionContent(type, value);
  await db
    .update(sections)
    .set({ draftContent: content, updatedAt: new Date() })
    .where(and(eq(sections.id, sectionId), eq(sections.type, type)));
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
  await db
    .insert(revisions)
    .values({
      pageId: section.pageId,
      authorId: user.id,
      label: `Published ${section.name}`,
      snapshot: { sectionId, content: section.publishedContent },
    });
  await db
    .update(sections)
    .set({ publishedContent: content, updatedAt: new Date() })
    .where(eq(sections.id, sectionId));
  revalidatePath("/");
  return content;
}

export async function copySectionToPage(
  sourceSectionId: string,
  pageId: string,
) {
  await requireUser();
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
  await db
    .insert(sections)
    .values({
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
  await db
    .insert(adminResources)
    .values({
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
  revalidatePath("/admin/saved-sections");
}

export async function addSavedSectionToPage(
  templateId: string,
  pageId: string,
) {
  await requireUser();
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
  await db
    .insert(sections)
    .values({
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
  revalidatePath(`/admin/pages/${pageId}/builder`);
}
