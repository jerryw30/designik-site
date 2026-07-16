"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { PillButton } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";

export default function AboutIntro() {
  return (
    <section id="about" className="relative overflow-hidden bg-white">
      {/* red mountains rising behind the heading */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0">
        <Image
          src={assets.aboutMountains}
          alt=""
          width={1488}
          height={1057}
          sizes="100vw"
          className="h-auto w-full select-none"
          priority={false}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[820px] px-6 pt-16 pb-[26vw] text-center md:pt-20 md:pb-[20vw]">
        <Reveal>
          <span className="font-display text-[13px] font-semibold uppercase tracking-[0.25em] text-wine-500">
            About Us
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-3 font-display font-medium uppercase leading-[0.95] tracking-tight text-[clamp(40px,6.5vw,68px)]">
            <span className="text-wine-500">Designik</span>
            <span className="block text-ink">Creative Agency</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-4 max-w-[34rem] font-sans text-[15px] font-light leading-relaxed text-neutral-600">
            Designik exists to revolutionize the way brands connect and engage with their audiences in the
            digital era by leveraging innovative strategies and cutting-edge technology.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-6 flex justify-center">
            <PillButton href="#services" variant="wine">
              About Us
            </PillButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
