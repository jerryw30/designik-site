import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, pages, siteSettings } from "@/db/schema";
import { seoSettings } from "@/cms/seo";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
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
  help,
}: {
  label: string;
  name: string;
  value: string;
  help?: string;
}) => (
  <label className="block">
    <span className={T.label}>{label}</span>
    <input name={name} defaultValue={value} className={T.input} />
    {help && <p className={T.help}>{help}</p>}
  </label>
);
const Check = ({
  label,
  name,
  checked,
}: {
  label: string;
  name: string;
  checked: boolean;
}) => (
  <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
    <input
      type="checkbox"
      name={name}
      defaultChecked={checked}
      className={T.checkbox}
    />
    {label}
  </label>
);
export default async function SeoPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "seo")) redirect("/admin");
  const [[row], pageList, posts] = await Promise.all([
    db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "seo_settings"))
      .limit(1),
    db
      .select()
      .from(pages)
      .where(isNull(pages.deletedAt))
      .orderBy(desc(pages.updatedAt)),
    db
      .select()
      .from(adminResources)
      .where(
        and(
          eq(adminResources.module, "posts"),
          isNull(adminResources.deletedAt),
        ),
      )
      .orderBy(desc(adminResources.updatedAt)),
  ]);
  const stored = row?.value as { draft?: unknown; published?: unknown } | undefined,
    value = seoSettings(stored?.draft ?? stored?.published);
  return (
    <AdminShell user={user} title="SEO Center">
      <div className="mb-6">
        <h2 className={T.screenTitle}>SEO Center</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Global defaults plus per-page and per-post overrides for search
          metadata.
        </p>
      </div>
      <div className="space-y-8">
        <form className={T.card}>
          <div className={T.cardHeader}>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1b1c20]">
                Global SEO
              </h2>
              <p className="mt-0.5 text-[12px] text-neutral-400">
                Draft changes do not affect search metadata until published.
              </p>
            </div>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Field
              label="Site title"
              name="siteTitle"
              value={value.siteTitle}
            />
            <Field
              label="Title template"
              name="titleTemplate"
              value={value.titleTemplate}
              help="%s is replaced with the page title."
            />
            <label className="block md:col-span-2">
              <span className={T.label}>Default description</span>
              <textarea
                name="description"
                defaultValue={value.description}
                className={`${T.input} min-h-20`}
              />
              <p className={T.help}>
                Used when a page has no description of its own.
              </p>
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-2">
              <Check label="Allow indexing" name="index" checked={value.index} />
              <Check label="Follow links" name="follow" checked={value.follow} />
              <Check
                label="Enable XML sitemap"
                name="sitemapEnabled"
                checked={value.sitemapEnabled}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-black/[0.05] px-5 py-4">
            <button formAction={saveSeoDraft} className={T.btn}>
              Save draft
            </button>
            <button formAction={publishSeo} className={T.btnPrimary}>
              Publish SEO
            </button>
            <button
              formAction={resetSeoDraft}
              formNoValidate
              className={`ml-auto text-[13px] ${T.dangerLink}`}
            >
              Reset draft
            </button>
          </div>
        </form>
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold text-[#1b1c20]">
              Page overrides
            </h2>
            <span className="text-[12.5px] text-neutral-400">
              {pageList.length} page{pageList.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-4">
            {pageList.map((page) => {
              const seo = page.seo as {
                title?: string;
                description?: string;
                canonical?: string;
                ogImage?: string;
                noindex?: boolean;
              };
              return (
                <form action={updatePageSeo} key={page.id} className={T.card}>
                  <input type="hidden" name="id" value={page.id} />
                  <div className={T.cardHeader}>
                    <h3 className="text-[14px] font-semibold text-[#1b1c20]">
                      {page.title}{" "}
                      <span className="text-[12px] font-normal text-neutral-400">
                        /{page.slug}
                      </span>
                    </h3>
                  </div>
                  <div className="grid gap-5 p-5 md:grid-cols-2">
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
                    <label className="block md:col-span-2">
                      <span className={T.label}>Meta description</span>
                      <textarea
                        name="description"
                        defaultValue={seo.description}
                        className={`${T.input} min-h-20`}
                      />
                    </label>
                    <Field
                      label="Open Graph image"
                      name="ogImage"
                      value={seo.ogImage || ""}
                    />
                    <Check
                      label="Noindex this page"
                      name="noindex"
                      checked={!!seo.noindex}
                    />
                  </div>
                  <div className="border-t border-black/[0.05] px-5 py-3.5">
                    <button className={T.btnPrimary}>Save page SEO</button>
                  </div>
                </form>
              );
            })}
          </div>
        </section>
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold text-[#1b1c20]">
              Post overrides
            </h2>
            <span className="text-[12.5px] text-neutral-400">
              {posts.length} post{posts.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-4">
            {posts.map((post) => {
              const data = post.data as {
                seoTitle?: string;
                seoDescription?: string;
                seoCanonical?: string;
                seoOgImage?: string;
                seoNoindex?: boolean;
              };
              return (
                <form action={updatePostSeo} key={post.id} className={T.card}>
                  <input type="hidden" name="id" value={post.id} />
                  <div className={T.cardHeader}>
                    <h3 className="text-[14px] font-semibold text-[#1b1c20]">
                      {post.title}
                    </h3>
                  </div>
                  <div className="grid gap-5 p-5 md:grid-cols-2">
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
                    <label className="block md:col-span-2">
                      <span className={T.label}>Meta description</span>
                      <textarea
                        name="description"
                        defaultValue={data.seoDescription}
                        className={`${T.input} min-h-20`}
                      />
                    </label>
                    <Field
                      label="Open Graph image"
                      name="ogImage"
                      value={data.seoOgImage || ""}
                    />
                    <Check
                      label="Noindex this post"
                      name="noindex"
                      checked={!!data.seoNoindex}
                    />
                  </div>
                  <div className="border-t border-black/[0.05] px-5 py-3.5">
                    <button className={T.btnPrimary}>Save post SEO</button>
                  </div>
                </form>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
