import { and, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogArchive from "@/components/BlogArchive";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";

export const revalidate = 60;

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function loadAuthor(id: string) {
  // users.id is a uuid column — a malformed id must 404, not crash the query.
  if (!isUuid(id)) return undefined;
  const [author] = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.id, id), eq(users.active, true)))
    .limit(1);
  return author;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const author = await loadAuthor((await params).id);
  if (!author) return {};
  return {
    title: `${author.name} — Designik Journal`,
    description: `Journal posts written by ${author.name}.`,
  };
}

export default async function AuthorArchive({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const author = await loadAuthor(id);
  if (!author) notFound();
  const posts = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
        eq(adminResources.createdBy, id),
      ),
    )
    .orderBy(desc(adminResources.updatedAt));
  return (
    <BlogArchive
      eyebrow="Written by"
      title={author.name}
      description={`Published by ${author.name} · ${author.role.replaceAll("_", " ").toLowerCase()}`}
      posts={posts}
    />
  );
}
