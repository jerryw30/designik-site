import Image from "next/image";
import { assets } from "@/lib/assets";
import NewsletterForm from "@/components/ui/NewsletterForm";
import { sectionContent } from "@/cms/section-defaults";

export default function Footer({ content }: { content?: unknown } = {}) {
  const data = sectionContent("footer", content);
  const globalStyle = (
    content as { _globalStyle?: Record<string, unknown> } | undefined
  )?._globalStyle;
  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-wine-700 text-white"
      style={
        globalStyle
          ? {
              backgroundColor:
                globalStyle.backgroundColor === "transparent"
                  ? undefined
                  : String(globalStyle.backgroundColor),
              color: String(globalStyle.textColor || "#ffffff"),
              fontFamily: String(globalStyle.fontFamily || "inherit"),
              borderWidth: Number(globalStyle.borderWidth || 0),
              borderColor: String(globalStyle.borderColor || "transparent"),
              borderRadius: Number(globalStyle.borderRadius || 0),
              boxShadow: String(globalStyle.shadow || "none"),
            }
          : undefined
      }
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-16 pb-40 md:pt-20">
        {/* top: logo + heading */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Image
              src={data.logo || assets.logo}
              alt={data.brand}
              width={48}
              height={48}
              className="h-11 w-11 brightness-0 invert"
            />
            <span className="font-display text-3xl font-bold uppercase tracking-tight">
              {data.brand}
            </span>
          </div>
          <h2 className="font-display text-[clamp(26px,3vw,40px)] font-medium uppercase leading-[0.95] md:text-right">
            {data.heading.split("\n").map((line, i) => (
              <span className="block" key={i}>
                {line}
              </span>
            ))}
          </h2>
        </div>

        {/* columns + newsletter */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-5">
          {data.columns.map((links, i) => (
            <nav key={i} className="flex flex-col gap-3">
              {links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[14px] font-light text-white/75 transition-colors hover:text-white"
                >
                  {l}
                </a>
              ))}
            </nav>
          ))}

          {/* badge */}
          <div className="hidden items-start justify-center md:flex">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20">
              <Image
                src={data.logo || assets.logo}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 brightness-0 invert"
              />
            </div>
          </div>

          {/* newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-[15px] font-semibold uppercase tracking-wide">
              {data.newsletterHeading}
            </h3>
            <NewsletterForm />
            <p className="mt-3 text-[11px] font-light leading-relaxed text-white/55">
              {data.newsletterNote}
            </p>
          </div>
        </div>

        <p className="mt-14 text-center text-[13px] font-light text-white/60">
          {data.copyright}
        </p>
      </div>

      {/* desert scene */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] w-full opacity-70">
        <Image
          src={data.backgroundImage || assets.desert}
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-wine-700/40 to-wine-700" />
      </div>
    </footer>
  );
}
