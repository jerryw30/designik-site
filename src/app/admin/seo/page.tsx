import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, pages, siteSettings } from "@/db/schema";
import { seoSettings } from "@/cms/seo";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
import { SeoTabs } from "./seo-tabs";
import {
  publishSeo,
  resetSeoDraft,
  saveSeoDraft,
  updatePageSeo,
  updatePostSeo,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "seo")) redirect("/admin");
  const [[row], pageList, posts] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.key, "seo_settings")).limit(1),
    db.select().from(pages).where(isNull(pages.deletedAt)).orderBy(desc(pages.updatedAt)),
    db
      .select()
      .from(adminResources)
      .where(and(eq(adminResources.module, "posts"), isNull(adminResources.deletedAt)))
      .orderBy(desc(adminResources.updatedAt)),
  ]);
  const stored = row?.value as { draft?: unknown; published?: unknown } | undefined;
  const value = seoSettings(stored?.draft ?? stored?.published);
  const hasDraft = stored?.draft !== undefined;

  const pageRows = pageList.map((p) => {
    const seo = (p.seo || {}) as { title?: string; description?: string; canonical?: string; ogImage?: string; noindex?: boolean };
    return { id: p.id, title: p.title, slug: p.slug, seo };
  });
  const postRows = posts.map((p) => {
    const d = (p.data || {}) as { seoTitle?: string; seoDescription?: string; seoCanonical?: string; seoOgImage?: string; seoNoindex?: boolean };
    return {
      id: p.id,
      title: p.title,
      seo: { title: d.seoTitle, description: d.seoDescription, canonical: d.seoCanonical, ogImage: d.seoOgImage, noindex: d.seoNoindex },
    };
  });

  return (
    <AdminShell user={user} title="SEO Center">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className={T.screenTitle}>SEO Center</h2>
        <span className="text-[13px] text-neutral-400">Meta defaults, webmaster verification, social, schema and per-page overrides — all injected into the site.</span>
        {hasDraft && <span className={T.pillDraft}>Unpublished draft</span>}
      </div>

      <SeoTabs
        value={value}
        pages={pageRows}
        posts={postRows}
        actions={{ saveSeoDraft, publishSeo, resetSeoDraft, updatePageSeo, updatePostSeo }}
      />
    </AdminShell>
  );
}
