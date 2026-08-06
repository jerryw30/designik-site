"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingCustomers, hostingCustomerSessions, hostingOrders, hostingPlans } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { formatUsd } from "@/lib/hosting";
import { sendCustomerEmail } from "@/lib/mailer";
import { requirePermission } from "@/lib/permissions";

/** Hosting management is settings-level: SUPER_ADMIN and ADMIN only. */
async function authorize() {
  return requirePermission("manage_settings");
}

const refresh = () => {
  revalidatePath("/admin/hosting");
  revalidatePath("/hosting");
};

/* --------------------------------- orders -------------------------------- */

export async function updateOrderStatus(id: string, status: string) {
  const user = await authorize();
  if (!["PENDING", "PROVISIONING", "ACTIVE", "CANCELLED"].includes(status)) return;
  await db.update(hostingOrders).set({ status, updatedAt: new Date() }).where(eq(hostingOrders.id, id));
  await logActivity(user, "hosting.order.status", `Order ${id} → ${status}`);
  refresh();
}

export async function saveOrderDetails(id: string, form: FormData) {
  const user = await authorize();
  const storageRaw = String(form.get("storageGbOverride") || "").trim();
  await db
    .update(hostingOrders)
    .set({
      wpAdminUrl: String(form.get("wpAdminUrl") || "").trim(),
      wpUsername: String(form.get("wpUsername") || "").trim(),
      notes: String(form.get("notes") || ""),
      storageGbOverride: storageRaw ? Math.max(1, parseInt(storageRaw, 10) || 0) : null,
      updatedAt: new Date(),
    })
    .where(eq(hostingOrders.id, id));
  await logActivity(user, "hosting.order.update", `Order ${id} details saved`);
  refresh();
}

export async function setOrderBlocked(id: string, blocked: boolean) {
  const user = await authorize();
  await db
    .update(hostingOrders)
    .set({ blocked, updatedAt: new Date() })
    .where(eq(hostingOrders.id, id));
  await logActivity(user, "hosting.order.block", `Order ${id} ${blocked ? "blocked" : "unblocked"}`);
  refresh();
}

/**
 * Mark active and email the customer their WordPress login. The temporary
 * password is typed by the admin and sent once — it is never stored.
 */
export async function sendCredentials(id: string, form: FormData) {
  const user = await authorize();
  const [order] = await db.select().from(hostingOrders).where(eq(hostingOrders.id, id)).limit(1);
  if (!order) return { ok: false, error: "Order not found." };

  const wpAdminUrl = String(form.get("wpAdminUrl") || "").trim();
  const wpUsername = String(form.get("wpUsername") || "").trim();
  const tempPassword = String(form.get("tempPassword") || "").trim();
  if (!wpAdminUrl || !wpUsername || !tempPassword)
    return { ok: false, error: "Admin URL, username and temporary password are all required." };

  const result = await sendCustomerEmail({
    to: order.customerEmail,
    subject: `Your WordPress site is ready — ${order.domainName}`,
    text: `Hi ${order.customerName},

Your WordPress site is ready!

  Site:      https://${order.domainName}
  Login:     ${wpAdminUrl}
  Username:  ${wpUsername}
  Password:  ${tempPassword}

Please sign in and change your password right away (Users → Profile).

Your ${order.planName} plan (${formatUsd(order.planPrice)}/mo) is active.
Need help? Just reply to this email.

— The Designik team
https://designik.us`,
  });
  if (!result.sent)
    return { ok: false, error: `Email failed: ${result.error || "SMTP not configured"}` };

  await db
    .update(hostingOrders)
    .set({ status: "ACTIVE", wpAdminUrl, wpUsername, credentialsSentAt: new Date(), updatedAt: new Date() })
    .where(eq(hostingOrders.id, id));
  await logActivity(user, "hosting.order.credentials", `Credentials sent for ${order.orderRef} (${order.domainName})`);
  refresh();
  return { ok: true };
}

/* ---------------------------------- plans --------------------------------- */

export async function savePlan(form: FormData) {
  const user = await authorize();
  const id = String(form.get("id") || "");
  const values = {
    name: String(form.get("name") || "").trim(),
    slug: String(form.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    priceMonthly: Math.max(0, Math.round(parseFloat(String(form.get("priceMonthly") || "0")) * 100)),
    storageGb: Math.max(1, parseInt(String(form.get("storageGb") || "1"), 10) || 1),
    features: String(form.get("features") || "")
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean),
    position: parseInt(String(form.get("position") || "0"), 10) || 0,
    active: form.get("active") === "on",
    updatedAt: new Date(),
  };
  if (!values.name || !values.slug) return;
  if (id) {
    await db.update(hostingPlans).set(values).where(eq(hostingPlans.id, id));
  } else {
    await db.insert(hostingPlans).values(values);
  }
  await logActivity(user, "hosting.plan.save", `Plan ${values.name} saved`);
  refresh();
  redirect("/admin/hosting/plans");
}

export async function deletePlan(id: string) {
  const user = await authorize();
  await db.delete(hostingPlans).where(eq(hostingPlans.id, id));
  await logActivity(user, "hosting.plan.delete", `Plan ${id} deleted`);
  refresh();
}

/* -------------------------------- customers ------------------------------- */

export async function setCustomerBlocked(id: string, blocked: boolean) {
  const user = await authorize();
  await db
    .update(hostingCustomers)
    .set({ blocked, updatedAt: new Date() })
    .where(eq(hostingCustomers.id, id));
  // Blocking must take effect immediately, not at cookie expiry.
  if (blocked)
    await db.delete(hostingCustomerSessions).where(eq(hostingCustomerSessions.customerId, id));
  await logActivity(user, "hosting.customer.block", `Customer ${id} ${blocked ? "blocked" : "unblocked"}`);
  revalidatePath("/admin/hosting/customers");
}
