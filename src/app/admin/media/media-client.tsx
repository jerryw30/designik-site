"use client";

import { useState } from "react";

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
