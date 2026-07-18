"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { sectionContent } from "@/cms/section-defaults";

function Lines({ text }: { text: string }) {
  return text.split("\n").map((line) => <span className="block" key={line}>{line}</span>);
}

export default function Services({ content }: { content?: unknown } = {}) {
  const data = sectionContent("services", content);

  return (
    <section id="services" className="relative bg-white">
      <div className="relative mx-auto hidden h-[827px] w-[1300px] min-[1200px]:block">
        <article className="group absolute left-[1px] top-[100px] h-[279px] w-[525px] overflow-hidden rounded-[21px] bg-[#fff3e9] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <Image src="/figma/6847051-fca9-d03-f2175253-ef-grid17.png" alt="" fill className="z-0 object-cover object-bottom opacity-60" sizes="525px" />
          <Image
            src={data.cards.product.image || assets.productDesign}
            alt="Product design"
            width={525}
            height={279}
            className="pointer-events-none absolute inset-0 z-10 h-[279px] w-[525px] max-w-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.012]"
          />
          <span className="absolute left-[30px] top-[42px] z-20 font-display text-[15.319px] font-normal uppercase leading-[18.027px] text-wine-500">{data.eyebrow}</span>
          <h3 className="absolute left-[30px] top-[75.129px] z-20 font-display text-[34.649px] font-medium uppercase leading-[40.776px] text-black">
            <Lines text={data.cards.product.title} />
          </h3>
        </article>

        <article className="group absolute left-[546px] top-[100px] h-[339.604px] w-[287.202px] overflow-hidden rounded-[20px] bg-wine-500 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <Image src="/figma/rectangle39529.png" alt="" fill className="mix-blend-multiply object-cover" sizes="288px" />
          <h3 className="absolute inset-x-0 top-[29px] z-10 text-center font-display text-[31.867px] font-medium uppercase leading-[37.502px] text-white">
            <Lines text={data.cards.digital.title} />
          </h3>
          <div className="absolute left-[-32px] top-[115px] z-10 h-[250px] w-[287px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]">
            <Image src={data.cards.digital.image || assets.digitalMarketing} alt="Digital marketing" fill className="object-contain object-bottom" sizes="287px" />
          </div>
        </article>

        <h2 className="absolute left-[853.6px] top-[131.278px] w-[439.37px] whitespace-nowrap font-display text-[77.031px] uppercase leading-[90.652px]">
          <span className="font-normal text-black">{data.headingPrefix} </span>
          <span className="font-semibold text-wine-500">{data.headingAccent}</span>
        </h2>

        <article className="group absolute left-[854px] top-[305px] h-[135.036px] w-[309.372px] overflow-visible rounded-[20px] bg-[#ffefef] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <h3 className="absolute left-[19px] top-[38px] z-10 font-display text-[24px] font-medium uppercase leading-[28px] text-black">
            <Lines text={data.cards.mobile.title} />
          </h3>
          <Image
            src={data.cards.mobile.image || assets.mobileAppHand}
            alt="Mobile app development"
            width={257}
            height={254}
            className="absolute left-[61px] top-[-70px] z-20 h-[254px] w-[257px] max-w-none object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[2px] group-hover:scale-[1.018]"
          />
        </article>

        <Image src="/figma/group1261153735.svg" alt="View all services" width={81} height={81} className="absolute left-[1219px] top-[359px] h-[80.618px] w-[80.618px]" />

        <article className="group absolute left-[1px] top-[407px] h-[178px] w-[171px] overflow-hidden rounded-[20px] bg-[#ffefef] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <h3 className="absolute inset-x-0 top-[29px] z-10 text-center font-display text-[31.867px] font-medium uppercase leading-[37.502px] text-black">{data.cards.seo.title}</h3>
          <Image src={data.cards.seo.image || assets.seo} alt="SEO" width={155} height={98} className="absolute left-[16px] top-[73px] h-[98px] w-[155px] max-w-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.018]" />
        </article>

        <article className="group absolute left-[192px] top-[407px] h-[340px] w-[287.202px] overflow-hidden rounded-[20px] bg-[#fff3e9] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <span className="absolute inset-x-0 top-[50px] text-center font-display text-[15.319px] font-normal uppercase leading-[18.027px] text-wine-500">{data.eyebrow}</span>
          <div className="absolute left-[34px] top-[127px] flex items-center gap-[9px]">
            {data.cards.website.icons.map((src, index) => (
              <span key={src} className={`flex items-center justify-center rounded-full bg-white ${index === 1 ? "h-[86px] w-[86px]" : "h-[58px] w-[58px]"}`}>
                <Image
                  src={src}
                  alt=""
                  width={32}
                  height={32}
                  className={`object-contain ${index === 0 ? "h-[22px] w-[22px]" : index === 1 ? "h-[32px] w-[32px]" : "h-[25px] w-[25px]"}`}
                />
              </span>
            ))}
          </div>
          <h3 className="absolute inset-x-0 top-[226px] text-center font-display text-[31.867px] font-medium uppercase leading-[37.502px] text-black">
            <Lines text={data.cards.website.title} />
          </h3>
        </article>

        <article className="group absolute left-[498px] top-[467.821px] h-[279.141px] w-[802.151px] overflow-hidden rounded-[20px] bg-[linear-gradient(176.398deg,#a10140_10.085%,#db2f73_137.48%)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.15)]">
          <span className="absolute left-[48px] top-[33px] z-10 font-display text-[15.319px] font-normal uppercase leading-[18.027px] text-white">{data.eyebrow}</span>
          <h3 className="absolute left-[48px] top-[66px] z-10 font-display text-[34.649px] font-medium uppercase leading-[40.776px] text-white">
            <Lines text={data.cards.brand.title} />
          </h3>
          <Image src={data.cards.brand.image || assets.brandIdentity} alt="" width={767} height={129} className="absolute bottom-0 left-[35px] h-[129px] w-[767px] max-w-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.018]" />
          <Image src={assets.hangingTag} alt="" width={360} height={360} className="absolute left-[240px] top-[-12px] h-[360px] w-[360px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-[3px] group-hover:rotate-[1deg]" />
        </article>

        <Image src={assets.hangingTag} alt="" width={304} height={306} className="pointer-events-none absolute left-[984px] top-[-10px] z-20 h-[306px] w-[304px]" />
      </div>

      <div className="grid gap-4 px-5 py-12 min-[1200px]:hidden sm:grid-cols-2">
        {[
          [data.cards.product, "bg-cream-100"],
          [data.cards.digital, "bg-wine-500 text-white"],
          [data.cards.mobile, "bg-blush-100"],
          [data.cards.seo, "bg-blush-100"],
          [data.cards.website, "bg-cream-100"],
          [data.cards.brand, "bg-wine-500 text-white"],
        ].map(([item, tone]) => {
          const card = item as { title: string; image?: string };
          return (
            <article key={card.title} className={`group relative min-h-[280px] overflow-hidden rounded-[20px] p-6 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] ${tone}`}>
              <span className="font-display text-xs uppercase text-wine-500">{data.eyebrow}</span>
              <h3 className="relative z-10 mt-3 font-display text-3xl font-medium uppercase leading-tight"><Lines text={card.title} /></h3>
              {card.image && <Image src={card.image} alt="" fill className="object-contain object-bottom pt-20 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.018]" sizes="50vw" />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
