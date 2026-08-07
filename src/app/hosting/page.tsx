import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import GlobalPopup from "@/components/GlobalPopup";
import { blogChrome } from "@/cms/blog-chrome";
import { db } from "@/db";
import { hostingPlans } from "@/db/schema";
import { currentCustomer } from "@/lib/customer-auth";
import { formatUsd, SITE_TEMPLATES } from "@/lib/hosting";
import { PAYMENTS_MODE } from "@/lib/payments";

// Same rule as every public page: no build-time DB, no stale cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build your WordPress site — Designik",
  description:
    "Pick a plan, choose a domain, and get a ready-to-edit WordPress site set up for you by Designik.",
};

/**
 * Public pricing page, hosting-company style: anyone can browse, but picking
 * a plan routes through login/signup into the panel's buy flow
 * (/hosting/dashboard/new).
 */
export default async function HostingPage() {
  const [plans, chrome, customer] = await Promise.all([
    db
      .select()
      .from(hostingPlans)
      .where(eq(hostingPlans.active, true))
      .orderBy(asc(hostingPlans.position)),
    blogChrome(),
    currentCustomer(),
  ]);

  return (
    <>
      <Nav content={chrome.headerContent} />
      <main className="min-h-screen overflow-x-clip bg-white px-5 pb-28 pt-36 md:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="text-center font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-wine-500">
            Websites by Designik
          </p>
          <h1 className="mt-3 text-center font-display text-[clamp(38px,6vw,64px)] font-semibold uppercase leading-[1.05] text-wine-500">
            Build your WordPress site
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center font-sans text-[17px] leading-[28px] text-black/70">
            Pick a plan, choose your domain, and we set up a ready-to-edit
            WordPress site for you — themes and plugins included.
          </p>
          {PAYMENTS_MODE === "test" && (
            <p className="mx-auto mt-4 w-fit rounded-full bg-emerald-100 px-4 py-1.5 text-center font-display text-[12px] font-semibold uppercase tracking-wide text-emerald-700">
              Launch offer — get set up free, no card needed
            </p>
          )}
          <p className="mt-3 text-center">
            <Link
              href={customer ? "/hosting/dashboard" : "/hosting/account"}
              className="font-sans text-[13.5px] font-medium text-black/50 underline underline-offset-2 hover:text-wine-500"
            >
              {customer ? `Signed in as ${customer.name} — open your dashboard →` : "Already a customer? Log in →"}
            </Link>
          </p>

          {/* pricing */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((p, i) => (
              <Link
                key={p.slug}
                href={`/hosting/dashboard/new?plan=${p.slug}`}
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
                  {formatUsd(p.priceMonthly)}
                  <span className={`text-[15px] font-medium ${i === 1 ? "text-white/70" : "text-black/50"}`}>/mo</span>
                </span>
                <span className={`mt-1.5 font-sans text-[13.5px] ${i === 1 ? "text-white/70" : "text-black/55"}`}>
                  {p.storageGb} GB storage
                </span>
                <ul className={`mt-5 space-y-2.5 font-sans text-[14px] leading-5 ${i === 1 ? "text-white/90" : "text-black/75"}`}>
                  {((p.features as string[]) || []).map((f) => (
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
              </Link>
            ))}
          </div>

          {/* templates teaser */}
          <h2 className="mt-20 text-center font-display text-[26px] font-semibold uppercase text-[#1b1c20]">
            Start from a design you like
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center font-sans text-[14.5px] text-black/55">
            Pick a starting template during setup — we build it with your
            content, and you can change everything with the visual editor.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SITE_TEMPLATES.map((t) => (
              <div key={t.key} className="overflow-hidden rounded-2xl border border-black/10">
                <div
                  className="flex h-24 items-end p-4"
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
              </div>
            ))}
          </div>

          {/* how it works */}
          <h2 className="mt-20 text-center font-display text-[26px] font-semibold uppercase text-[#1b1c20]">
            How it works
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ["1", "Create your account", "One login for your websites, orders and support."],
              ["2", "Pick plan & domain", "Free subdomain, a new domain, or one you already own."],
              ["3", "Tell us your vision", "Template, colors, pages — a 2-minute brief."],
              ["4", "We build, you edit", "Your WordPress login arrives by email, ready for Elementor."],
            ].map(([n, title, body]) => (
              <div key={n} className="rounded-2xl border border-black/10 bg-white p-6 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-wine-500 font-display text-[16px] font-bold text-white">
                  {n}
                </span>
                <p className="mt-3 font-display text-[15px] font-semibold uppercase text-[#1b1c20]">{title}</p>
                <p className="mt-1.5 font-sans text-[13px] leading-5 text-black/55">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/hosting/dashboard/new"
              className="inline-block rounded-full bg-wine-500 px-8 py-4 font-display text-[14px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700"
            >
              Start your website
            </Link>
          </div>
        </div>
      </main>
      <Footer content={chrome.footerContent} />
      <GlobalPopup design={chrome.popup} />
    </>
  );
}
