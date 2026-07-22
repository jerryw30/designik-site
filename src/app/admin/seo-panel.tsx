"use client";

import { useMemo, useState } from "react";
import { T } from "./theme";
import { MediaPicker } from "./media-picker";

type SeoDefaults = {
  focusKeyphrase?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  xTitle?: string;
  xDescription?: string;
};

function Counter({ value, ideal }: { value: string; ideal: [number, number] }) {
  const len = value.length;
  const ok = len >= ideal[0] && len <= ideal[1];
  const empty = len === 0;
  return (
    <span className={`text-[11px] font-medium ${empty ? "text-neutral-400" : ok ? "text-emerald-600" : "text-amber-600"}`}>
      {len} chars{empty ? "" : ok ? " · good" : len < ideal[0] ? " · a bit short" : " · too long"}
    </span>
  );
}

/**
 * Yoast-style SEO panel: focus keyphrase with live checks, Google snippet
 * preview, search + social (OG) + X fields, canonical and noindex. Plain
 * named inputs so existing server actions receive everything via FormData.
 */
export function SeoPanel({
  defaults = {},
  fallbackTitle,
  urlPrefix,
  slug,
  idPrefix = "seo",
}: {
  defaults?: SeoDefaults;
  fallbackTitle: string;
  urlPrefix: string; // e.g. "/blog/" or "/"
  slug: string;
  idPrefix?: string;
}) {
  const [tab, setTab] = useState<"search" | "social" | "x">("search");
  const [focus, setFocus] = useState(defaults.focusKeyphrase || "");
  const [title, setTitle] = useState(defaults.seoTitle || "");
  const [desc, setDesc] = useState(defaults.seoDescription || "");

  const previewTitle = title || fallbackTitle;
  const previewUrl = `designik.agency${urlPrefix}${slug}`;

  const checks = useMemo(() => {
    if (!focus.trim()) return [];
    const kp = focus.trim().toLowerCase();
    return [
      { label: "Keyphrase in SEO title", pass: previewTitle.toLowerCase().includes(kp) },
      { label: "Keyphrase in meta description", pass: desc.toLowerCase().includes(kp) },
      { label: "Keyphrase in URL slug", pass: slug.toLowerCase().replaceAll("-", " ").includes(kp) },
      { label: "Meta description length", pass: desc.length >= 120 && desc.length <= 160 },
      { label: "SEO title length", pass: previewTitle.length >= 30 && previewTitle.length <= 60 },
    ];
  }, [focus, previewTitle, desc, slug]);

  const tabBtn = (key: typeof tab, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setTab(key)}
      className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ${
        tab === key ? "bg-gradient-to-r from-[#a10140] to-[#c81a5e] text-white" : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* focus keyphrase */}
      <div>
        <label htmlFor={`${idPrefix}-focus`} className={T.label}>
          Focus keyphrase
        </label>
        <input
          id={`${idPrefix}-focus`}
          name="focusKeyphrase"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="e.g. creative agency"
          className={T.input}
        />
        {checks.length > 0 && (
          <ul className="mt-2 space-y-1">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-[12px]">
                <span className={`h-2 w-2 rounded-full ${c.pass ? "bg-emerald-500" : "bg-amber-400"}`} />
                <span className={c.pass ? "text-neutral-600" : "text-neutral-500"}>{c.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Google snippet preview */}
      <div className="rounded-lg border border-black/[0.06] bg-neutral-50 p-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Search preview</p>
        <p className="truncate text-[13px] text-[#202124]">{previewUrl}</p>
        <p className="truncate text-[18px] leading-snug text-[#1a0dab]">{previewTitle}</p>
        <p className="text-[13px] leading-snug text-[#4d5156] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
          {desc || "Add a meta description to control how this appears in search results."}
        </p>
      </div>

      {/* tabs */}
      <div className="flex gap-1.5">{[tabBtn("search", "Search"), tabBtn("social", "Social"), tabBtn("x", "X / Twitter")]}</div>

      {/* search tab */}
      <div className={tab === "search" ? "space-y-4" : "hidden"}>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${idPrefix}-title`} className={T.label}>
              SEO title
            </label>
            <Counter value={title} ideal={[30, 60]} />
          </div>
          <input id={`${idPrefix}-title`} name="seoTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={fallbackTitle} className={T.input} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${idPrefix}-desc`} className={T.label}>
              Meta description
            </label>
            <Counter value={desc} ideal={[120, 160]} />
          </div>
          <textarea id={`${idPrefix}-desc`} name="seoDescription" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={`${T.input} resize-y`} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-canonical`} className={T.label}>
            Canonical URL
          </label>
          <input id={`${idPrefix}-canonical`} name="canonical" defaultValue={defaults.canonical} placeholder="Leave empty for default" className={T.input} />
          <p className={T.help}>Only set when this content exists at another primary URL.</p>
        </div>
        <label className="flex items-center gap-2.5 text-[13px] text-neutral-700">
          <input type="checkbox" name="noindex" defaultChecked={!!defaults.noindex} className={T.checkbox} />
          Discourage search engines from indexing this
        </label>
      </div>

      {/* social tab */}
      <div className={tab === "social" ? "space-y-4" : "hidden"}>
        <div>
          <label htmlFor={`${idPrefix}-og-title`} className={T.label}>
            Social title
          </label>
          <input id={`${idPrefix}-og-title`} name="ogTitle" defaultValue={defaults.ogTitle} placeholder={previewTitle} className={T.input} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-og-desc`} className={T.label}>
            Social description
          </label>
          <textarea id={`${idPrefix}-og-desc`} name="ogDescription" defaultValue={defaults.ogDescription} rows={2} className={`${T.input} resize-y`} />
        </div>
        <div>
          <span className={T.label}>Social image</span>
          <MediaPicker name="ogImage" defaultValue={defaults.ogImage} buttonLabel="Set social image" />
          <p className={T.help}>Used for Facebook, LinkedIn, WhatsApp previews (1200×630 recommended).</p>
        </div>
      </div>

      {/* x tab */}
      <div className={tab === "x" ? "space-y-4" : "hidden"}>
        <div>
          <label htmlFor={`${idPrefix}-x-title`} className={T.label}>
            X title
          </label>
          <input id={`${idPrefix}-x-title`} name="xTitle" defaultValue={defaults.xTitle} placeholder={previewTitle} className={T.input} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-x-desc`} className={T.label}>
            X description
          </label>
          <textarea id={`${idPrefix}-x-desc`} name="xDescription" defaultValue={defaults.xDescription} rows={2} className={`${T.input} resize-y`} />
        </div>
        <p className={T.help}>Falls back to the social fields, then the search fields, when empty.</p>
      </div>
    </div>
  );
}
