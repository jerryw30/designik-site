"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Checkout wizard: plan → domain → template → details → done.
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

type Template = { key: string; name: string; blurb: string; colors: readonly string[] };

type DomainType = "temp" | "new" | "own";

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

const STEPS = ["Plan", "Domain", "Template", "Details"];

export function HostingWizard({
  plans,
  templates,
  pageOptions,
  connectFee,
}: {
  plans: Plan[];
  templates: Template[];
  pageOptions: readonly string[];
  connectFee: number;
}) {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [domainType, setDomainType] = useState<DomainType>("temp");
  const [domainInput, setDomainInput] = useState("");
  const [registrar, setRegistrar] = useState("");
  const [connectService, setConnectService] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const [checked, setChecked] = useState<{
    value: string;
    available: boolean | null;
    priceCents: number;
    host?: string;
    error?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  // site details
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#a10140");
  const [pages, setPages] = useState<string[]>(["Home", "About", "Contact"]);
  const [extraNotes, setExtraNotes] = useState("");
  // customer account + submit
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authBusy, setAuthBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ orderRef: string } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the signed-in account so returning customers skip the auth form.
  useEffect(() => {
    fetch("/api/hosting/auth")
      .then((r) => r.json())
      .then((d) => d.customer && setMe(d.customer))
      .catch(() => {});
  }, []);

  async function authenticate() {
    if (authBusy) return;
    setAuthBusy(true);
    setError("");
    try {
      const res = await fetch("/api/hosting/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: authMode, name, email, password }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error || "Couldn't sign you in.");
      else setMe(data.customer);
    } catch {
      setError("Network problem — try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  const runCheck = useCallback((value: string, type: DomainType) => {
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
  }, []);

  const domainReady =
    domainType === "own"
      ? /^\S+\.\S{2,}$/.test(domainInput.trim())
      : Boolean(checked && checked.available === true && checked.value) ||
        (domainType === "new" && checked?.available === null);

  const domainPrice = domainType === "new" && checked ? checked.priceCents : 0;
  const connectPrice = domainType === "own" && connectService ? connectFee : 0;
  const total = (plan?.priceMonthly || 0) + domainPrice + connectPrice;

  const togglePage = (p: string) =>
    setPages((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  async function submit() {
    if (!plan || !template || submitting) return;
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
          template: template.key,
          connectService: domainType === "own" ? connectService : false,
          registrar: registrar.trim(),
          site: {
            siteName: siteName.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            brandColor,
            pages,
            notes: extraNotes.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.needAuth) setMe(null);
        setError(data.error || "Something went wrong — try again.");
        return;
      }
      setDone({ orderRef: data.orderRef });
    } catch {
      setError("Network problem — nothing was charged. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- confirmation ---------- */
  if (done) {
    return (
      <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-black/10 bg-blush-100/40 p-10 text-center shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wine-500 text-3xl text-white">✓</div>
        <h2 className="mt-6 font-display text-[28px] font-semibold uppercase text-wine-500">Order received</h2>
        <p className="mt-3 font-sans text-[15px] leading-6 text-black/70">
          Your order reference is{" "}
          <span className="font-semibold text-black">{done.orderRef}</span>.
          Our team is building your site from the {template?.name} template with
          your details. Your WordPress login will arrive by email — then you can
          change anything you like with the visual editor.
        </p>
        <a
          href="/hosting/dashboard"
          className="mt-6 inline-block rounded-full bg-wine-500 px-6 py-3 font-display text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700"
        >
          Go to my dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="mt-12">
      {/* progress */}
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-black/15" />}
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wide transition ${
                i === step ? "bg-wine-500 text-white" : i < step ? "bg-blush-100 text-wine-500" : "bg-black/5 text-black/40"
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
                i === 1 ? "border-wine-500 bg-wine-500 text-white shadow-[0_18px_45px_rgba(161,1,64,0.25)]" : "border-black/10 bg-white text-black"
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
              <span className={`mt-1.5 font-sans text-[13.5px] ${i === 1 ? "text-white/70" : "text-black/55"}`}>{p.storageGb} GB storage</span>
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
                  i === 1 ? "bg-white text-wine-500 group-hover:bg-blush-100" : "bg-wine-500 text-white group-hover:bg-wine-700"
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
            {domainType === "temp" ? (
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
                <span className="shrink-0 border-l border-black/10 bg-blush-100/50 px-4 py-4 font-sans text-[15px] text-black/60">.designik.us</span>
              </div>
            ) : (
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
            </div>

            {domainType === "own" && (
              <div className="mt-4 space-y-4 rounded-2xl border border-black/10 bg-blush-100/30 p-5">
                <div>
                  <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">
                    Where is your domain registered? <span className="text-black/40">(GoDaddy, Namecheap, Hostinger…)</span>
                  </label>
                  <input
                    value={registrar}
                    onChange={(e) => setRegistrar(e.target.value)}
                    placeholder="e.g. GoDaddy"
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-sans text-[15px] outline-none focus:border-wine-500"
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={connectService}
                    onChange={(e) => setConnectService(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#a10140]"
                  />
                  <span className="font-sans text-[14px] leading-5 text-black/75">
                    <span className="font-semibold text-black">
                      Connect it for me — {usd(connectFee)}
                    </span>{" "}
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-emerald-700">free at launch</span>
                    <br />
                    Our team handles the domain pointing with you — we send exact
                    steps for your registrar and stay on it until your site is
                    live. We never ask for your registrar password.
                  </span>
                </label>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!domainReady}
            onClick={() => setStep(2)}
            className="mt-6 w-full rounded-full bg-wine-500 px-6 py-4 font-display text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {/* step 2: template */}
      {step === 2 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <p className="text-center font-sans text-[15px] text-black/60">
            Pick a starting design. We build it with your content — you can change
            everything later with the visual editor (Elementor).
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTemplate(t);
                  setStep(3);
                }}
                className={`group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)] ${
                  template?.key === t.key ? "border-wine-500 ring-2 ring-wine-500/30" : "border-black/10"
                }`}
              >
                <div
                  className="flex h-28 items-end p-4"
                  style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}
                >
                  <div className="space-y-1.5">
                    <div className="h-2 w-24 rounded bg-white/80" />
                    <div className="h-2 w-16 rounded bg-white/50" />
                  </div>
                </div>
                <div className="bg-white p-4">
                  <p className="font-display text-[14px] font-semibold uppercase text-[#1b1c20]">{t.name}</p>
                  <p className="mt-1 font-sans text-[12.5px] leading-4 text-black/55">{t.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* step 3: site details + customer + place order */}
      {step === 3 && plan && template && (
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
            <h3 className="font-display text-[16px] font-semibold uppercase text-wine-500">Tell us about your site</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">Site name *</label>
                <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Acme Studio" className="w-full rounded-xl border border-black/15 px-4 py-3 font-sans text-[15px] outline-none focus:border-wine-500" />
              </div>
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">Tagline</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Design that works" className="w-full rounded-xl border border-black/15 px-4 py-3 font-sans text-[15px] outline-none focus:border-wine-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">What is your site about? *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="We are a bakery in Denver making custom cakes…" className="w-full rounded-xl border border-black/15 px-4 py-3 font-sans text-[15px] outline-none focus:border-wine-500" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[110px_1fr]">
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">Brand color</label>
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-11 w-full cursor-pointer rounded-xl border border-black/15 bg-white p-1" />
              </div>
              <div>
                <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">Pages you want</label>
                <div className="flex flex-wrap gap-2">
                  {pageOptions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePage(p)}
                      className={`rounded-full px-3.5 py-2 font-sans text-[13px] font-medium transition ${
                        pages.includes(p) ? "bg-wine-500 text-white" : "bg-black/5 text-black/60 hover:bg-black/10"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block font-sans text-[13px] font-medium text-black/70">Anything else? (logo, examples you like…)</label>
              <textarea value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-black/15 px-4 py-3 font-sans text-[15px] outline-none focus:border-wine-500" />
            </div>

            <div className="mt-7 border-t border-black/10 pt-5">
              <h3 className="font-display text-[16px] font-semibold uppercase text-wine-500">Your account</h3>
              {me ? (
                <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 font-sans text-[14px] text-emerald-800">
                  Ordering as <span className="font-semibold">{me.name}</span> ({me.email}) —
                  your website will appear in your dashboard.
                </p>
              ) : (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1">
                    {(["signup", "login"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => { setAuthMode(m); setError(""); }}
                        className={`rounded-lg px-3 py-2 font-display text-[12px] font-semibold uppercase tracking-wide transition ${authMode === m ? "bg-white text-wine-500 shadow" : "text-black/50"}`}>
                        {m === "signup" ? "Create account" : "I have an account"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {authMode === "signup" && (
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="w-full rounded-xl border border-black/15 px-4 py-3.5 font-sans text-[15px] outline-none focus:border-wine-500" />
                    )}
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" className="w-full rounded-xl border border-black/15 px-4 py-3.5 font-sans text-[15px] outline-none focus:border-wine-500" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={authMode === "signup" ? "Password (8+ characters)" : "Password"} autoComplete={authMode === "signup" ? "new-password" : "current-password"} className="w-full rounded-xl border border-black/15 px-4 py-3.5 font-sans text-[15px] outline-none focus:border-wine-500" />
                  </div>
                  <button type="button" disabled={authBusy || !email || password.length < (authMode === "signup" ? 8 : 1) || (authMode === "signup" && name.trim().length < 2)} onClick={authenticate}
                    className="mt-3 w-full rounded-xl border-2 border-wine-500 px-5 py-3 font-display text-[13px] font-bold uppercase tracking-wide text-wine-500 transition hover:bg-wine-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                    {authBusy ? "One moment…" : authMode === "signup" ? "Create account" : "Log in"}
                  </button>
                </div>
              )}
            </div>

            <dl className="mt-6 space-y-2 rounded-2xl bg-blush-100/40 p-4 font-sans text-[14px]">
              <div className="flex justify-between"><dt className="text-black/60">{plan.name} plan · {plan.storageGb} GB · {template.name} template</dt><dd className="font-medium">{usd(plan.priceMonthly)}/mo</dd></div>
              <div className="flex justify-between">
                <dt className="text-black/60">
                  {domainType === "temp" && `${checked?.host || "your subdomain"} (free)`}
                  {domainType === "new" && `${domainInput.trim()} (1 year)`}
                  {domainType === "own" && `${domainInput.trim()}${connectService ? " + we connect it" : " (you connect it)"}`}
                </dt>
                <dd className="font-medium">{usd(domainPrice + connectPrice)}</dd>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-2.5 text-[16px]">
                <dt className="font-semibold">Due today</dt>
                <dd className="font-display font-semibold text-emerald-600">FREE <span className="text-[13px] text-black/40 line-through">{usd(total)}</span></dd>
              </div>
            </dl>

            {error && <p className="mt-4 font-sans text-[14px] text-red-600">{error}</p>}

            <button
              type="button"
              disabled={submitting || !me || siteName.trim().length < 2 || description.trim().length < 10}
              onClick={submit}
              className="mt-6 w-full rounded-full bg-wine-500 px-6 py-4 font-display text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Placing order…" : "Place my order — free"}
            </button>
            <p className="mt-3 text-center font-sans text-[12.5px] text-black/45">
              Free during our launch period — no card needed. Listed prices apply to new orders once launch pricing ends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
