import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import BlogArchive from "@/components/BlogArchive";
import { db } from "@/db";
import { adminResources } from "@/db/schema";

export const revalidate = 60;
export default async function TagArchive({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [term] = await db
    .select()
    .from(adminResources)
    .where(
      and(eq(adminResources.module, "tags"), eq(adminResources.slug, slug)),
    )
    .limit(1);
  if (!term) notFound();
  const posts = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
        sql`${adminResources.data}->'tags' @> ${JSON.stringify([term.title])}::jsonb`,
      ),
    )
    .orderBy(desc(adminResources.updatedAt));
  const data = term.data as { description?: string };
  return (
    <BlogArchive
      title={`Tag: ${term.title}`}
      description={data.description}
      posts={posts}
    />
  );
}
