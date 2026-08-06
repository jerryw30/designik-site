import { desc, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingOrders } from "@/db/schema";
import { currentCustomer } from "@/lib/customer-auth";
import { formatUsd } from "@/lib/hosting";
import { changeCustomerPassword, logoutCustomer } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My websites — Designik Hosting" };

const STATUS_STEPS = ["PENDING", "PROVISIONING", "ACTIVE"] as const;

function StatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED")
    return <span className="inline-flex rounded-full bg-neutral-200 px-3 py-1 font-display text-[11px] font-bold uppercase text-neutral-600">Cancelled</span>;
  const idx = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  const labels = ["Order received", "Setting up", "Live"];
  return (
    <div className="flex items-center gap-1.5">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          {i > 0 && <div className={`h-px w-5 ${i <= idx ? "bg-emerald-500" : "bg-black/15"}`} />}
          <span
            className={`rounded-full px-2.5 py-1 font-display text-[10.5px] font-bold uppercase tracking-wide ${
              i < idx ? "bg-emerald-100 text-emerald-700" : i === idx ? (idx === 2 ? "bg-emerald-500 text-white" : "bg-wine-500 text-white") : "bg-black/5 text-black/35"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>;
}) {
  const customer = await currentCustomer();
  if (!customer) redirect("/hosting/account");
  const { pw } = await searchParams;

  const orders = await db
    .select()
    .from(hostingOrders)
    .where(or(eq(hostingOrders.customerId, customer.id), eq(hostingOrders.customerEmail, customer.email)))
    .orderBy(desc(hostingOrders.createdAt));
  const visible = orders.filter((o) => !o.blocked);

  const input =
    "w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-sans text-[14px] outline-none focus:border-wine-500";

  return (
    <main className="min-h-screen bg-blush-100/25">
      {/* panel top bar */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/hosting" className="font-display text-[17px] font-bold uppercase tracking-wide text-wine-500">
            Designik <span className="text-black/40">Hosting</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-sans text-[13.5px] text-black/60 sm:block">
              {customer.name} · {customer.email}
            </span>
            <form action={logoutCustomer}>
              <button className="rounded-full border border-black/15 px-4 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wide text-black/60 transition hover:border-wine-500 hover:text-wine-500">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[28px] font-semibold uppercase text-[#1b1c20]">My websites</h1>
          <Link
            href="/hosting"
            className="rounded-full bg-wine-500 px-5 py-2.5 font-display text-[12.5px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700"
          >
            + New website
          </Link>
        </div>

        {/* websites */}
        <div className="mt-6 space-y-5">
          {visible.map((o) => {
            const details = (o.details || {}) as {
              templateName?: string;
              site?: { siteName?: string; brandColor?: string };
              connectService?: boolean;
            };
            return (
              <section key={o.id} className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      {details.site?.brandColor && (
                        <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: details.site.brandColor }} />
                      )}
                      <h2 className="font-display text-[19px] font-semibold text-[#1b1c20]">{o.domainName}</h2>
                    </div>
                    <p className="mt-1 font-sans text-[13px] text-black/55">
                      {details.site?.siteName || "Your website"}
                      {details.templateName ? ` · ${details.templateName} template` : ""} · Order {o.orderRef}
                    </p>
                  </div>
                  <StatusTimeline status={o.status} />
                </div>

                <div className="mt-5 grid gap-3 border-t border-black/5 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="font-sans text-[11.5px] font-semibold uppercase tracking-wide text-black/40">Plan</p>
                    <p className="mt-0.5 font-sans text-[14.5px] font-medium">{o.planName} · {formatUsd(o.planPrice)}/mo</p>
                  </div>
                  <div>
                    <p className="font-sans text-[11.5px] font-semibold uppercase tracking-wide text-black/40">Storage</p>
                    <p className="mt-0.5 font-sans text-[14.5px] font-medium">{o.storageGbOverride ? `${o.storageGbOverride} GB` : "Plan allowance"}</p>
                  </div>
                  <div>
                    <p className="font-sans text-[11.5px] font-semibold uppercase tracking-wide text-black/40">Domain</p>
                    <p className="mt-0.5 font-sans text-[14.5px] font-medium">
                      {o.domainType === "temp" ? "Free subdomain" : o.domainType === "new" ? "Registered for you" : details.connectService ? "Yours — we connect it" : "Yours"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {o.status === "ACTIVE" ? (
                    <>
                      <a
                        href={`https://${o.domainName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-wine-500 px-5 py-2.5 font-display text-[12.5px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700"
                      >
                        Visit site ↗
                      </a>
                      {o.wpAdminUrl && (
                        <a
                          href={o.wpAdminUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-wine-500 px-5 py-2.5 font-display text-[12.5px] font-bold uppercase tracking-wide text-wine-500 transition hover:bg-wine-500 hover:text-white"
                        >
                          WordPress admin ↗
                        </a>
                      )}
                    </>
                  ) : o.status === "CANCELLED" ? null : (
                    <p className="font-sans text-[13.5px] text-black/55">
                      Our team is building your site — your WordPress login arrives by email when it&apos;s ready.
                    </p>
                  )}
                  <a
                    href={`mailto:support@designik.us?subject=Help with ${o.domainName} (${o.orderRef})`}
                    className="rounded-full border border-black/15 px-5 py-2.5 font-display text-[12.5px] font-bold uppercase tracking-wide text-black/55 transition hover:border-black/40"
                  >
                    Get help
                  </a>
                </div>
              </section>
            );
          })}

          {!visible.length && (
            <section className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-12 text-center">
              <p className="font-display text-[18px] font-semibold uppercase text-black/60">No websites yet</p>
              <p className="mx-auto mt-2 max-w-sm font-sans text-[14px] text-black/50">
                Pick a plan and we&apos;ll build your WordPress site — free during our launch period.
              </p>
              <Link
                href="/hosting"
                className="mt-5 inline-block rounded-full bg-wine-500 px-6 py-3 font-display text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700"
              >
                Start your first website
              </Link>
            </section>
          )}
        </div>

        {/* account */}
        <h2 className="mt-12 font-display text-[20px] font-semibold uppercase text-[#1b1c20]">Account</h2>
        <section className="mt-4 max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h3 className="font-display text-[14px] font-semibold uppercase text-wine-500">Change password</h3>
          {pw === "done" && <p className="mt-2 font-sans text-[13px] font-medium text-emerald-600">Password updated.</p>}
          {pw === "wrong" && <p className="mt-2 font-sans text-[13px] font-medium text-red-600">Current password was incorrect.</p>}
          {pw === "short" && <p className="mt-2 font-sans text-[13px] font-medium text-red-600">New password needs 8+ characters.</p>}
          <form action={changeCustomerPassword} className="mt-4 space-y-3">
            <input name="current" type="password" placeholder="Current password" autoComplete="current-password" required className={input} />
            <input name="next" type="password" placeholder="New password (8+ characters)" autoComplete="new-password" required className={input} />
            <button className="rounded-full bg-wine-500 px-5 py-2.5 font-display text-[12.5px] font-bold uppercase tracking-wide text-white transition hover:bg-wine-700">
              Update password
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
