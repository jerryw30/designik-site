import { and, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import BlogArchive from "@/components/BlogArchive";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";

export const revalidate = 60;
export default async function AuthorArchive({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [author] = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.id, id), eq(users.active, true)))
    .limit(1);
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
      title={author.name}
      description={`Published by ${author.name} · ${author.role.replaceAll("_", " ")}`}
      posts={posts}
    />
  );
}
