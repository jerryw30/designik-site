"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { PillButton } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { sectionContent } from "@/cms/section-defaults";

export default function AboutIntro({ content }: { content?: unknown } = {}) {
  const data = sectionContent("about",content);
  return (
    <section id="about" className="relative min-h-[650px] overflow-hidden bg-white md:h-[756px] md:min-h-0">
      {/* red mountains rising behind the heading */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0">
        <Image
          src={data.backgroundImage || assets.aboutMountains}
          alt=""
          width={1488}
          height={1057}
          sizes="100vw"
          className="h-auto w-full select-none"
          priority={false}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[820px] px-6 pt-14 text-center md:pt-[75px]">
        <Reveal>
          <span className="font-display text-[13px] font-medium uppercase leading-[16px] tracking-normal text-black md:text-[14.201px] md:leading-[16.712px]">
            {data.eyebrow}
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-[14px] font-display uppercase tracking-normal">
            <span className="block text-[clamp(54px,6.658vw,95.877px)] font-semibold leading-[1.1768] text-wine-500">
              {data.headingAccent}
            </span>
            <span className="mt-[-7px] block text-[clamp(40px,4.737vw,68.215px)] font-medium leading-[1.1768] text-black">
              {data.heading}
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-[29px] max-w-[564px] font-sans text-[15px] font-normal leading-[21px] text-black md:text-[16px] md:leading-[22.75px]">
            {data.description}
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-[35px] flex justify-center">
            <PillButton
              href={data.buttonLink}
              variant="wine"
              className="h-[55px] w-[180px] justify-between gap-[12.833px] py-[17.11px] pl-[34.22px] pr-[22.5px] text-[18.616px] leading-[25.665px] tracking-normal shadow-none [&>span]:h-[34.22px] [&>span]:w-[34.22px]"
            >
              {data.buttonLabel}
            </PillButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
