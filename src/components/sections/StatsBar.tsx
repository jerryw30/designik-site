"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Counter from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { sectionContent } from "@/cms/section-defaults";

const proxima =
  "font-['Proxima_Nova','Avenir_Next',Arial,sans-serif] [font-synthesis:none]";

function ReviewBlock({ data }: { data: ReturnType<typeof sectionContent<"stats">> }) {
  return (
    <div className="flex items-start justify-center gap-[15px]">
      <div className="flex h-[62px] min-w-[83px] flex-col justify-between">
        <span className="text-center text-[13.543px] font-normal leading-normal">{data.reviewLabel}</span>
        <Image
          src="/figma/clutch-co-vector-logo.svg"
          alt={String(data.reviewSite || "Clutch")}
          width={83}
          height={23}
          className="h-[23.334px] w-[83.065px]"
        />
      </div>
      <div className="flex h-[62px] flex-col justify-between pt-[2px]">
        <Image src="/figma/group1261153209.svg" alt="Five-star rating" width={90} height={14} className="h-[14.164px] w-[89.706px]" />
        <span className="text-center text-[13.543px] font-normal leading-normal">{data.reviews}</span>
      </div>
    </div>
  );
}

function StatBlock({ stat, index, center }: { stat: { value: number; suffix?: string; unit?: string; label: string }; index: number; center?: boolean }) {
  return (
    <div className={`flex min-h-[62px] flex-col justify-between ${center ? "items-center" : "items-start"}`}>
      <div className={`flex items-baseline gap-[7px] whitespace-nowrap leading-none ${center ? "justify-center" : "justify-start"}`}>
        <span className="text-[32.52px] font-semibold tracking-[-0.02em]">
          <Counter to={stat.value} duration={1.4 + index * 0.1} />
        </span>
        {stat.suffix && <span className="font-['Montserrat',Arial,sans-serif] text-[20.766px] font-semibold">{stat.suffix}</span>}
        {stat.unit && <span className="text-[20.766px] font-semibold">{stat.unit}</span>}
      </div>
      <span className={`whitespace-nowrap text-[16.252px] font-normal leading-normal ${center ? "text-center" : "text-left"}`}>
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsBar({ content }: { content?: unknown } = {}) {
  const data = sectionContent("stats", content);
  const slides = data.items.length + 1; // review card + stats
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  const goTo = useCallback((i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const idx = ((i % slides) + slides) % slides;
    t.scrollTo({ left: idx * t.clientWidth, behavior: "smooth" });
  }, [slides]);

  const onScroll = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setActive(Math.round(t.scrollLeft / t.clientWidth));
  }, []);

  // autoplay (mobile only — the track has zero width on desktop where it's hidden)
  useEffect(() => {
    const id = setInterval(() => {
      const t = trackRef.current;
      if (!t || pausedRef.current || t.clientWidth === 0) return;
      goTo(active + 1);
    }, 3200);
    return () => clearInterval(id);
  }, [active, goTo]);

  return (
    <Reveal className="w-full bg-white">
      {/* ---------- mobile carousel ---------- */}
      <div className={`md:hidden ${proxima}`}>
        <div
          ref={trackRef}
          onScroll={onScroll}
          onTouchStart={() => (pausedRef.current = true)}
          onTouchEnd={() => (pausedRef.current = false)}
          className="flex snap-x snap-mandatory overflow-x-auto py-8 text-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-full shrink-0 snap-start items-center justify-center px-6">
            <ReviewBlock data={data} />
          </div>
          {data.items.map((stat, index) => (
            <div key={stat.label} className="flex w-full shrink-0 snap-start items-center justify-center px-6">
              <StatBlock stat={stat} index={index} center />
            </div>
          ))}
        </div>
        {/* dots */}
        <div className="flex justify-center gap-2 pb-6">
          {Array.from({ length: slides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                active === i ? "w-6 bg-wine-500" : "w-2 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ---------- desktop grid (unchanged) ---------- */}
      <div
        className={`mx-auto hidden min-h-[129px] w-full max-w-[1440px] items-center px-6 py-8 text-black md:grid md:grid-cols-[280px_280px_278px_280px_177px] md:gap-0 md:px-[72px] md:py-0 ${proxima}`}
      >
        <div className="flex h-[62px] items-start gap-[15px] pr-[20px]">
          <ReviewBlock data={data} />
        </div>
        {data.items.map((stat, index) => (
          <div key={stat.label} className="border-l-[3.262px] border-neutral-300 pl-[21px]">
            <StatBlock stat={stat} index={index} />
          </div>
        ))}
      </div>
    </Reveal>
  );
}
