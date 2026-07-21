"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { PillButton } from "@/components/ui/Buttons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

export default function BrandHeights({ content }: { content?: unknown } = {}) {
  const data=sectionContent("brand-heights",content);
  const [active, setActive] = useState(1);

  const logoSrc = data.logo || assets.logo;

  return (
    <section className="relative isolate overflow-hidden bg-white px-5 py-16 md:py-24">
      {/* Background texture at the top of the section (Figma: cloud mist + grid) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 [mask-image:linear-gradient(to_bottom,transparent,black_140px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_140px)]"
      >
        <Image
          src={assets.bgBrandBaked}
          alt=""
          width={1440}
          height={1191}
          sizes="100vw"
          className="h-auto w-full"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px]">
        <Reveal className="text-center">
          <h2 className="font-display uppercase leading-[1.18]">
            <span className="block font-semibold text-wine-500 text-[clamp(36px,5.4vw,77px)]">
              {data.headingAccent}
            </span>
            <span className="block font-medium text-ink text-[clamp(28px,4.3vw,61px)]">
              {data.heading}
            </span>
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 flex flex-col gap-4 md:mt-16" stagger={0.08}>
          {data.rows.map((title, i) => {
            const isActive = active === i;
            return (
              <RevealItem key={i}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-[16px] border px-5 py-5 text-left transition-colors duration-300 md:gap-7 md:px-8 md:py-6",
                    isActive
                      ? "border-transparent bg-wine-500 text-white"
                      : "border-rose-200 bg-blush-100 text-ink hover:bg-blush-300"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-9 w-9 shrink-0 transition-colors md:h-11 md:w-11",
                      isActive ? "bg-white" : "bg-wine-500"
                    )}
                    style={{
                      WebkitMaskImage: `url(${logoSrc})`,
                      maskImage: `url(${logoSrc})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />

                  <h3
                    style={{ lineHeight: 1.03 }}
                    className={cn(
                      "w-[150px] shrink-0 whitespace-pre-line font-display font-bold uppercase text-[clamp(24px,3.3vw,48px)] md:w-[360px]",
                      isActive ? "text-white" : "text-wine-500"
                    )}
                  >
                    {title}
                  </h3>

                  <p
                    className={cn(
                      "hidden max-w-[420px] flex-1 text-[15px] font-normal leading-[1.55] md:block",
                      isActive ? "text-white/85" : "text-neutral-600"
                    )}
                  >
                    {data.rowDescriptions?.[i] || data.description}
                  </p>

                  <span
                    className={cn(
                      "ml-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:rotate-45 md:h-16 md:w-16",
                      isActive ? "bg-white text-wine-500" : "bg-wine-500 text-white"
                    )}
                  >
                    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal className="mt-12 flex justify-center">
          <PillButton href={data.buttonLink} variant="wine">
            {data.buttonLabel}
          </PillButton>
        </Reveal>
      </div>

      {/* logo marquee band */}
      <div className="relative z-10 mt-16 -mx-5 overflow-hidden border-y border-[#f1eded] py-6 md:mt-20">
        <div className="flex w-max animate-marquee" style={{ ["--marquee-duration" as string]: `${data.marqueeDuration}s` }}>
          {Array.from({ length: 2 }).map((_, u) => (
            <div key={u} className="flex items-center">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="mx-[30px] flex h-[68px] w-[62px] shrink-0 items-center justify-center rounded-[10px] bg-blush-100">
                  <span
                    aria-hidden
                    className="h-9 w-9 bg-wine-500"
                    style={{
                      WebkitMaskImage: `url(${logoSrc})`,
                      maskImage: `url(${logoSrc})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
