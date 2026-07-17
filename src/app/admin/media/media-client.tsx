"use client";

import { useState } from "react";

export function MediaUploadForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      encType="multipart/form-data"
      className="mb-6 rounded-2xl border border-dashed border-pink-300 bg-white p-6"
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
      <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
        <label className="text-sm font-medium">
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
            className="mt-2 block w-full rounded-xl border p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:font-semibold file:text-pink-700"
          />
        </label>
        <button
          disabled={uploading}
          className="admin-button min-w-36 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload media"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
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
      className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-neutral-50"
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
      className={`flex items-center justify-center bg-neutral-100 text-4xl ${className}`}
      aria-label={mimeType}
    >
      ▤
    </div>
  );
}
