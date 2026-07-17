"use client";

import { useEffect, useState } from "react";
import type { GlobalDesign } from "@/cms/design-resources";

export default function GlobalPopup({
  design,
}: {
  design?: GlobalDesign | null;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!design) return;
    const content = design.content;
    const frequency = String(content.frequency || "session");
    const key = "designik-popup-seen";
    const store =
      frequency === "always"
        ? null
        : frequency === "day"
          ? localStorage
          : sessionStorage;
    if (store?.getItem(key)) return;
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
  if (!design || !open) return null;
  const { content, style } = design;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-5"
      role="dialog"
      aria-modal="true"
      aria-label={String(content.heading || "Website popup")}
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <section
        className="relative max-h-[90vh] w-full max-w-xl overflow-auto bg-white p-9"
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
          href={String(content.buttonLink || "#")}
          className="mt-6 inline-block rounded-full px-6 py-3 font-semibold text-white"
          style={{ backgroundColor: style.accentColor }}
        >
          {String(content.buttonLabel || "Continue")}
        </a>
      </section>
    </div>
  );
}
