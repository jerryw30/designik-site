"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends one page-view per route change to the first-party tracker. */
export default function SiteAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    let sid = "";
    let isNewSession = false;
    try {
      sid = sessionStorage.getItem("dk_sid") || "";
      if (!sid) {
        isNewSession = true;
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("dk_sid", sid);
      }
    } catch {
      sid = "anon";
    }
    const body = JSON.stringify({
      path: pathname,
      // Only report the external referrer on the session's first hit —
      // later navigations are internal.
      referrer: isNewSession ? document.referrer : "",
      sessionId: sid,
    });
    try {
      const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
      if (!sent) {
        fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      /* never break the site for analytics */
    }
  }, [pathname]);
  return null;
}
