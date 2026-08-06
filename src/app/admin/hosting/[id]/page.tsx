import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { hostingOrders, hostingPlans } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { formatUsd } from "@/lib/hosting";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../../admin-shell";
import { T, wpDate } from "../../theme";
import { saveOrderDetails, sendCredentials, setOrderBlocked, updateOrderStatus } from "../actions";
import { CredentialsForm } from "../hosting-forms";

export const dynamic = "force-dynamic";

const CHECKLIST = [
  "hPanel → Websites → Add website (or subdomain of designik.us for temp sites)",
  "Install WordPress via hPanel's one-click installer",
  "Apply the Designik white-label setup (theme + plugin bundle, remove host branding)",
  "Set the customer's storage quota if this plan/override requires it",
  "Create their admin user with a strong temporary password",
  "Verify the site loads over HTTPS, then send credentials below",
];

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "hosting")) redirect("/admin");

  const { id } = await params;
  const [order] = await db.select().from(hostingOrders).where(eq(hostingOrders.id, id)).limit(1);
  if (!order) notFound();
  const [plan] = order.planId
    ? await db.select().from(hostingPlans).where(eq(hostingPlans.id, order.planId)).limit(1)
    : [];

  const storage = order.storageGbOverride ?? plan?.storageGb;
  const details = (order.details || {}) as {
    template?: string;
    templateName?: string;
    connectService?: boolean;
    registrar?: string;
    site?: { siteName?: string; tagline?: string; description?: string; brandColor?: string; pages?: string[]; notes?: string };
  };
  const site = details.site || {};

  return (
    <AdminShell user={user} title={`Order ${order.orderRef}`}>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/hosting" className={T.mutedLink}>← Hosting orders</Link>
          <h1 className={`${T.screenTitle} mt-1`}>
            {order.orderRef}
            {(order.paymentStatus === "TEST_PAID" || order.paymentStatus === "FREE") && (
              <span className="ml-2 align-middle inline-flex rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-700">Free order</span>
            )}
            {order.blocked && (
              <span className={`ml-2 align-middle ${T.pillTrash}`}>BLOCKED</span>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          {["PENDING", "PROVISIONING", "ACTIVE", "CANCELLED"].map((s) => (
            <form key={s} action={updateOrderStatus.bind(null, order.id, s)}>
              <button
                className={order.status === s ? T.btnPrimary : T.btn}
                disabled={order.status === s}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className={T.card}>
            <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">What to build</h2></div>
            <dl className="grid gap-x-6 gap-y-2.5 p-5 text-[13.5px] sm:grid-cols-2">
              <div><dt className="text-neutral-400">Template</dt><dd className="font-medium">{details.templateName || details.template || "—"}</dd></div>
              <div><dt className="text-neutral-400">Site name</dt><dd className="font-medium">{site.siteName || "—"}</dd></div>
              <div><dt className="text-neutral-400">Tagline</dt><dd className="font-medium">{site.tagline || "—"}</dd></div>
              <div>
                <dt className="text-neutral-400">Brand color</dt>
                <dd className="flex items-center gap-2 font-medium">
                  {site.brandColor ? (<><span className="inline-block h-4 w-4 rounded border border-black/10" style={{ background: site.brandColor }} />{site.brandColor}</>) : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2"><dt className="text-neutral-400">Pages</dt><dd className="font-medium">{site.pages?.length ? site.pages.join(", ") : "default set"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-neutral-400">About the site</dt><dd className="whitespace-pre-wrap">{site.description || "—"}</dd></div>
              {site.notes ? (<div className="sm:col-span-2"><dt className="text-neutral-400">Customer notes</dt><dd className="whitespace-pre-wrap">{site.notes}</dd></div>) : null}
              {order.domainType === "own" ? (
                <div className="sm:col-span-2">
                  <dt className="text-neutral-400">Domain connection</dt>
                  <dd className="font-medium">
                    {details.connectService ? `WE CONNECT IT (service ordered) — registrar: ${details.registrar || "not given"}` : "Customer connects it themselves"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className={T.card}>
            <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">Provisioning checklist (manual — Hostinger hPanel)</h2></div>
            <ol className="list-decimal space-y-2 p-5 pl-10 text-[13.5px] text-neutral-700">
              {CHECKLIST.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className={T.card}>
            <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">Send WordPress credentials</h2></div>
            <div className="p-5">
              <CredentialsForm
                orderId={order.id}
                defaults={{ wpAdminUrl: order.wpAdminUrl, wpUsername: order.wpUsername }}
                action={sendCredentials}
              />
              {order.credentialsSentAt && (
                <p className={T.help}>Last sent {wpDate(order.credentialsSentAt)}.</p>
              )}
            </div>
          </section>

          <section className={T.card}>
            <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">Storage & notes</h2></div>
            <form action={saveOrderDetails.bind(null, order.id)} className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={T.label}>Storage override (GB)</label>
                  <input
                    name="storageGbOverride"
                    type="number"
                    min={1}
                    defaultValue={order.storageGbOverride ?? ""}
                    placeholder={`Plan default: ${plan?.storageGb ?? "—"} GB`}
                    className={T.input}
                  />
                  <p className={T.help}>Blank = use the plan&apos;s {plan?.storageGb ?? "—"} GB. Apply the quota in hPanel too.</p>
                </div>
                <div>
                  <label className={T.label}>WP admin URL (record only)</label>
                  <input name="wpAdminUrl" defaultValue={order.wpAdminUrl} className={T.input} />
                  <input type="hidden" name="wpUsername" value={order.wpUsername} />
                </div>
              </div>
              <div>
                <label className={T.label}>Internal notes</label>
                <textarea name="notes" defaultValue={order.notes} rows={3} className={T.input} />
              </div>
              <button className={T.btn}>Save</button>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className={T.card}>
            <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">Customer</h2></div>
            <dl className="space-y-2.5 p-5 text-[13.5px]">
              <div><dt className="text-neutral-400">Name</dt><dd className="font-medium">{order.customerName}</dd></div>
              <div><dt className="text-neutral-400">Email</dt><dd className="font-medium">{order.customerEmail}</dd></div>
              <div><dt className="text-neutral-400">Website</dt><dd className="font-medium">{order.domainName} <span className="text-neutral-400">({order.domainType})</span></dd></div>
              <div><dt className="text-neutral-400">Plan</dt><dd className="font-medium">{order.planName} · {storage ?? "—"} GB{order.storageGbOverride ? " (custom)" : ""}</dd></div>
              <div><dt className="text-neutral-400">Paid</dt><dd className="font-medium">{formatUsd(order.totalPaid)} <span className="text-neutral-400">{order.paymentStatus} · {order.paymentRef}</span></dd></div>
              <div><dt className="text-neutral-400">Ordered</dt><dd className="font-medium">{wpDate(order.createdAt)}</dd></div>
            </dl>
          </section>

          <section className={T.card}>
            <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">{order.blocked ? "Unblock customer" : "Block customer"}</h2></div>
            <div className="p-5">
              <p className="text-[13px] text-neutral-500">
                {order.blocked
                  ? "Unblocking lets this email order again. Re-enable their site in hPanel yourself."
                  : "Blocking stops new orders from this email. Suspend the site in hPanel yourself — blocking here doesn't touch the server."}
              </p>
              <form action={setOrderBlocked.bind(null, order.id, !order.blocked)} className="mt-3">
                <button className={order.blocked ? T.btn : T.btnDanger}>
                  {order.blocked ? "Unblock" : "Block this customer"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
