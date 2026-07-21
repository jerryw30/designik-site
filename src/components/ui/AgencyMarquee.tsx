import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

/**
 * Figma marquee spec (node 221:1229): Akshar Bold 43.968px, leading 39.571
 * (0.9), tracking -0.02em, black on #f16f04, 91px strip. Separator is the
 * Designik logo mark (24.34 x 24.69), tinted via mask so it follows textColor.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-[13.7px] w-[13.5px] shrink-0 md:h-[24.7px] md:w-[24.34px]", className)}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/figma/marquee-logo.svg)",
        maskImage: "url(/figma/marquee-logo.svg)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
      }}
    />
  );
}

export default function AgencyMarquee({
  className,
  duration,
  content,
  figmaGray = false,
}: {
  className?: string;
  duration?: number;
  content?: unknown;
  figmaGray?: boolean;
}) {
  const data = sectionContent("agency-marquee", content);
  duration ??= data.duration;
  const unit = (
    <div className="flex items-center gap-[11.6px] pr-[11.6px] md:gap-[19.6px] md:pr-[19.6px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-[11.6px] md:gap-[19.6px]">
          <span className="marquee-editable-text font-marquee font-bold uppercase leading-[0.9] tracking-[-0.02em] whitespace-nowrap" style={{ ["--marquee-mobile" as string]:`${data.fontSizeMobile}px`, ["--marquee-desktop" as string]:"43.968px" }}>
            {data.text}
          </span>
          <LogoMark />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full items-center overflow-hidden py-3 md:h-[91px] md:py-0",
        className
      )}
      style={{ backgroundColor: figmaGray ? "#d9d9d9" : data.backgroundColor, color: data.textColor }}
    >
      <div
        className="flex w-max animate-marquee will-change-transform"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {unit}
        {unit}
      </div>
    </div>
  );
}
