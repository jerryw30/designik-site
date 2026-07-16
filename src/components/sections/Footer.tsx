import Image from "next/image";
import { assets } from "@/lib/assets";
import NewsletterForm from "@/components/ui/NewsletterForm";

const COLS: { heading?: string; links: string[] }[] = [
  { links: ["Home", "About Us", "Services", "Project", "Contact"] },
  { links: ["News", "Careers", "Blogs", "Book Consultation", "Faqs"] },
  { links: ["Contact", "Privacy Policy", "Cookie Policy"] },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden bg-wine-700 text-white">
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-16 pb-40 md:pt-20">
        {/* top: logo + heading */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Image src={assets.logo} alt="Designik" width={48} height={48} className="h-11 w-11 brightness-0 invert" />
            <span className="font-display text-3xl font-bold uppercase tracking-tight">Designik</span>
          </div>
          <h2 className="font-display text-[clamp(26px,3vw,40px)] font-medium uppercase leading-[0.95] md:text-right">
            We Drive Your
            <br />
            Brand to New Height
          </h2>
        </div>

        {/* columns + newsletter */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          {COLS.map((col, i) => (
            <nav key={i} className="flex flex-col gap-3">
              {col.links.map((l) => (
                <a key={l} href="#" className="text-[14px] font-light text-white/75 transition-colors hover:text-white">
                  {l}
                </a>
              ))}
            </nav>
          ))}

          {/* badge */}
          <div className="hidden items-start justify-center md:flex">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20">
              <Image src={assets.logo} alt="" width={36} height={36} className="h-9 w-9 brightness-0 invert" />
            </div>
          </div>

          {/* newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-[15px] font-semibold uppercase tracking-wide">Subscribe to our newsletter</h3>
            <NewsletterForm />
            <p className="mt-3 text-[11px] font-light leading-relaxed text-white/55">
              By subscribing you agree to our privacy policy and it&rsquo;s terms.
            </p>
          </div>
        </div>

        <p className="mt-14 text-center text-[13px] font-light text-white/60">@ 2026, All rights reserved.</p>
      </div>

      {/* desert scene */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] w-full opacity-70">
        <Image src={assets.desert} alt="" fill className="object-cover object-bottom" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-wine-700/40 to-wine-700" />
      </div>
    </footer>
  );
}
