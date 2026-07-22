import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function PostPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "posts")) redirect("/admin");
  const { id } = await params;
  // adminResources.id is a uuid column — malformed ids must 404, not crash.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [post] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")))
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
  return (
    <>
      <Nav />
      <main className="min-h-screen overflow-x-clip bg-white px-5 pb-24 pt-36 md:pt-44">
        <article className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-[13px] text-amber-900">
            <span>
              <strong>Preview</strong> — this is how the post will look.
              {post.status !== "PUBLISHED" && " It is not public yet."}
            </span>
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
            >
              Back to editor
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-wine-500 px-3.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wide text-white">
              {data.category || "Uncategorized"}
            </span>
            <span className="font-sans text-[13px] text-black/50">
              {post.updatedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="mt-4 font-display text-[clamp(36px,5.5vw,60px)] font-semibold uppercase leading-[1.08] text-wine-500">
            {post.title}
          </h1>
          {data.excerpt && (
            <p className="mt-5 font-sans text-[18px] leading-[29px] text-black/70">
              {data.excerpt}
            </p>
          )}
          {author && (
            <span className="mt-5 inline-flex items-center gap-2.5 font-sans text-[14px] font-medium text-black/60">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-[11px] font-bold text-white">
                {author.name.slice(0, 2).toUpperCase()}
              </span>
              By {author.name}
            </span>
          )}
          {data.featuredImage && (
            // Arbitrary administrator-provided URLs cannot be statically allowlisted.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.featuredImage}
              alt=""
              className="mt-10 w-full rounded-[20px] shadow-[0_18px_45px_rgba(0,0,0,0.1)]"
            />
          )}
          <div className="mt-10 whitespace-pre-wrap font-sans text-[17px] leading-[31px] text-black/85">
            {data.content}
          </div>
          {data.tags?.length ? (
            <div className="mt-10 flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blush-100 px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wide text-wine-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </main>
      <Footer />
    </>
  );
}
