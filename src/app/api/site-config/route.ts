import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

/** Public site configuration for client widgets (chat, popups, booking). */
export async function GET() {
  const config = await getSiteConfig();
  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
