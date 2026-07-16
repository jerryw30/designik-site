"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { RevealGroup, RevealItem, Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

function Eyebrow({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-display text-[10px] font-medium uppercase tracking-[0.2em]",
        dark ? "bg-white/15 text-white" : "bg-wine-500/10 text-wine-500"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Creative agency
    </span>
  );
}

const card = "group relative overflow-hidden rounded-[20px] p-6 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]";

export default function Services() {
  return (
    <section id="services" className="relative bg-white px-5 py-16 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {/* Product Design (wide, tall) */}
          <RevealItem className="md:col-span-5">
            <article className={cn(card, "h-full min-h-[360px] bg-cream-100")}>
              <Eyebrow />
              <h3 className="mt-4 font-display text-[34px] font-medium uppercase leading-[0.95] text-ink">
                Product Design
                <br />
                Excellence
              </h3>
              <div className="pointer-events-none absolute inset-x-3 bottom-3 h-[210px]">
                <Image src={assets.productDesign} alt="Product design" fill className="object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width:768px) 100vw, 460px" />
              </div>
            </article>
          </RevealItem>

          {/* Digital Marketing (tall) */}
          <RevealItem className="md:col-span-3">
            <article className={cn(card, "h-full min-h-[360px] bg-gradient-to-br from-wine-500 to-wine-400")}>
              <h3 className="font-display text-[26px] font-semibold uppercase leading-[0.95] text-white">
                Digital
                <br />
                marketing
              </h3>
              <div className="pointer-events-none absolute inset-x-2 bottom-2 top-[90px]">
                <Image src={assets.digitalMarketing} alt="Digital marketing" fill className="object-contain transition-transform duration-500 group-hover:scale-105" sizes="320px" />
              </div>
            </article>
          </RevealItem>

          {/* Right column: heading + mobile app */}
          <div className="flex flex-col gap-4 md:col-span-4 md:gap-5">
            <Reveal direction="left" className="flex items-start justify-end pt-1">
              <h2 className="text-right font-display text-[clamp(40px,5vw,64px)] font-medium uppercase leading-[0.9]">
                <span className="text-ink">Our </span>
                <span className="text-wine-500">Services</span>
              </h2>
            </Reveal>
            <RevealItem className="flex-1">
              <article className={cn(card, "flex h-full min-h-[210px] items-center justify-between bg-blush-100")}>
                <h3 className="font-display text-[22px] font-medium uppercase leading-[0.95] text-ink">
                  Mobile app
                  <br />
                  Development
                </h3>
                <div className="relative h-[180px] w-[130px] shrink-0">
                  <Image src={assets.mobileAppHand} alt="Mobile app development" fill className="object-contain object-right transition-transform duration-500 group-hover:-translate-y-1" sizes="150px" />
                </div>
              </article>
            </RevealItem>
          </div>

          {/* SEO */}
          <RevealItem className="md:col-span-3">
            <article className={cn(card, "flex h-full min-h-[250px] flex-col bg-blush-200")}>
              <Eyebrow />
              <div className="pointer-events-none relative mt-2 flex-1">
                <Image src={assets.seo} alt="SEO" fill className="object-contain transition-transform duration-500 group-hover:scale-105" sizes="300px" />
              </div>
            </article>
          </RevealItem>

          {/* Website Development */}
          <RevealItem className="md:col-span-4">
            <article className={cn(card, "flex h-full min-h-[250px] flex-col items-center justify-between bg-blush-100 text-center")}>
              <Eyebrow />
              <div className="flex items-center gap-4">
                {[assets.iconWebDev, assets.iconCustom, assets.iconSend].map((src, i) => (
                  <div key={i} className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1">
                    <Image src={src} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                  </div>
                ))}
              </div>
              <h3 className="font-display text-[24px] font-medium uppercase leading-[0.95] text-ink">
                Website
                <br />
                Development
              </h3>
            </article>
          </RevealItem>

          {/* Brand Identity (wide) */}
          <RevealItem className="md:col-span-5">
            <article className={cn(card, "h-full min-h-[250px] bg-gradient-to-br from-wine-600 to-pink-brand")}>
              <Eyebrow dark />
              <h3 className="mt-3 font-display text-[30px] font-semibold uppercase leading-[0.95] text-white">
                Brand identity
                <br />
                And design
              </h3>
              <div className="pointer-events-none absolute bottom-0 right-0 h-[170px] w-[62%]">
                <Image src={assets.brandIdentity} alt="Brand identity and design" fill className="object-contain object-bottom transition-transform duration-500 group-hover:scale-105" sizes="360px" />
              </div>
            </article>
          </RevealItem>
        </RevealGroup>
      </div>

      {/* hanging discover tag near the heading */}
      <motion.div
        initial={{ rotate: -10, y: -12, opacity: 0 }}
        whileInView={{ rotate: -4, y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 70, damping: 9 }}
        className="pointer-events-none absolute right-[20%] top-[22%] z-20 hidden h-36 w-24 md:block"
      >
        <Image src={assets.hangingTag} alt="" fill className="object-contain object-top" sizes="110px" />
      </motion.div>
    </section>
  );
}
