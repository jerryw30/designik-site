import Link from "next/link";
import { and, count, desc, eq, ilike, ne, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { ConfirmButton, SelectAllBox } from "../wp-ui";
import { wpDate } from "../theme";
import { bulkPosts, createPost, deletePostForever, duplicatePost, setPostStatus } from "./actions";

export const dynamic = "force-dynamic";

const wpLink = "text-[#a10140] hover:text-[#7c0134] hover:underline";
const wpBtn = "rounded-lg border border-[#a10140] bg-white px-2.5 py-1 text-[13px] font-medium text-[#a10140] hover:bg-[#fdf2f7]";

type PostData = { category?: string; tags?: string[] };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; s?: string; new?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "posts")) redirect("/admin");
  const query = await searchParams;
  const status = query.status || "all";
  const search = (query.s || "").trim();

  const isPosts = eq(adminResources.module, "posts");
  const filters: Record<string, SQL | undefined> = {
    all: and(isPosts, ne(adminResources.status, "TRASH")),
    published: and(isPosts, eq(adminResources.status, "PUBLISHED")),
    draft: and(isPosts, eq(adminResources.status, "DRAFT")),
    trash: and(isPosts, eq(adminResources.status, "TRASH")),
  };
  let where = filters[status] || filters.all;
  if (search) where = and(where, ilike(adminResources.title, `%${search}%`));

  const [rows, [allC], [pubC], [draftC], [trashC]] = await Promise.all([
    db
      .select({ post: adminResources, authorName: users.name })
      .from(adminResources)
      .leftJoin(users, eq(adminResources.createdBy, users.id))
      .where(where)
      .orderBy(desc(adminResources.updatedAt)),
    db.select({ value: count() }).from(adminResources).where(filters.all),
    db.select({ value: count() }).from(adminResources).where(filters.published),
    db.select({ value: count() }).from(adminResources).where(filters.draft),
    db.select({ value: count() }).from(adminResources).where(filters.trash),
  ]);

  const views = [
    { key: "all", label: "All", count: allC.value, href: "/admin/posts" },
    { key: "published", label: "Published", count: pubC.value, href: "/admin/posts?status=published" },
    { key: "draft", label: "Draft", count: draftC.value, href: "/admin/posts?status=draft" },
    { key: "trash", label: "Trash", count: trashC.value, href: "/admin/posts?status=trash" },
  ].filter((v) => v.key === "all" || v.count > 0);

  const inTrash = status === "trash";

  return (
    <AdminShell user={user} title="Posts">
      {/* screen heading */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[23px] font-normal text-[#1d2327]">Posts</h2>
        <Link href="/admin/posts?new=1" className={wpBtn}>Add New Post</Link>
        <Link href="/admin/posts/categories" className="text-[13px] text-[#a10140] hover:underline">Categories</Link>
        <span className="text-[#c3c4c7]">|</span>
        <Link href="/admin/posts/tags" className="text-[13px] text-[#a10140] hover:underline">Tags</Link>
        {search && <span className="text-[13px] text-[#50575e]">Search results for: <strong>&ldquo;{search}&rdquo;</strong></span>}
      </div>

      {query.new === "1" && (
        <form action={createPost} className="mt-4 flex flex-wrap gap-2 rounded-lg border border-[#c3c4c7] bg-white p-4 shadow-sm">
          <input
            name="title"
            required
            autoFocus
            placeholder="Post title"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-[14px] outline-none focus:border-[#a10140] focus:shadow-[0_0_0_1px_#a10140]"
          />
          <button className="rounded-lg bg-[#a10140] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#7c0134]">Create draft</button>
          <Link href="/admin/posts" className="px-2 py-1.5 text-[13px] text-[#50575e] hover:text-[#7c0134]">Cancel</Link>
        </form>
      )}

      {/* subsubsub */}
      <ul className="mt-4 flex flex-wrap items-center gap-1.5 text-[13px]">
        {views.map((v, i) => (
          <li key={v.key} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#c3c4c7]">|</span>}
            <Link href={v.href} className={status === v.key ? "font-semibold text-black" : wpLink}>
              {v.label} <span className="text-[#50575e]">({v.count})</span>
            </Link>
          </li>
        ))}
      </ul>

      <form action={bulkPosts}>
        {/* tablenav top */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select name="bulk" defaultValue="-1" className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-[13px]">
              <option value="-1">Bulk actions</option>
              {inTrash ? (
                <>
                  <option value="restore">Restore</option>
                  <option value="delete">Delete permanently</option>
                </>
              ) : (
                <>
                  <option value="publish">Publish</option>
                  <option value="draft">Move to Draft</option>
                  <option value="trash">Move to Trash</option>
                </>
              )}
            </select>
            <button className={wpBtn}>Apply</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              name="s"
              defaultValue={search}
              placeholder="Search posts…"
              form="posts-search"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#a10140] focus:shadow-[0_0_0_1px_#a10140]"
            />
            <button form="posts-search" className={wpBtn}>Search Posts</button>
          </div>
        </div>

        {/* list table */}
        <table className="mt-2.5 w-full border-collapse border border-[#c3c4c7] bg-white text-[13px] shadow-sm">
          <thead>
            <tr className="border-b border-[#c3c4c7] text-left text-[#1d2327]">
              <th className="w-10 px-3 py-2.5"><SelectAllBox /></th>
              <th className="px-3 py-2.5 font-normal">Title</th>
              <th className="hidden px-3 py-2.5 font-normal lg:table-cell">Author</th>
              <th className="hidden px-3 py-2.5 font-normal md:table-cell">Categories</th>
              <th className="hidden px-3 py-2.5 font-normal xl:table-cell">Tags</th>
              <th className="w-44 px-3 py-2.5 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[#50575e]">No posts found.</td>
              </tr>
            )}
            {rows.map(({ post, authorName }) => {
              const data = (post.data || {}) as PostData;
              return (
                <tr key={post.id} className="group border-b border-[#f0f0f1] align-top hover:bg-[#f6f7f7]">
                  <td className="px-3 py-3">
                    <input type="checkbox" name="ids" value={post.id} aria-label={`Select ${post.title}`} className="h-4 w-4 accent-[#a10140]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold">
                      <Link href={`/admin/posts/${post.id}/edit`} className={`${wpLink} text-[14px]`}>{post.title}</Link>
                      {post.status === "DRAFT" && !inTrash && <span className="ml-1.5 text-[#1d2327]">— Draft</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[12.5px] opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                      {inTrash ? (
                        <>
                          <button formAction={setPostStatus.bind(null, post.id, "DRAFT")} className={wpLink}>Restore</button>
                          <span className="text-[#c3c4c7]">|</span>
                          <ConfirmButton
                            message={`Permanently delete "${post.title}"? This cannot be undone.`}
                            formAction={deletePostForever.bind(null, post.id)}
                            className="text-[#dc2626] hover:underline"
                          >
                            Delete Permanently
                          </ConfirmButton>
                        </>
                      ) : (
                        <>
                          <Link href={`/admin/posts/${post.id}/edit`} className={wpLink}>Edit</Link>
                          <span className="text-[#c3c4c7]">|</span>
                          <button formAction={duplicatePost.bind(null, post.id)} className={wpLink}>Duplicate</button>
                          <span className="text-[#c3c4c7]">|</span>
                          <a href={`/admin/posts/${post.id}/preview`} target="_blank" className={wpLink}>Preview</a>
                          {post.status === "PUBLISHED" && (
                            <>
                              <span className="text-[#c3c4c7]">|</span>
                              <a href={`/blog/${post.slug}`} target="_blank" className={wpLink}>View</a>
                            </>
                          )}
                          <span className="text-[#c3c4c7]">|</span>
                          <button formAction={setPostStatus.bind(null, post.id, post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")} className={wpLink}>
                            {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </button>
                          <span className="text-[#c3c4c7]">|</span>
                          <button formAction={setPostStatus.bind(null, post.id, "TRASH")} className="text-[#dc2626] hover:underline">Trash</button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 text-[#50575e] lg:table-cell">
                    {authorName || "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 text-[#50575e] md:table-cell">
                    {data.category || "Uncategorized"}
                  </td>
                  <td className="hidden px-3 py-2.5 text-[#50575e] xl:table-cell">
                    {data.tags?.length ? data.tags.join(", ") : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[#50575e]">
                    {post.status === "PUBLISHED" ? "Published" : "Last Modified"}
                    <br />
                    {wpDate(post.updatedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* tablenav bottom */}
        <div className="mt-2.5 flex items-center justify-end text-[13px] text-[#50575e]">
          <span>{rows.length} item{rows.length === 1 ? "" : "s"}</span>
        </div>
      </form>

      <form id="posts-search" method="get" action="/admin/posts">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
      </form>
    </AdminShell>
  );
}
