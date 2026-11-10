
import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const allowedOrigins = new Set([
  "http://localhost:4173",
]);

export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  const headers: Record<string, string> = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    Vary: "Origin",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  const config = await getSiteConfig();

  return NextResponse.json(config, { headers });
}
