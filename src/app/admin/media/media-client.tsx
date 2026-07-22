"use client";

import { useState } from "react";
import { T } from "../theme";

export function MediaUploadForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      action="/api/media/upload"
      method="post"
      encType="multipart/form-data"
      className="mb-6 rounded-xl border-2 border-dashed border-neutral-300 bg-white p-6 transition hover:border-[#a10140]/40"
      onSubmit={async (event) => {
        event.preventDefault();
        setUploading(true);
        setError("");
        try {
          const response = await fetch("/api/media/upload", {
            method: "POST",
            body: new FormData(event.currentTarget),
          });
          if (!response.ok) throw new Error(await response.text());
          window.location.assign("/admin/media?uploaded=1");
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Upload failed");
          setUploading(false);
        }
      }}
    >
      <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block text-[13px] font-medium text-neutral-700">
          Upload files{" "}
          <span className="font-normal text-neutral-400">
            (up to 4 MB each)
          </span>
          <input
            name="files"
            type="file"
            multiple
            required
            accept="image/*,video/*,audio/*,application/pdf,font/*"
            className="mt-2 block w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-[13px] text-neutral-600 outline-none transition focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15 file:mr-4 file:rounded-md file:border-0 file:bg-[#a10140]/10 file:px-4 file:py-2 file:text-[12.5px] file:font-semibold file:text-[#a10140]"
          />
        </label>
        <button
          disabled={uploading}
          className={`${T.btnPrimary} min-w-36 disabled:opacity-50`}
        >
          {uploading ? "Uploading…" : "Upload media"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={T.btnSmall}
      onClick={async () => {
        await navigator.clipboard.writeText(
          new URL(url, window.location.origin).href,
        );
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

export function MediaPreview({
  id,
  mimeType,
  title,
  className = "",
}: {
  id: string;
  mimeType: string;
  title: string;
  className?: string;
}) {
  const src = `/api/media/${id}`;
  if (mimeType.startsWith("image/"))
    // Media records can contain arbitrary user uploads, so their dimensions
    // are unknown and the direct asset endpoint is the correct source here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={title} className={className} />;
  if (mimeType.startsWith("video/"))
    return (
      <video src={src} controls preload="metadata" className={className} />
    );
  if (mimeType.startsWith("audio/"))
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <audio src={src} controls className="w-full" />
      </div>
    );
  return (
    <div
      className={`flex items-center justify-center bg-neutral-100 text-4xl text-neutral-400 ${className}`}
      aria-label={mimeType}
    >
      ▤
    </div>
  );
}
