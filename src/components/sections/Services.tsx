"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import PendulumSwing from "@/components/ui/PendulumSwing";
import { sectionContent } from "@/cms/section-defaults";

function Lines({ text }: { text: string }) {
  return text.split("\n").map((line) => <span className="block" key={line}>{line}</span>);
}

export default function Services({ content }: { content?: unknown } = {}) {
  const data = sectionContent("services", content);

  return (
    <section id="services" className="relative bg-white">
      <div className="relative mx-auto hidden h-[827px] w-[1300px] min-[1200px]:block">
        <article className="group absolute left-[1px] top-[100px] h-[279px] w-[525px] overflow-hidden rounded-[21px] bg-[#fff3e9] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <Image src="/api/static/figma/6847051-fca9-d03-f2175253-ef-grid17.png" alt="" fill className="z-0 object-cover object-bottom opacity-60" sizes="525px" />
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

        <article className="group absolute left-[546px] top-[100px] h-[339.604px] w-[287.202px] overflow-hidden rounded-[20px] bg-wine-500 transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <Image src="/api/static/figma/rectangle39529.png" alt="" fill className="mix-blend-multiply object-cover" sizes="288px" />
          <h3 className="absolute inset-x-0 top-[29px] z-10 text-center font-display text-[31.867px] font-medium uppercase leading-[37.502px] text-white">
            <Lines text={data.cards.digital.title} />
          </h3>
          <div className="absolute left-[-32px] top-[115px] z-10 h-[250px] w-[287px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]">
            <Image src={data.cards.digital.image || assets.digitalMarketing} alt="Digital marketing" fill className="object-contain object-bottom" sizes="287px" />
          </div>
        </article>

        <h2 className="absolute left-[853.6px] top-[140px] whitespace-nowrap font-display text-[60px] uppercase leading-[74px]">
          <span className="font-normal text-black">{data.headingPrefix} </span>
          <span className="font-semibold text-wine-500">{data.headingAccent}</span>
        </h2>

        <article className="group absolute left-[854px] top-[305px] h-[135.036px] w-[309.372px] overflow-visible rounded-[20px] bg-[#ffefef] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
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

        <Image src="/api/static/figma/group1261153735.svg" alt="View all services" width={81} height={81} className="absolute left-[1219px] top-[359px] h-[80.618px] w-[80.618px] [animation:spin360_14s_linear_infinite]" />

        {/* SEO — layer-wise: wine gradient, white type, statue scene + clouds (Figma 486/536) */}
        <article className="group absolute left-[1px] top-[407px] h-[340px] w-[192px] overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#a80746_0%,#d92f71_70%)] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <span className="absolute inset-x-0 top-[30px] z-20 text-center font-display text-[10.114px] font-normal uppercase leading-[11.902px] text-white">{data.eyebrow}</span>
          <h3 className="absolute inset-x-0 top-[48px] z-20 text-center font-display text-[63.868px] font-medium uppercase leading-[75.162px] text-white">{data.cards.seo.title}</h3>
          <div className="absolute inset-x-0 bottom-0 z-10 h-[227px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]">
            <Image src={data.cards.seo.image || assets.seo} alt="SEO" fill className="object-cover object-bottom" sizes="192px" />
            <Image src="/api/static/figma/svc-cloud.png" alt="" width={68} height={34} className="absolute left-[5px] top-[11px] h-[34px] w-[68px]" />
            <Image src="/api/static/figma/svc-cloud.png" alt="" width={68} height={34} className="absolute left-[115px] top-[5px] h-[34px] w-[68px]" />
          </div>
        </article>

        {/* Website development — layer-wise: cream + grid, title top, laptop scene flush bottom (Figma 538) */}
        <article className="group absolute left-[216px] top-[407px] h-[340px] w-[269px] overflow-hidden rounded-[20px] bg-[#fff3e9] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <Image src="/api/static/figma/6847051-fca9-d03-f2175253-ef-grid17.png" alt="" fill className="z-0 object-cover object-bottom opacity-60" sizes="269px" />
          <span className="absolute inset-x-0 top-[25px] z-20 text-center font-display text-[13.363px] font-normal uppercase leading-[15.726px] text-wine-500">{data.eyebrow}</span>
          <h3 className="absolute inset-x-0 top-[48px] z-20 text-center font-display text-[29.694px] font-medium uppercase leading-[34.945px] text-black">
            <Lines text={data.cards.website.title} />
          </h3>
          <div className="absolute inset-x-0 bottom-0 z-10 h-[269px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]">
            <Image src={data.cards.website.image} alt="Website development" fill className="object-contain object-bottom" sizes="269px" />
          </div>
        </article>

        <article className="group absolute left-[498px] top-[467.821px] h-[279.141px] w-[802.151px] overflow-hidden rounded-[20px] bg-[linear-gradient(176.398deg,#a10140_10.085%,#db2f73_137.48%)] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.15)]">
          <span className="absolute left-[48px] top-[33px] z-10 font-display text-[15.319px] font-normal uppercase leading-[18.027px] text-white">{data.eyebrow}</span>
          <h3 className="absolute left-[48px] top-[66px] z-10 font-display text-[34.649px] font-medium uppercase leading-[40.776px] text-white">
            <Lines text={data.cards.brand.title} />
          </h3>
          <Image src={data.cards.brand.image || assets.brandIdentity} alt="" width={767} height={129} className="absolute bottom-0 left-[35px] h-[129px] w-[767px] max-w-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.018]" />
          <PendulumSwing className="absolute left-[240px] top-[-12px] h-[360px] w-[360px]" duration={4.8} angle={2.8}>
            <Image src={assets.hangingTag} alt="" width={360} height={360} className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-[3px]" />
          </PendulumSwing>
        </article>

        <PendulumSwing className="pointer-events-none absolute left-[984px] top-[-10px] z-20 h-[306px] w-[304px]">
          <Image src={assets.hangingTag} alt="" width={304} height={306} className="h-full w-full" />
        </PendulumSwing>
      </div>

      {/* ---------- mobile / tablet layout (per-card compositions) ---------- */}
      <div className="grid gap-4 px-5 py-12 min-[1200px]:hidden sm:grid-cols-2">
        {/* Product Design — full scene fills the card */}
        <article className="group relative min-h-[320px] overflow-hidden rounded-[20px] bg-cream-100 shadow-sm sm:col-span-2">
          <Image src="/api/static/figma/6847051-fca9-d03-f2175253-ef-grid17.png" alt="" fill className="object-cover object-bottom opacity-60" sizes="100vw" />
          <Image src={data.cards.product.image || assets.productDesign} alt="Product design" fill className="object-cover object-bottom" sizes="100vw" />
          <div className="relative z-10 p-6">
            <span className="font-display text-xs uppercase tracking-wide text-wine-500">{data.eyebrow}</span>
            <h3 className="mt-2 font-display text-[28px] font-medium uppercase leading-tight text-black"><Lines text={data.cards.product.title} /></h3>
          </div>
        </article>

        {/* Digital Marketing — wine, image anchored bottom */}
        <article className="group relative min-h-[320px] overflow-hidden rounded-[20px] bg-wine-500 text-white shadow-sm">
          <Image src="/api/static/figma/rectangle39529.png" alt="" fill className="object-cover mix-blend-multiply" sizes="50vw" />
          <h3 className="relative z-10 px-6 pt-7 text-center font-display text-[26px] font-medium uppercase leading-tight"><Lines text={data.cards.digital.title} /></h3>
          <Image src={data.cards.digital.image || assets.digitalMarketing} alt="" width={287} height={250} className="absolute left-[39%] top-[64%] h-[90%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain object-center" />
        </article>

        {/* SEO — wine gradient, white type, statue scene flush bottom (aspect-locked, no crop) */}
        <article className="group relative overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#a80746_0%,#d92f71_70%)] shadow-sm">
          <span className="relative z-20 block pt-7 text-center font-display text-xs font-normal uppercase text-white">{data.eyebrow}</span>
          <h3 className="relative z-20 mt-1 px-6 text-center font-display text-[56px] font-medium uppercase leading-tight text-white">{data.cards.seo.title}</h3>
          <div className="relative mt-3 aspect-[192/227] w-full">
            <Image src={data.cards.seo.image || assets.seo} alt="SEO" fill className="object-cover object-bottom" sizes="100vw" />
            <Image src="/api/static/figma/svc-cloud.png" alt="" width={110} height={55} className="absolute left-[3%] top-[5%] w-[35%]" />
            <Image src="/api/static/figma/svc-cloud.png" alt="" width={110} height={55} className="absolute right-[2%] top-[2%] w-[35%]" />
          </div>
        </article>

        {/* Mobile App — hand overflowing from the bottom-right */}
        <article className="group relative min-h-[320px] overflow-hidden rounded-[20px] bg-blush-100 shadow-sm">
          <h3 className="relative z-10 p-6 font-display text-[26px] font-medium uppercase leading-tight text-black"><Lines text={data.cards.mobile.title} /></h3>
          <Image src={data.cards.mobile.image || assets.mobileAppHand} alt="" width={257} height={254} className="absolute bottom-[-4%] left-[31%] h-[120%] w-auto max-w-none -translate-x-[33%] translate-y-[17%] object-contain object-left-bottom" />
        </article>

        {/* Website Development — cream + grid, title top, laptop scene flush bottom (aspect-locked) */}
        <article className="group relative overflow-hidden rounded-[20px] bg-[#fff3e9] shadow-sm">
          <Image src="/api/static/figma/6847051-fca9-d03-f2175253-ef-grid17.png" alt="" fill className="z-0 object-cover object-bottom opacity-60" sizes="100vw" />
          <span className="relative z-20 block pt-7 text-center font-display text-xs font-normal uppercase text-wine-500">{data.eyebrow}</span>
          <h3 className="relative z-20 mt-1 px-6 text-center font-display text-[30px] font-medium uppercase leading-tight text-black"><Lines text={data.cards.website.title} /></h3>
          <div className="relative z-10 -mt-2 aspect-square w-full">
            <Image src={data.cards.website.image} alt="Website development" fill className="object-contain object-bottom" sizes="100vw" />
          </div>
        </article>

        {/* Brand Identity — wine gradient, hanging tag + big brand strip like desktop */}
        <article className="group relative min-h-[300px] overflow-hidden rounded-[20px] text-white shadow-sm sm:col-span-2" style={{ backgroundImage: "linear-gradient(176.4deg,#a10140 10%,#db2f73 137%)" }}>
          <div className="relative z-10 p-6">
            <span className="font-display text-xs uppercase tracking-wide">{data.eyebrow}</span>
            <h3 className="mt-2 font-display text-[28px] font-medium uppercase leading-tight"><Lines text={data.cards.brand.title} /></h3>
          </div>
          {/* strip height matches desktop's proportion (129/279 of card height) so the packets read the same size */}
          <Image src={data.cards.brand.image || assets.brandIdentity} alt="" width={767} height={129} className="pointer-events-none absolute inset-x-0 bottom-0 h-[130px] w-full max-w-none object-cover object-center sm:object-contain" />
          <PendulumSwing className="pointer-events-none absolute left-[25%] top-[-10px] h-[230px] w-[230px]" duration={4.8} angle={2.8}>
            <Image src={assets.hangingTag} alt="" width={230} height={230} className="h-full w-full" />
          </PendulumSwing>
        </article>
      </div>
    </section>
  );
}
