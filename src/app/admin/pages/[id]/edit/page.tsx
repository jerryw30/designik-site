import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "@/app/admin/admin-shell";
import { updatePage } from "@/app/admin/actions";
import { SeoPanel } from "../../../seo-panel";
import { T, statusPill, wpDate } from "../../../theme";

type PageSeo = {
  focusKeyphrase?: string;
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  xTitle?: string;
  xDescription?: string;
};

export const dynamic = "force-dynamic";

const cardTitle = "text-[13px] font-semibold text-[#1b1c20]";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) notFound();
  const seo = (page.seo || {}) as PageSeo;

  return (
    <AdminShell user={user} title={`Edit page · ${page.title}`}>
      <form action={updatePage}>
        <input type="hidden" name="id" value={page.id} />

        {/* Top row: back link + borderless title */}
        <div className="mb-6">
          <Link href="/admin/pages" className={`${T.mutedLink} text-[13px] font-medium`}>
            ← Pages
          </Link>
          <input
            name="title"
            defaultValue={page.title}
            required
            aria-label="Page title"
            placeholder="Page title"
            className="mt-2 block w-full border-0 border-b-2 border-transparent bg-transparent pb-1.5 text-2xl font-semibold text-[#1b1c20] outline-none transition placeholder:text-neutral-300 focus:border-[#a10140]"
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Content</h2>
              </div>
              <div className="p-5">
                <p className="text-[13px] leading-6 text-neutral-500">
                  Sections, media and layout for this page are managed in the visual builder.
                  Open it to edit the live design of the page.
                </p>
                <Link href={`/admin/pages/${page.id}/builder`} className={`${T.btn} mt-4`}>
                  Edit visually
                </Link>
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>SEO</h2>
              </div>
              <div className="p-5">
                <SeoPanel
                  idPrefix="page-seo"
                  fallbackTitle={page.title}
                  urlPrefix="/"
                  slug={page.slug === "home" ? "" : page.slug}
                  defaults={{
                    focusKeyphrase: seo.focusKeyphrase,
                    seoTitle: seo.title,
                    seoDescription: seo.description,
                    canonical: seo.canonical,
                    noindex: seo.noindex,
                    ogTitle: seo.ogTitle,
                    ogDescription: seo.ogDescription,
                    ogImage: seo.ogImage,
                    xTitle: seo.xTitle,
                    xDescription: seo.xDescription,
                  }}
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-6">
            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Publish</h2>
                <span className={statusPill(page.status)}>{page.status}</span>
              </div>
              <div className="p-5">
                <button className={`${T.btnPrimary} w-full`}>Save page</button>
                <p className={T.help}>Last updated {wpDate(page.updatedAt)}</p>
              </div>
            </section>

            <section className={T.card}>
              <div className={T.cardHeader}>
                <h2 className={cardTitle}>Slug / URL</h2>
              </div>
              <div className="p-5">
                <label htmlFor="page-slug" className={T.label}>
                  URL slug
                </label>
                <input id="page-slug" name="slug" defaultValue={page.slug} required className={T.input} />
                <p className={T.help}>Public address: /{page.slug}</p>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </AdminShell>
  );
}
