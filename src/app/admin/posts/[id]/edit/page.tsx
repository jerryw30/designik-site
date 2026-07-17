import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../../admin-shell";
import { savePost, savePostWithStatus } from "../../actions";

type PostData = {
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
};
export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const [post] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "posts")))
    .limit(1);
  if (!post) notFound();
  const data = post.data as PostData;
  const [categories, tags] = await Promise.all([
    db
      .select()
      .from(adminResources)
      .where(eq(adminResources.module, "categories")),
    db.select().from(adminResources).where(eq(adminResources.module, "tags")),
  ]);
  return (
    <AdminShell user={user} title={`Edit post · ${post.title}`}>
      <form action={savePost} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <input type="hidden" name="id" value={post.id} />
        <section className="space-y-4 rounded-2xl border bg-white p-6">
          <label className="block text-sm font-medium">
            Title
            <input
              name="title"
              defaultValue={post.title}
              required
              className="mt-1.5 block w-full rounded-xl border px-4 py-3 text-xl"
            />
          </label>
          <label className="block text-sm font-medium">
            Excerpt
            <textarea
              name="excerpt"
              defaultValue={data.excerpt}
              className="mt-1.5 block min-h-24 w-full rounded-xl border p-4"
            />
          </label>
          <label className="block text-sm font-medium">
            Content
            <textarea
              name="content"
              defaultValue={data.content}
              className="mt-1.5 block min-h-[440px] w-full rounded-xl border p-4 font-mono"
            />
          </label>
        </section>
        <aside className="space-y-4">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Publish</h2>
            <p className="my-3 text-sm text-neutral-500">
              Current status: {post.status}
            </p>
            <button className="admin-button w-full">Save changes</button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                formAction={savePostWithStatus.bind(null, "DRAFT")}
                className="rounded-lg border p-2 text-sm"
              >
                Draft
              </button>
              <button
                formAction={savePostWithStatus.bind(null, "PUBLISHED")}
                className="rounded-lg border p-2 text-sm"
              >
                Publish
              </button>
            </div>
          </section>
          <section className="space-y-3 rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Post settings</h2>
            <label className="block text-sm">
              Slug
              <input
                name="slug"
                defaultValue={post.slug}
                className="mt-1 block w-full rounded-lg border p-2"
              />
            </label>
            <label className="block text-sm">
              Category
              <input
                name="category"
                list="category-options"
                defaultValue={data.category}
                className="mt-1 block w-full rounded-lg border p-2"
              />
              <datalist id="category-options">
                {categories.map((item) => (
                  <option key={item.id} value={item.title} />
                ))}
              </datalist>
            </label>
            <label className="block text-sm">
              Tags (comma separated)
              <input
                name="tags"
                list="tag-options"
                defaultValue={data.tags?.join(", ")}
                className="mt-1 block w-full rounded-lg border p-2"
              />
              <datalist id="tag-options">
                {tags.map((item) => (
                  <option key={item.id} value={item.title} />
                ))}
              </datalist>
            </label>
            <label className="block text-sm">
              Featured image URL
              <input
                name="featuredImage"
                defaultValue={data.featuredImage}
                className="mt-1 block w-full rounded-lg border p-2"
              />
            </label>
          </section>
          <section className="space-y-3 rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">SEO</h2>
            <input
              name="seoTitle"
              defaultValue={data.seoTitle}
              placeholder="SEO title"
              className="block w-full rounded-lg border p-2"
            />
            <textarea
              name="seoDescription"
              defaultValue={data.seoDescription}
              placeholder="Meta description"
              className="block w-full rounded-lg border p-2"
            />
          </section>
        </aside>
      </form>
    </AdminShell>
  );
}
