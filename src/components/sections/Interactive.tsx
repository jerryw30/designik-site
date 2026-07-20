"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { sectionContent } from "@/cms/section-defaults";

/**
 * Pixel-exact port of the Figma "Our Interactive Design" section
 * (1440 canvas, 1cqw = 14.4px, section 1440x929).
 * Layers: wine gradient -> grid -> clouds -> TV screen content -> scene
 * (the scene PNG has a transparent window where the TV screen is).
 */
export default function Interactive({ content }: { content?: unknown } = {}) {
  const data = sectionContent("interactive", content);

  return (
    <section className="relative bg-wine-700">
      <div className="@container relative mx-auto max-w-[1440px] overflow-hidden">
        <div
          className="relative h-[64.5139cqw] w-full overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(-66.108deg, #AF2A4A 27.401%, #580A25 121.26%)",
          }}
        >
          {/* grid texture (Figma: 1440x717 at top, object-bottom, 60%) */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[49.7917cqw]">
            <Image
              src={assets.interactiveGrid}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-bottom opacity-60"
            />
          </div>

          {/* clouds (Figma: y160, x97 and x983, 361 wide) */}
          <div aria-hidden className="pointer-events-none absolute left-[6.7361cqw] top-[11.1111cqw] w-[25.0694cqw]">
            <Image src={assets.interactiveCloudL} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[68.2639cqw] top-[11.1111cqw] w-[25.0694cqw]">
            <Image src={assets.interactiveCloudR} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
          </div>

          {/* TV screen content — sits behind the scene's transparent window */}
          <div className="absolute left-[41.4583cqw] top-[26.5972cqw] h-[13.3333cqw] w-[18.6806cqw] overflow-hidden rounded-[1.25cqw]">
            <Image src={assets.interactiveScreen} alt="" fill sizes="270px" className="object-cover" />
          </div>

          {/* scene: red flower hills + TV with transparent screen window (y236) */}
          <div className="absolute inset-x-0 top-[16.3889cqw]">
            <Image
              src={data.backgroundImage || assets.interactiveScene2}
              alt=""
              width={1440}
              height={720}
              sizes="100vw"
              className="h-auto w-full"
            />
          </div>

          {/* heading + button (Figma: y83 centered, Oswald 400 72/64.8 -0.02em) */}
          <div className="absolute inset-x-0 top-[5.7639cqw] z-10 text-center">
            <Reveal>
              <h2 className="font-display font-normal uppercase tracking-[-0.02em] text-white text-[max(24px,4.9996cqw)] leading-[max(21.6px,4.4997cqw)]">
                {data.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-[max(18px,3.1389cqw)] flex justify-center">
              <a
                href={data.buttonLink}
                className="group inline-flex items-center gap-[max(6px,0.5701cqw)] rounded-full bg-white px-[max(14px,1.5204cqw)] h-[max(32px,2.4655cqw)]"
              >
                <span className="font-sans font-semibold text-wine-500 text-[max(11px,0.8272cqw)] leading-none">
                  {data.buttonLabel}
                </span>
                <span className="flex size-[max(20px,1.5204cqw)] items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
                  <svg viewBox="0 0 16 16" fill="none" className="h-[44%] w-[44%]" aria-hidden>
                    <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
