"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "./theme";

type Asset = {
  id: string;
  url: string;
  title: string;
  filename?: string;
  mimeType: string;
  byteSize?: number;
};

/**
 * WordPress-style media field: preview + "Set image" button that opens a
 * Select-or-Upload modal backed by the media library. Submits through a
 * hidden input so server forms keep the same field name.
 */
export function MediaPicker({
  name,
  defaultValue = "",
  buttonLabel = "Set featured image",
}: {
  name: string;
  defaultValue?: string;
  buttonLabel?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      setAssets((data.assets || []).filter((a: Asset) => a.mimeType.startsWith("image/")));
    } catch {
      setError("Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError("");
      setSelected(null);
      load();
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setUploading(true);
      setError("");
      const form = new FormData();
      [...files].forEach((f) => form.append("files", f));
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Upload failed.");
        await load();
        const first = data.assets?.[0];
        if (first) setSelected(first);
        setTab("library");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const filtered = search
    ? assets.filter((a) => `${a.title} ${a.filename || ""}`.toLowerCase().includes(search.toLowerCase()))
    : assets;

  return (
    <div>
      <input type="hidden" name={name} value={value} />

      {value ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full rounded-lg border border-black/[0.06] object-cover" />
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setOpen(true)} className={T.btnSmall}>
              Replace image
            </button>
            <button type="button" onClick={() => setValue("")} className="text-[12.5px] font-medium text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-6 text-[13px] font-medium text-neutral-500 transition hover:border-[#a10140]/50 hover:text-[#a10140]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="M3 5h18v14H3z" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
          </svg>
          {buttonLabel}
        </button>
      )}

      {/* modal */}
      {open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[min(640px,90vh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
              <h3 className="text-[16px] font-semibold">Select or upload media</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4.5 w-4.5" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* tabs + search */}
            <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-5 py-2.5">
              {(["library", "upload"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                    tab === t ? "bg-gradient-to-r from-[#a10140] to-[#c81a5e] text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {t === "library" ? "Media Library" : "Upload files"}
                </button>
              ))}
              {tab === "library" && (
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media…"
                  className="ml-auto w-52 rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15"
                />
              )}
            </div>

            {error && <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-[13px] text-red-600">{error}</p>}

            {/* body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {tab === "upload" ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    upload(e.dataTransfer.files);
                  }}
                  className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 transition hover:border-[#a10140]/50 hover:text-[#a10140]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10" aria-hidden>
                    <path d="M12 16V4" />
                    <path d="M6 10l6-6 6 6" />
                    <path d="M4 20h16" />
                  </svg>
                  <span className="text-[15px] font-medium">{uploading ? "Uploading…" : "Drop images here or click to upload"}</span>
                  <span className="text-[12px] text-neutral-400">PNG, JPG, WebP, GIF — up to 4MB</span>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
                </button>
              ) : loading ? (
                <p className="py-16 text-center text-[13px] text-neutral-400">Loading media…</p>
              ) : filtered.length === 0 ? (
                <p className="py-16 text-center text-[13px] text-neutral-400">
                  No images yet — switch to “Upload files” to add some.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {filtered.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a)}
                      onDoubleClick={() => {
                        setValue(a.url);
                        setOpen(false);
                      }}
                      className={`group relative aspect-square overflow-hidden rounded-lg border bg-neutral-50 transition ${
                        selected?.id === a.id ? "border-transparent ring-2 ring-[#a10140]" : "border-black/[0.06] hover:ring-2 hover:ring-[#a10140]/40"
                      }`}
                      title={a.title}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.title} loading="lazy" className="h-full w-full object-cover" />
                      {selected?.id === a.id && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#a10140] text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                            <path d="M5 12.5 10 17.5 19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3.5">
              <span className="truncate pr-3 text-[12.5px] text-neutral-400">
                {selected ? selected.title : `${filtered.length} item${filtered.length === 1 ? "" : "s"}`}
              </span>
              <button
                type="button"
                disabled={!selected}
                onClick={() => {
                  if (!selected) return;
                  setValue(selected.url);
                  setOpen(false);
                }}
                className={`${T.btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Set image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
