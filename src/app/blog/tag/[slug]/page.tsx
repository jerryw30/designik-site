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
 * Tags on posts are free text, so resolve the archive from the saved term
 * when it exists and otherwise fall back to matching post tags by slug — a
 * tag chip on a post never dead-ends.
 */
async function loadTag(slug: string) {
  const [[term], published] = await Promise.all([
    db
      .select()
      .from(adminResources)
      .where(
        and(eq(adminResources.module, "tags"), eq(adminResources.slug, slug)),
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
  const matches = (post: (typeof published)[number]) =>
    ((post.data as { tags?: string[] }).tags || []).find(
      (tag) => termSlug(tag) === slug,
    );
  const posts = published.filter((post) => matches(post));
  if (!term && !posts.length) return null;
  const title = term?.title || (posts[0] && matches(posts[0])) || slug;
  const description = (term?.data as { description?: string } | undefined)
    ?.description;
  return { title, description, posts };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const archive = await loadTag((await params).slug);
  if (!archive) return {};
  return {
    title: `${archive.title} — Designik Journal`,
    description:
      archive.description || `Journal posts tagged ${archive.title}.`,
  };
}

export default async function TagArchive({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const archive = await loadTag((await params).slug);
  if (!archive) notFound();
  return (
    <BlogArchive
      eyebrow="Tagged"
      title={archive.title}
      description={archive.description}
      posts={archive.posts}
    />
  );
}
