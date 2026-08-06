/**
 * Payment layer for the hosting storefront.
 *
 * Currently MOCK ONLY: charge() approves everything instantly and returns a
 * TEST reference, so the whole order pipeline (checkout → order row → emails
 * → admin provisioning) can run end-to-end with no gateway account.
 *
 * Going live later = implement charge() against Stripe with the same
 * signature (create PaymentIntent / Checkout Session, verify, return its id)
 * and flip PAYMENTS_MODE. Nothing else in the app changes — callers only see
 * { ok, reference, status }.
 */

export const PAYMENTS_MODE: "test" | "live" =
  process.env.PAYMENTS_MODE === "live" ? "live" : "test";

export type ChargeResult =
  | { ok: true; reference: string; status: "FREE" | "PAID" }
  | { ok: false; error: string };

export async function charge(_opts: {
  amountCents: number;
  description: string;
  customerEmail: string;
}): Promise<ChargeResult> {
  if (PAYMENTS_MODE === "live") {
    // Guard: never pretend a live payment happened.
    return { ok: false, error: "Live payments are not configured yet." };
  }
  return {
    ok: true,
    reference: `FREE-${Date.now().toString(36).toUpperCase()}`,
    status: "FREE",
  };
}
