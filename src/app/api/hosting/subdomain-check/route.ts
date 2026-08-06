import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { hostingOrders } from "@/db/schema";
import {
  normalizeSubdomain,
  subdomainProblem,
  TEMP_DOMAIN_SUFFIX,
} from "@/lib/hosting";

export const runtime = "nodejs";

/** GET /api/hosting/subdomain-check?name=acme */
export async function GET(request: NextRequest) {
  const name = normalizeSubdomain(
    request.nextUrl.searchParams.get("name") || "",
  );
  const problem = subdomainProblem(name);
  if (problem) return Response.json({ ok: false, name, error: problem });

  const host = `${name}.${TEMP_DOMAIN_SUFFIX}`;
  const [taken] = await db
    .select({ id: hostingOrders.id })
    .from(hostingOrders)
    .where(eq(hostingOrders.domainName, host))
    .limit(1);
  return Response.json({ ok: true, name, host, available: !taken });
}
