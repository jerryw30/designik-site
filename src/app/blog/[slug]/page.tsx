import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.slug, slug),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!post) return {};
  const data = post.data as {
    excerpt?: string;
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoCanonical?: string;
    seoOgImage?: string;
    seoNoindex?: boolean;
  };
  const title = data.seoTitle || post.title,
    description = data.seoDescription || data.excerpt || "",
    image = data.seoOgImage || data.featuredImage;
  return {
    title,
    description,
    alternates: { canonical: data.seoCanonical || `/blog/${post.slug}` },
    robots: data.seoNoindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export const revalidate = 60;
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.slug, slug),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!post) notFound();
  const data = post.data as {
    excerpt?: string;
    content?: string;
    category?: string;
    tags?: string[];
    featuredImage?: string;
  };
  const [author] = post.createdBy
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, post.createdBy))
        .limit(1)
    : [];
  const termSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-20">
      <article className="mx-auto max-w-3xl">
        <Link
          href={`/blog/category/${termSlug(data.category || "Uncategorized")}`}
          className="text-sm font-semibold uppercase text-pink-brand"
        >
          {data.category || "Uncategorized"}
        </Link>
        <h1 className="mt-3 font-display text-6xl uppercase text-wine-800">
          {post.title}
        </h1>
        <p className="mt-5 text-xl leading-8 text-neutral-600">
          {data.excerpt}
        </p>
        {author && (
          <Link
            href={`/blog/author/${author.id}`}
            className="mt-4 inline-block text-sm font-medium text-neutral-500"
          >
            By {author.name}
          </Link>
        )}
        {data.featuredImage && (
          // Arbitrary administrator-provided URLs cannot be statically allowlisted.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.featuredImage}
            alt=""
            className="mt-10 w-full rounded-3xl"
          />
        )}
        <div className="mt-10 whitespace-pre-wrap text-lg leading-9">
          {data.content}
        </div>
        {data.tags?.length ? (
          <div className="mt-10 flex gap-2">
            {data.tags.map((tag) => (
              <Link
                href={`/blog/tag/${termSlug(tag)}`}
                key={tag}
                className="rounded-full bg-blush-200 px-3 py-1 text-sm"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
      </article>
    </main>
  );
}
