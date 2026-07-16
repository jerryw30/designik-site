"use server";

import { compare, hash } from "bcryptjs";
import { asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pages, revisions, sections, users } from "@/db/schema";
import { createSession, currentUser, destroySession } from "@/lib/auth";
import { heroContent } from "@/cms/defaults";

export async function setupAdmin(form: FormData) {
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (total) redirect("/admin/login");
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10) redirect("/admin/setup?error=invalid");
  const [user] = await db.insert(users).values({ name, email, passwordHash: await hash(password, 12), role: "SUPER_ADMIN" }).returning({ id: users.id });
  await createSession(user.id);
  redirect("/admin");
}

export async function login(form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.active || !(await compare(password, user.passwordHash))) redirect("/admin/login?error=invalid");
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() { await destroySession(); redirect("/admin/login"); }

export async function ensureHomepage() {
  const [existing] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, "home")).limit(1);
  if (existing) return existing.id;
  const [page] = await db.insert(pages).values({ title: "Home", slug: "home", status: "PUBLISHED", publishedAt: new Date(), seo: { title: "Designik — Creative Agency" } }).returning({ id: pages.id });
  const names = ["Header", "Hero", "Agency Marquee", "Stats", "About", "Services", "Brand Heights", "Experience", "Portfolio", "Team", "Interactive", "Testimonials", "Footer"];
  await db.insert(sections).values(names.map((name, position) => ({ pageId: page.id, name, type: name.toLowerCase().replaceAll(" ", "-"), position })));
  return page.id;
}

export async function updatePage(form: FormData) {
  const id = String(form.get("id"));
  const title = String(form.get("title") || "").trim();
  const slug = String(form.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (id && title && slug) await db.update(pages).set({ title, slug, updatedAt: new Date() }).where(eq(pages.id, id));
}

export async function getHomepageSections(pageId: string) {
  return db.select().from(sections).where(eq(sections.pageId, pageId)).orderBy(asc(sections.position));
}

export async function saveHeroDraft(sectionId: string, value: unknown) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const content = heroContent(value);
  await db.update(sections).set({ draftContent: content, updatedAt: new Date() }).where(eq(sections.id, sectionId));
  return content;
}

export async function publishHero(sectionId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const [section] = await db.select().from(sections).where(eq(sections.id, sectionId)).limit(1);
  if (!section) throw new Error("Section not found");
  const content = heroContent(section.draftContent);
  await db.transaction(async (tx) => {
    await tx.insert(revisions).values({ pageId: section.pageId, authorId: user.id, label: "Published Hero", snapshot: { sectionId, content: section.publishedContent } });
    await tx.update(sections).set({ publishedContent: content, updatedAt: new Date() }).where(eq(sections.id, sectionId));
  });
  revalidatePath("/");
  return content;
}
