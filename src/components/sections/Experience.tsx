"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

/**
 * Pixel-exact port of the Figma "Experience Your Brand" section
 * (1440 canvas, 1cqw = 14.4px; card 1396x818 at x22).
 * Layers: red-hills card -> corner logo shapes -> Akshar wordmark ->
 * clouds -> heading -> arrows -> statue (1:1 export with baked shadow)
 * -> floating pills -> View All button.
 */

// Pill geometry from the Figma render (card-local design px)
const PILLS = [
  { x: 182, y: 283, w: 301, icon: assets.expIconStrategy, ix: 22, iy: 17.8, iw: 39, ih: 38, tx: 70, split: false },
  { x: 913, y: 283, w: 272, icon: assets.expIconCreator, ix: 24, iy: 18, iw: 35.7, ih: 35.5, tx: 78, split: true },
  { x: 47, y: 486, w: 295, icon: assets.expIconInfluencer, ix: 28, iy: 17.9, iw: 36.1, ih: 32.5, tx: 86, split: true },
  { x: 1023, y: 486, w: 274, icon: assets.expIconPublishing, ix: 29.5, iy: 12, iw: 50, ih: 47, tx: 94, split: true },
  { x: 142, y: 678, w: 268, icon: assets.expIconInsight, ix: 23.9, iy: 16.9, iw: 39, ih: 39, tx: 75, split: false },
];

// Hand-drawn arrows — positions measured from the Figma render
// (the raw node coords sit inside flipped groups and are unreliable)
const ARROWS = [
  { x: 478, y: 244, w: 101, src: assets.expArrow208 },
  { x: 798, y: 272, w: 101, src: assets.expArrow207 },
  { x: 365, y: 420, w: 93.9, src: assets.expSwirl },
  { x: 915, y: 377, w: 122, src: assets.expArrow205 },
  { x: 408, y: 616, w: 51, src: assets.expArrow209 },
  { x: 943, y: 615, w: 51, src: assets.expArrow210 },
];

const q = (px: number) => `${(px / 14.4).toFixed(4)}cqw`;

function Pill({ spec, label, delay }: { spec: (typeof PILLS)[number]; label: string; delay: number }) {
  const words = label.split(" ");
  const lines = spec.split && words.length > 1 ? [words[0], words.slice(1).join(" ")] : [label];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="absolute z-20"
      style={{ left: q(spec.x), top: q(spec.y), width: q(spec.w), height: q(71) }}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 3.6 + delay, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-full w-full rounded-full bg-blush-100 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
      >
        <Image
          src={spec.icon}
          alt=""
          width={Math.round(spec.iw)}
          height={Math.round(spec.ih)}
          className="absolute"
          style={{ left: q(spec.ix), top: q(spec.iy), width: q(spec.iw), height: q(spec.ih) }}
        />
        <span
          className="absolute flex h-full flex-col justify-center font-display font-semibold uppercase text-black text-[1.5847cqw] leading-[1.8403cqw]"
          style={{ left: q(spec.tx) }}
        >
          {lines.map((l, i) => (
            <span key={i} className="whitespace-nowrap">
              {l}
            </span>
          ))}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function Experience({ content }: { content?: unknown } = {}) {
  const data = sectionContent("experience", content);
  const headingLines = data.heading.split("\n");

  return (
    <section className="bg-white">
      <div className="@container relative mx-auto max-w-[1440px]">
        {/* ===================== desktop (exact) ===================== */}
        <div className="relative hidden pt-[5.7639cqw] md:block">
          <div className="relative mx-auto h-[56.8056cqw] w-[96.9444cqw] overflow-hidden rounded-[1.3194cqw]">
            {/* red hills card background (exact export) */}
            <Image src={data.backgroundImage || assets.expCard} alt="" fill sizes="100vw" className="object-cover" priority={false} />

            {/* corner logo shapes (3% black, baked in svg) */}
            <div aria-hidden className="absolute left-[2.5cqw] top-[0.2083cqw] w-[16.9444cqw]">
              <Image src={assets.expCornerL} alt="" width={244} height={247} className="h-auto w-full" />
            </div>
            <div aria-hidden className="absolute left-[79.9306cqw] top-[0.2083cqw] w-[16.9444cqw]">
              <Image src={assets.expCornerR} alt="" width={244} height={247} className="h-auto w-full" />
            </div>

            {/* giant Akshar wordmark */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[-0.0694cqw] top-[34.0278cqw] z-[1] select-none whitespace-nowrap font-marquee font-bold uppercase leading-[26.5504cqw] tracking-[-0.0368em] text-[#840135] opacity-[0.34] text-[26.2093cqw]"
            >
              {data.wordmark}
            </span>

            {/* clouds */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute left-[1.4583cqw] top-[4.2361cqw] z-[2] w-[25.0694cqw]"
            >
              <Image src={data.cloudImage || assets.expCloudL} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
            </motion.div>
            <motion.div
              aria-hidden
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute left-[69.7917cqw] top-[5.625cqw] z-[2] w-[25.0694cqw]"
            >
              <Image src={assets.expCloudR} alt="" width={361} height={183} className="h-auto w-full" sizes="361px" />
            </motion.div>

            {/* heading — Oswald 600 77 / 500 54.5 (Figma) */}
            <Reveal className="absolute inset-x-0 top-[3.1944cqw] z-10 text-center">
              <h2 className="font-display uppercase text-white">
                <span className="block text-[5.3494cqw] font-semibold leading-[6.2953cqw]">{headingLines[0]}</span>
                <span className="block text-[3.782cqw] font-medium leading-[4.4508cqw]">{headingLines[1] || ""}</span>
              </h2>
            </Reveal>

            {/* hand-drawn arrows */}
            {ARROWS.map((a, i) => (
              <motion.div
                key={i}
                aria-hidden
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute z-[15]"
                style={{ left: q(a.x), top: q(a.y), width: q(a.w) }}
              >
                <Image src={a.src} alt="" width={125} height={123} className="h-auto w-full" />
              </motion.div>
            ))}

            {/* statue (clean node crop, anchored to the card bottom) */}
            <motion.div
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-[24.9306cqw] z-10 w-[44.8611cqw]"
            >
              <Image
                src={data.statueImage || assets.expStatue}
                alt="Designik — experience your brand"
                width={646}
                height={586}
                sizes="(min-width: 768px) 45vw, 100vw"
                className="h-auto w-full"
              />
            </motion.div>

            {/* floating pills */}
            {PILLS.map((p, i) => (
              <Pill key={i} spec={p} label={data.pills[i]?.label || ""} delay={i * 0.12} />
            ))}

            {/* View All button (953,686 — 184x55) */}
            <motion.a
              href={data.buttonLink}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="group absolute left-[66.1806cqw] top-[47.6389cqw] z-20 flex h-[3.8194cqw] w-[12.7778cqw] items-center justify-between rounded-full bg-white pl-[2.3764cqw] pr-[1.0806cqw]"
            >
              <span className="font-display text-[1.2928cqw] font-semibold uppercase leading-none text-wine-500">
                {data.buttonLabel}
              </span>
              <span className="flex size-[2.3764cqw] items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
                <svg viewBox="0 0 16 16" fill="none" className="h-[44%] w-[44%]" aria-hidden>
                  <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </motion.a>
          </div>
        </div>

        {/* ===================== mobile (stacked) ===================== */}
        <div className="px-4 pb-12 pt-8 md:hidden">
          <div className="relative overflow-hidden rounded-3xl">
            <Image src={data.backgroundImage || assets.expCard} alt="" width={1396} height={818} className="h-auto w-full" sizes="100vw" />
            <div className="absolute inset-x-0 top-[6%] z-10 text-center">
              <h2 className="font-display uppercase text-white">
                <span className="block text-[7vw] font-semibold leading-[1.18]">{headingLines[0]}</span>
                <span className="block text-[5vw] font-medium leading-[1.18]">{headingLines[1] || ""}</span>
              </h2>
            </div>
            <div className="absolute bottom-0 left-[25%] z-10 w-[44.9%]">
              <Image src={data.statueImage || assets.expStatue} alt="" width={646} height={586} className="h-auto w-full" sizes="100vw" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {data.pills.map((p, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full bg-blush-100 py-2 pl-3 pr-4 shadow-md">
                <Image src={PILLS[i % PILLS.length].icon} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
                <span className="font-display text-xs font-semibold uppercase text-black">{p.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-center">
            <a href={data.buttonLink} className={cn("group inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 font-display text-[12px] font-semibold uppercase text-wine-500 shadow")}>
              {data.buttonLabel}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wine-500 text-white transition-transform group-hover:rotate-45">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
