"use client";

import Image from "next/image";
import Counter from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { sectionContent } from "@/cms/section-defaults";

const proxima =
  "font-['Proxima_Nova','Avenir_Next',Arial,sans-serif] [font-synthesis:none]";

export default function StatsBar({ content }: { content?: unknown } = {}) {
  const data = sectionContent("stats", content);

  return (
    <Reveal className="w-full bg-white">
      <div
        className={`mx-auto grid min-h-[129px] w-full max-w-[1440px] grid-cols-1 items-center gap-6 px-6 py-8 text-black md:grid-cols-[280px_280px_278px_280px_177px] md:gap-0 md:px-[72px] md:py-0 ${proxima}`}
      >
        <div className="flex h-[62px] items-start gap-[15px] md:pr-[20px]">
          <div className="flex h-full min-w-[83px] flex-col justify-between">
            <span className="text-center text-[13.543px] font-normal leading-normal">
              {data.reviewLabel}
            </span>
            <Image
              src="/figma/clutch-co-vector-logo.svg"
              alt={String(data.reviewSite || "Clutch")}
              width={83}
              height={23}
              className="h-[23.334px] w-[83.065px]"
            />
          </div>
          <div className="flex h-full flex-col justify-between pt-[2px]">
            <Image
              src="/figma/group1261153209.svg"
              alt="Five-star rating"
              width={90}
              height={14}
              className="h-[14.164px] w-[89.706px]"
            />
            <span className="text-center text-[13.543px] font-normal leading-normal">
              {data.reviews}
            </span>
          </div>
        </div>

        {data.items.map((stat, index) => (
          <div
            key={stat.label}
            className="flex min-h-[62px] flex-col items-start justify-between border-neutral-300 md:border-l-[3.262px] md:pl-[21px]"
          >
            <div className="flex items-baseline gap-[7px] whitespace-nowrap leading-none">
              <span className="text-[32.52px] font-semibold tracking-[-0.02em]">
                <Counter to={stat.value} duration={1.4 + index * 0.1} />
              </span>
              {stat.suffix && (
                <span className="font-['Montserrat',Arial,sans-serif] text-[20.766px] font-semibold">
                  {stat.suffix}
                </span>
              )}
              {stat.unit && (
                <span className="text-[20.766px] font-semibold">{stat.unit}</span>
              )}
            </div>
            <span className="whitespace-nowrap text-left text-[16.252px] font-normal leading-normal">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
