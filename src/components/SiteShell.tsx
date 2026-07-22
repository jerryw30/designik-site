"use client";
import { usePathname } from "next/navigation";
import SmoothScroll from "./SmoothScroll";
import SiteAnalytics from "./SiteAnalytics";
import BackToTop from "./ui/BackToTop";
import GetStartedModal from "./ui/GetStartedModal";
import ChatWidget from "./ui/ChatWidget";
import type { WebsiteSettings } from "@/cms/website-settings";
export default function SiteShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: WebsiteSettings;
}) {
  const pathname = usePathname();
  // Admin runs without the site chrome: no Lenis scroll hijack (it breaks
  // nested scroll areas like the sidebar) and no floating site widgets.
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  if (settings.behavior.maintenance && !pathname.startsWith("/admin")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-wine-900 px-6 text-center text-white">
        <div>
          {/* Administrator-provided logo URLs cannot be statically allowlisted. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.identity.logoUrl}
            alt={settings.identity.siteName}
            className="mx-auto mb-8 h-16 w-16"
          />
          <h1 className="font-display text-6xl uppercase">
            {settings.identity.siteName}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            {settings.behavior.maintenanceMessage}
          </p>
        </div>
      </main>
    );
  }
  return (
    <SmoothScroll>
      {children}
      <SiteAnalytics />
      <BackToTop />
      <ChatWidget />
      <GetStartedModal />
      {settings.custom.footerCode && (
        <script
          dangerouslySetInnerHTML={{ __html: settings.custom.footerCode }}
        />
      )}
    </SmoothScroll>
  );
}
