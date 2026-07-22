import { db } from "@/db";
import { pageViews } from "@/db/schema";

/** First-party page-view tracking. Fire-and-forget from the site frontend. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: string; referrer?: string; sessionId?: string };
    const path = String(body.path || "").slice(0, 512);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) {
      return new Response(null, { status: 204 });
    }
    const referrer = String(body.referrer || "").slice(0, 1024);
    let referrerHost = "";
    if (referrer) {
      try {
        const host = new URL(referrer).hostname.replace(/^www\./, "");
        const ownHost = new URL(request.url).hostname.replace(/^www\./, "");
        if (host && host !== ownHost) referrerHost = host;
      } catch {
        /* ignore malformed referrers */
      }
    }
    const ua = request.headers.get("user-agent") || "";
    const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android/i.test(ua) ? "mobile" : "desktop";
    const country = (request.headers.get("x-vercel-ip-country") || "").slice(0, 8);
    await db.insert(pageViews).values({
      path,
      referrer: referrerHost ? referrer : "",
      referrerHost,
      country,
      device,
      sessionId: String(body.sessionId || "").slice(0, 64),
    });
  } catch {
    /* tracking must never error the client */
  }
  return new Response(null, { status: 204 });
}
