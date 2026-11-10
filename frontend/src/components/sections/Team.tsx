"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

/**
 * Pixel-exact port of the Figma "Meet Our Team" section (1440 canvas,
 * 1cqw = 14.4px). Cards are a full-bleed row of 339.3x396.4 tiles with the
 * member name/role below each tile. The row is a scroll-snap carousel with
 * arrow controls (requested addition; not part of the Figma design).
 */

// Per-card art defaults from Figma (photo box + watermark tint), by index
const CARD_ART = [
  { photoLeft: "6%", photoWidth: "88%", photoW: 794, photoH: 1010, watermark: "#94013B" },
  { photoLeft: "6%", photoWidth: "88%", photoW: 801, photoH: 982, watermark: "#CCAEFF" },
  { photoLeft: "5%", photoWidth: "90%", photoW: 820, photoH: 1013, watermark: "#F0841D" },
  { photoLeft: "6%", photoWidth: "88%", photoW: 792, photoH: 1006, watermark: "#E04637" },
];

function CarouselArrow({ dir, onClick, disabled }: { dir: "prev" | "next"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous team members" : "Next team members"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "pointer-events-auto flex size-11 items-center justify-center rounded-full bg-wine-500 text-white shadow-[0_8px_24px_rgba(161,1,64,0.35)] transition-all duration-300 md:size-[3.4722cqw]",
        disabled ? "cursor-default opacity-30" : "hover:scale-110"
      )}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className={cn("h-[38%] w-[38%]", dir === "prev" && "rotate-180")}
        aria-hidden
      >
        <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function Team({ content }: { content?: unknown } = {}) {
  const data = sectionContent("team", content);
  const pausedRef = useRef(false);
  const touchX = useRef<number | null>(null);
  const n = data.members.length;

  // Transform-based infinite carousel: 3 copies, index starts on the middle
  // copy and is silently re-centered after each wrap transition.
  const [idx, setIdx] = useState<number>(n);
  const [animate, setAnimate] = useState(true);

  const next = useCallback(() => setIdx((i) => i + 1), []);
  const prev = useCallback(() => setIdx((i) => i - 1), []);

  const onTransitionEnd = useCallback(() => {
    setIdx((i) => {
      if (i >= n * 2 || i < n) {
        setAnimate(false);
        return i >= n * 2 ? i - n : i + n;
      }
      return i;
    });
  }, [n]);

  // re-enable the transition one frame after a silent wrap jump
  useEffect(() => {
    if (!animate) {
      const id = window.setTimeout(() => setAnimate(true), 30);
      return () => window.clearTimeout(id);
    }
  }, [animate]);

  // Fallback wrap: if the transitionend event never fires (hidden tab,
  // skipped transitions), re-center shortly after leaving the middle copy.
  useEffect(() => {
    if (idx >= n && idx < n * 2) return;
    const id = window.setTimeout(onTransitionEnd, 650);
    return () => window.clearTimeout(id);
  }, [idx, n, onTransitionEnd]);

  // Autoplay (pauses on hover/touch; respects reduced-motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!pausedRef.current && document.visibilityState === "visible") next();
    }, 3000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="relative bg-white">
      {/* background texture: grid + sky mist (Figma treatment), full-bleed */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 [mask-image:linear-gradient(to_bottom,transparent,black_140px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_140px)]"
      >
        <Image
          src={assets.bgTeamBaked}
          alt=""
          width={1440}
          height={937}
          sizes="100vw"
          className="h-auto w-full"
        />
      </div>
      <div className="@container relative mx-auto max-w-[1440px] pb-[6cqw]">

        {/* header: heading left, description right (Figma: y77 / y88) */}
        <Reveal className="relative z-10 px-5 pt-[5.3472cqw] md:px-[4.8611cqw]">
          <h2 className="font-display uppercase text-[8vw] leading-[1.18] md:text-[5.3494cqw] md:leading-[6.2953cqw]">
            <span className="font-semibold text-wine-500">{data.headingAccent} </span>
            <span className="font-normal text-black">{data.heading}</span>
          </h2>
          <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-black md:hidden">{data.description}</p>
          <p className="absolute left-[54.7222cqw] top-[6.1111cqw] hidden w-[37.5cqw] text-[1.1111cqw] leading-[1.5799cqw] text-black md:block">
            {data.description}
          </p>
        </Reveal>

        {/* carousel: full-bleed card row (Figma: y230, cards 339.3x396.4, ~27.6 gaps) */}
        <div className="relative z-10 mt-[4.3056cqw]">
          <div
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => (pausedRef.current = false)}
            onTouchStart={(e) => {
              pausedRef.current = true;
              touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              pausedRef.current = false;
              if (touchX.current !== null) {
                const d = e.changedTouches[0].clientX - touchX.current;
                if (d < -40) next();
                else if (d > 40) prev();
                touchX.current = null;
              }
            }}
            className="overflow-hidden px-5 md:px-0"
          >
            <div
              onTransitionEnd={onTransitionEnd}
              className="flex gap-[1.9141cqw] [--step:69.9141cqw] md:[--step:25.4785cqw]"
              style={{
                transform: `translateX(calc(var(--step) * ${-idx}))`,
                transition: animate ? "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
              }}
            >
            {[0, 1, 2].flatMap((copy) =>
              data.members.map((m, i) => {
                const art = CARD_ART[i % CARD_ART.length];
                return (
                  <motion.div
                    key={`${copy}-${i}`}
                    initial={{ opacity: 0, y: 36 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: (i % data.members.length) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="w-[68cqw] shrink-0 snap-start md:w-[23.5644cqw]"
                  >
                  {/* card tile */}
                  <div
                    className="relative aspect-[339.327/396.41] overflow-hidden rounded-[1.4682cqw]"
                    style={{ backgroundColor: m.background }}
                  >
                    {/* watermark logo shape */}
                    <span
                      aria-hidden
                      className="absolute left-[5.894%] top-[14.883%] aspect-[300.273/304.64] w-[88.487%] opacity-[0.18]"
                      style={{
                        backgroundColor: "#ffffff",
                        WebkitMaskImage: `url(${assets.teamWatermark})`,
                        maskImage: `url(${assets.teamWatermark})`,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "100% 100%",
                        maskSize: "100% 100%",
                      }}
                    />
                    {/* member photo — uniform height, bottom-anchored and centered so every card aligns */}
                    <div className="absolute inset-x-0 bottom-0 h-[88%]">
                      <Image
                        src={m.photo}
                        alt={m.name}
                        fill
                        className="object-contain object-bottom"
                        sizes="(max-width:768px) 68vw, 340px"
                      />
                    </div>
                  </div>

                  {/* name / role / arrow below the tile */}
                  <div className="relative mt-[1.5625cqw]">
                    <h3 className="font-marquee font-bold uppercase tracking-[-0.0616em] text-black text-[22px] leading-[1] md:text-[2.3484cqw] md:leading-[2.0139cqw]">
                      {m.name}
                    </h3>
                    <p className="capitalize text-black text-[13px] leading-[2] md:text-[1.0123cqw] md:leading-[2.2928cqw]">
                      {m.role}
                    </p>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="absolute right-[1.0069cqw] top-[2.1319cqw] size-5 text-wine-500 md:size-[1.5854cqw]"
                      aria-hidden
                    >
                      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </motion.div>
                );
              })
            )}
            </div>
          </div>

          {/* carousel arrows (always visible — infinite loop) */}
          <div className="pointer-events-none absolute inset-x-3 top-[34cqw] z-20 flex justify-between md:inset-x-[1.5cqw] md:top-[13cqw]">
            <CarouselArrow dir="prev" onClick={prev} disabled={false} />
            <CarouselArrow dir="next" onClick={next} disabled={false} />
          </div>
        </div>

        {/* View All (Figma: 183x55 wine pill, centered at y787) */}
        <Reveal className="relative z-10 mt-[4.909cqw] flex justify-center">
          <a
            href={data.buttonLink}
            className="group inline-flex h-11 items-center gap-3 whitespace-nowrap rounded-full bg-wine-500 pl-6 pr-2.5 md:h-[3.8194cqw] md:gap-[0.9236cqw] md:pl-[2.3764cqw] md:pr-[1.0806cqw]"
          >
            <span className="font-display font-semibold uppercase leading-none text-white text-[13px] md:text-[1.2928cqw]">
              {data.buttonLabel}
            </span>
            <span className="flex size-7 items-center justify-center rounded-full bg-blush-300 text-wine-500 transition-transform duration-300 group-hover:rotate-45 md:size-[2.3764cqw]">
              <svg viewBox="0 0 16 16" fill="none" className="h-[44%] w-[44%]" aria-hidden>
                <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
