"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

function Stars() {
  return (
    <div className="flex gap-0.5 text-orange-brand">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function Quote({ tone, quote, author, role, rating }: { tone: "cream" | "magenta" | "orange" | "blush"; quote:string; author:string; role:string; rating:string }) {
  const styles = {
    cream: "bg-cream-100 text-ink",
    magenta: "bg-gradient-to-br from-wine-600 to-pink-brand text-white",
    orange: "bg-gradient-to-br from-orange-brand to-redorange text-white",
    blush: "bg-blush-100 text-ink",
  }[tone];
  const dark = tone === "magenta" || tone === "orange";
  return (
    <article className={cn("flex h-full flex-col justify-between gap-6 rounded-[20px] p-6", styles)}>
      <p className={cn("text-[13.5px] font-light leading-relaxed", dark ? "text-white/90" : "text-neutral-600")}>
        {quote}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <h4 className="font-display text-[15px] font-bold uppercase">{author}</h4>
          <p className={cn("text-[11px]", dark ? "text-white/70" : "text-neutral-500")}>{role}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars />
          <span className={cn("text-[11px] font-medium", dark ? "text-white/80" : "text-neutral-500")}>
            {rating}
          </span>
        </div>
      </div>
    </article>
  );
}

function ImageCard({ src, light }: { src: string; light?: boolean }) {
  return (
    <article className={cn("group relative h-full overflow-hidden rounded-[20px]", light ? "bg-cream-50" : "bg-blush-200")}>
      <Image
        src={src}
        alt="Designik project"
        fill
        className={cn("transition-transform duration-500 group-hover:scale-105", light ? "object-contain p-6" : "object-cover")}
        sizes="420px"
      />
    </article>
  );
}

export default function Testimonials({ content }: { content?: unknown } = {}) {
  const data=sectionContent("testimonials",content); const quoteProps={quote:data.quote,author:data.author,role:data.role,rating:data.rating};
  return (
    <section className="relative bg-white px-5 py-12 md:py-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(34px,5.5vw,58px)] font-medium uppercase leading-[0.95]">
            <span className="text-wine-500">{data.headingAccent}</span> <span className="text-ink">{data.heading}</span>
          </h2>
          <p className="max-w-[40ch] text-[14px] font-light leading-relaxed text-neutral-600">
            {data.description}
          </p>
        </div>
        <RevealGroup
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:auto-rows-[minmax(230px,1fr)] md:gap-5"
          stagger={0.07}
        >
          <RevealItem className="h-full"><Quote tone="cream" {...quoteProps} /></RevealItem>
          <RevealItem className="h-full"><Quote tone="magenta" {...quoteProps} /></RevealItem>
          <RevealItem className="h-full"><ImageCard src={data.images[0]} /></RevealItem>
          <RevealItem className="h-full"><Quote tone="orange" {...quoteProps} /></RevealItem>
          <RevealItem className="h-full"><ImageCard src={data.images[1]} light /></RevealItem>
          <RevealItem className="h-full"><Quote tone="blush" {...quoteProps} /></RevealItem>
        </RevealGroup>
      </div>

      {/* hanging tag */}
      <motion.div
        initial={{ rotate: -8, opacity: 0 }}
        whileInView={{ rotate: 6, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 60, damping: 8 }}
        className="pointer-events-none absolute right-[9%] -top-2 z-20 hidden h-40 w-28 md:block"
      >
        <Image src={assets.hangingTag} alt="" fill className="object-contain object-top" sizes="120px" />
      </motion.div>
    </section>
  );
}
