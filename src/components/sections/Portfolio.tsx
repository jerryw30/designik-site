"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";
import PendulumSwing from "@/components/ui/PendulumSwing";

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
  accent?: string;
  heading?: string;
  description?: string;
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
        "group inline-flex items-center gap-[0.9236cqw] whitespace-nowrap rounded-full bg-white pl-[2.3764cqw] pr-[1.0806cqw] shadow-sm",
        "h-[3.8194cqw]",
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
  const accent = banner.accent || data.projectAccent;
  const heading = banner.heading || data.projectHeading;
  const description = banner.description || data.description;

  return (
    <div ref={ref} className="sticky" style={{ top: `calc(100px + ${index * 1.6}rem)` }}>
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 md:mb-[6.3194cqw]"
      >
        <motion.article
          style={{ scale: isLast ? 1 : scale }}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-[14px] md:aspect-[1300/535] md:rounded-[1.3889cqw]"
        >
          <motion.div
            style={{ filter: isLast ? undefined : brightnessFilter }}
            className="absolute inset-0"
          >
            {/* background scene (exact Figma crop) */}
            <Image src={banner.background} alt="" fill className="object-cover" sizes="100vw" priority={index === 0} />
            {spec.overlay && <div className="absolute inset-0 bg-black/[0.11]" />}

            {/* translucent inner frame (Figma: white 10% + soft shadow, inset 21/16) */}
            <div
              aria-hidden
              className="hidden md:block absolute left-[1.4583cqw] top-[1.1111cqw] h-[34.931cqw] w-[87.361cqw] rounded-[1.2768cqw] border border-white/60 bg-white/10 shadow-[0_4px_4px_rgba(0,0,0,0.25)] [backdrop-filter:blur(0.5556cqw)]"
            />
            {/* mobile inner frame */}
            <div
              aria-hidden
              className="absolute inset-[10px] rounded-[12px] border border-white/60 bg-white/10 shadow-[0_4px_4px_rgba(0,0,0,0.25)] [backdrop-filter:blur(6px)] md:hidden"
            />

            {/* device image (pre-cropped Figma export) */}
            <div
              className="hidden md:block absolute"
              style={{ left: spec.device.left, top: spec.device.top, width: spec.device.w, height: spec.device.h }}
            >
              <Image src={banner.device} alt="Designik project" fill className="object-cover" sizes="720px" />
            </div>
            {/* mobile device image — flush to the card bottom (card 3's collage keeps a small inset) */}
            <div className={cn("absolute left-1/2 -translate-x-1/2 md:hidden", spec.deviceShadow ? "bottom-[4%] h-[44%] w-[86%]" : "bottom-0 h-[50%] w-[92%]")}>
              <Image src={banner.device} alt="Designik project" fill className="object-contain object-bottom" sizes="100vw" />
            </div>

            {/* mobile text block — inside the card */}
            <div className="absolute inset-x-0 top-0 z-10 p-6 md:hidden">
              <h3 className={cn("font-display text-[26px] font-semibold uppercase leading-[1.15]", light ? "text-white" : "text-wine-500")}>{accent}</h3>
              <p className={cn("font-display text-[18px] font-medium uppercase leading-[1.15]", light ? "text-white" : "text-black")}>{heading}</p>
              <p className={cn("mt-2 max-w-[44ch] text-[12px] leading-[1.55]", light ? "text-white/90" : "text-black/80")}>{description}</p>
              <a
                href={data.buttonLink}
                className="group mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-white pl-4 pr-1.5 font-display text-[11px] font-semibold uppercase text-wine-500 shadow-sm"
              >
                {data.buttonLabel}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wine-500 text-white transition-transform group-hover:rotate-45">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
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
                {accent}
              </h3>
              <p
                className={cn(
                  "absolute font-display text-[4.7372cqw] font-medium uppercase leading-[5.5749cqw] whitespace-nowrap",
                  light ? "text-white" : "text-black"
                )}
                style={{ left: spec.textLeft, top: "12.478cqw" }}
              >
                {heading}
              </p>
              <p
                className={cn("absolute w-[31.736cqw] text-[1.1111cqw] leading-[1.5799cqw]", light ? "text-white" : "text-black")}
                style={{ left: spec.descLeft, top: "20cqw" }}
              >
                {description}
              </p>
              <div className="absolute" style={{ left: spec.descLeft, top: "28.194cqw" }}>
                <ReadMoreButton label={data.buttonLabel} href={data.buttonLink} />
              </div>
            </div>
          </motion.div>
        </motion.article>

      </motion.div>
    </div>
  );
}

export default function Portfolio({ content }: { content?: unknown } = {}) {
  const data = sectionContent("portfolio", content);
  return (
    <section id="portfolio" className="relative bg-white">
      {/* background texture: grid + sky mist (Figma treatment), full-bleed */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0">
        <Image
          src={assets.bgPortfolioBaked}
          alt=""
          width={1440}
          height={1191}
          sizes="100vw"
          className="h-auto w-full"
        />
      </div>
      <div className="@container relative mx-auto max-w-[1440px]">

        {/* hanging Designik tag (top left) */}
        <motion.div
          initial={{ rotate: -8, y: -10, opacity: 0 }}
          whileInView={{ rotate: 0, y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 70, damping: 9 }}
          className="pointer-events-none absolute left-[7.7222cqw] top-0 z-[5] hidden w-[18.028cqw] md:block"
        >
          <PendulumSwing duration={3.9} angle={3}>
            <Image src={assets.pfTag} alt="" width={366} height={365} className="h-auto w-full" sizes="260px" />
          </PendulumSwing>
        </motion.div>

        {/* cloud (right of heading) */}
        <div aria-hidden className="pointer-events-none absolute left-[68.611cqw] top-[7.9861cqw] z-[1] hidden w-[25.069cqw] md:block">
          <Image src={assets.pfCloud} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
        </div>

        {/* heading — Oswald SemiBold 77 / Medium 61 (Figma) */}
        <Reveal className="relative z-10 pt-[8.1944cqw] text-center">
          <h2 className="font-display uppercase">
            <span className="block font-semibold text-wine-500 text-[max(28px,5.3494cqw)] leading-[max(33px,6.2953cqw)]">
              {data.headingAccent}
            </span>
            <span className="block font-medium text-black text-[max(22px,4.2596cqw)] leading-[max(26px,5.0128cqw)]">{data.heading}</span>
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
