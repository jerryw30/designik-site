"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

type Banner = {
  background: string;
  device: string;
  deviceSide: "left" | "right";
  light?: boolean; // white heading text
};

function ReadMore({ label, href }: { label:string; href:string }) {
  return (
    <a
      href={href}
      className="group mt-5 inline-flex items-center gap-2 rounded-full bg-white py-2 pl-5 pr-2 font-display text-[12px] font-semibold uppercase tracking-wide text-wine-500 shadow-md"
    >
      {label}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wine-500 text-white transition-transform group-hover:rotate-45">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function StackCard({ banner, index, total, data }: { banner: Banner; index: number; total: number; data:{projectAccent:string;projectHeading:string;description:string;buttonLabel:string;buttonLink:string} }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 120px", "end 120px"],
  });
  // The card shrinks slightly as the next one slides over it.
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const brightnessFilter = useTransform(scrollYProgress, [0, 1], ["brightness(1)", "brightness(0.82)"]);
  const isLast = index === total - 1;
  const textSide = banner.deviceSide === "left" ? "right" : "left";

  return (
    <div
      ref={ref}
      className="sticky"
      style={{ top: `calc(100px + ${index * 1.6}rem)` }}
    >
      <motion.article
        style={{ scale: isLast ? 1 : scale }}
        className="relative mb-8 h-[62vh] min-h-[440px] w-full overflow-hidden rounded-[28px] shadow-[0_30px_60px_-20px_rgba(83,8,35,0.45)]"
      >
        <motion.div style={{ filter: isLast ? undefined : brightnessFilter }} className="absolute inset-0">
          <Image src={banner.background} alt="" fill className="object-cover" sizes="100vw" priority={index === 0} />
        </motion.div>

        {/* device */}
        <div
          className={cn(
            "absolute inset-y-0 hidden w-[42%] md:block",
            banner.deviceSide === "left" ? "left-[4%]" : "right-[4%]"
          )}
        >
          <Image src={banner.device} alt="Designik project" fill className="object-contain object-center drop-shadow-2xl" sizes="600px" />
        </div>

        {/* text */}
        <div
          className={cn(
            "absolute top-1/2 max-w-[46%] -translate-y-1/2",
            textSide === "right" ? "right-[7%] text-left" : "left-[7%] text-left"
          )}
        >
          <h3 className="font-display text-[clamp(34px,4.6vw,60px)] font-semibold uppercase leading-[0.9]">
            <span className={banner.light ? "text-white" : "text-wine-700"}>{data.projectAccent}</span>
            <br />
            <span className={banner.light ? "text-white/95" : "text-ink"}>{data.projectHeading}</span>
          </h3>
          <p className={cn("mt-3 hidden max-w-[34ch] text-[13px] font-light leading-relaxed sm:block", banner.light ? "text-white/80" : "text-ink/70")}>
            {data.description}
          </p>
          <ReadMore label={data.buttonLabel} href={data.buttonLink} />
        </div>
      </motion.article>
    </div>
  );
}

export default function Portfolio({ content }: { content?: unknown } = {}) {
  const data=sectionContent("portfolio",content);
  return (
    <section id="portfolio" className="relative bg-white px-5 pt-16 pb-24 md:pt-24">
      {/* hanging discover tag */}
      <motion.div
        initial={{ rotate: -10, y: -12, opacity: 0 }}
        whileInView={{ rotate: -4, y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 70, damping: 9 }}
        className="pointer-events-none absolute left-[7%] top-0 z-20 hidden h-44 w-32 md:block"
      >
        <Image src={assets.hangingTag} alt="" fill className="object-contain object-top" sizes="140px" />
      </motion.div>

      <Reveal className="mx-auto mb-12 max-w-[760px] text-center">
        <h2 className="font-display text-[clamp(34px,5.5vw,58px)] font-medium uppercase leading-[0.95]">
          <span className="text-wine-500">{data.headingAccent}</span>{" "}
          <span className="text-ink">{data.heading}</span>
        </h2>
      </Reveal>

      <div className="mx-auto max-w-[1280px]">
        {data.cards.map((b, i) => (
          <StackCard key={i} banner={b as Banner} index={i} total={data.cards.length} data={data} />
        ))}
      </div>
    </section>
  );
}
