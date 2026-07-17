"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { assets } from "@/lib/assets";
import { PillButton } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { sectionContent } from "@/cms/section-defaults";

export default function Interactive({ content }: { content?: unknown } = {}) {
  const data = sectionContent("interactive",content);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section ref={ref} className="relative min-h-[560px] w-full overflow-hidden bg-wine-700" style={{height:`${data.heightVh}vh`}}>
      <motion.div style={{ y:data.parallax ? y : 0 }} className="absolute inset-0 scale-110">
        <Image src={data.backgroundImage || assets.interactiveScene} alt="" fill priority={false} sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-wine-800/70 to-transparent" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-[12vh] text-center">
        <Reveal>
          <h2 className="font-display text-[clamp(32px,5vw,56px)] font-medium uppercase leading-[0.95] text-white">
            {data.heading}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-6">
          <PillButton href={data.buttonLink} variant="white">
            {data.buttonLabel}
          </PillButton>
        </Reveal>
      </div>
    </section>
  );
}
