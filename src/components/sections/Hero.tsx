"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { assets } from "@/lib/assets";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-wine-900"
    >
      {/* Background scene */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.12]">
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

          <Image src={assets.heroScene} alt="" fill priority sizes="120vw" className="object-cover" />

          {/* The scene contains the TV body. This screen layer sits over the
              printed screen artwork, while the glass treatment below sits over
              the video so it reads as content playing inside the television. */}
          <div
            className="absolute isolate overflow-hidden bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.75)]"
            style={{
              left: "42.24%",
              top: "54.88%",
              width: "16.85%",
              height: "14.38%",
              borderRadius: "7% / 10%",
            }}
          >
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Designik portfolio showcase"
            >
              <source src="/video/portfolio.mp4" type="video/mp4" />
            </video>

            {/* Curved CRT glass: edge shade plus a restrained reflection. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                borderRadius: "7% / 10%",
                boxShadow:
                  "inset 0 0 16px rgba(0,0,0,0.8), inset 0 0 3px rgba(255,255,255,0.28)",
                background:
                  "linear-gradient(115deg, rgba(255,255,255,0.13) 0%, transparent 24%, transparent 72%, rgba(255,255,255,0.05) 100%)",
              }}
            />
          </div>
        </div>

        {/* readability gradient on top of the scene */}
        <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-wine-950/45 to-transparent" />
      </motion.div>

      {/* Foreground content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col items-center px-6 pt-[17vh] text-center md:pt-[18vh]"
      >
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.25 }}
          className="font-display font-normal uppercase leading-[0.9] tracking-[-0.02em] text-white text-[clamp(44px,7.2vw,72px)]"
        >
          Design with ease
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.42 }}
          className="mt-5 max-w-[34ch] font-sans text-[clamp(15px,1.5vw,20px)] font-light leading-relaxed text-white/90"
        >
          Designik drives brand engagement with innovative digital solutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.58 }}
          className="mt-8 flex items-center gap-3"
        >
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-white py-2 pl-6 pr-2 font-display text-[13px] font-semibold uppercase tracking-wide text-wine-500 shadow-lg transition-transform duration-300 hover:scale-[1.04] active:scale-95"
          >
            Get Started
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
              <ArrowIcon />
            </span>
          </a>
          <a
            href="#portfolio"
            className="group inline-flex items-center gap-2 rounded-full border border-white/80 px-6 py-2.5 font-sans text-[13px] font-semibold uppercase tracking-wide text-white transition-colors duration-300 hover:bg-white/10"
          >
            <PlayIcon />
            Watch Video
          </a>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
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
      </motion.div>
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
