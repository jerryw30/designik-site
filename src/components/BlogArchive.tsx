import Link from "next/link";

export type ArchivePost = {
  id: string;
  title: string;
  slug: string;
  data: unknown;
  updatedAt: Date;
};
export default function BlogArchive({
  title,
  description,
  posts,
}: {
  title: string;
  description?: string;
  posts: ArchivePost[];
}) {
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <Link href="/blog" className="text-sm font-semibold text-pink-brand">
          ← Designik Journal
        </Link>
        <h1 className="mt-5 font-display text-6xl uppercase text-wine-800">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-neutral-600">{description}</p>
        )}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const data = post.data as {
              excerpt?: string;
              featuredImage?: string;
              category?: string;
            };
            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1"
              >
                {data.featuredImage && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.featuredImage}
                      alt=""
                      className="h-52 w-full object-cover"
                    />
                  </>
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
            No published posts in this archive.
          </p>
        )}
      </div>
    </main>
  );
}
