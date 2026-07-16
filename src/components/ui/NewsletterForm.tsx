"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong");
      setStatus("success");
      setMessage("You're subscribed — thank you!");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email*"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-2 text-[12px] ${status === "success" ? "text-emerald-300" : "text-orange-light"}`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
