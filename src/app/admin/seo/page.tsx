import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, pages, siteSettings } from "@/db/schema";
import { seoSettings } from "@/cms/seo";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import {
  publishSeo,
  resetSeoDraft,
  saveSeoDraft,
  updatePageSeo,
  updatePostSeo,
} from "./actions";
const Field = ({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) => (
  <label className="block text-sm">
    {label}
    <input
      name={name}
      defaultValue={value}
      className="mt-1 block w-full rounded-lg border p-2"
    />
  </label>
);
export default async function SeoPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const [[row], pageList, posts] = await Promise.all([
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "seo_settings"))
      .limit(1),
    db.select().from(pages).orderBy(desc(pages.updatedAt)),
    db
      .select()
      .from(adminResources)
      .where(eq(adminResources.module, "posts"))
      .orderBy(desc(adminResources.updatedAt)),
  ]);
  const stored = row?.value as { draft?: unknown } | undefined,
    value = seoSettings(stored?.draft);
  return (
    <AdminShell user={user} title="SEO Center">
      <div className="space-y-8">
        <form className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Global SEO</h2>
          <p className="mb-5 text-sm text-neutral-500">
            Draft changes do not affect search metadata until published.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Site title"
              name="siteTitle"
              value={value.siteTitle}
            />
            <Field
              label="Title template (%s = page title)"
              name="titleTemplate"
              value={value.titleTemplate}
            />
            <label className="block text-sm md:col-span-2">
              Default description
              <textarea
                name="description"
                defaultValue={value.description}
                className="mt-1 block w-full rounded-lg border p-2"
              />
            </label>
            <Field
              label="Canonical base URL"
              name="canonicalBase"
              value={value.canonicalBase}
            />
            <Field
              label="Default Open Graph image"
              name="ogImage"
              value={value.ogImage}
            />
            <Field
              label="Twitter/X handle"
              name="twitterHandle"
              value={value.twitterHandle}
            />
            <Field
              label="Google verification code"
              name="googleVerification"
              value={value.googleVerification}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="index"
                defaultChecked={value.index}
              />
              Allow indexing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="follow"
                defaultChecked={value.follow}
              />
              Follow links
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="sitemapEnabled"
                defaultChecked={value.sitemapEnabled}
              />
              Enable XML sitemap
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              formAction={saveSeoDraft}
              className="rounded-lg border px-4 py-2"
            >
              Save draft
            </button>
            <button formAction={publishSeo} className="admin-button">
              Publish SEO
            </button>
            <button
              formAction={resetSeoDraft}
              formNoValidate
              className="ml-auto text-sm text-red-600"
            >
              Reset draft
            </button>
          </div>
        </form>
        <section>
          <h2 className="text-xl font-semibold">Page overrides</h2>
          <div className="mt-4 space-y-3">
            {pageList.map((page) => {
              const seo = page.seo as {
                title?: string;
                description?: string;
                canonical?: string;
                ogImage?: string;
                noindex?: boolean;
              };
              return (
                <form
                  action={updatePageSeo}
                  key={page.id}
                  className="rounded-2xl border bg-white p-5"
                >
                  <input type="hidden" name="id" value={page.id} />
                  <h3 className="mb-3 font-semibold">
                    {page.title}{" "}
                    <span className="text-xs font-normal text-neutral-400">
                      /{page.slug}
                    </span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="SEO title"
                      name="title"
                      value={seo.title || ""}
                    />
                    <Field
                      label="Canonical override"
                      name="canonical"
                      value={seo.canonical || ""}
                    />
                    <label className="block text-sm md:col-span-2">
                      Meta description
                      <textarea
                        name="description"
                        defaultValue={seo.description}
                        className="mt-1 block w-full rounded-lg border p-2"
                      />
                    </label>
                    <Field
                      label="Open Graph image"
                      name="ogImage"
                      value={seo.ogImage || ""}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="noindex"
                        defaultChecked={seo.noindex}
                      />
                      Noindex this page
                    </label>
                  </div>
                  <button className="admin-button mt-3">Save page SEO</button>
                </form>
              );
            })}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Post overrides</h2>
          <div className="mt-4 space-y-3">
            {posts.map((post) => {
              const data = post.data as {
                seoTitle?: string;
                seoDescription?: string;
                seoCanonical?: string;
                seoOgImage?: string;
                seoNoindex?: boolean;
              };
              return (
                <form
                  action={updatePostSeo}
                  key={post.id}
                  className="rounded-2xl border bg-white p-5"
                >
                  <input type="hidden" name="id" value={post.id} />
                  <h3 className="mb-3 font-semibold">{post.title}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="SEO title"
                      name="title"
                      value={data.seoTitle || ""}
                    />
                    <Field
                      label="Canonical override"
                      name="canonical"
                      value={data.seoCanonical || ""}
                    />
                    <label className="block text-sm md:col-span-2">
                      Meta description
                      <textarea
                        name="description"
                        defaultValue={data.seoDescription}
                        className="mt-1 block w-full rounded-lg border p-2"
                      />
                    </label>
                    <Field
                      label="Open Graph image"
                      name="ogImage"
                      value={data.seoOgImage || ""}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="noindex"
                        defaultChecked={data.seoNoindex}
                      />
                      Noindex this post
                    </label>
                  </div>
                  <button className="admin-button mt-3">Save post SEO</button>
                </form>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
