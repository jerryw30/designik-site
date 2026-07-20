"use client";

import Image from "next/image";
import { useState } from "react";
import { assets } from "@/lib/assets";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Newsletter form styled exactly to the Figma footer:
 * mint (#ebf5f4) input 290x44 r7 + separate mint 46x44 send button.
 * Same POST /api/contact behavior as the original NewsletterForm.
 */
export default function FigmaNewsletterForm() {
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
    <form onSubmit={onSubmit}>
      <div className="flex gap-[0.2778cqw]">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email*"
          aria-label="Email address"
          className="h-11 w-[190px] rounded-[7px] bg-mint px-3 text-[14px] text-black outline-none placeholder:text-black md:h-[3.0556cqw] md:w-[20.1389cqw] md:rounded-[0.4861cqw] md:px-[0.9722cqw] md:text-[1.0417cqw]"
          style={{ fontFamily: "var(--font-raleway), sans-serif" }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe"
          className="flex h-11 w-12 shrink-0 items-center justify-center rounded-[7px] bg-mint transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 md:h-[3.0556cqw] md:w-[3.1944cqw] md:rounded-[0.4861cqw]"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <Image src={assets.footerSend} alt="" width={21} height={21} className="h-5 w-5 md:h-[1.4583cqw] md:w-[1.4583cqw]" />
          )}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-[12px] ${status === "success" ? "text-emerald-300" : "text-orange-light"}`}
          style={{ fontFamily: "var(--font-raleway), sans-serif" }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
