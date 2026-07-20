"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

/**
 * Pixel-exact port of the Figma testimonials section ("Meet Our team" #2,
 * 1440 canvas, 1cqw = 14.4px). Two rows of cards at exact positions:
 *   row 1: cream 595 | wine 301 | phone 244 (+ faint texture wash)
 *   row 2: orange 301 | traffic light 244 | cream 595
 * Hover lift/shadow is a site addition (not in Figma).
 */

const HOVER = { y: -8 };
const CARD_HOVER_CLASS =
  "transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(83,8,35,0.18)]";

function Stars({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-[0.3281cqw] text-[#FB8C3A]", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-[0.9836cqw] w-[0.9836cqw]" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

type QuoteData = { quote: string; author: string; role: string; rating: string };

/** Big cream card — 595x294, glass inner frame, text at exact offsets */
function CreamCard({ data, className }: { data: QuoteData; className?: string }) {
  return (
    <motion.article
      whileHover={HOVER}
      className={cn("absolute h-[20.4167cqw] w-[41.3194cqw] rounded-[1.1111cqw] bg-cream-100", CARD_HOVER_CLASS, className)}
    >
      <div
        aria-hidden
        className="absolute left-[0.7639cqw] top-[0.6944cqw] h-[19.0278cqw] w-[39.7917cqw] rounded-[1.1111cqw] bg-[rgba(255,243,233,0.2)] shadow-[0_0_4px_rgba(0,0,0,0.39)]"
      />
      <p className="absolute left-[2.0139cqw] top-[2.2222cqw] w-[35.2778cqw] text-[1.25cqw] leading-[1.8611cqw] text-black">
        {data.quote}
      </p>
      <h4 className="absolute left-[1.7361cqw] top-[14.375cqw] font-display text-[1.3145cqw] font-semibold uppercase leading-[1.5469cqw] text-black">
        {data.author}
      </h4>
      <p className="absolute left-[1.8056cqw] top-[16.4583cqw] font-display text-[0.9722cqw] font-normal capitalize leading-[1.5469cqw] text-black">
        {data.role}
      </p>
      <Stars className="absolute left-[33.0556cqw] top-[14.4444cqw]" />
      <p className="absolute left-[34.0972cqw] top-[16.3194cqw] font-display text-[0.9722cqw] font-normal capitalize leading-[1.5469cqw] text-black">
        {data.rating}
      </p>
    </motion.article>
  );
}

/** Small quote card — 301x294 (wine flat / orange with texture + glass) */
function SmallQuoteCard({
  data,
  tone,
  className,
}: {
  data: QuoteData;
  tone: "wine" | "orange";
  className?: string;
}) {
  return (
    <motion.article
      whileHover={HOVER}
      className={cn(
        "absolute h-[20.4167cqw] w-[20.9028cqw] overflow-hidden rounded-[1.1111cqw]",
        tone === "wine" ? "bg-wine-400" : "bg-orange-brand",
        CARD_HOVER_CLASS,
        className
      )}
    >
      {tone === "orange" && (
        <>
          <Image
            src={assets.testiTexture}
            alt=""
            fill
            sizes="310px"
            className="rounded-[1.1111cqw] object-cover opacity-[0.38] [mix-blend-mode:overlay]"
          />
          <div
            aria-hidden
            className="absolute left-[0.6944cqw] top-[0.6806cqw] h-[19.0601cqw] w-[19.5139cqw] rounded-[1.0373cqw] bg-white/20 shadow-[0_0_5px_rgba(0,0,0,0.42)]"
          />
        </>
      )}
      <p className="absolute left-[2.0833cqw] top-[1.875cqw] w-[16.7361cqw] text-[1.25cqw] leading-[1.8611cqw] text-white">
        {data.quote.split(" ").slice(0, 13).join(" ")}
      </p>
      <h4 className="absolute left-[2.0833cqw] top-[15cqw] font-display text-[1.3145cqw] font-semibold uppercase leading-[1.5469cqw] text-white">
        {data.author}
      </h4>
      <p className="absolute left-[2.1528cqw] top-[17.0833cqw] font-display text-[0.9722cqw] font-normal capitalize leading-[1.5469cqw] text-white">
        {data.role}
      </p>
      <Stars className={cn("absolute top-[15.3472cqw]", tone === "wine" ? "left-[10.3472cqw]" : "left-[12.4306cqw]")} />
    </motion.article>
  );
}

/** Blush image card — 244x294 with logo watermark + photo (phone / traffic light) */
function ImageTile({
  variant,
  className,
}: {
  variant: "phone" | "traffic";
  className?: string;
}) {
  const isPhone = variant === "phone";
  return (
    <motion.article
      whileHover={HOVER}
      className={cn("absolute h-[20.4167cqw] w-[16.9444cqw] rounded-[1.1111cqw] bg-blush-200", CARD_HOVER_CLASS, className)}
    >
      {/* logo watermark */}
      <span
        aria-hidden
        className={cn(
          "absolute top-[2.8472cqw] aspect-[209.6/212.64] w-[14.5556cqw]",
          isPhone ? "left-[1.1806cqw]" : "left-[1.25cqw]"
        )}
        style={{
          backgroundColor: "#EBDDDD",
          WebkitMaskImage: `url(${assets.testiWatermark})`,
          maskImage: `url(${assets.testiWatermark})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      />
      {isPhone ? (
        <div className="absolute left-[1.7361cqw] top-[1.1111cqw] h-[19.3056cqw] w-[15.2083cqw] overflow-hidden rounded-[1.0417cqw] shadow-[-5px_-1px_11px_rgba(0,0,0,0.1),-20px_-5px_21px_rgba(0,0,0,0.09)]">
          <Image
            src={assets.testiPhoneRaw}
            alt="Designik mobile app"
            width={804}
            height={1010}
            sizes="240px"
            className="absolute left-0 top-[-0.12%] h-[101.67%] w-[102.74%] max-w-none object-cover"
          />
        </div>
      ) : (
        <div className="absolute left-[1.3889cqw] top-[1.1111cqw] h-[19.3056cqw] w-[14.8611cqw] overflow-hidden shadow-[-2px_1px_6px_rgba(0,0,0,0.1),-10px_2px_10px_rgba(0,0,0,0.09)]">
          <Image
            src={assets.testiTrafficRaw}
            alt="Social traffic light"
            width={1472}
            height={1472}
            sizes="240px"
            className="absolute left-[-42.99%] top-[-43.17%] h-[143.17%] w-[185.98%] max-w-none object-cover"
          />
        </div>
      )}
    </motion.article>
  );
}

export default function Testimonials({ content }: { content?: unknown } = {}) {
  const data = sectionContent("testimonials", content);
  const q: QuoteData = { quote: data.quote, author: data.author, role: data.role, rating: data.rating };

  return (
    <section className="relative bg-white">
      <div className="@container relative mx-auto max-w-[1440px] pb-[6.3194cqw] pt-[9.4444cqw]">
        {/* hanging Designik tag (Figma: 198px box at x584, overlapping the marquee above) */}
        <motion.div
          initial={{ rotate: -8, y: -10, opacity: 0 }}
          whileInView={{ rotate: 0, y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 70, damping: 9 }}
          className="pointer-events-none absolute left-[32.2487cqw] top-[-0.6739cqw] z-20 hidden w-[22.7143cqw] md:block"
        >
          <Image src={assets.testiTag} alt="" width={324} height={315} className="h-auto w-full" sizes="230px" />
        </motion.div>

        {/* header: heading left (x116), description right (x788) */}
        <Reveal className="relative z-10">
          <h2 className="ml-[8.0556cqw] font-display uppercase text-[8vw] leading-[1.18] md:text-[5.3494cqw] md:leading-[6.2953cqw]">
            <span className="font-semibold text-wine-500">{data.headingAccent} </span>
            <span className="font-normal text-black">{data.heading}</span>
          </h2>
          <p className="ml-[8.0556cqw] mt-3 max-w-[46ch] text-[13px] leading-relaxed text-black md:hidden">
            {data.description}
          </p>
          <p className="absolute left-[54.7222cqw] top-[0.7639cqw] hidden w-[37.5cqw] text-[1.1111cqw] leading-[1.5799cqw] text-black md:block">
            {data.description}
          </p>
        </Reveal>

        {/* exact two-row card mosaic (desktop) */}
        <div className="relative z-10 mt-[5.2778cqw] hidden h-[43.4028cqw] md:block">
          {/* row 1 */}
          <CreamCard data={q} className="left-[7.9167cqw] top-0" />
          <SmallQuoteCard data={q} tone="wine" className="left-[51.25cqw] top-0" />
          {/* faint texture wash behind the phone tile (Figma: 301-wide multiply 38%) */}
          <div
            aria-hidden
            className="absolute left-[72.1528cqw] top-0 h-[20.4167cqw] w-[20.9028cqw] overflow-hidden rounded-[1.1111cqw] opacity-[0.38] [mix-blend-mode:multiply]"
          >
            <Image src={assets.testiTexture} alt="" fill sizes="310px" className="object-cover" />
          </div>
          <ImageTile variant="phone" className="left-[73.8194cqw] top-0" />

          {/* row 2 */}
          <SmallQuoteCard data={q} tone="orange" className="left-[7.9167cqw] top-[22.9861cqw]" />
          <ImageTile variant="traffic" className="left-[30.4167cqw] top-[22.9861cqw]" />
          <CreamCard data={q} className="left-[49.4444cqw] top-[22.9861cqw]" />
        </div>

        {/* mobile stack */}
        <div className="mt-8 flex flex-col gap-4 px-5 md:hidden">
          {(["cream", "wine", "orange"] as const).map((tone, i) => (
            <article
              key={i}
              className={cn(
                "rounded-2xl p-6",
                tone === "cream" ? "bg-cream-100 text-black" : tone === "wine" ? "bg-wine-400 text-white" : "bg-orange-brand text-white"
              )}
            >
              <p className="text-[14px] leading-relaxed">{data.quote}</p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <h4 className="font-display text-[16px] font-semibold uppercase">{data.author}</h4>
                  <p className="font-display text-[12px] capitalize opacity-80">{data.role}</p>
                </div>
                <div className="flex gap-1 text-[#FB8C3A]">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
