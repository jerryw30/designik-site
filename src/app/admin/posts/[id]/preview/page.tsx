import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";

export default async function PostPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "posts")) redirect("/admin");
  const { id } = await params;
  const [post] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")))
    .limit(1);
  if (!post) notFound();
  const data = post.data as {
    excerpt?: string;
    content?: string;
    featuredImage?: string;
  };
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-8 rounded-lg bg-amber-100 p-3 text-sm">
        Draft preview · not public
      </div>
      <h1 className="font-display text-6xl uppercase">{post.title}</h1>
      <p className="mt-4 text-xl text-neutral-500">{data.excerpt}</p>
      {data.featuredImage && (
        // Arbitrary administrator-provided URLs cannot be statically allowlisted.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.featuredImage}
          alt=""
          className="mt-8 w-full rounded-2xl"
        />
      )}
      <article className="mt-10 whitespace-pre-wrap leading-8">
        {data.content}
      </article>
    </main>
  );
}
