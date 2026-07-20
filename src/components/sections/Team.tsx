"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
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
  { photoLeft: "10.609%", photoWidth: "70.732%", photoW: 240, photoH: 389, watermark: "#94013B" },
  { photoLeft: "2.829%", photoWidth: "84.285%", photoW: 286, photoH: 382, watermark: "#CCAEFF" },
  { photoLeft: "8.841%", photoWidth: "78.096%", photoW: 265, photoH: 389, watermark: "#F0841D" },
  { photoLeft: "5.894%", photoWidth: "88.115%", photoW: 299, photoH: 389, watermark: "#E04637" },
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
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Infinite loop: the track holds 3 copies of the member list. Whenever the
  // scroll position drifts out of the middle copy, silently jump one copy.
  const normalizeLoop = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const copyW = t.scrollWidth / 3;
    if (copyW <= 0) return;
    if (t.scrollLeft < copyW * 0.5 || t.scrollLeft > copyW * 1.75) {
      const prev = t.style.scrollBehavior;
      t.style.scrollBehavior = "auto";
      t.scrollLeft += t.scrollLeft < copyW * 0.5 ? copyW : -copyW;
      t.style.scrollBehavior = prev;
    }
  }, []);

  // Start in the middle copy
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    t.style.scrollBehavior = "auto";
    t.scrollLeft = t.scrollWidth / 3;
    t.style.scrollBehavior = "";
  }, []);

  // JS-driven tween (native smooth scrolling is unreliable with snap tracks)
  const animRef = useRef<number | null>(null);
  const scrollByCard = useCallback((dir: 1 | -1) => {
    const t = trackRef.current;
    if (!t) return;
    const cell = t.firstElementChild as HTMLElement | null;
    if (!cell) return;
    const gap = parseFloat(getComputedStyle(t).columnGap || "0") || 0;
    const delta = dir * (cell.getBoundingClientRect().width + gap);
    const start = t.scrollLeft;
    const t0 = performance.now();
    const ms = 450;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    if (animRef.current !== null) window.clearInterval(animRef.current);
    animRef.current = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      t.scrollLeft = start + delta * ease(p);
      if (p >= 1 && animRef.current !== null) {
        window.clearInterval(animRef.current);
        animRef.current = null;
      }
    }, 16);
  }, []);

  useEffect(() => () => {
    if (animRef.current !== null) window.clearInterval(animRef.current);
  }, []);

  // Autoplay (pauses on hover/touch; respects reduced-motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!pausedRef.current && document.visibilityState === "visible") scrollByCard(1);
    }, 3500);
    return () => clearInterval(id);
  }, [scrollByCard]);

  return (
    <section className="relative bg-white">
      <div className="@container relative mx-auto max-w-[1440px] pb-[6cqw]">
        {/* background texture: grid + sky mist (Figma treatment) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[65cqw] overflow-hidden">
          <Image
            src={assets.teamGrid}
            alt=""
            width={1440}
            height={679}
            sizes="100vw"
            className="absolute top-0 h-auto w-full opacity-[0.6]"
          />
          <Image
            src={assets.teamSky}
            alt=""
            width={1439}
            height={937}
            sizes="100vw"
            className="absolute top-0 h-auto w-full opacity-[0.05] [mix-blend-mode:luminosity]"
          />
        </div>

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
            ref={trackRef}
            onScroll={normalizeLoop}
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => (pausedRef.current = false)}
            onTouchStart={() => (pausedRef.current = true)}
            onTouchEnd={() => (pausedRef.current = false)}
            className="flex snap-x snap-proximity gap-[1.9141cqw] overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-0"
          >
            {[0, 1, 2].flatMap((copy) =>
              data.members.map((m, i) => {
                const art = CARD_ART[i % CARD_ART.length];
                return (
                  <div key={`${copy}-${i}`} className="w-[68cqw] shrink-0 snap-start md:w-[23.5644cqw]">
                  {/* card tile */}
                  <div
                    className="relative aspect-[339.327/396.41] overflow-hidden rounded-[1.4682cqw]"
                    style={{ backgroundColor: m.background }}
                  >
                    {/* watermark logo shape */}
                    <span
                      aria-hidden
                      className="absolute left-[5.894%] top-[14.883%] aspect-[300.273/304.64] w-[88.487%]"
                      style={{
                        backgroundColor: art.watermark,
                        WebkitMaskImage: `url(${assets.teamWatermark})`,
                        maskImage: `url(${assets.teamWatermark})`,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "100% 100%",
                        maskSize: "100% 100%",
                      }}
                    />
                    {/* member photo, flush to card bottom */}
                    <div className="absolute bottom-0" style={{ left: art.photoLeft, width: art.photoWidth }}>
                      <Image
                        src={m.photo}
                        alt={m.name}
                        width={art.photoW}
                        height={art.photoH}
                        className="h-auto w-full"
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
                </div>
                );
              })
            )}
          </div>

          {/* carousel arrows (always visible — infinite loop) */}
          <div className="pointer-events-none absolute inset-x-3 top-[13cqw] z-20 flex justify-between md:inset-x-[1.5cqw]">
            <CarouselArrow dir="prev" onClick={() => scrollByCard(-1)} disabled={false} />
            <CarouselArrow dir="next" onClick={() => scrollByCard(1)} disabled={false} />
          </div>
        </div>

        {/* View All (Figma: 183x55 wine pill, centered at y787) */}
        <Reveal className="relative z-10 mt-[4.909cqw] flex justify-center">
          <a
            href={data.buttonLink}
            className="group inline-flex h-11 w-[160px] items-center justify-between rounded-full bg-wine-500 pl-6 pr-2.5 md:h-[3.8194cqw] md:w-[12.7083cqw] md:pl-[2.3764cqw] md:pr-[1.0806cqw]"
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
