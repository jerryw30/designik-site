"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assets } from "@/lib/assets";

type Status = "idle" | "loading" | "success" | "error";

type FormField = {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
};

/** Fallback fields when the Forms-builder definition isn't available. */
const DEFAULT_FIELDS: FormField[] = [
  { id: "name", type: "text", label: "Name", name: "name", placeholder: "Your name", required: true, options: [] },
  { id: "email", type: "email", label: "Email", name: "email", placeholder: "Email address", required: true, options: [] },
  { id: "phone", type: "phone", label: "Phone", name: "phone", placeholder: "Phone number", required: true, options: [] },
  { id: "budget", type: "select", label: "Budget", name: "budget", placeholder: "Budget", required: true, options: ["Under $1,000", "$1,000 – $5,000", "$5,000 – $10,000", "$10,000+"] },
  { id: "service", type: "select", label: "What do you need?", name: "service", placeholder: "What do you need?", required: true, options: ["Product Design", "Website Development", "Mobile App Development", "Brand Identity & Design", "Digital Marketing", "SEO", "Something else"] },
  { id: "message", type: "textarea", label: "Project details", name: "message", placeholder: "Tell us about your project…", required: true, options: [] },
];

// Lead fields /api/contact stores as columns; everything else joins the message.
const KNOWN_NAMES = new Set(["name", "email", "phone", "budget", "service", "message"]);

/**
 * Global "Get Started" modal. Open it from anywhere with:
 *   window.dispatchEvent(new CustomEvent("open-get-started"))
 * Fields come from the Forms builder (Start a Project form); copy from Popups.
 */
export default function GetStartedModal() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [values, setValues] = useState<Record<string, string>>({});
  // Admin-editable copy (Backend → Popups)
  const [copy, setCopy] = useState({
    title: "Let's build\nsomething great",
    success: "Thanks for reaching out — we'll get back to you within 24 hours.",
    submitLabel: "Send message",
  });

  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      setStatus("idle");
      setError("");
      fetch("/api/site-config")
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => {
          if (!c) return;
          if (Array.isArray(c.getStartedForm?.fields) && c.getStartedForm.fields.length) {
            setFields(c.getStartedForm.fields);
          }
          setCopy((prev) => ({
            title: c.popups?.getStartedTitle || prev.title,
            success: c.popups?.getStartedSuccess || c.getStartedForm?.successMessage || prev.success,
            submitLabel: c.getStartedForm?.submitLabel || prev.submitLabel,
          }));
        })
        .catch(() => {});
    };
    window.addEventListener("open-get-started", openHandler);
    return () => window.removeEventListener("open-get-started", openHandler);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      setError("");
      try {
        // Known fields map to lead columns; custom fields join the message.
        const payload: Record<string, string> = { source: "get-started" };
        const extras: string[] = [];
        for (const f of fields) {
          const v = (values[f.name] || "").trim();
          if (!v) continue;
          if (KNOWN_NAMES.has(f.name)) payload[f.name] = v;
          else extras.push(`${f.label}: ${v}`);
        }
        if (extras.length) payload.message = [payload.message, ...extras].filter(Boolean).join("\n");
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Something went wrong");
        setStatus("success");
        setValues({});
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Please try again.");
      }
    },
    [fields, values, status]
  );

  const input =
    "w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] text-ink outline-none transition-all placeholder:text-neutral-400 focus:border-wine-500 focus:bg-white focus:ring-4 focus:ring-wine-500/10";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
            className="relative max-h-[92vh] w-full max-w-[440px] overflow-y-auto rounded-[28px] bg-white shadow-[0_40px_90px_rgba(0,0,0,0.4)]"
          >
            {/* header band */}
            <div
              className="relative overflow-hidden px-8 pb-7 pt-8 text-white"
              style={{ backgroundImage: "linear-gradient(135deg, #8e0038 0%, #a10140 55%, #c4136a 130%)" }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 opacity-15"
                style={{
                  backgroundColor: "#fff",
                  WebkitMaskImage: `url(${assets.teamWatermark})`,
                  maskImage: `url(${assets.teamWatermark})`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }}
              />
              <div className="flex items-center gap-3">
                <Image src={assets.logo} alt="" width={34} height={35} className="h-9 w-9" />
                <p className="font-display text-[13px] font-medium uppercase tracking-[0.18em] text-white/75">
                  Designik Agency
                </p>
              </div>
              <h2 className="mt-4 font-display text-[34px] font-semibold uppercase leading-[1.05]">
                {copy.title.split("\n").map((line, i, all) => (
                  <span key={i}>
                    {line}
                    {i < all.length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:rotate-90 hover:bg-white/25"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                  <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-8 pb-8 pt-6">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-wine-500 text-white"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
                        <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.span>
                    <h3 className="mt-5 font-display text-[22px] font-semibold uppercase text-ink">Message sent!</h3>
                    <p className="mt-2 max-w-[30ch] text-[14px] text-neutral-500">{copy.success}</p>
                    <button
                      onClick={() => setOpen(false)}
                      className="mt-6 rounded-full bg-wine-500 px-7 py-2.5 font-display text-[13px] font-semibold uppercase text-white transition-transform hover:scale-105"
                    >
                      Done
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={submit} className="flex flex-col gap-3.5" exit={{ opacity: 0 }}>
                    {fields.map((f) => {
                      const value = values[f.name] || "";
                      const setValue = (v: string) => setValues((prev) => ({ ...prev, [f.name]: v }));
                      if (f.type === "textarea")
                        return (
                          <textarea
                            key={f.id}
                            rows={4}
                            required={f.required}
                            placeholder={f.placeholder || f.label}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className={`${input} min-h-[96px] resize-y`}
                          />
                        );
                      if (f.type === "select")
                        return (
                          <div key={f.id} className="relative">
                            <select
                              required={f.required}
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              className={`${input} appearance-none pr-9 ${value ? "text-ink" : "text-neutral-400"}`}
                            >
                              <option value="" disabled>
                                {f.placeholder || f.label}
                              </option>
                              {f.options.map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                            <svg viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden>
                              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        );
                      if (f.type === "checkbox")
                        return (
                          <label key={f.id} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
                            <input
                              type="checkbox"
                              required={f.required}
                              checked={value === "Yes"}
                              onChange={(e) => setValue(e.target.checked ? "Yes" : "")}
                              className="h-4 w-4 accent-wine-500"
                            />
                            {f.label}
                          </label>
                        );
                      return (
                        <input
                          key={f.id}
                          type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
                          required={f.required}
                          placeholder={f.placeholder || f.label}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className={input}
                        />
                      );
                    })}
                    {error && <p className="text-[13px] text-red-500">{error}</p>}
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="group mt-1 flex h-12 items-center justify-between rounded-full bg-wine-500 pl-6 pr-1.5 font-display text-[14px] font-semibold uppercase text-white transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                    >
                      {status === "loading" ? "Sending…" : copy.submitLabel}
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-wine-500 transition-transform duration-300 group-hover:rotate-45">
                        {status === "loading" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-wine-500/30 border-t-wine-500" />
                        ) : (
                          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                            <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                    <p className="text-center text-[11px] text-neutral-400">
                      We usually reply within one business day.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
