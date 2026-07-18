"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { sectionContent } from "@/cms/section-defaults";

export default function Nav({ content }: { content?: unknown } = {}) {
  const data = sectionContent("header", content);
  const globalStyle = (
    content as { _globalStyle?: Record<string, unknown> } | undefined
  )?._globalStyle;
  type HeaderLink = {
    label: string;
    href: string;
    target?: "_self" | "_blank";
    children?: HeaderLink[];
  };
  const links = data.links as unknown as HeaderLink[];
  const [open, setOpen] = useState(false);

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
        style={
          globalStyle
            ? {
                backgroundImage:
                  globalStyle.backgroundColor === "transparent"
                    ? undefined
                    : `linear-gradient(${String(globalStyle.backgroundColor)}, ${String(globalStyle.backgroundColor)})`,
                color: String(globalStyle.textColor || "#ffffff"),
                fontFamily: String(globalStyle.fontFamily || "inherit"),
                borderWidth: Number(globalStyle.borderWidth || 0),
                borderColor: String(globalStyle.borderColor || "transparent"),
                borderRadius: Number(globalStyle.borderRadius || 999),
                boxShadow: String(globalStyle.shadow || "none"),
              }
            : undefined
        }
        className="isolate flex h-[60px] w-full max-w-[720px] items-center justify-between overflow-hidden rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_100%),rgba(145,9,57,0.72)] pl-5 pr-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/25 backdrop-blur-xl backdrop-saturate-150 md:h-[70px] md:pl-7"
      >
        <a
          href={links[0]?.href || "#home"}
          className="flex items-center gap-2"
          aria-label={`${data.logoAlt} home`}
        >
          <Image
            src={data.logo}
            alt={data.logoAlt}
            width={44}
            height={44}
            className="h-9 w-9 md:h-10 md:w-10"
            priority
          />
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.label} className="group relative py-4">
              <a
                href={l.href}
                target={l.target}
                className="font-display text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-white"
              >
                {l.label}
              </a>
              {!!l.children?.length && (
                <ul className="invisible absolute left-1/2 top-full min-w-48 -translate-x-1/2 rounded-2xl bg-wine-900/95 p-2 opacity-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition group-hover:visible group-hover:opacity-100">
                  {l.children.map((child) => (
                    <li key={child.label}>
                      <a
                        href={child.href}
                        target={child.target}
                        className="block rounded-xl px-4 py-3 font-display text-sm uppercase text-white/85 hover:bg-white/10 hover:text-white"
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
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
            <motion.span
              animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-5 bg-white"
            />
            <motion.span
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              className="block h-0.5 w-5 bg-white"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-5 bg-white"
            />
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
            {links.map((l, i) => (
              <div key={l.label} className="text-center">
                <motion.a
                  key={l.label}
                  href={l.href}
                  target={l.target}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i + 0.1 }}
                  className="font-display text-3xl font-medium uppercase tracking-wide text-white"
                >
                  {l.label}
                </motion.a>
                {l.children?.map((child) => (
                  <a
                    key={child.label}
                    href={child.href}
                    target={child.target}
                    onClick={() => setOpen(false)}
                    className="mt-2 block font-display text-lg uppercase text-white/65"
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            ))}
            <motion.a
              href={data.buttonLink}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * links.length + 0.1 }}
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
