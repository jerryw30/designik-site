"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Login / signup card for the customer hosting panel. */
export function AccountAuth({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/hosting/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, name, email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network problem — try again.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 font-sans text-[15px] outline-none focus:border-wine-500";

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1.5">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`rounded-xl px-3 py-2.5 font-display text-[12.5px] font-semibold uppercase tracking-wide transition ${
              mode === m ? "bg-white text-wine-500 shadow" : "text-black/50"
            }`}
          >
            {m === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className={input} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" className={input} />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={input}
        />
      </div>

      {error && <p className="mt-3 font-sans text-[14px] text-red-600">{error}</p>}

      <button
        type="button"
        disabled={busy || !email || password.length < (mode === "signup" ? 8 : 1) || (mode === "signup" && name.trim().length < 2)}
        onClick={submit}
        className="mt-5 w-full rounded-full bg-wine-500 px-6 py-4 font-display text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "One moment…" : mode === "login" ? "Log in" : "Create my account"}
      </button>
      <p className="mt-4 text-center font-sans text-[12.5px] text-black/45">
        One account for your orders, websites and billing — free to create.
      </p>
    </div>
  );
}
