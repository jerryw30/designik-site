import { cn } from "@/lib/utils";

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
  duration = 26,
}: {
  className?: string;
  duration?: number;
}) {
  const unit = (
    <div className="flex items-center gap-8 pr-8 md:gap-12 md:pr-12">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-8 md:gap-12">
          <span className="font-marquee font-bold uppercase leading-none tracking-[-0.02em] text-black text-[26px] md:text-[38px] lg:text-[42px] whitespace-nowrap">
            Designik Agency
          </span>
          <Swirl className="text-black" />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("w-full overflow-hidden bg-orange-brand py-3 md:py-4", className)}>
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
