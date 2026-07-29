"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Portfolio case-study popup — scroll-driven narrative.
 *
 * Left column: a full-height image pinned in place that crossfades between
 * shots (product mockup ↔ brand scene) as you scroll, with a slow Ken-Burns
 * zoom. Right column: a long scrolling story, one chapter per image. An
 * IntersectionObserver ties the chapter under the viewport centre to its
 * left-hand image.
 *
 * Overlay + open/close use the same light-lavender wash and CSS keyframes as
 * before (see globals.css `.dgk-modal-*`). Type/colors are Designik's.
 * `data-lenis-prevent` keeps Lenis from stealing the wheel.
 */

export type StorySection = {
  image: string;
  /** Solid pane color behind the image — lets a landscape tile read as full-bleed. */
  bg?: string;
  kicker?: string;
  title: string;
  body: string;
  highlights?: readonly string[];
};

export type CardProject = {
  accent: string;
  heading: string;
  description: string;
  tags?: readonly string[];
  year?: string;
  link?: string;
  story: readonly StorySection[];
};

const EXIT_MS = 300;
const isScene = (src: string) => /rectangle-|scene|bg-/.test(src);

export default function ProjectModal({
  project,
  originRect,
  onClose,
}: {
  project: CardProject;
  originRect: { x: number; y: number; width: number; height: number } | null;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionEls = useRef<(HTMLElement | null)[]>([]);

  const story = project.story;

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  // Lock page scroll while open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Tie the chapter nearest the viewport centre to its image. A scroll-position
  // calculation (rather than IntersectionObserver) so it's deterministic and
  // fires reliably everywhere.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const compute = () => {
      const rootRect = root.getBoundingClientRect();
      const mid = rootRect.top + rootRect.height / 2;
      let best = 0;
      let bestDist = Infinity;
      sectionEls.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive((prev) => (prev === best ? prev : best));
    };
    root.addEventListener("scroll", compute, { passive: true });
    compute(); // initial
    return () => root.removeEventListener("scroll", compute);
  }, [story.length]);

  // Expand out of the clicked card: transform-origin points at where it was.
  const transformOrigin = useMemo(() => {
    const vpW = typeof window !== "undefined" ? window.innerWidth : 1;
    const vpH = typeof window !== "undefined" ? window.innerHeight : 1;
    const ox = originRect ? originRect.x + originRect.width / 2 : vpW / 2;
    const oy = originRect ? originRect.y + originRect.height / 2 : vpH / 2;
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    return `${clamp((ox / vpW) * 100).toFixed(1)}% ${clamp((oy / vpH) * 100).toFixed(1)}%`;
  }, [originRect]);

  const hasRealLink = !!project.link && !project.link.startsWith("#");
  const ctaLabel = hasRealLink ? "Visit Live Site" : "Start a Project";
  const onCta = () => {
    handleClose();
    if (hasRealLink) window.open(project.link!, "_blank", "noopener");
    else window.setTimeout(() => window.dispatchEvent(new CustomEvent("open-get-started")), EXIT_MS + 20);
  };

  return (
    <div
      data-closing={closing}
      onClick={handleClose}
      className="dgk-modal-overlay fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(240,241,251,0.98)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dgk-modal-card relative h-[90vh] w-full max-w-[1160px] overflow-hidden rounded-[16px] bg-white"
        style={{ boxShadow: "rgba(51,53,71,0.22) 0px 40px 100px -20px", transformOrigin }}
      >
        {/* close */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 hover:rotate-90 hover:bg-white"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* scroll area */}
        <div ref={scrollerRef} data-lenis-prevent className="absolute inset-0 overflow-y-auto overscroll-contain md:snap-y md:snap-mandatory">
          <div className="flex min-h-full flex-col md:flex-row">
            {/* LEFT — full-height pinned image that changes on scroll */}
            <div
              className="sticky top-0 z-0 h-[40vh] w-full overflow-hidden md:h-[90vh] md:w-[54%]"
              style={{ background: story[active]?.bg || "linear-gradient(160deg,#241c20 0%,#141013 100%)" }}
            >
              {story.map((s, i) => {
                const cover = isScene(s.image);
                // Tiles that carry their own solid background sit flush (no padding)
                // so they merge seamlessly with the pane color.
                const flush = !!s.bg;
                return (
                  <div
                    key={i}
                    className="absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{
                      opacity: active === i ? 1 : 0,
                      transform: active === i ? "scale(1.05)" : "scale(1)",
                      transition: "opacity 700ms ease, transform 7000ms ease-out",
                    }}
                  >
                    {cover ? (
                      <Image src={s.image} alt={s.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 640px" />
                    ) : (
                      <div className={`absolute inset-0 flex items-center justify-center ${flush ? "" : "p-6 md:p-12"}`}>
                        <div className="relative h-full w-full">
                          <Image
                            src={s.image}
                            alt={s.title}
                            fill
                            className={flush ? "object-contain object-bottom" : "object-contain"}
                            sizes="(max-width:768px) 100vw, 620px"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* bottom caption + chapter progress */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 to-transparent p-5 md:p-7">
                <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
                  {story[active]?.kicker || `${active + 1} / ${story.length}`}
                </span>
                <span className="flex gap-1.5">
                  {story.map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 rounded-full bg-white transition-all duration-300"
                      style={{ width: active === i ? 20 : 6, opacity: active === i ? 1 : 0.5 }}
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* RIGHT — long scrolling narrative */}
            <div className="relative z-10 w-full bg-white md:w-[46%]">
              {story.map((s, i) => (
                <section
                  key={i}
                  data-idx={i}
                  ref={(el) => {
                    sectionEls.current[i] = el;
                  }}
                  className="flex min-h-[82vh] flex-col justify-center px-7 py-[12vh] sm:px-10 md:h-[90vh] md:min-h-0 md:snap-start md:px-12 md:py-0"
                >
                  {i === 0 ? (
                    <header>
                      <p className="font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-wine-500">
                        {story[0]?.kicker || (project.year ? `Case Study · ${project.year}` : "Case Study")}
                      </p>
                      <h2 className="mt-4 font-display text-[34px] font-semibold uppercase leading-[1.02] text-wine-500 sm:text-[42px]">
                        {project.accent}
                        <span className="block text-ink">{project.heading}</span>
                      </h2>
                      {project.tags && project.tags.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {project.tags.map((t) => (
                            <li
                              key={t}
                              className="rounded-full border border-ink/15 px-3 py-1 font-display text-[11px] font-medium uppercase tracking-[0.08em] text-ink/70"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </header>
                  ) : (
                    <p className="font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-wine-500">
                      {s.kicker}
                    </p>
                  )}

                  <h3
                    className={
                      i === 0
                        ? "mt-8 font-display text-[22px] font-semibold uppercase leading-[1.15] text-ink"
                        : "mt-4 font-display text-[26px] font-semibold uppercase leading-[1.12] text-ink sm:text-[30px]"
                    }
                  >
                    {s.title}
                  </h3>

                  <p className="mt-4 text-[15px] leading-[1.7] text-ink/75">{s.body}</p>

                  {s.highlights && s.highlights.length > 0 && (
                    <ul className="mt-6 space-y-2.5">
                      {s.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3 text-[14px] leading-[1.5] text-ink/80">
                          <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-wine-500 text-white">
                            <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5" aria-hidden>
                              <path d="M4 8.5 7 11.5 12.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}

                  {i === story.length - 1 && (
                    <div className="mt-9">
                      <button
                        type="button"
                        onClick={onCta}
                        className="group inline-flex h-12 items-center gap-3 rounded-full bg-wine-500 pl-6 pr-1.5 font-display text-[13px] font-semibold uppercase text-white shadow-sm transition-transform duration-300 hover:scale-[1.03] active:scale-95"
                      >
                        {ctaLabel}
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-wine-500 transition-transform duration-300 group-hover:rotate-45">
                          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                            <path
                              d="M4 12L12 4M12 4H5M12 4V11"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
