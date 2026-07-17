import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";

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
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-20">
      <article className="mx-auto max-w-3xl">
        <span className="text-sm font-semibold uppercase text-pink-brand">
          {data.category || "Uncategorized"}
        </span>
        <h1 className="mt-3 font-display text-6xl uppercase text-wine-800">
          {post.title}
        </h1>
        <p className="mt-5 text-xl leading-8 text-neutral-600">
          {data.excerpt}
        </p>
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
              <span
                key={tag}
                className="rounded-full bg-blush-200 px-3 py-1 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </main>
  );
}
