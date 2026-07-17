"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

export default function Nav({ content }: { content?: unknown } = {}) {
  const data=sectionContent("header",content);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 md:top-6"
    >
      <nav
        className={cn(
          "flex h-[60px] w-full max-w-[720px] items-center justify-between rounded-full pl-5 pr-2 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-inset transition-colors duration-300 md:h-[70px] md:pl-7",
          scrolled
            ? "bg-wine-900/70 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            : "bg-gradient-to-b from-white/20 to-white/5 ring-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        )}
      >
        <a href={data.links[0]?.href||"#home"} className="flex items-center gap-2" aria-label={`${data.logoAlt} home`}>
          <Image src={data.logo} alt={data.logoAlt} width={44} height={44} className="h-9 w-9 md:h-10 md:w-10" priority />
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {data.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="font-display text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={data.buttonLink}
          className="hidden items-center rounded-full bg-white px-6 py-2.5 font-display text-[15px] font-semibold uppercase tracking-wide text-wine-500 transition-transform duration-300 hover:scale-[1.04] active:scale-95 md:inline-flex"
        >
          {data.buttonLabel}
        </a>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 md:hidden"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col gap-[5px]">
            <motion.span animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} className="block h-0.5 w-5 bg-white" />
            <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} className="block h-0.5 w-5 bg-white" />
            <motion.span animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} className="block h-0.5 w-5 bg-white" />
          </div>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-wine-900/95 backdrop-blur-lg md:hidden"
          >
            {data.links.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i + 0.1 }}
                className="font-display text-3xl font-medium uppercase tracking-wide text-white"
              >
                {l.label}
              </motion.a>
            ))}
            <motion.a
              href={data.buttonLink}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * data.links.length + 0.1 }}
              className="mt-2 rounded-full bg-white px-8 py-3 font-display text-lg font-semibold uppercase tracking-wide text-wine-500"
            >
              {data.buttonLabel}
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
