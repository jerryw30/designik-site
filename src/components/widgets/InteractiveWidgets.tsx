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

export function TabsWidget({ content }: { content: string }) {
  const items = content
    .split("\n")
    .map((line) => line.split("|"))
    .filter(([label, body]) => label?.trim() && body?.trim())
    .map(([label, ...body]) => ({
      label: label.trim(),
      body: body.join("|").trim(),
    }));
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const safeActive = Math.min(active, items.length - 1);
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            role="tab"
            aria-selected={safeActive === index}
            onClick={() => setActive(index)}
            className={`rounded-t-xl px-5 py-3 font-semibold ${safeActive === index ? "bg-wine-500 text-white" : "bg-neutral-100"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-b-xl rounded-tr-xl border p-5">
        {items[safeActive].body}
      </div>
    </div>
  );
}

export function AccordionWidget({
  content,
  single = false,
}: {
  content: string;
  single?: boolean;
}) {
  const items = content
    .split("\n")
    .map((line) => line.split("|"))
    .filter(([label, body]) => label?.trim() && body?.trim())
    .map(([label, ...body]) => ({
      label: label.trim(),
      body: body.join("|").trim(),
    }));
  const [open, setOpen] = useState<number | null>(single ? null : 0);
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="rounded-xl border">
          <button
            type="button"
            aria-expanded={open === index}
            onClick={() => setOpen(open === index ? null : index)}
            className="flex w-full items-center justify-between p-4 text-left font-semibold"
          >
            {item.label}
            <span aria-hidden>{open === index ? "−" : "+"}</span>
          </button>
          {open === index && <div className="border-t p-4">{item.body}</div>}
        </div>
      ))}
    </div>
  );
}
