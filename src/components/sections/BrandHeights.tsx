"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { PillButton } from "@/components/ui/Buttons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const LOREM =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.";

const ROWS = [
  { title: "Discovery &\nStrategy" },
  { title: "Strategic\nAction" },
  { title: "Performance\nBoost" },
  { title: "Insight\nAnalysis" },
];

export default function BrandHeights() {
  const [active, setActive] = useState(1);

  return (
    <section className="bg-white px-5 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="text-center">
          <h2 className="font-display text-[clamp(34px,5.5vw,56px)] font-medium uppercase leading-[0.95]">
            <span className="text-wine-500">We Drive Your</span>
            <br />
            <span className="text-ink">Brand to New Height</span>
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 flex flex-col gap-4" stagger={0.08}>
          {ROWS.map((row, i) => {
            const isActive = active === i;
            return (
              <RevealItem key={i}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={cn(
                    "group flex w-full items-center gap-5 rounded-[18px] px-6 py-5 text-left transition-colors duration-300 md:gap-7 md:px-8",
                    isActive ? "bg-wine-500 text-white" : "bg-blush-200 text-ink hover:bg-blush-300"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isActive ? "bg-white/15" : "bg-white"
                    )}
                  >
                    <Image
                      src={assets.logo}
                      alt=""
                      width={26}
                      height={26}
                      className={cn("h-6 w-6", isActive ? "brightness-0 invert" : "brightness-0")}
                    />
                  </span>

                  <h3 className="w-[170px] shrink-0 whitespace-pre-line font-display text-[22px] font-semibold uppercase leading-[1.05] md:w-[210px] md:text-[26px]">
                    {row.title}
                  </h3>

                  <p
                    className={cn(
                      "hidden flex-1 max-w-[460px] text-[13px] font-light leading-relaxed md:block",
                      isActive ? "text-white/85" : "text-neutral-500"
                    )}
                  >
                    {LOREM}
                  </p>

                  <span
                    className={cn(
                      "ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:rotate-45",
                      isActive ? "bg-white text-wine-500" : "bg-wine-500 text-white"
                    )}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal className="mt-12 flex justify-center">
          <PillButton href="#services" variant="wine">
            View All Services
          </PillButton>
        </Reveal>
      </div>

      {/* logo strip */}
      <div className="mt-14 w-screen overflow-hidden">
        <div className="flex w-max animate-marquee" style={{ ["--marquee-duration" as string]: "32s" }}>
          {Array.from({ length: 2 }).map((_, u) => (
            <div key={u} className="flex items-center">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex h-12 w-12 items-center justify-center px-10">
                  <Image src={assets.logo} alt="" width={32} height={32} className="h-8 w-8 opacity-90" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
