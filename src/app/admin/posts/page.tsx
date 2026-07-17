import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import {
  createPost,
  deletePostForever,
  duplicatePost,
  setPostStatus,
} from "./actions";

export default async function PostsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const posts = await db
    .select()
    .from(adminResources)
    .where(eq(adminResources.module, "posts"))
    .orderBy(desc(adminResources.updatedAt));
  return (
    <AdminShell user={user} title="Posts">
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Add new post</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Create a draft and continue in the full post editor.
          </p>
          <form action={createPost} className="mt-5 space-y-3">
            <label className="block text-sm">
              Title
              <input
                name="title"
                required
                className="mt-1.5 block w-full rounded-xl border px-4 py-3"
              />
            </label>
            <button className="admin-button w-full">Create draft</button>
          </form>
          <Link
            href="/blog"
            target="_blank"
            className="mt-4 block text-center text-sm text-pink-600"
          >
            View public blog
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/admin/posts/categories"
              className="rounded-lg border p-2 text-center text-sm"
            >
              Categories
            </Link>
            <Link
              href="/admin/posts/tags"
              className="rounded-lg border p-2 text-center text-sm"
            >
              Tags
            </Link>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">All posts</h2>
          <p className="mb-4 text-sm text-neutral-500">
            {posts.length} posts, including drafts and trash.
          </p>
          <div className="space-y-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-xs text-neutral-500">
                      /{post.slug} · {post.status} ·{" "}
                      {post.updatedAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.status !== "TRASH" && (
                      <>
                        <Link
                          className="rounded-lg border px-3 py-2 text-sm"
                          href={`/admin/posts/${post.id}/edit`}
                        >
                          Edit
                        </Link>
                        <Link
                          className="rounded-lg border px-3 py-2 text-sm"
                          href={`/admin/posts/${post.id}/preview`}
                          target="_blank"
                        >
                          Preview
                        </Link>
                        <form action={duplicatePost.bind(null, post.id)}>
                          <button className="rounded-lg border px-3 py-2 text-sm">
                            Duplicate
                          </button>
                        </form>
                        <form
                          action={setPostStatus.bind(
                            null,
                            post.id,
                            post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                          )}
                        >
                          <button className="admin-button">
                            {post.status === "PUBLISHED"
                              ? "Move to draft"
                              : "Publish"}
                          </button>
                        </form>
                        <form
                          action={setPostStatus.bind(null, post.id, "TRASH")}
                        >
                          <button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">
                            Trash
                          </button>
                        </form>
                      </>
                    )}
                    {post.status === "TRASH" && (
                      <>
                        <form
                          action={setPostStatus.bind(null, post.id, "DRAFT")}
                        >
                          <button className="rounded-lg border px-3 py-2 text-sm">
                            Restore
                          </button>
                        </form>
                        <form action={deletePostForever.bind(null, post.id)}>
                          <button className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">
                            Delete permanently
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {!posts.length && (
              <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-neutral-500">
                No posts yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
