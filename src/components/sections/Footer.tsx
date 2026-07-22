"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import FigmaNewsletterForm from "@/components/ui/FigmaNewsletterForm";
import { sectionContent } from "@/cms/section-defaults";
import PendulumSwing from "@/components/ui/PendulumSwing";

/**
 * Pixel-exact port of the Figma footer (1440 canvas, 1cqw = 14.4px,
 * section 1440x1017 at y10594). Gradient #580a25 -> #b12a4a, giant 51%
 * "Designik" wordmark, red field image at the bottom, hanging tag,
 * Oswald link columns with hairlines, white circular badge, mint
 * Raleway newsletter.
 */

const RALEWAY = { fontFamily: "var(--font-raleway), sans-serif" } as const;

const FOOTER_HREFS: Record<string, string> = {
  home: "/",
  about: "/#about",
  services: "/#services",
  work: "/#portfolio",
  contact: "/#contact",
  "book a call": "/#contact",
  careers: "/#contact",
  journal: "/blog",
  blog: "/blog",
};
const footerHref = (label: string) => FOOTER_HREFS[label.toLowerCase().trim()] || "/";

export default function Footer({ content }: { content?: unknown } = {}) {
  const data = sectionContent("footer", content);
  const globalStyle = (
    content as { _globalStyle?: Record<string, unknown> } | undefined
  )?._globalStyle;
  return (
    <footer
      id="contact"
      className="relative text-white"
      style={
        globalStyle
          ? {
              backgroundColor:
                globalStyle.backgroundColor === "transparent"
                  ? undefined
                  : String(globalStyle.backgroundColor),
              color: String(globalStyle.textColor || "#ffffff"),
              fontFamily: String(globalStyle.fontFamily || "inherit"),
            }
          : undefined
      }
    >
      <div
        className="@container relative mx-auto w-full overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #580a25 15.978%, #b12a4a 77.139%)",
        }}
      >
        {/* ======================= desktop (exact) ======================= */}
        <div className="relative hidden h-[70.625cqw] md:block">
          {/* giant faded wordmark */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[0.6944cqw] top-[21.5278cqw] z-0 select-none whitespace-nowrap font-display text-[26.1277cqw] font-semibold uppercase leading-[30.7478cqw] text-[#8e0038] opacity-[0.51]"
          >
            Designik
          </span>

          {/* red field scene at the bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]">
            <Image
              src={data.backgroundImage || assets.footerField}
              alt=""
              width={1440}
              height={421}
              sizes="100vw"
              className="h-auto w-full"
            />
          </div>

          {/* hanging tag (Figma: 198 box at x639) */}
          <motion.div
            initial={{ rotate: -8, y: -10, opacity: 0 }}
            whileInView={{ rotate: 0, y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 70, damping: 9 }}
            className="pointer-events-none absolute left-[34.4931cqw] top-[-12px] z-[5] w-[22.7143cqw]"
          >
            <PendulumSwing duration={5.1} angle={3}>
              <Image src={assets.footerTag} alt="" width={324} height={315} className="h-auto w-full" sizes="330px" />
            </PendulumSwing>
          </motion.div>

          {/* logo + DESIGNIK (y121) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[5.2083cqw] top-[8.4028cqw] z-10 w-[7.7778cqw]"
          >
            <Image
              src={data.logo || assets.logo}
              alt={data.brand}
              width={112}
              height={114}
              className="h-auto w-full"
            />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[14.6528cqw] top-[8.4722cqw] z-10 whitespace-nowrap font-display text-[6.6581cqw] font-semibold uppercase leading-[7.8355cqw]"
          >
            {data.brand}
          </motion.span>

          {/* right heading (left-aligned at x921) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-[4.8611cqw] top-[7.7778cqw] z-10 text-right uppercase"
          >
            <p className="whitespace-nowrap font-display text-[4.3433cqw] font-normal leading-[5.1114cqw]">
              {data.heading.split("\n")[0]}
            </p>
            <p className="whitespace-nowrap font-display text-[3.4585cqw] font-medium leading-[4.0701cqw]">
              {data.heading.split("\n")[1] || ""}
            </p>
          </motion.div>

          {/* horizontal hairline (y295.5) */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[4.8611cqw] top-[20.5208cqw] z-10 h-px w-[90.2431cqw] origin-left bg-black/25"
          />

          {/* link columns with vertical hairlines (y361) */}
          {[0, 1, 2].map((c) => (
            <div
              aria-hidden
              key={`line-${c}`}
              className="absolute top-[25.0694cqw] z-10 h-[10.1389cqw] w-px bg-black/25"
              style={{ left: `${[4.8611, 18.9931, 33.1597][c]}cqw` }}
            />
          ))}
          {data.columns.map((links, c) => (
            <motion.nav
              key={c}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + c * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-[25.1042cqw] z-10 flex flex-col"
              style={{ left: `${[6.2847, 20.4167, 34.5833][c]}cqw` }}
            >
              {links.map((l, r) => (
                <a
                  key={l + r}
                  href={footerHref(l)}
                  className="whitespace-nowrap font-display text-[1.2902cqw] font-medium leading-[2.1528cqw] tracking-[-0.0348em] text-white transition-opacity hover:opacity-70"
                >
                  {l}
                </a>
              ))}
            </motion.nav>
          ))}

          {/* circular VIEW ALL SERVICES badge (x755) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[52.4306cqw] top-[25.7431cqw] z-10 w-[7.8604cqw]"
          >
            <Image src={assets.footerBadge} alt="View all services" width={122} height={122} className="h-auto w-full [animation:spin360_14s_linear_infinite]" />
          </motion.div>

          {/* newsletter (x1034) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[71.8056cqw] top-[25.9722cqw] z-10"
          >
            <h3 className="text-[1.0417cqw] font-bold leading-[1.5625cqw] text-mint" style={RALEWAY}>
              {data.newsletterHeading}
            </h3>
            <div className="mt-[0.5903cqw]">
              <FigmaNewsletterForm />
            </div>
            <p className="mt-[1.0417cqw] w-[16.4583cqw] text-[0.9028cqw] leading-[1.1458cqw] text-mint" style={RALEWAY}>
              {data.newsletterNote}
            </p>
          </motion.div>

          {/* copyright (y623, centered) */}
          <p className="absolute inset-x-0 top-[43.2639cqw] z-10 text-center text-[1.1111cqw] leading-[1.1458cqw]" style={RALEWAY}>
            {data.copyright}
          </p>
        </div>

        {/* ======================= mobile (stacked) ======================= */}
        <div className="relative overflow-hidden px-5 pb-56 pt-12 md:hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-[45%] z-0 select-none whitespace-nowrap font-display text-[38vw] font-semibold uppercase leading-none text-[#8e0038] opacity-[0.51]"
          >
            Designik
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]">
            <Image src={data.backgroundImage || assets.footerField} alt="" width={1440} height={421} sizes="100vw" className="h-auto w-full" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Image src={data.logo || assets.logo} alt={data.brand} width={44} height={45} className="h-11 w-auto" />
            <span className="font-display text-3xl font-semibold uppercase">{data.brand}</span>
          </div>
          <h2 className="relative z-10 mt-6 font-display uppercase leading-[1.15]">
            <span className="block text-[26px] font-normal">{data.heading.split("\n")[0]}</span>
            <span className="block text-[21px] font-medium">{data.heading.split("\n")[1] || ""}</span>
          </h2>
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-6 border-t border-black/25 pt-8">
            {data.columns.map((links, i) => (
              <nav key={i} className="flex flex-col gap-2">
                {links.map((l) => (
                  <a key={l} href={footerHref(l)} className="font-display text-[15px] font-medium text-white/90">
                    {l}
                  </a>
                ))}
              </nav>
            ))}
          </div>
          <div className="relative z-10 mt-10">
            <h3 className="text-[14px] font-bold text-mint" style={RALEWAY}>
              {data.newsletterHeading}
            </h3>
            <div className="mt-3">
              <FigmaNewsletterForm />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-mint" style={RALEWAY}>
              {data.newsletterNote}
            </p>
          </div>
          <p className="relative z-10 mt-12 text-center text-[13px]" style={RALEWAY}>
            {data.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
