import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import GlobalPopup from "@/components/GlobalPopup";
import { blogChrome } from "@/cms/blog-chrome";
import { db } from "@/db";
import { hostingPlans } from "@/db/schema";
import { DOMAIN_CONNECT_FEE, SITE_PAGE_OPTIONS, SITE_TEMPLATES } from "@/lib/hosting";
import { PAYMENTS_MODE } from "@/lib/payments";
import { HostingWizard } from "./hosting-client";

// Same rule as every public page: no build-time DB, no stale cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build your WordPress site — Designik",
  description:
    "Pick a plan, choose a domain, and get a ready-to-edit WordPress site set up for you by Designik.",
};

export default async function HostingPage() {
  const [plans, chrome] = await Promise.all([
    db
      .select()
      .from(hostingPlans)
      .where(eq(hostingPlans.active, true))
      .orderBy(asc(hostingPlans.position)),
    blogChrome(),
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
          <HostingWizard
            plans={plans.map((p) => ({
              slug: p.slug,
              name: p.name,
              priceMonthly: p.priceMonthly,
              storageGb: p.storageGb,
              features: (p.features as string[]) || [],
            }))}
            templates={SITE_TEMPLATES.map((t) => ({ ...t }))}
            pageOptions={SITE_PAGE_OPTIONS}
            connectFee={DOMAIN_CONNECT_FEE}
          />
        </div>
      </main>
      <Footer content={chrome.footerContent} />
      <GlobalPopup design={chrome.popup} />
    </>
  );
}
