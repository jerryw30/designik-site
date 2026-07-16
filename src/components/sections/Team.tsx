"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { PillButton } from "@/components/ui/Buttons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

const MEMBERS = [
  { name: "Michel Brown", role: "Social Media Manager", photo: assets.teamA, bg: "bg-wine-700" },
  { name: "Michel Brown", role: "Social Media Manager", photo: assets.teamB, bg: "bg-[#b89cf0]" },
  { name: "Michel Brown", role: "Social Media Manager", photo: assets.teamA, bg: "bg-orange-brand" },
  { name: "Michel Brown", role: "Social Media Manager", photo: assets.teamB, bg: "bg-redorange" },
];

export default function Team() {
  return (
    <section className="bg-white px-5 py-16 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(34px,5.5vw,58px)] font-medium uppercase leading-[0.95]">
            <span className="text-wine-500">Meet</span> <span className="text-ink">Our Team</span>
          </h2>
          <p className="max-w-[36ch] text-[14px] font-light leading-relaxed text-neutral-600">
            Designik exists to revolutionize the way brands connect and engage with their audiences in the
            digital era by leveraging innovative strategies and cutting-edge technology.
          </p>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5" stagger={0.1}>
          {MEMBERS.map((m, i) => (
            <RevealItem key={i}>
              <motion.article
                whileHover={{ y: -6 }}
                className={`group relative aspect-[3/4] overflow-hidden rounded-[20px] ${m.bg}`}
              >
                <Image
                  src={m.photo}
                  alt={m.name}
                  fill
                  className="object-cover object-top mix-blend-luminosity opacity-95 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width:768px) 50vw, 300px"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <div>
                    <h3 className="font-display text-[16px] font-bold uppercase leading-tight text-white">{m.name}</h3>
                    <p className="text-[11px] font-light text-white/80">{m.role}</p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-wine-500 transition-transform duration-300 group-hover:rotate-45">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </motion.article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 flex justify-center">
          <PillButton href="#contact" variant="wine">
            View All
          </PillButton>
        </Reveal>
      </div>
    </section>
  );
}
