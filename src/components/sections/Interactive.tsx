"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
      {/* ============ mobile: zoomed scene, readable heading ============ */}
      <div
        className="relative w-full overflow-hidden md:hidden"
        style={{
          backgroundImage:
            "linear-gradient(-66.108deg, #AF2A4A 27.401%, #580A25 121.26%)",
        }}
      >
        <div className="relative z-10 px-6 pt-10 text-center">
          <Reveal>
            <h2 className="font-display font-normal uppercase tracking-[-0.02em] text-white text-[7.2vw] leading-[1.1]">
              {data.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-4 flex justify-center">
            <a
              href={data.buttonLink}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-white pl-5 pr-2 shadow-sm transition-transform duration-300 hover:scale-[1.04]"
            >
              <span className="font-display text-[13px] font-semibold uppercase leading-none text-wine-500">{data.buttonLabel}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
                <svg viewBox="0 0 16 16" fill="none" className="h-[44%] w-[44%]" aria-hidden>
                  <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </Reveal>
        </div>
        {/* zoomed canvas (2x) so the TV reads well on small screens */}
        <div className="@container relative left-1/2 -mt-[6vw] w-[200%] -translate-x-1/2">
          <div className="relative h-[64.5139cqw] w-full">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[49.7917cqw]">
              <Image src={assets.interactiveGrid} alt="" fill sizes="100vw" className="object-cover object-bottom opacity-60" />
            </div>
            <div aria-hidden className="pointer-events-none absolute left-[6.7361cqw] top-[11.1111cqw] w-[25.0694cqw]">
              <Image src={assets.interactiveCloudL} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
            </div>
            <div aria-hidden className="pointer-events-none absolute left-[68.2639cqw] top-[11.1111cqw] w-[25.0694cqw]">
              <Image src={assets.interactiveCloudR} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
            </div>
            <div className="absolute left-[41.4583cqw] top-[26.5972cqw] h-[13.3333cqw] w-[18.6806cqw] overflow-hidden rounded-[1.25cqw] bg-black">
              {data.screenVideo ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Designik showreel"
                >
                  <source src={data.screenVideo} type="video/mp4" />
                </video>
              ) : (
                <Image src={assets.interactiveScreen} alt="" fill sizes="270px" className="object-cover" />
              )}
            </div>
            <div className="absolute inset-x-0 top-[16.3889cqw]">
              <Image src={data.backgroundImage || assets.interactiveScene2} alt="" width={1440} height={720} sizes="200vw" className="h-auto w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ============ desktop: exact Figma canvas (unchanged) ============ */}
      <div className="@container relative hidden w-full overflow-hidden md:block">
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
          <motion.div
            aria-hidden
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-[6.7361cqw] top-[11.1111cqw] w-[25.0694cqw]"
          >
            <Image src={assets.interactiveCloudL} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
          </motion.div>
          <motion.div
            aria-hidden
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-[68.2639cqw] top-[11.1111cqw] w-[25.0694cqw]"
          >
            <Image src={assets.interactiveCloudR} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
          </motion.div>

          {/* TV screen content — sits behind the scene's transparent window */}
          <div className="absolute left-[41.4583cqw] top-[26.5972cqw] h-[13.3333cqw] w-[18.6806cqw] overflow-hidden rounded-[1.25cqw] bg-black">
            {data.screenVideo ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Designik showreel"
              >
                <source src={data.screenVideo} type="video/mp4" />
              </video>
            ) : (
              <Image src={assets.interactiveScreen} alt="" fill sizes="270px" className="object-cover" />
            )}
          </div>

          {/* scene: red flower hills + TV with transparent screen window (y236) */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-[16.3889cqw]"
          >
            <Image
              src={data.backgroundImage || assets.interactiveScene2}
              alt=""
              width={1440}
              height={720}
              sizes="100vw"
              className="h-auto w-full"
            />
          </motion.div>

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
                className="group inline-flex h-[max(44px,3.8194cqw)] items-center gap-[max(8px,0.9236cqw)] whitespace-nowrap rounded-full bg-white pl-[max(20px,2.3764cqw)] pr-[max(9px,1.0806cqw)] shadow-sm transition-transform duration-300 hover:scale-[1.04]"
              >
                <span className="font-display text-[max(13px,1.2928cqw)] font-semibold uppercase leading-none text-wine-500">
                  {data.buttonLabel}
                </span>
                <span className="flex size-[max(28px,2.3764cqw)] items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
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
