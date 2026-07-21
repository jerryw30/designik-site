"use client";

import { cn } from "@/lib/utils";

function Arrow({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Figma-exact pill CTA: h55, 34.22 left pad, 12px gap, Oswald 18.62, 34.22 circle */
export function PillButton({
  children,
  href = "#contact",
  variant = "wine",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "wine" | "white" | "outline";
  className?: string;
}) {
  const base =
    "group inline-flex h-[55px] items-center gap-[12px] whitespace-nowrap rounded-full pl-[34px] pr-[15px] font-display text-[18.616px] font-semibold uppercase leading-none transition-transform duration-300 hover:scale-[1.04] active:scale-95";
  const styles = {
    wine: "bg-wine-500 text-white",
    white: "bg-white text-wine-500 shadow-md",
    outline: "border border-wine-500 text-wine-500",
  }[variant];
  const dot = {
    wine: "bg-blush-300 text-wine-500",
    white: "bg-wine-500 text-white",
    outline: "bg-wine-500 text-white",
  }[variant];

  return (
    <a href={href} className={cn(base, styles, className)}>
      {children}
      <span className={cn("flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45", dot)}>
        <Arrow />
      </span>
    </a>
  );
}

/** Round icon button with arrow (used in list rows / cards) */
export function ArrowCircle({
  className,
  tone = "wine",
}: {
  className?: string;
  tone?: "wine" | "white";
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45",
        tone === "wine" ? "bg-wine-500 text-white" : "bg-white text-wine-500",
        className
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
