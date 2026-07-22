"use client";

import { useEffect, useState } from "react";
import type { GlobalDesign } from "@/cms/design-resources";

const DAY_MS = 86_400_000;

export default function GlobalPopup({
  design,
}: {
  design?: GlobalDesign | null;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!design) return;
    const content = design.content;
    // Respect the responsive visibility toggles: don't trigger (or mark as
    // seen) on a device size the popup is disabled for.
    const width = window.innerWidth;
    const deviceVisible =
      width < 640
        ? design.style.mobileVisible
        : width < 1024
          ? design.style.tabletVisible
          : design.style.desktopVisible;
    if (!deviceVisible) return;
    const frequency = String(content.frequency || "session");
    const key = "designik-popup-seen";
    const store =
      frequency === "always"
        ? null
        : frequency === "day"
          ? localStorage
          : sessionStorage;
    const seen = Number(store?.getItem(key) || 0);
    // "session": once per browser session. "day": once per 24 hours.
    if (seen && (frequency !== "day" || Date.now() - seen < DAY_MS)) return;
    const show = () => {
      setOpen(true);
      store?.setItem(key, Date.now().toString());
    };
    if (content.trigger === "scroll") {
      const listener = () => {
        const total = document.documentElement.scrollHeight - innerHeight;
        if (
          total > 0 &&
          (scrollY / total) * 100 >= Number(content.scrollPercent || 50)
        ) {
          show();
          removeEventListener("scroll", listener);
        }
      };
      addEventListener("scroll", listener, { passive: true });
      return () => removeEventListener("scroll", listener);
    }
    const timer = setTimeout(
      show,
      Math.max(0, Number(content.delaySeconds || 0)) * 1000,
    );
    return () => clearTimeout(timer);
  }, [design]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);
  if (!design || !open) return null;
  const { content, style } = design;
  // Hash links target homepage sections — prefix with "/" so the button
  // works from any route.
  const buttonHref = String(content.buttonLink || "#");
  return (
    <div
      className="cms-section fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-5"
      data-desktop-visible={style.desktopVisible}
      data-tablet-visible={style.tabletVisible}
      data-mobile-visible={style.mobileVisible}
      role="dialog"
      aria-modal="true"
      aria-label={String(content.heading || "Website popup")}
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <section
        className={`relative max-h-[90vh] w-full max-w-xl overflow-auto bg-white p-9 cms-animation-${style.animation}`}
        style={{
          backgroundColor:
            style.backgroundColor === "transparent"
              ? "#fff"
              : style.backgroundColor,
          color: style.textColor === "#ffffff" ? "#202126" : style.textColor,
          fontFamily: style.fontFamily,
          border: `${style.borderWidth}px solid ${style.borderColor}`,
          borderRadius: style.borderRadius,
          boxShadow: style.shadow,
          textAlign: style.alignment,
          animationDuration: "0.5s",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label={String(content.closeLabel || "Close")}
          className="absolute right-4 top-3 text-2xl"
        >
          ×
        </button>
      {Boolean(content.image) && (
        // User-managed Media Library assets can have arbitrary dimensions.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={String(content.image)}
            alt=""
            className="mb-5 max-h-56 w-full object-cover"
          />
        )}
        <h2 className="text-4xl font-bold">{String(content.heading || "")}</h2>
        <p className="mt-4 opacity-75">{String(content.body || "")}</p>
        <a
          href={buttonHref.startsWith("#") ? `/${buttonHref}` : buttonHref}
          className="mt-6 inline-block rounded-full px-6 py-3 font-semibold text-white"
          style={{ backgroundColor: style.accentColor }}
        >
          {String(content.buttonLabel || "Continue")}
        </a>
      </section>
    </div>
  );
}
