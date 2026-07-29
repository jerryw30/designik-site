"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const CALENDLY_URL = "https://calendly.com/luke-designingenious/";

/**
 * Shared embedded Calendly booking popup — same overlay language as the
 * other site modals. Used by the hero, footer and chat widget.
 */
export default function CalendlyModal({
  open,
  onClose,
  url,
}: {
  open: boolean;
  onClose: () => void;
  url?: string;
}) {
  // When no explicit URL is passed, use the admin-configured booking link.
  const [configUrl, setConfigUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!open || url || configUrl) return;
    fetch("/api/site-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setConfigUrl(c?.calendlyUrl || CALENDLY_URL))
      .catch(() => setConfigUrl(CALENDLY_URL));
  }, [open, url, configUrl]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const bookingUrl = url || configUrl || CALENDLY_URL;
  const src = `${bookingUrl}${bookingUrl.includes("?") ? "&" : "?"}embed_domain=${
    typeof location !== "undefined" ? location.hostname : ""
  }&embed_type=Inline&hide_gdpr_banner=1`;

  return createPortal(
    <div
      onClick={onClose}
      className="dgk-modal-overlay fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(240,241,251,0.98)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dgk-modal-card relative h-[90vh] w-full max-w-[1000px] overflow-hidden rounded-[16px] bg-white"
        style={{ boxShadow: "rgba(51,53,71,0.22) 0px 40px 100px -20px" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur transition-transform duration-300 hover:rotate-90 hover:bg-white"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <iframe src={src} title="Book an appointment with Designik" className="h-full w-full border-0" />
      </div>
    </div>,
    document.body,
  );
}
