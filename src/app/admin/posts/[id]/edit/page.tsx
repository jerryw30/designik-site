import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../../admin-shell";
import { MediaPicker } from "../../../media-picker";
import { SeoPanel } from "../../../seo-panel";
import { T, statusPill, wpDate } from "../../../theme";
import { savePost, savePostWithStatus } from "../../actions";

type PostData = {
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyphrase?: string;
  seoCanonical?: string;
  seoNoindex?: boolean;
  seoOgTitle?: string;
  seoOgDescription?: string;
  seoOgImage?: string;
  seoXTitle?: string;
  seoXDescription?: string;
};

const cardTitle = "text-[13px] font-semibold text-[#1b1c20]";

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
  const authors = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(users.name);
  return (
    <AdminShell user={user} title={`Edit post · ${post.title}`}>
      <form action={savePost}>
        <input type="hidden" name="id" value={post.id} />

        {/* Top row: back link + borderless title */}
        <div className="mb-6">
          <Link href="/admin/posts" className={`${T.mutedLink} text-[13px] font-medium`}>
            ← Posts
          </Link>
          <input
            name="title"
            defaultValue={post.title}
            required
            aria-label="Post title"
            placeholder="Add title"
            className="mt-2 block w-full border-0 border-b-2 border-transparent bg-transparent pb-1.5 text-2xl font-semibold text-[#1b1c20] outline-none transition placeholder:text-neutral-300 focus:border-[#a10140]"
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Excerpt</h2>
              </div>
              <div className="p-5">
                <textarea
                  name="excerpt"
                  defaultValue={data.excerpt}
                  aria-label="Excerpt"
                  placeholder="A short summary shown in listings and previews…"
                  className={`${T.input} min-h-24`}
                />
                <p className={T.help}>Shown on the blog index and in search results.</p>
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Content</h2>
              </div>
              <div className="p-5">
                <textarea
                  name="content"
                  defaultValue={data.content}
                  aria-label="Content"
                  placeholder="Write your post…"
                  className={`${T.input} min-h-[440px] font-mono text-[13px] leading-6`}
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-6">
            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Publish</h2>
                <span className={statusPill(post.status)}>{post.status}</span>
              </div>
              <div className="p-5">
                <button className={`${T.btn} w-full`}>Save changes</button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    formAction={savePostWithStatus.bind(null, "DRAFT")}
                    className={T.btn}
                  >
                    Save draft
                  </button>
                  <button
                    formAction={savePostWithStatus.bind(null, "PUBLISHED")}
                    className={T.btnPrimary}
                  >
                    Publish
                  </button>
                </div>
                <p className={T.help}>Last updated {wpDate(post.updatedAt)}</p>
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Slug / URL</h2>
              </div>
              <div className="p-5">
                <label htmlFor="post-slug" className={T.label}>
                  URL slug
                </label>
                <input id="post-slug" name="slug" defaultValue={post.slug} className={T.input} />
                <p className={T.help}>Public address: /blog/{post.slug}</p>
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Organization</h2>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label htmlFor="post-author" className={T.label}>
                    Author
                  </label>
                  <select
                    id="post-author"
                    name="authorId"
                    defaultValue={post.createdBy || user.id}
                    className={`${T.select} block w-full`}
                  >
                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name} · {author.role.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="post-category" className={T.label}>
                    Category
                  </label>
                  <input
                    id="post-category"
                    name="category"
                    list="category-options"
                    defaultValue={data.category}
                    className={T.input}
                  />
                  <datalist id="category-options">
                    {categories.map((item) => (
                      <option key={item.id} value={item.title} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="post-tags" className={T.label}>
                    Tags
                  </label>
                  <input
                    id="post-tags"
                    name="tags"
                    list="tag-options"
                    defaultValue={data.tags?.join(", ")}
                    className={T.input}
                  />
                  <datalist id="tag-options">
                    {tags.map((item) => (
                      <option key={item.id} value={item.title} />
                    ))}
                  </datalist>
                  <p className={T.help}>Separate tags with commas.</p>
                </div>
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Featured image</h2>
              </div>
              <div className="p-5">
                <MediaPicker name="featuredImage" defaultValue={data.featuredImage} />
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>SEO</h2>
              </div>
              <div className="p-5">
                <SeoPanel
                  idPrefix="post-seo"
                  fallbackTitle={post.title}
                  urlPrefix="/blog/"
                  slug={post.slug}
                  defaults={{
                    focusKeyphrase: data.focusKeyphrase,
                    seoTitle: data.seoTitle,
                    seoDescription: data.seoDescription,
                    canonical: data.seoCanonical,
                    noindex: data.seoNoindex,
                    ogTitle: data.seoOgTitle,
                    ogDescription: data.seoOgDescription,
                    ogImage: data.seoOgImage,
                    xTitle: data.seoXTitle,
                    xDescription: data.seoXDescription,
                  }}
                />
              </div>
            </section>
          </aside>
        </div>
      </form>
    </AdminShell>
  );
}
