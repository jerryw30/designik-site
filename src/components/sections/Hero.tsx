"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assets } from "@/lib/assets";
import { heroContent, type HeroContent } from "@/cms/defaults";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({ content: input }: { content?: Partial<HeroContent> } = {}) {
  const content = heroContent(input);
  const alignItems = content.alignment === "left" ? "flex-start" : content.alignment === "right" ? "flex-end" : "center";
  const textAlign = content.alignment;
  const entrance = content.entranceAnimation === "none" ? {} : content.entranceAnimation === "fade" ? { opacity: 0 } : content.entranceAnimation === "zoom" ? { opacity: 0, scale: .9 } : { opacity: 0, y: 28 };
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Primary opens the same project form as the header; a Calendly secondary
  // link opens in an embedded booking popup instead of navigating away.
  const primaryIsExternal = /^https?:/i.test(content.primaryLink);
  const secondaryIsCalendly = content.secondaryLink.includes("calendly.com");
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  useEffect(() => {
    if (!calendlyOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCalendlyOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [calendlyOpen]);

  return (
    <section
      id="home"
      ref={ref}
      className="hero-editable relative h-[100svh] min-h-[680px] w-full overflow-hidden"
      style={{ backgroundColor: content.backgroundColor, ["--hero-top-desktop" as string]: `${content.contentTopDesktop}vh`, ["--hero-top-tablet" as string]: `${content.contentTopTablet}vh`, ["--hero-top-mobile" as string]: `${content.contentTopMobile}vh`, ["--hero-h1-desktop" as string]: `${content.headingSizeDesktop}px`, ["--hero-h1-tablet" as string]: `${content.headingSizeTablet}px`, ["--hero-h1-mobile" as string]: `${content.headingSizeMobile}px`, ["--hero-p-desktop" as string]: `${content.descriptionSizeDesktop}px`, ["--hero-p-tablet" as string]: `${content.descriptionSizeTablet}px`, ["--hero-p-mobile" as string]: `${content.descriptionSizeMobile}px` }}
    >
      {/* Background scene */}
      <motion.div style={{ y: bgY, scale: content.sceneScale }} className="absolute inset-0">
        {/* Aspect-locked wrapper sized to cover the viewport while showing the full
            scene (no crop). This gives the TV screen a fixed % position so the video
            stays pinned to it on every viewport. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "max(100vw, calc(100svh * 4096 / 3061))", aspectRatio: "4096 / 3061" }}
        >
          {/* Spotlight glow BEHIND the scene (Figma: Ellipse 1496, #FF579B, heavy blur).
              The scene PNG has a transparent sky/valley, so the glow shows through behind
              the TV and is occluded by the opaque TV + mountains in front of it. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(46% 40% at 50% 42%, rgba(255,87,155,0.95), rgba(255,99,150,0.45) 45%, rgba(255,87,155,0.12) 70%, transparent 86%)",
            }}
          />

          <Image src={content.backgroundImage || assets.heroScene} alt="" fill priority sizes="120vw" className="object-cover" />

          {/* The scene contains the TV body. This screen layer sits over the
              printed screen artwork, while the glass treatment below sits over
              the video so it reads as content playing inside the television. */}
          <div
            className="absolute isolate overflow-hidden bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.75)]"
            style={{
              left: "42.3%",
              top: "54.6%",
              width: "15.6%",
              height: "15.2%",
              borderRadius: "2% / 11%",
            }}
          >
            <video
              className="absolute inset-0 h-full w-full"
              style={{ objectFit: content.videoFit }}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Designik portfolio showcase"
            >
              <source src={content.video} type="video/mp4" />
            </video>

            {/* Curved CRT glass: edge shade plus a restrained reflection. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                borderRadius: "2% / 11%",
                boxShadow:
                  "inset 0 0 16px rgba(0,0,0,0.8), inset 0 0 3px rgba(255,255,255,0.28)",
                background:
                  "linear-gradient(115deg, rgba(255,255,255,0.13) 0%, transparent 24%, transparent 72%, rgba(255,255,255,0.05) 100%)",
              }}
            />
          </div>
        </div>

        {/* readability gradient on top of the scene */}
        <div className="absolute inset-x-0 top-0 h-2/5" style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${content.overlayColor} ${content.overlayOpacity}%, transparent), transparent)` }} />
      </motion.div>

      {/* Foreground content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, maxWidth: content.contentMaxWidth, alignItems, textAlign }}
        className="hero-content relative z-10 mx-auto flex h-full w-full flex-col px-6"
      >
        <motion.h1
          initial={entrance}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: content.animationDuration, ease, delay: content.animationDelay }}
          className="hero-heading uppercase leading-[0.9]"
          style={{ fontFamily: content.headingFont, color: content.headingColor, fontWeight: content.headingWeight, letterSpacing: `${content.headingLetterSpacing}em` }}
        >
          {content.heading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.42 }}
          className="hero-description max-w-[34ch] leading-relaxed"
          style={{ marginTop: content.textGap, fontFamily: content.descriptionFont, color: content.descriptionColor, fontWeight: content.descriptionWeight }}
        >
          {content.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.58 }}
          className="flex items-center"
          style={{ marginTop: content.buttonsTop, gap: content.buttonGap }}
        >
          <a
            href={content.primaryLink}
            onClick={(e) => {
              if (primaryIsExternal) return;
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("open-get-started"));
            }}
            className="hero-primary group inline-flex items-center gap-2 font-display font-semibold uppercase tracking-wide shadow-lg transition-all duration-300 active:scale-95"
            style={{ background: content.primaryBackground, color: content.primaryColor, borderColor: content.primaryBorderColor, borderWidth: content.primaryBorderWidth, borderStyle: "solid", borderRadius: content.buttonRadius, fontSize: content.buttonFontSize, padding: `${content.buttonPaddingY}px ${content.buttonPaddingX}px`, ["--hover-bg" as string]: content.primaryHoverBackground, ["--hover-color" as string]: content.primaryHoverColor, ["--hover-scale" as string]: content.hoverScale }}
          >
            {content.primaryLabel}
            {content.primaryIcon !== "none" && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
              <ArrowIcon />
            </span>}
          </a>
          <a
            href={content.secondaryLink}
            onClick={(e) => {
              if (!secondaryIsCalendly) return;
              e.preventDefault();
              setCalendlyOpen(true);
            }}
            className="hero-secondary group inline-flex items-center gap-2 font-sans font-semibold uppercase tracking-wide transition-all duration-300"
            style={{ background: content.secondaryBackground, color: content.secondaryColor, borderColor: content.secondaryBorderColor, borderWidth: content.secondaryBorderWidth, borderStyle: "solid", borderRadius: content.buttonRadius, fontSize: content.buttonFontSize, padding: `${content.buttonPaddingY}px ${content.buttonPaddingX}px`, ["--hover-bg" as string]: content.secondaryHoverBackground, ["--hover-color" as string]: content.secondaryHoverColor, ["--hover-scale" as string]: content.hoverScale }}
          >
            {content.secondaryIcon !== "none" && <PlayIcon />}
            {content.secondaryLabel}
          </a>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      {content.showScrollCue && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-[8%] left-1/2 z-10 hidden -translate-x-1/2 md:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-white/50 p-1.5"
        >
          <span className="h-2 w-1 rounded-full bg-white/80" />
        </motion.div>
      </motion.div>}

      {/* Calendly booking popup (embedded, stays on-site) */}
      {calendlyOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setCalendlyOpen(false)}
            className="dgk-modal-overlay fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6"
            style={{ backgroundColor: "rgba(240,241,251,0.98)" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="dgk-modal-card relative h-[90vh] w-full max-w-[1000px] overflow-hidden rounded-[16px] bg-white"
              style={{ boxShadow: "rgba(51,53,71,0.22) 0px 40px 100px -20px" }}
            >
              <button
                onClick={() => setCalendlyOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 hover:rotate-90 hover:bg-white"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <iframe
                src={`${content.secondaryLink}${content.secondaryLink.includes("?") ? "&" : "?"}embed_domain=${typeof location !== "undefined" ? location.hostname : ""}&embed_type=Inline&hide_gdpr_banner=1`}
                title="Book an appointment with Designik"
                className="h-full w-full border-0"
              />
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2 1.5v9l8-4.5-8-4.5z" />
    </svg>
  );
}
