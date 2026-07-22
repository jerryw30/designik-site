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
        const formElement = event.currentTarget;
        setUploading(true);
        setError("");
        try {
          const response = await fetch("/api/media/upload", {
            method: "POST",
            headers: { accept: "application/json" },
            body: new FormData(formElement),
          });
          if (!response.ok) {
            let message = "Upload failed";
            try {
              const payload = await response.json();
              if (payload?.error) message = payload.error;
            } catch {
              // Non-JSON error body — keep the generic message.
            }
            throw new Error(message);
          }
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
        const absolute = new URL(url, window.location.origin).href;
        try {
          await navigator.clipboard.writeText(absolute);
        } catch {
          // Clipboard API unavailable (insecure context) — fall back to a
          // temporary input + execCommand copy.
          const holder = document.createElement("textarea");
          holder.value = absolute;
          holder.style.position = "fixed";
          holder.style.opacity = "0";
          document.body.appendChild(holder);
          holder.select();
          document.execCommand("copy");
          holder.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

function typeLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("font/")) return "Font";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.startsWith("video/")) return "Video";
  return mimeType.split("/")[1]?.toUpperCase().slice(0, 8) || "File";
}

export function MediaPreview({
  id,
  mimeType,
  title,
  className = "",
  interactive = false,
}: {
  id: string;
  mimeType: string;
  title: string;
  className?: string;
  /** Show playable controls / embedded viewers (edit screen). Grid tiles stay non-interactive so clicks navigate. */
  interactive?: boolean;
}) {
  const src = `/api/media/${id}`;
  if (mimeType.startsWith("image/"))
    // Media records can contain arbitrary user uploads, so their dimensions
    // are unknown and the direct asset endpoint is the correct source here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={title} className={className} />;
  if (mimeType.startsWith("video/")) {
    if (interactive)
      return (
        <video src={src} controls preload="metadata" className={className} />
      );
    return (
      <div className={`relative ${className}`}>
        <video
          src={src}
          preload="metadata"
          muted
          playsInline
          className="pointer-events-none h-full w-full object-cover"
        />
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 pl-0.5 text-[15px] text-white">
            ▶
          </span>
        </span>
      </div>
    );
  }
  if (mimeType.startsWith("audio/")) {
    if (interactive)
      return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
          <audio src={src} controls className="w-full" />
        </div>
      );
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 bg-neutral-100 text-neutral-400 ${className}`}
        aria-label={title}
      >
        <span aria-hidden className="text-3xl">
          ♫
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
          Audio
        </span>
      </div>
    );
  }
  if (mimeType === "application/pdf" && interactive)
    return (
      <iframe
        src={src}
        title={title}
        className={`min-h-[480px] w-full bg-white ${className}`}
      />
    );
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 bg-neutral-100 text-neutral-400 ${className}`}
      aria-label={`${typeLabel(mimeType)} file: ${title}`}
    >
      <span aria-hidden className="text-3xl">
        ▤
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
        {typeLabel(mimeType)}
      </span>
    </div>
  );
}
