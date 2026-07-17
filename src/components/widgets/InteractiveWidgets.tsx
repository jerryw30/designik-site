"use client";

import { useEffect, useMemo, useState } from "react";

export function CarouselWidget({
  sources,
  alt,
  height,
}: {
  sources: string[];
  alt: string;
  height: number;
}) {
  const [index, setIndex] = useState(0);
  if (!sources.length) return null;
  const safeIndex = index % sources.length;
  const move = (delta: number) =>
    setIndex((current) => (current + delta + sources.length) % sources.length);
  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* CMS URLs may be uploaded files or administrator-approved remotes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[safeIndex]}
        alt={alt || `Carousel image ${safeIndex + 1}`}
        className="w-full object-cover"
        style={{ height }}
      />
      {sources.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => move(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 px-4 py-3 text-white"
          >
            &larr;
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => move(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 px-4 py-3 text-white"
          >
            &rarr;
          </button>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs text-white">
            {safeIndex + 1} / {sources.length}
          </span>
        </>
      )}
    </div>
  );
}

export function CountdownWidget({ target }: { target: string }) {
  const targetTime = useMemo(() => new Date(target).getTime(), [target]);
  const [remaining, setRemaining] = useState(() => targetTime - Date.now());
  useEffect(() => {
    const tick = () => setRemaining(targetTime - Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);
  if (!Number.isFinite(targetTime))
    return (
      <p className="text-center text-sm">Choose a valid countdown date.</p>
    );
  const total = Math.max(0, remaining);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total / 3_600_000) % 24);
  const minutes = Math.floor((total / 60_000) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return (
    <div className="grid grid-cols-4 gap-3 text-center" aria-live="polite">
      {[
        [days, "Days"],
        [hours, "Hours"],
        [minutes, "Minutes"],
        [seconds, "Seconds"],
      ].map(([value, label]) => (
        <div key={label} className="rounded-xl bg-black/5 p-3">
          <strong className="block font-display text-3xl">{value}</strong>
          <span className="text-[10px] uppercase">{label}</span>
        </div>
      ))}
    </div>
  );
}
