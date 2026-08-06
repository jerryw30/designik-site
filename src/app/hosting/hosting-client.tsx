"use client";

import { useCallback, useRef, useState } from "react";

/**
 * 4-step checkout wizard: plan → domain → details → done.
 * Availability checks are debounced against the /api/hosting endpoints;
 * final validation happens server-side in /api/hosting/checkout.
 */

type Plan = {
  slug: string;
  name: string;
  priceMonthly: number;
  storageGb: number;
  features: string[];
};

type DomainType = "temp" | "new" | "own";

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

export function HostingWizard({ plans }: { plans: Plan[] }) {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [domainType, setDomainType] = useState<DomainType>("temp");
  const [domainInput, setDomainInput] = useState("");
  const [checked, setChecked] = useState<{
    value: string;
    available: boolean | null;
    priceCents: number;
    host?: string;
    error?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ orderRef: string } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runCheck = useCallback(
    (value: string, type: DomainType) => {
      if (debounce.current) clearTimeout(debounce.current);
      setChecked(null);
      const v = value.trim();
      if (!v || type === "own") return;
      setChecking(true);
      debounce.current = setTimeout(async () => {
        try {
          const url =
            type === "temp"
              ? `/api/hosting/subdomain-check?name=${encodeURIComponent(v)}`
              : `/api/hosting/domain-check?domain=${encodeURIComponent(v)}`;
          const res = await fetch(url);
          const data = await res.json();
          setChecked({
            value: v,
            available: data.ok ? data.available : null,
            priceCents: data.priceCents || 0,
            host: data.host,
            error: data.ok ? undefined : data.error,
          });
        } catch {
          setChecked({ value: v, available: null, priceCents: 0, error: "Couldn't check — try again." });
        } finally {
          setChecking(false);
        }
      }, 450);
    },
    [],
  );

  const domainReady =
    domainType === "own"
      ? /^\S+\.\S{2,}$/.test(domainInput.trim())
      : Boolean(checked && checked.available === true && checked.value);

  const domainPrice = domainType === "new" && checked ? checked.priceCents : 0;
  const total = (plan?.priceMonthly || 0) + domainPrice;

  async function submit() {
    if (!plan || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/hosting/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          domainType,
          domain: domainInput.trim(),
          customerName: name,
          customerEmail: email,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Something went wrong — try again.");
        return;
      }
      setDone({ orderRef: data.orderRef });
      setStep(3);
    } catch {
      setError("Network problem — your card was not charged. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- step 3: confirmation ---------- */
  if (done) {
    return (
      <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-black/10 bg-blush-100/40 p-10 text-center shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wine-500 text-3xl text-white">✓</div>
        <h2 className="mt-6 font-display text-[28px] font-semibold uppercase text-wine-500">Order received</h2>
        <p className="mt-3 font-sans text-[15px] leading-6 text-black/70">
          Your order reference is{" "}
          <span className="font-semibold text-black">{done.orderRef}</span>.
          We&apos;re setting up your WordPress site now — your login details
          will arrive by email, usually within a few hours.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      {/* progress */}
      <div className="mx-auto flex max-w-md items-center justify-center gap-2">
        {["Plan", "Domain", "Details"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-black/15" />}
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wide transition ${
                i === step
                  ? "bg-wine-500 text-white"
                  : i < step
                    ? "bg-blush-100 text-wine-500"
                    : "bg-black/5 text-black/40"
              }`}
            >
              {label}
            </button>
          </div>
        ))}
      </div>

      {/* step 0: plans */}
      {step === 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => {
                setPlan(p);
                setStep(1);
              }}
              className={`group relative flex flex-col rounded-3xl border p-7 text-left transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(161,1,64,0.15)] ${
                i === 1
                  ? "border-wine-500 bg-wine-500 text-white shadow-[0_18px_45px_rgba(161,1,64,0.25)]"
                  : "border-black/10 bg-white text-black"
              }`}
            >
              {i === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink-brand px-3.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <span className={`font-display text-[15px] font-semibold uppercase tracking-wide ${i === 1 ? "text-white/80" : "text-wine-500"}`}>
                {p.name}
              </span>
              <span className="mt-3 font-display text-[40px] font-semibold leading-none">
                {usd(p.priceMonthly)}
                <span className={`text-[15px] font-medium ${i === 1 ? "text-white/70" : "text-black/50"}`}>/mo</span>
              </span>
              <span className={`mt-1.5 font-sans text-[13.5px] ${i === 1 ? "text-white/70" : "text-black/55"}`}>
                {p.storageGb} GB storage
              </span>
              <ul className={`mt-5 space-y-2.5 font-sans text-[14px] leading-5 ${i === 1 ? "text-white/90" : "text-black/75"}`}>
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className={i === 1 ? "text-white" : "text-wine-500"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <span
                className={`mt-7 inline-flex items-center justify-center rounded-full px-6 py-3 font-display text-[13px] font-bold uppercase tracking-wide transition ${
                  i === 1
                    ? "bg-white text-wine-500 group-hover:bg-blush-100"
                    : "bg-wine-500 text-white group-hover:bg-wine-700"
                }`}
              >
                Choose {p.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* step 1: domain */}
      {step === 1 && plan && (
        <div className="mx-auto mt-10 max-w-xl">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/5 p-1.5">
            {(
              [
                ["temp", "Free subdomain"],
                ["new", "Buy a domain"],
                ["own", "I own one"],
              ] as [DomainType, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setDomainType(t);
                  setChecked(null);
                  runCheck(domainInput, t);
                }}
                className={`rounded-xl px-3 py-2.5 font-display text-[12.5px] font-semibold uppercase tracking-wide transition ${
                  domainType === t ? "bg-white text-wine-500 shadow" : "text-black/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {domainType === "temp" && (
              <div className="flex items-center overflow-hidden rounded-2xl border border-black/15 bg-white focus-within:border-wine-500">
                <input
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value);
                    runCheck(e.target.value, "temp");
                  }}
                  placeholder="yourbusiness"
                  className="min-w-0 flex-1 px-5 py-4 font-sans text-[16px] outline-none"
                />
                <span className="shrink-0 border-l border-black/10 bg-blush-100/50 px-4 py-4 font-sans text-[15px] text-black/60">
                  .designik.us
                </span>
              </div>
            )}
            {domainType !== "temp" && (
              <input
                value={domainInput}
                onChange={(e) => {
                  setDomainInput(e.target.value);
                  runCheck(e.target.value, domainType);
                }}
                placeholder={domainType === "new" ? "yourbusiness.com" : "the-domain-you-own.com"}
                className="w-full rounded-2xl border border-black/15 bg-white px-5 py-4 font-sans text-[16px] outline-none focus:border-wine-500"
              />
            )}

            <div className="mt-3 min-h-[24px] font-sans text-[14px]">
              {checking && <span className="text-black/50">Checking…</span>}
              {!checking && checked?.error && <span className="text-red-600">{checked.error}</span>}
              {!checking && checked && !checked.error && checked.available === true && (
                <span className="text-emerald-600">
                  ✓ {checked.host || checked.value} is available
                  {domainType === "new" && ` — ${usd(checked.priceCents)}/year`}
                </span>
              )}
              {!checking && checked && !checked.error && checked.available === false && (
                <span className="text-red-600">✕ Taken — try another</span>
              )}
              {!checking && checked && !checked.error && checked.available === null && (
                <span className="text-amber-600">Couldn&apos;t verify right now — you can still continue.</span>
              )}
              {domainType === "own" && (
                <span className="text-black/55">
                  We&apos;ll send simple connection steps after setup — or do it for you.
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!domainReady && !(domainType === "new" && checked?.available === null)}
            onClick={() => setStep(2)}
            className="mt-6 w-full rounded-full bg-wine-500 px-6 py-4 font-display text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {/* step 2: details + pay */}
      {step === 2 && plan && (
        <div className="mx-auto mt-10 max-w-xl">
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
            <h3 className="font-display text-[16px] font-semibold uppercase text-wine-500">Order summary</h3>
            <dl className="mt-4 space-y-2.5 font-sans text-[15px]">
              <div className="flex justify-between">
                <dt className="text-black/60">{plan.name} plan · {plan.storageGb} GB</dt>
                <dd className="font-medium">{usd(plan.priceMonthly)}/mo</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black/60">
                  {domainType === "temp" && `${checked?.host || "subdomain"} (free)`}
                  {domainType === "new" && `${domainInput.trim()} (1 year)`}
                  {domainType === "own" && `${domainInput.trim()} (yours)`}
                </dt>
                <dd className="font-medium">{domainPrice ? usd(domainPrice) : "$0.00"}</dd>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-[17px]">
                <dt className="font-semibold">Due today</dt>
                <dd className="font-display font-semibold text-wine-500">{usd(total)}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-xl border border-black/15 px-4 py-3.5 font-sans text-[15px] outline-none focus:border-wine-500"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email address"
                autoComplete="email"
                className="w-full rounded-xl border border-black/15 px-4 py-3.5 font-sans text-[15px] outline-none focus:border-wine-500"
              />
            </div>

            {error && <p className="mt-4 font-sans text-[14px] text-red-600">{error}</p>}

            <button
              type="button"
              disabled={submitting || name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)}
              onClick={submit}
              className="mt-6 w-full rounded-full bg-wine-500 px-6 py-4 font-display text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Placing order…" : `Pay ${usd(total)} — test mode`}
            </button>
            <p className="mt-3 text-center font-sans text-[12.5px] text-black/45">
              Test mode: no card is charged. Real payments switch on at launch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
