import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources } from "@/db/schema";

export const revalidate = 60;
export default async function BlogPage() {
  const posts = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .orderBy(desc(adminResources.updatedAt));
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-7xl uppercase text-wine-800">
          Designik Journal
        </h1>
        <p className="mt-3 text-neutral-600">
          Ideas, insights, and studio updates.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const data = post.data as {
              excerpt?: string;
              category?: string;
              featuredImage?: string;
            };
            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1"
              >
                {data.featuredImage && (
                  // Arbitrary administrator-provided URLs cannot be statically allowlisted.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.featuredImage}
                    alt=""
                    className="h-56 w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <span className="text-xs font-semibold uppercase text-pink-brand">
                    {data.category || "Uncategorized"}
                  </span>
                  <h2 className="mt-2 font-display text-3xl uppercase">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {data.excerpt}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        {!posts.length && (
          <p className="mt-12 rounded-2xl border border-dashed p-12 text-center text-neutral-500">
            No published posts yet.
          </p>
        )}
      </div>
    </main>
  );
}
