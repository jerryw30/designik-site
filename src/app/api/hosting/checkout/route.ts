import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { hostingOrders, hostingPlans } from "@/db/schema";
import {
  DOMAIN_CONNECT_FEE,
  domainAvailable,
  domainPriceFor,
  formatUsd,
  makeOrderRef,
  normalizeSubdomain,
  SITE_TEMPLATES,
  subdomainProblem,
  TEMP_DOMAIN_SUFFIX,
  validDomain,
} from "@/lib/hosting";
import { sendCustomerEmail, sendNotification } from "@/lib/mailer";
import { charge, PAYMENTS_MODE } from "@/lib/payments";

export const runtime = "nodejs";

type Body = {
  planSlug?: string;
  domainType?: "temp" | "new" | "own";
  domain?: string;
  customerName?: string;
  customerEmail?: string;
  template?: string;
  connectService?: boolean;
  registrar?: string;
  site?: {
    siteName?: string;
    tagline?: string;
    description?: string;
    brandColor?: string;
    pages?: string[];
    notes?: string;
  };
};

/**
 * POST /api/hosting/checkout — validates the order, takes payment (TEST mode
 * for now), records it, and emails both the customer and the admin team.
 */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const name = String(body.customerName || "").trim();
  const email = String(body.customerEmail || "").trim().toLowerCase();
  if (name.length < 2)
    return Response.json({ ok: false, error: "Enter your name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return Response.json({ ok: false, error: "Enter a valid email." }, { status: 400 });

  // Blocked customers can't order again with the same email.
  const [blockedRow] = await db
    .select({ id: hostingOrders.id })
    .from(hostingOrders)
    .where(and(eq(hostingOrders.customerEmail, email), eq(hostingOrders.blocked, true)))
    .limit(1);
  if (blockedRow)
    return Response.json(
      { ok: false, error: "This account can't place orders. Contact support@designik.us." },
      { status: 403 },
    );

  const [plan] = await db
    .select()
    .from(hostingPlans)
    .where(and(eq(hostingPlans.slug, String(body.planSlug || "")), eq(hostingPlans.active, true)))
    .limit(1);
  if (!plan)
    return Response.json({ ok: false, error: "Pick a plan." }, { status: 400 });

  const template = SITE_TEMPLATES.find((t) => t.key === String(body.template || ""));
  if (!template)
    return Response.json({ ok: false, error: "Pick a template." }, { status: 400 });
  const site = body.site || {};
  const siteName = String(site.siteName || "").trim().slice(0, 120);
  const siteDescription = String(site.description || "").trim().slice(0, 2000);
  if (siteName.length < 2)
    return Response.json({ ok: false, error: "Enter your site name." }, { status: 400 });
  if (siteDescription.length < 10)
    return Response.json({ ok: false, error: "Tell us a little more about your site." }, { status: 400 });

  // Resolve the domain choice.
  const domainType = body.domainType;
  let domainName = "";
  let domainPrice = 0;

  if (domainType === "temp") {
    const sub = normalizeSubdomain(String(body.domain || ""));
    const problem = subdomainProblem(sub);
    if (problem) return Response.json({ ok: false, error: problem }, { status: 400 });
    domainName = `${sub}.${TEMP_DOMAIN_SUFFIX}`;
  } else if (domainType === "new") {
    const d = String(body.domain || "").toLowerCase().trim();
    if (!validDomain(d))
      return Response.json({ ok: false, error: "Enter a valid domain." }, { status: 400 });
    const price = domainPriceFor(d);
    if (price === null)
      return Response.json({ ok: false, error: "That domain ending isn't supported." }, { status: 400 });
    // Re-verify availability server-side; a stale UI check must not sell a
    // domain someone else owns.
    if ((await domainAvailable(d)) === false)
      return Response.json({ ok: false, error: "That domain is already taken." }, { status: 400 });
    domainName = d;
    domainPrice = price;
  } else if (domainType === "own") {
    const d = String(body.domain || "").toLowerCase().trim();
    if (!validDomain(d))
      return Response.json({ ok: false, error: "Enter the domain you own." }, { status: 400 });
    domainName = d;
  } else {
    return Response.json({ ok: false, error: "Choose a domain option." }, { status: 400 });
  }

  // One active order per domain/subdomain.
  const [clash] = await db
    .select({ id: hostingOrders.id })
    .from(hostingOrders)
    .where(eq(hostingOrders.domainName, domainName))
    .limit(1);
  if (clash)
    return Response.json({ ok: false, error: "That name was just taken — pick another." }, { status: 409 });

  const connectService = domainType === "own" && Boolean(body.connectService);
  const connectPrice = connectService ? DOMAIN_CONNECT_FEE : 0;
  const total = plan.priceMonthly + domainPrice + connectPrice;
  const payment = await charge({
    amountCents: total,
    description: `Designik hosting: ${plan.name} + ${domainName}`,
    customerEmail: email,
  });
  if (!payment.ok)
    return Response.json({ ok: false, error: payment.error }, { status: 402 });

  const orderRef = makeOrderRef();
  const [order] = await db
    .insert(hostingOrders)
    .values({
      orderRef,
      planId: plan.id,
      planName: plan.name,
      planPrice: plan.priceMonthly,
      customerName: name,
      customerEmail: email,
      domainType,
      domainName,
      domainPrice: domainPrice + connectPrice,
      totalPaid: total,
      details: {
        template: template.key,
        templateName: template.name,
        connectService,
        registrar: String(body.registrar || "").trim().slice(0, 120),
        site: {
          siteName,
          tagline: String(site.tagline || "").trim().slice(0, 200),
          description: siteDescription,
          brandColor: String(site.brandColor || "").trim().slice(0, 20),
          pages: Array.isArray(site.pages) ? site.pages.map(String).slice(0, 12) : [],
          notes: String(site.notes || "").trim().slice(0, 2000),
        },
      },
      paymentStatus: payment.status,
      paymentProvider: PAYMENTS_MODE === "test" ? "mock" : "stripe",
      paymentRef: payment.reference,
      status: "PENDING",
    })
    .returning({ id: hostingOrders.id });

  const testTag = PAYMENTS_MODE === "test" ? " (free during our launch period)" : "";
  // Best-effort emails; the order stands even if SMTP is down.
  await Promise.all([
    sendCustomerEmail({
      to: email,
      subject: `Your Designik order ${orderRef} — we're building your site`,
      text: `Hi ${name},

Thanks for your order!${testTag}

Order ${orderRef}
  Plan:    ${plan.name} (${formatUsd(plan.priceMonthly)}/mo)
  Website: ${domainName}${domainPrice ? `\n  Domain:  ${formatUsd(domainPrice)}/yr` : ""}
  Total:   ${formatUsd(total)}

Our team is setting up your WordPress site now. You'll receive your login
details in a separate email shortly (usually within a few hours).

— The Designik team
https://designik.us`,
    }),
    sendNotification({
      subject: `New hosting order ${orderRef}: ${plan.name} for ${domainName}${testTag}`,
      text: `Provision this order in hPanel, then mark it active in /admin/hosting.

Customer: ${name} <${email}>
Plan:     ${plan.name} (${plan.storageGb}GB)
Template: ${template.name}
Domain:   ${domainName} (${domainType})${connectService ? ` — CONNECT SERVICE, registrar: ${String(body.registrar || "?")}` : ""}
Site:     ${siteName} — ${siteDescription.slice(0, 200)}
Pages:    ${(Array.isArray(site.pages) ? site.pages : []).join(", ") || "default"}
Total:    ${formatUsd(total)} ${payment.status}`,
      replyTo: email,
    }),
  ]);

  return Response.json({ ok: true, orderRef, orderId: order.id });
}
