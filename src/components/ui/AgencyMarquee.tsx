import { cn } from "@/lib/utils";
import { sectionContent } from "@/cms/section-defaults";

function Swirl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-[26px] w-[26px] shrink-0", className)} fill="none" aria-hidden>
      <path
        d="M28 11c-5-3-12-2-15 3-2 4-1 9 3 11 3 1.6 7 1 9-2"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M26 6l5 5-6 4" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <div className="flex items-center gap-8 pr-8 md:gap-12 md:pr-12">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-8 md:gap-12">
          <span className="marquee-editable-text font-marquee font-bold uppercase leading-[0.9] tracking-[-0.02em] whitespace-nowrap" style={{ ["--marquee-mobile" as string]:`${data.fontSizeMobile}px`, ["--marquee-desktop" as string]:`${figmaGray ? 43.968 : data.fontSizeDesktop}px` }}>
            {data.text}
          </span>
          <Swirl />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full items-center overflow-hidden py-3 md:py-4",
        figmaGray && "md:h-[100.959px] md:py-0",
        className
      )}
      style={{ backgroundColor: figmaGray ? "#d9d9d9" : data.backgroundColor, color:data.textColor }}
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
