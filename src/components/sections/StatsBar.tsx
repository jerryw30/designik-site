"use client";

import Counter from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";

const STATS = [
  { value: 20, suffix: "", label: "Proven Track Record", unit: "Years" },
  { value: 98, suffix: "%", label: "Customer Satisfaction", unit: "" },
  { value: 1500, suffix: "", label: "We Have Completed", unit: "Projects" },
  { value: 3, suffix: "", label: "Average Answer Time", unit: "Mins" },
];

function Stars() {
  return (
    <div className="flex gap-0.5 text-orange-brand">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function StatsBar() {
  return (
    <Reveal className="w-full bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-col items-stretch gap-6 px-6 py-8 md:flex-row md:items-center md:gap-0 md:py-10">
        {/* Clutch reviews */}
        <div className="flex items-center gap-3 md:pr-8">
          <div className="flex flex-col">
            <span className="font-display text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Reviewed On
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-ink">Clutch</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-neutral-200 pl-3">
            <Stars />
            <span className="text-[11px] font-medium text-neutral-500">31 Reviews</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid flex-1 grid-cols-2 gap-y-6 md:flex md:justify-between">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col px-3 md:px-6 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-neutral-200"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold leading-none tracking-tight text-ink md:text-[32px]">
                  <Counter to={s.value} duration={1.4 + i * 0.1} />
                  {s.suffix}
                </span>
                {s.unit && (
                  <span className="font-display text-[13px] font-medium uppercase text-neutral-500">{s.unit}</span>
                )}
              </div>
              <span className="mt-1 text-[12px] font-medium text-neutral-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
