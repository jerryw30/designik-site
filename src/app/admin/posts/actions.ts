"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";

async function authorize() {
  return requirePermission("edit_posts");
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "post"
  );
}

function postData(form: FormData) {
  return {
    excerpt: String(form.get("excerpt") || ""),
    content: String(form.get("content") || ""),
    category:
      String(form.get("category") || "Uncategorized").trim() || "Uncategorized",
    tags: String(form.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featuredImage: String(form.get("featuredImage") || "").trim(),
    seoTitle: String(form.get("seoTitle") || "").trim(),
    seoDescription: String(form.get("seoDescription") || "").trim(),
  };
}

export async function createPost(form: FormData) {
  const user = await authorize();
  const title =
    String(form.get("title") || "Untitled post").trim() || "Untitled post";
  const [post] = await db
    .insert(adminResources)
    .values({
      module: "posts",
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      createdBy: user.id,
      data: postData(form),
    })
    .returning({ id: adminResources.id });
  redirect(`/admin/posts/${post.id}/edit`);
}

export async function savePost(form: FormData) {
  await authorize();
  const id = String(form.get("id"));
  const title =
    String(form.get("title") || "Untitled post").trim() || "Untitled post";
  const requestedSlug = slugify(String(form.get("slug") || title));
  await db
    .update(adminResources)
    .set({
      title,
      slug: requestedSlug,
      data: postData(form),
      updatedAt: new Date(),
    })
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")));
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}/edit`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${requestedSlug}`);
}

export async function savePostWithStatus(
  status: "DRAFT" | "PUBLISHED",
  form: FormData,
) {
  await authorize();
  const id = String(form.get("id"));
  const title =
    String(form.get("title") || "Untitled post").trim() || "Untitled post";
  const slug = slugify(String(form.get("slug") || title));
  await db
    .update(adminResources)
    .set({
      title,
      slug,
      status,
      deletedAt: null,
      data: postData(form),
      updatedAt: new Date(),
    })
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")));
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}/edit`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function setPostStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "TRASH",
) {
  await authorize();
  await db
    .update(adminResources)
    .set({
      status,
      deletedAt: status === "TRASH" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")));
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
}

export async function duplicatePost(id: string) {
  const user = await authorize();
  const [source] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")))
    .limit(1);
  if (!source) return;
  await db.insert(adminResources).values({
    module: "posts",
    title: `${source.title} Copy`,
    slug: `${source.slug}-copy-${Date.now().toString(36)}`,
    status: "DRAFT",
    data: source.data,
    createdBy: user.id,
  });
  revalidatePath("/admin/posts");
}

export async function deletePostForever(id: string) {
  await authorize();
  await db
    .delete(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, "posts"),
        eq(adminResources.status, "TRASH"),
      ),
    );
  revalidatePath("/admin/posts");
}

export async function createTaxonomy(
  kind: "categories" | "tags",
  form: FormData,
) {
  const user = await authorize();
  const title = String(form.get("title") || "").trim();
  if (!title) return;
  const slug = slugify(title);
  const existing = await db
    .select({ id: adminResources.id })
    .from(adminResources)
    .where(and(eq(adminResources.module, kind), eq(adminResources.slug, slug)))
    .limit(1);
  if (!existing.length)
    await db.insert(adminResources).values({
      module: kind,
      title,
      slug,
      status: "PUBLISHED",
      createdBy: user.id,
      data: { description: String(form.get("description") || "") },
    });
  revalidatePath(`/admin/posts/${kind}`);
}

export async function deleteTaxonomy(kind: "categories" | "tags", id: string) {
  await authorize();
  await db
    .delete(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, kind)));
  revalidatePath(`/admin/posts/${kind}`);
}
