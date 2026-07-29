"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";
import PendulumSwing from "@/components/ui/PendulumSwing";
import ProjectModal, { type CardProject, type StorySection } from "@/components/sections/ProjectModal";

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
  // Case-study popup content (all optional — falls back to the card fields).
  longDescription?: string;
  story?: readonly StorySection[];
  tags?: readonly string[];
  year?: string;
  link?: string;
};

// Per-card geometry from Figma (card-local px / 14.4 = cqw)
const CARD_SPECS = [
  {
    // Card 1 — sunset Tanna's scene, text left (x=111), laptop right
    textLeft: "7.7083cqw",
    textW: "34.5cqw",
    device: { left: "44.0972cqw", top: "3.8194cqw", w: "40.5686cqw", h: "33.3525cqw" },
    overlay: true, // Figma: black 11% wash over background
    glass: "rgba(255,255,255,0.1)",
    deviceShadow: false,
  },
  {
    // Card 2 — green Kindro scene, laptop left, text right (x=675)
    textLeft: "46.875cqw",
    textW: "38.5cqw",
    device: { left: "2.0833cqw", top: "4.1667cqw", w: "45.1794cqw", h: "33.0145cqw" },
    overlay: false,
    glass: "rgba(255,255,255,0.1)",
    deviceShadow: false,
  },
  {
    // Card 3 — sky Rooted scene, laptop left, text right (x=701.5)
    textLeft: "48.718cqw",
    textW: "37cqw",
    device: { left: "3.8194cqw", top: "3.9335cqw", w: "44.3056cqw", h: "33.2292cqw" },
    overlay: false,
    glass: "rgba(206,227,252,0.2)", // Figma: pale-blue glass panel
    deviceShadow: false,
  },
];

function ReadMoreButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-[0.9236cqw] whitespace-nowrap rounded-full bg-white pl-[2.3764cqw] pr-[1.0806cqw] shadow-sm",
        "h-[3.8194cqw] transition-transform duration-300 hover:scale-[1.04]",
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
    </button>
  );
}

function StackCard({
  banner,
  index,
  total,
  data,
  onOpen,
}: {
  banner: Banner;
  index: number;
  total: number;
  data: { projectAccent: string; projectHeading: string; description: string; buttonLabel: string; buttonLink: string };
  onOpen: (project: CardProject, rect: DOMRect) => void;
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

  // Open the case-study popup, growing it out of this card.
  const openModal = () => {
    const el = ref.current?.querySelector("article") ?? ref.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return;
    const story: readonly StorySection[] =
      banner.story && banner.story.length
        ? banner.story
        : [
            {
              image: banner.device,
              kicker: "01 · Overview",
              title: `${accent} ${heading}`,
              body: banner.longDescription || description,
            },
            {
              image: banner.background,
              kicker: "02 · In Context",
              title: "Made with intent",
              body: description,
            },
          ];
    onOpen(
      {
        accent,
        heading,
        description,
        tags: banner.tags,
        year: banner.year,
        link: banner.link,
        story,
      },
      rect,
    );
  };

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

            {/* translucent inner frame (Figma: glass tint + backdrop blur + soft shadow, inset 21/16) */}
            <div
              aria-hidden
              className="hidden md:block absolute left-[1.4583cqw] top-[1.1111cqw] h-[34.931cqw] w-[87.361cqw] rounded-[1.2768cqw] shadow-[0_4px_4px_rgba(0,0,0,0.25)] [backdrop-filter:blur(0.6944cqw)]"
              style={{ backgroundColor: spec.glass }}
            />
            {/* mobile inner frame */}
            <div
              aria-hidden
              className="absolute inset-[10px] rounded-[12px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] [backdrop-filter:blur(8px)] md:hidden"
              style={{ backgroundColor: spec.glass }}
            />

            {/* device image (pre-cropped Figma export) */}
            <div
              className="hidden md:block absolute"
              style={{ left: spec.device.left, top: spec.device.top, width: spec.device.w, height: spec.device.h }}
            >
              <Image src={banner.device} alt="Designik project" fill className="object-cover" sizes="720px" />
            </div>
            {/* mobile device image — flush to the card bottom (card 3's collage keeps a small inset) */}
            <div className={cn("absolute left-1/2 -translate-x-1/2 md:hidden", spec.deviceShadow ? "bottom-[4%] h-[44%] w-[86%]" : "bottom-0 h-[46%] w-[92%]")}>
              <Image src={banner.device} alt="Designik project" fill className="object-contain object-bottom" sizes="100vw" />
            </div>

            {/* mobile text block — inside the card */}
            <div className="absolute inset-x-0 top-0 z-10 p-6 md:hidden">
              <h3 className={cn("font-display text-[27px] font-semibold uppercase leading-[1.1]", light ? "text-white" : "text-wine-500")}>{accent}</h3>
              <p className={cn("mt-1 font-display text-[17px] font-medium uppercase leading-[1.2]", light ? "text-white" : "text-black")}>{heading}</p>
              <p className={cn("mt-2 max-w-[44ch] text-[13px] leading-[1.5]", light ? "text-white/90" : "text-black/80")}>{description}</p>
              <button
                type="button"
                onClick={openModal}
                className="group mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white pl-5 pr-2 font-display text-[13px] font-semibold uppercase text-wine-500 shadow-sm transition-transform duration-300 hover:scale-[1.04]"
              >
                {data.buttonLabel}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-500 text-white transition-transform group-hover:rotate-45">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>

            {/* text block — flows from the Figma anchor so long titles fit (md+) */}
            <div
              className="hidden md:block absolute"
              style={{ left: spec.textLeft, top: "5.1389cqw", width: spec.textW }}
            >
              <h3
                className={cn(
                  "font-display text-[5.2cqw] font-semibold uppercase leading-[1.1]",
                  light ? "text-white" : "text-wine-500"
                )}
              >
                {accent}
              </h3>
              <p
                className={cn(
                  "mt-[0.8cqw] font-display text-[2.6cqw] font-medium uppercase leading-[1.2]",
                  light ? "text-white" : "text-black"
                )}
              >
                {heading}
              </p>
              <p className={cn("mt-[1.1cqw] max-w-[31.736cqw] text-[1.1111cqw] leading-[1.5799cqw]", light ? "text-white" : "text-black")}>
                {description}
              </p>
              <div className="mt-[1.6cqw]">
                <ReadMoreButton label={data.buttonLabel} onClick={openModal} />
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
  const [active, setActive] = useState<{ project: CardProject; rect: DOMRect } | null>(null);
  const closeModal = useCallback(() => setActive(null), []);
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
            <StackCard
              key={i}
              banner={b as Banner}
              index={i}
              total={data.cards.length}
              data={data}
              onOpen={(project, rect) => setActive({ project, rect })}
            />
          ))}
        </div>

        {/* View more — opens the full portfolio page */}
        <div className="relative z-10 flex justify-center pb-[7cqw]">
          <a
            href="/portfolio"
            className="group inline-flex items-center gap-3 rounded-full bg-wine-500 px-8 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.03em] text-white shadow-[0_18px_44px_-18px_rgba(161,1,64,0.75)] transition-transform duration-300 hover:scale-[1.04] md:gap-[0.9cqw] md:px-[2.7cqw] md:py-[1.15cqw] md:text-[1.15cqw]"
          >
            View More Work
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-wine-500 transition-transform duration-300 group-hover:rotate-45 md:h-[2.1cqw] md:w-[2.1cqw]">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 md:h-[44%] md:w-[44%]" aria-hidden>
                <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </div>
      </div>

      {/* Case-study popup (portaled to <body> so the section's @container
          containment doesn't trap the fixed overlay). */}
      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <ProjectModal
            key={`${active.project.accent}-${active.project.heading}`}
            project={active.project}
            originRect={active.rect}
            onClose={closeModal}
          />,
          document.body,
        )}
    </section>
  );
}
