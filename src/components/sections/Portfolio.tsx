"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

/**
 * Pixel-exact port of the Figma "Designik Design Portfolio" section.
 * All measurements come from the 1440px design canvas, expressed in cqw
 * (1cqw = 14.4px at 1440), so the section scales proportionally and is
 * pixel-identical to Figma at the design width.
 */

type Banner = {
  background: string;
  device: string;
  deviceSide: "left" | "right";
  light?: boolean; // white text (card 2)
};

// Per-card geometry from Figma (card-local px / 14.4 = cqw)
const CARD_SPECS = [
  {
    // Card 1 — orange scene, phone-in-hand left, text right (x=658)
    textLeft: "45.694cqw",
    descLeft: "45.625cqw",
    device: { left: "6.25cqw", top: "0.2778cqw", w: "31.25cqw", h: "36.875cqw" },
    overlay: false,
    deviceShadow: false,
  },
  {
    // Card 2 — red scene, text left (x=111), laptop right
    textLeft: "7.7083cqw",
    descLeft: "7.7083cqw",
    device: { left: "40.764cqw", top: "2.0604cqw", w: "49.829cqw", h: "35.231cqw" },
    overlay: true, // Figma: black 11% wash over background
    deviceShadow: false,
  },
  {
    // Card 3 — lilac scene, phone collage left, text right (x=701.5)
    textLeft: "48.718cqw",
    descLeft: "48.718cqw",
    device: { left: "2.8472cqw", top: "5.1424cqw", w: "41.56cqw", h: "28.625cqw" },
    overlay: false,
    deviceShadow: true, // Figma: 0 2px 4px rgba(0,0,0,0.38)
  },
];

function ReadMoreButton({ label, href, className }: { label: string; href: string; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex items-center justify-between rounded-full bg-white pl-[2.3764cqw] pr-[1.0806cqw] shadow-sm",
        "h-[3.8194cqw] w-[12.7778cqw]",
        className
      )}
    >
      <span className="font-display text-[1.2928cqw] font-semibold uppercase leading-none text-wine-500">
        {label}
      </span>
      <span className="flex size-[2.3764cqw] items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
        <svg viewBox="0 0 16 16" fill="none" className="h-[44%] w-[44%]" aria-hidden>
          <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function StackCard({
  banner,
  index,
  total,
  data,
}: {
  banner: Banner;
  index: number;
  total: number;
  data: { projectAccent: string; projectHeading: string; description: string; buttonLabel: string; buttonLink: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 120px", "end 120px"],
  });
  // The card shrinks slightly as the next one slides over it.
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const brightnessFilter = useTransform(scrollYProgress, [0, 1], ["brightness(1)", "brightness(0.82)"]);
  const isLast = index === total - 1;
  const spec = CARD_SPECS[index % CARD_SPECS.length];
  const light = banner.light;

  return (
    <div ref={ref} className="sticky" style={{ top: `calc(100px + ${index * 1.6}rem)` }}>
      <div className="mb-[6.3194cqw]">
        <motion.article
          style={{ scale: isLast ? 1 : scale }}
          className="relative aspect-[1300/535] w-full overflow-hidden rounded-[1.3889cqw]"
        >
          <motion.div style={{ filter: isLast ? undefined : brightnessFilter }} className="absolute inset-0">
            {/* background scene (exact Figma crop) */}
            <Image src={banner.background} alt="" fill className="object-cover" sizes="100vw" priority={index === 0} />
            {spec.overlay && <div className="absolute inset-0 bg-black/[0.11]" />}

            {/* translucent inner frame (Figma: white 10% + soft shadow, inset 21/16) */}
            <div
              aria-hidden
              className="absolute left-[1.4583cqw] top-[1.1111cqw] h-[34.931cqw] w-[87.361cqw] rounded-[1.2768cqw] border border-white/60 bg-white/10 shadow-[0_4px_4px_rgba(0,0,0,0.25)] [backdrop-filter:blur(0.5556cqw)]"
            />

            {/* device image (pre-cropped Figma export) */}
            <div
              className={cn("absolute", spec.deviceShadow && "shadow-[0_2px_4px_rgba(0,0,0,0.38)]")}
              style={{ left: spec.device.left, top: spec.device.top, width: spec.device.w, height: spec.device.h }}
            >
              <Image src={banner.device} alt="Designik project" fill className="object-cover" sizes="720px" />
            </div>

            {/* text block — exact absolute layout (md+) */}
            <div className="hidden md:block">
              <h3
                className={cn(
                  "absolute font-display text-[6.6581cqw] font-semibold uppercase leading-[7.8355cqw] whitespace-nowrap",
                  light ? "text-white" : "text-wine-500"
                )}
                style={{ left: spec.textLeft, top: "5.1389cqw" }}
              >
                {data.projectAccent}
              </h3>
              <p
                className={cn(
                  "absolute font-display text-[4.7372cqw] font-medium uppercase leading-[5.5749cqw] whitespace-nowrap",
                  light ? "text-white" : "text-black"
                )}
                style={{ left: spec.textLeft, top: "12.478cqw" }}
              >
                {data.projectHeading}
              </p>
              <p
                className={cn("absolute w-[31.736cqw] text-[1.1111cqw] leading-[1.5799cqw]", light ? "text-white" : "text-black")}
                style={{ left: spec.descLeft, top: "20cqw" }}
              >
                {data.description}
              </p>
              <div className="absolute" style={{ left: spec.descLeft, top: "28.194cqw" }}>
                <ReadMoreButton label={data.buttonLabel} href={data.buttonLink} />
              </div>
            </div>
          </motion.div>
        </motion.article>

        {/* mobile text block (readable sizes, below the card) */}
        <div className="mt-4 md:hidden">
          <h3 className="font-display text-[28px] font-semibold uppercase leading-[1.18] text-wine-500">
            {data.projectAccent}
          </h3>
          <p className="font-display text-[20px] font-medium uppercase leading-[1.18] text-black">{data.projectHeading}</p>
          <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-black/80">{data.description}</p>
          <a
            href={data.buttonLink}
            className="group mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-wine-500 px-5 font-display text-[12px] font-semibold uppercase text-white"
          >
            {data.buttonLabel}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-wine-500 transition-transform group-hover:rotate-45">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Portfolio({ content }: { content?: unknown } = {}) {
  const data = sectionContent("portfolio", content);
  return (
    <section id="portfolio" className="relative bg-white">
      <div className="@container relative mx-auto max-w-[1440px]">
        {/* background texture: grid + sky mist (Figma treatment) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[82.71cqw] overflow-hidden">
          <Image
            src={assets.pfGrid}
            alt=""
            width={1440}
            height={539}
            sizes="100vw"
            className="absolute top-0 h-auto w-full opacity-[0.6]"
          />
          <Image
            src={assets.pfSky}
            alt=""
            width={1440}
            height={1191}
            sizes="100vw"
            className="absolute top-0 h-auto w-full opacity-[0.09] [mix-blend-mode:luminosity]"
          />
        </div>

        {/* hanging Designik tag (top left) */}
        <motion.div
          initial={{ rotate: -8, y: -10, opacity: 0 }}
          whileInView={{ rotate: 0, y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 70, damping: 9 }}
          className="pointer-events-none absolute left-[7.7222cqw] top-[-0.5417cqw] z-[5] hidden w-[18.028cqw] md:block"
        >
          <Image src={assets.pfTag} alt="" width={366} height={365} className="h-auto w-full" sizes="260px" />
        </motion.div>

        {/* cloud (right of heading) */}
        <div aria-hidden className="pointer-events-none absolute left-[68.611cqw] top-[7.9861cqw] z-[1] hidden w-[25.069cqw] md:block">
          <Image src={assets.pfCloud} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
        </div>

        {/* heading — Oswald SemiBold 77 / Medium 61 (Figma) */}
        <Reveal className="relative z-10 pt-[8.1944cqw] text-center">
          <h2 className="font-display uppercase">
            <span className="block text-[5.3494cqw] font-semibold leading-[6.2953cqw] text-wine-500">
              {data.headingAccent}
            </span>
            <span className="block text-[4.2596cqw] font-medium leading-[5.0128cqw] text-black">{data.heading}</span>
          </h2>
        </Reveal>

        {/* cards — 1300px wide at 1440, gap 91px */}
        <div className="relative z-10 mx-auto mt-[5.7222cqw] w-[90.278cqw] pb-[6cqw]">
          {data.cards.map((b, i) => (
            <StackCard key={i} banner={b as Banner} index={i} total={data.cards.length} data={data} />
          ))}
        </div>
      </div>
    </section>
  );
}
