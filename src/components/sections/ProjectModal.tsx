"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Portfolio case-study popup.
 *
 * Open animation + overlay mirror upsunday.co: a light lavender wash
 * (#F0F1FB / .98) and a card that expands out of the clicked card, with the
 * info column staggering upward. Everything *inside* uses Designik's own type
 * (Oswald `font-display`), wine/ink colors and pill button.
 *
 * Layout: the body scrolls; the LEFT column is a stacked image gallery that
 * moves as you scroll, while the RIGHT info column is `sticky` and stays put.
 *
 * Animations are pure CSS @keyframes (see globals.css `.dgk-modal-*`). The
 * modal is portaled to <body>, and framer-motion's enter animations don't
 * fire reliably across the portal + AnimatePresence boundary here — CSS does.
 * Enter plays automatically on mount; exit is driven by `data-closing`.
 */

export type CardProject = {
  accent: string;
  heading: string;
  description: string;
  longDescription?: string;
  gallery: readonly string[];
  tags?: readonly string[];
  year?: string;
  link?: string;
};

const EXIT_MS = 300;

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

  // Expand out of the clicked card: transform-origin points at where it was.
  const transformOrigin = useMemo(() => {
    const vpW = typeof window !== "undefined" ? window.innerWidth : 1;
    const vpH = typeof window !== "undefined" ? window.innerHeight : 1;
    const ox = originRect ? originRect.x + originRect.width / 2 : vpW / 2;
    const oy = originRect ? originRect.y + originRect.height / 2 : vpH / 2;
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    return `${clamp((ox / vpW) * 100).toFixed(1)}% ${clamp((oy / vpH) * 100).toFixed(1)}%`;
  }, [originRect]);

  const gallery = project.gallery.filter(Boolean);
  const hasRealLink = !!project.link && !project.link.startsWith("#");
  const ctaLabel = hasRealLink ? "Visit Live Site" : "Start a Project";

  const onCta = () => {
    handleClose();
    if (hasRealLink) window.open(project.link!, "_blank", "noopener");
    else window.setTimeout(() => window.dispatchEvent(new CustomEvent("open-get-started")), EXIT_MS + 20);
  };

  // Staggered fade-up delay for each info row.
  let step = 0;
  const riseDelay = () => ({ animationDelay: `${120 + step++ * 70}ms` });

  return (
    <div
      data-closing={closing}
      onClick={handleClose}
      className="dgk-modal-overlay fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(240,241,251,0.98)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dgk-modal-card relative h-[88vh] w-full max-w-[1080px] overflow-hidden rounded-[16px] bg-white"
        style={{ boxShadow: "rgba(51,53,71,0.22) 0px 40px 100px -20px", transformOrigin }}
      >
        {/* close */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur transition-transform duration-300 hover:rotate-90 hover:bg-white"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* scroll area (data-lenis-prevent so Lenis doesn't steal the wheel) */}
        <div data-lenis-prevent className="h-full overflow-y-auto overscroll-contain">
          <div className="flex flex-col-reverse md:flex-row md:items-start">
            {/* LEFT — gallery that scrolls */}
            <div className="w-full space-y-4 bg-[#f3f3f8] p-4 sm:p-6 md:w-[56%] md:space-y-6 md:p-7">
              {gallery.map((src, i) => (
                <div
                  key={i}
                  className="rounded-[14px] border border-black/[0.06] bg-white p-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.18)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[8px]">
                    <Image
                      src={src}
                      alt={`${project.accent} ${project.heading} — visual ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 90vw, 560px"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT — sticky info (Designik type + colors) */}
            <aside className="w-full p-7 sm:p-9 md:sticky md:top-0 md:w-[44%] md:self-start md:p-10">
              <p
                style={riseDelay()}
                className="dgk-modal-rise font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-wine-500"
              >
                {project.year ? `Case Study · ${project.year}` : "Case Study"}
              </p>

              <h2
                style={riseDelay()}
                className="dgk-modal-rise mt-4 font-display text-[34px] font-semibold uppercase leading-[1.02] text-wine-500 sm:text-[40px]"
              >
                {project.accent}
                <span className="block text-ink">{project.heading}</span>
              </h2>

              {project.tags && project.tags.length > 0 && (
                <ul style={riseDelay()} className="dgk-modal-rise mt-5 flex flex-wrap gap-2">
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

              <p style={riseDelay()} className="dgk-modal-rise mt-6 text-[15px] leading-[1.65] text-ink/75">
                {project.longDescription || project.description}
              </p>

              <div style={riseDelay()} className="dgk-modal-rise mt-8">
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

              {gallery.length > 1 && (
                <p
                  style={riseDelay()}
                  className="dgk-modal-rise mt-7 hidden items-center gap-2 font-display text-[11px] uppercase tracking-[0.18em] text-ink/40 md:flex"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 animate-bounce" aria-hidden>
                    <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Scroll to explore
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
