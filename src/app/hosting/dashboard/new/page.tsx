import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingPlans } from "@/db/schema";
import { currentCustomer } from "@/lib/customer-auth";
import { DOMAIN_CONNECT_FEE, SITE_PAGE_OPTIONS, SITE_TEMPLATES } from "@/lib/hosting";
import { HostingWizard } from "../../hosting-client";
import { logoutCustomer } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New website — Designik Hosting" };

/**
 * The buy flow lives inside the customer panel, hosting-company style:
 * pricing is public on /hosting, but configuring and ordering requires the
 * account first.
 */
export default async function NewWebsite({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const customer = await currentCustomer();
  if (!customer) {
    const next = `/hosting/dashboard/new${plan ? `?plan=${encodeURIComponent(plan)}` : ""}`;
    redirect(`/hosting/account?next=${encodeURIComponent(next)}`);
  }

  const plans = await db
    .select()
    .from(hostingPlans)
    .where(eq(hostingPlans.active, true))
    .orderBy(asc(hostingPlans.position));

  return (
    <main className="min-h-screen bg-blush-100/25">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/hosting" className="font-display text-[17px] font-bold uppercase tracking-wide text-wine-500">
            Designik <span className="text-black/40">Hosting</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/hosting/dashboard" className="font-sans text-[13.5px] font-medium text-black/60 hover:text-wine-500">
              My websites
            </Link>
            <span className="hidden font-sans text-[13.5px] text-black/60 sm:block">{customer.name}</span>
            <form action={logoutCustomer}>
              <button className="rounded-full border border-black/15 px-4 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wide text-black/60 transition hover:border-wine-500 hover:text-wine-500">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <h1 className="text-center font-display text-[30px] font-semibold uppercase text-[#1b1c20]">
          Set up your new website
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-center font-sans text-[14.5px] text-black/55">
          Free during our launch period — no card needed.
        </p>
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
          initialPlanSlug={plan}
          customer={customer ? { name: customer.name, email: customer.email } : null}
        />
      </div>
    </main>
  );
}
