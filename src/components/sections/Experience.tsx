"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";

type Pill = {
  label: string;
  icon: React.ReactNode;
  pos: string; // absolute positioning classes (desktop)
};

const ICON = "h-7 w-7 rounded-lg flex items-center justify-center text-white";

const PILLS: Pill[] = [
  {
    label: "Social Strategy",
    icon: (
      <span className={`${ICON} bg-pink-brand`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 13V7M6 13V3M10 13V9M14 13V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </span>
    ),
    pos: "left-[6%] top-[30%]",
  },
  {
    label: "Creator Management",
    icon: (
      <span className={`${ICON} bg-orange-brand`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.5" /><path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </span>
    ),
    pos: "right-[6%] top-[27%]",
  },
  {
    label: "Influencer Partnerships",
    icon: (
      <span className={`${ICON} bg-wine-500`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" /><circle cx="10.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" /><path d="M2 13c0-2 1.6-3 3.5-3M14 13c0-2-1.6-3-3.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </span>
    ),
    pos: "left-[3%] top-[50%]",
  },
  {
    label: "Social Publishing",
    icon: (
      <span className={`${ICON} bg-pink-brand`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 2L7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
      </span>
    ),
    pos: "right-[3%] top-[50%]",
  },
  {
    label: "Insight Analysis",
    icon: (
      <span className={`${ICON} bg-redorange`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.5" /><path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </span>
    ),
    pos: "left-[12%] top-[68%]",
  },
];

function FloatingPill({ label, icon, pos, delay }: Pill & { delay: number }) {
  return (
    <motion.div
      className={`absolute z-20 hidden lg:block ${pos}`}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 3.6 + delay, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2.5 rounded-full bg-white py-2.5 pl-2.5 pr-5 shadow-[0_10px_30px_rgba(83,8,35,0.25)]"
      >
        {icon}
        <span className="font-display text-[14px] font-semibold uppercase tracking-wide text-ink whitespace-nowrap">
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function Experience() {
  return (
    <section className="bg-white px-4 py-10 md:px-8 md:py-14">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-30px_rgba(83,8,35,0.6)]">
        {/* background: red hills + maroon wash */}
        <div className="absolute inset-0">
          <Image src={assets.experienceHills} alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-wine-800/95 via-wine-600/90 to-wine-500/95" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(255,142,34,0.12),transparent)]" />
        </div>

        {/* faded wordmark */}
        <span className="pointer-events-none absolute left-1/2 top-[46%] z-0 -translate-x-1/2 select-none font-display text-[24vw] font-bold uppercase leading-none text-white/[0.06] md:text-[180px]">
          Designik
        </span>

        {/* clouds */}
        <div className="pointer-events-none absolute left-[2%] top-[14%] z-10 h-20 w-44 opacity-90 md:h-28 md:w-64">
          <Image src={assets.cloud} alt="" fill className="object-contain" sizes="256px" />
        </div>
        <div className="pointer-events-none absolute right-[3%] top-[10%] z-10 h-16 w-40 opacity-90 md:h-24 md:w-56">
          <Image src={assets.cloud} alt="" fill className="object-contain" sizes="224px" />
        </div>

        <div className="relative z-10 px-6 pt-14 pb-16 md:pt-16 lg:pb-0">
          <Reveal className="text-center">
            <h2 className="font-display text-[clamp(32px,5vw,56px)] font-medium uppercase leading-[0.95] text-white">
              Experience Your
              <br />
              Brand to New Height
            </h2>
          </Reveal>

          <div className="relative mx-auto mt-6 h-[460px] max-w-[1080px] md:h-[560px]">
            {/* connector arrows (desktop) */}
            <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1080 560" fill="none" aria-hidden>
              <path d="M250 150 q70 10 90 60" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              <path d="M830 140 q-70 10 -95 60" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              <path d="M170 300 q60 10 90 30" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              <path d="M910 300 q-60 10 -95 30" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              <path d="M300 430 q50 -10 70 -40" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
            </svg>

            {PILLS.map((p, i) => (
              <FloatingPill key={p.label} {...p} delay={i * 0.12} />
            ))}

            {/* VIEW ALL */}
            <motion.a
              href="#services"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="group absolute right-[12%] top-[68%] z-20 hidden items-center gap-2 rounded-full bg-white py-2.5 pl-5 pr-2.5 font-display text-[14px] font-semibold uppercase tracking-wide text-wine-500 shadow-lg lg:flex"
            >
              View All
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-500 text-white transition-transform group-hover:rotate-45">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </motion.a>

            {/* Statue */}
            <Reveal direction="none" className="relative z-10 mx-auto flex h-full w-[300px] items-end justify-center md:w-[440px]">
              <Image
                src={assets.statue}
                alt="Designik — experience your brand"
                width={820}
                height={1024}
                className="h-auto w-full drop-shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
                sizes="440px"
                priority={false}
              />
            </Reveal>
          </div>

          {/* mobile pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:hidden">
            {PILLS.map((p) => (
              <div key={p.label} className="flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 shadow-md">
                {p.icon}
                <span className="font-display text-xs font-semibold uppercase tracking-wide text-ink">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
