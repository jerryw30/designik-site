import { NextRequest } from "next/server";
import {
  createCustomerSession,
  currentCustomer,
  destroyCustomerSession,
  registerCustomer,
  verifyCustomer,
} from "@/lib/customer-auth";

export const runtime = "nodejs";

/** GET /api/hosting/auth — who am I (used by the checkout wizard). */
export async function GET() {
  const customer = await currentCustomer();
  return Response.json({ ok: true, customer });
}

/**
 * POST /api/hosting/auth — { action: "signup" | "login" | "logout", ... }.
 * One route keeps the wizard's client code trivial.
 */
export async function POST(request: NextRequest) {
  let body: { action?: string; name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (body.action === "logout") {
    await destroyCustomerSession();
    return Response.json({ ok: true });
  }
  if (body.action === "signup") {
    const result = await registerCustomer(String(body.name || ""), email, password);
    if (!result.ok) return Response.json(result, { status: 400 });
    await createCustomerSession(result.customer.id);
    return Response.json({ ok: true, customer: result.customer });
  }
  if (body.action === "login") {
    const result = await verifyCustomer(email, password);
    if (!result.ok) return Response.json(result, { status: 401 });
    await createCustomerSession(result.customer.id);
    return Response.json({ ok: true, customer: result.customer });
  }
  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
