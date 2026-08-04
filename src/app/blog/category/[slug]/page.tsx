import { and, desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BlogArchive from "@/components/BlogArchive";
import { db } from "@/db";
import { adminResources } from "@/db/schema";

// Was ISR (revalidate=60): on Hostinger the persisted prerender cache served
// stale HTML indefinitely (stale-while-revalidate + failed revalidations
// against cold Neon), surviving deploys and DB fixes. Render per request.
export const dynamic = "force-dynamic";

const termSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Posts store their category as free text, so resolve the archive from the
 * saved term when it exists and otherwise fall back to matching post
 * categories by slug — a category chip on a post never dead-ends.
 */
async function loadCategory(slug: string) {
  const [[term], published] = await Promise.all([
    db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "categories"),
          eq(adminResources.slug, slug),
        ),
      )
      .limit(1),
    db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "posts"),
          eq(adminResources.status, "PUBLISHED"),
          isNull(adminResources.deletedAt),
        ),
      )
      .orderBy(desc(adminResources.updatedAt)),
  ]);
  const posts = published.filter(
    (post) =>
      termSlug(
        (post.data as { category?: string }).category || "Uncategorized",
      ) === slug,
  );
  if (!term && !posts.length) return null;
  const title =
    term?.title ||
    (posts[0]?.data as { category?: string })?.category ||
    "Uncategorized";
  const description = (term?.data as { description?: string } | undefined)
    ?.description;
  return { title, description, posts };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const archive = await loadCategory((await params).slug);
  if (!archive) return {};
  return {
    title: `${archive.title} — Designik Journal`,
    description:
      archive.description || `Journal posts filed under ${archive.title}.`,
  };
}

export default async function CategoryArchive({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const archive = await loadCategory((await params).slug);
  if (!archive) notFound();
  return (
    <BlogArchive
      eyebrow="Category"
      title={archive.title}
      description={archive.description}
      posts={archive.posts}
    />
  );
}
