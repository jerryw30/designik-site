import { NextRequest } from "next/server";
import { domainAvailable, domainPriceFor, validDomain } from "@/lib/hosting";

export const runtime = "nodejs";

/** GET /api/hosting/domain-check?domain=example.com */
export async function GET(request: NextRequest) {
  const domain = (request.nextUrl.searchParams.get("domain") || "")
    .toLowerCase()
    .trim();
  if (!validDomain(domain)) {
    return Response.json(
      { ok: false, error: "Enter a valid domain like example.com" },
      { status: 400 },
    );
  }
  const price = domainPriceFor(domain);
  if (price === null) {
    return Response.json(
      { ok: false, error: "We don't sell that domain ending yet." },
      { status: 400 },
    );
  }
  const available = await domainAvailable(domain);
  return Response.json({ ok: true, domain, available, priceCents: price });
}
