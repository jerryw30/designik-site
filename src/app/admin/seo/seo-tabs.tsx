"use client";

import { useState } from "react";
import { T } from "../theme";
import type { SeoSettings } from "@/cms/seo";

type PageRow = { id: string; title: string; slug: string; seo: { title?: string; description?: string; canonical?: string; ogImage?: string; noindex?: boolean } };
type PostRow = { id: string; title: string; seo: { title?: string; description?: string; canonical?: string; ogImage?: string; noindex?: boolean } };

type Actions = {
  saveSeoDraft: (fd: FormData) => Promise<void>;
  publishSeo: (fd: FormData) => Promise<void>;
  resetSeoDraft: (fd: FormData) => Promise<void>;
  updatePageSeo: (fd: FormData) => Promise<void>;
  updatePostSeo: (fd: FormData) => Promise<void>;
};

const TABS = [
  ["general", "General"],
  ["social", "Social"],
  ["verification", "Verification"],
  ["schema", "Schema"],
  ["scripts", "Scripts"],
  ["pages", "Page SEO"],
  ["posts", "Post SEO"],
] as const;
type TabKey = (typeof TABS)[number][0];

function Field({ label, name, defaultValue, help, placeholder }: { label: string; name: string; defaultValue?: string; help?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className={T.label}>{label}</span>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} className={T.input} />
      {help && <p className={T.help}>{help}</p>}
    </label>
  );
}
function Area({ label, name, defaultValue, help, mono, rows = 4 }: { label: string; name: string; defaultValue?: string; help?: string; mono?: boolean; rows?: number }) {
  return (
    <label className="block">
      <span className={T.label}>{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={rows} className={`${T.input} ${mono ? "font-mono text-[12.5px]" : ""}`} />
      {help && <p className={T.help}>{help}</p>}
    </label>
  );
}

export function SeoTabs({ value, pages, posts, actions }: { value: SeoSettings; pages: PageRow[]; posts: PostRow[]; actions: Actions }) {
  const [tab, setTab] = useState<TabKey>("general");
  const counts: Partial<Record<TabKey, number>> = { pages: pages.length, posts: posts.length };

  return (
    <div>
      {/* tab bar */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-black/[0.06] pb-px">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative rounded-t-lg px-4 py-2.5 text-[13.5px] font-medium transition ${
              tab === key ? "bg-white text-[#a10140] shadow-[0_-1px_0_#a10140_inset]" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            }`}
          >
            {label}
            {counts[key] ? <span className="ml-1.5 rounded-full bg-neutral-200 px-1.5 text-[11px] text-neutral-600">{counts[key]}</span> : null}
          </button>
        ))}
      </div>

      {/* Global settings form (tabs: general/social/verification/schema/scripts share one form) */}
      <form className={`${T.card} ${["pages", "posts"].includes(tab) ? "hidden" : ""}`}>
        {/* General */}
        <div className={`grid gap-5 p-5 md:grid-cols-2 ${tab === "general" ? "" : "hidden"}`}>
          <Field label="Site title" name="siteTitle" defaultValue={value.siteTitle} />
          <Field label="Title template" name="titleTemplate" defaultValue={value.titleTemplate} help="%s is replaced with the page title." />
          <Area label="Default meta description" name="description" defaultValue={value.description} help="Used when a page has no description of its own." rows={3} />
          <Area label="Keywords" name="keywords" defaultValue={value.keywords} help="Comma-separated. Optional — most engines ignore these." rows={2} />
          <Field label="Canonical base URL" name="canonicalBase" defaultValue={value.canonicalBase} help="Your primary domain, e.g. https://designik.agency" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-2">
            <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
              <input type="checkbox" name="index" defaultChecked={value.index} className={T.checkbox} /> Allow search engines to index the site
            </label>
            <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
              <input type="checkbox" name="follow" defaultChecked={value.follow} className={T.checkbox} /> Follow links
            </label>
            <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
              <input type="checkbox" name="sitemapEnabled" defaultChecked={value.sitemapEnabled} className={T.checkbox} /> Enable XML sitemap
            </label>
          </div>
        </div>

        {/* Social */}
        <div className={`grid gap-5 p-5 md:grid-cols-2 ${tab === "social" ? "" : "hidden"}`}>
          <Field label="Default Open Graph / social image" name="ogImage" defaultValue={value.ogImage} placeholder="https://… (1200×630)" help="Shown when a page is shared and has no image of its own." />
          <Field label="Twitter / X handle" name="twitterHandle" defaultValue={value.twitterHandle} placeholder="@designik" />
          <label className="block">
            <span className={T.label}>Twitter card type</span>
            <select name="twitterCardType" defaultValue={value.twitterCardType} className={`${T.select} w-full`}>
              <option value="summary_large_image">Large image</option>
              <option value="summary">Summary</option>
            </select>
          </label>
          <Field label="Facebook App ID" name="facebookAppId" defaultValue={value.facebookAppId} help="Optional — for Facebook Insights." />
        </div>

        {/* Verification (Webmaster tools) */}
        <div className={`p-5 ${tab === "verification" ? "" : "hidden"}`}>
          <p className="mb-4 text-[13px] text-neutral-500">
            Paste the <strong>verification code</strong> each service gives you (the value only, not the whole meta tag). It is injected into the site&rsquo;s <code className="rounded bg-neutral-100 px-1">&lt;head&gt;</code> so you can verify ownership.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Google Search Console" name="googleVerification" defaultValue={value.googleVerification} placeholder="e.g. AbC123…" help="Search Console → Settings → Ownership → HTML tag." />
            <Field label="Bing Webmaster Tools" name="bingVerification" defaultValue={value.bingVerification} placeholder="msvalidate.01 content" />
            <Field label="Pinterest" name="pinterestVerification" defaultValue={value.pinterestVerification} placeholder="p:domain_verify content" />
            <Field label="Yandex Webmaster" name="yandexVerification" defaultValue={value.yandexVerification} />
            <Field label="Baidu" name="baiduVerification" defaultValue={value.baiduVerification} />
          </div>
        </div>

        {/* Schema / Organization */}
        <div className={`grid gap-5 p-5 md:grid-cols-2 ${tab === "schema" ? "" : "hidden"}`}>
          <Field label="Organization name" name="orgName" defaultValue={value.orgName} help="Emitted as Organization structured data (JSON-LD)." />
          <Field label="Organization logo URL" name="orgLogo" defaultValue={value.orgLogo} placeholder="https://…" />
          <Area label="Social profile URLs" name="orgSameAs" defaultValue={value.orgSameAs} help="One per line — Instagram, LinkedIn, X, etc. Powers the knowledge panel." rows={3} />
          <Area label="Custom JSON-LD" name="schemaJson" defaultValue={value.schemaJson} help="Advanced: raw JSON-LD injected as-is. Leave blank to skip." mono rows={6} />
        </div>

        {/* Scripts */}
        <div className={`p-5 ${tab === "scripts" ? "" : "hidden"}`}>
          <Area label="Header scripts" name="headCode" defaultValue={value.headCode} help="JavaScript injected into <head> — Google Tag Manager, analytics, etc. Do not paste <meta> verification tags here; use the Verification tab for those." mono rows={8} />
        </div>

        {/* actions bar (shared) */}
        <div className="flex items-center gap-2 border-t border-black/[0.05] px-5 py-4">
          <button formAction={actions.saveSeoDraft} className={T.btn}>Save draft</button>
          <button formAction={actions.publishSeo} className={T.btnPrimary}>Publish changes</button>
          <button formAction={actions.resetSeoDraft} formNoValidate className={`ml-auto text-[13px] ${T.dangerLink}`}>Reset draft</button>
        </div>
      </form>

      {/* Page overrides */}
      <div className={tab === "pages" ? "space-y-4" : "hidden"}>
        {pages.length === 0 && <p className="rounded-xl border border-dashed border-black/10 p-10 text-center text-[13px] text-neutral-400">No pages yet.</p>}
        {pages.map((page) => (
          <form action={actions.updatePageSeo} key={page.id} className={T.card}>
            <input type="hidden" name="id" value={page.id} />
            <div className={T.cardHeader}>
              <h3 className="text-[14px] font-semibold text-[#1b1c20]">{page.title} <span className="text-[12px] font-normal text-neutral-400">/{page.slug}</span></h3>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field label="SEO title" name="title" defaultValue={page.seo.title || ""} />
              <Field label="Canonical override" name="canonical" defaultValue={page.seo.canonical || ""} />
              <Area label="Meta description" name="description" defaultValue={page.seo.description} rows={2} />
              <Field label="Open Graph image" name="ogImage" defaultValue={page.seo.ogImage || ""} />
              <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
                <input type="checkbox" name="noindex" defaultChecked={!!page.seo.noindex} className={T.checkbox} /> Noindex this page
              </label>
            </div>
            <div className="border-t border-black/[0.05] px-5 py-3.5"><button className={T.btnPrimary}>Save page SEO</button></div>
          </form>
        ))}
      </div>

      {/* Post overrides */}
      <div className={tab === "posts" ? "space-y-4" : "hidden"}>
        {posts.length === 0 && <p className="rounded-xl border border-dashed border-black/10 p-10 text-center text-[13px] text-neutral-400">No posts yet.</p>}
        {posts.map((post) => (
          <form action={actions.updatePostSeo} key={post.id} className={T.card}>
            <input type="hidden" name="id" value={post.id} />
            <div className={T.cardHeader}>
              <h3 className="text-[14px] font-semibold text-[#1b1c20]">{post.title}</h3>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field label="SEO title" name="title" defaultValue={post.seo.title || ""} />
              <Field label="Canonical override" name="canonical" defaultValue={post.seo.canonical || ""} />
              <Area label="Meta description" name="description" defaultValue={post.seo.description} rows={2} />
              <Field label="Open Graph image" name="ogImage" defaultValue={post.seo.ogImage || ""} />
              <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
                <input type="checkbox" name="noindex" defaultChecked={!!post.seo.noindex} className={T.checkbox} /> Noindex this post
              </label>
            </div>
            <div className="border-t border-black/[0.05] px-5 py-3.5"><button className={T.btnPrimary}>Save post SEO</button></div>
          </form>
        ))}
      </div>
    </div>
  );
}
