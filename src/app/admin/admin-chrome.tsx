"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Icon set — small inline SVGs (lucide-style, 1.7px stroke)           */
/* ------------------------------------------------------------------ */
function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className || "h-[17px] w-[17px]"} aria-hidden>
      {d.split("|").map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

const I = {
  home: "M3 10.5 12 3l9 7.5|M5 9.5V21h14V9.5|M9 21v-6h6v6",
  pages: "M6 2h9l5 5v15H6z|M14 2v6h6",
  posts: "M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  media: "M3 5h18v14H3z|M3 15l5-5 4 4 3-3 6 6|M8.5 9.5a1 1 0 1 0 0-.01",
  templates: "M3 3h18v4H3z|M3 10h8v11H3z|M14 10h7v11h-7z",
  saved: "M19 21 12 16 5 21V4h14z",
  header: "M3 4h18v5H3z|M3 13h18|M3 18h12",
  footer: "M3 15h18v5H3z|M3 10h18|M3 5h12",
  popup: "M4 4h16v12H4z|M9 20h6|M12 16v4",
  forms: "M4 3h16v18H4z|M8 8h8|M8 12h8|M8 16h5",
  leads: "M12 12a4 4 0 1 0-.01 0|M4 21a8 8 0 0 1 16 0",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12",
  menus: "M4 6h16|M4 12h16|M4 18h16",
  styles: "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 4 .5 5-2a9 9 0 0 0-7-11|M7.5 10.5a1 1 0 1 0 0-.01|M12 7.5a1 1 0 1 0 0-.01|M16.5 10.5a1 1 0 1 0 0-.01",
  seo: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16|M21 21l-4.3-4.3",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M22 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8",
  revisions: "M3 12a9 9 0 1 0 2.6-6.4L3 8|M3 3v5h5|M12 7v5l3 3",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6|M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  tools: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-3-3z",
  external: "M18 13v6H5V6h6|M15 3h6v6|M10 14 21 3",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9",
  menu: "M4 6h16|M4 12h16|M4 18h16",
  close: "M6 6l12 12|M18 6 6 18",
};

/* ------------------------------------------------------------------ */
/* Navigation model — grouped like WordPress                           */
/* ------------------------------------------------------------------ */
type BadgeKey = "leads" | "chat";
const NAV: { group: string; items: { label: string; href: string; icon: keyof typeof I; badge?: BadgeKey }[] }[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "home" }],
  },
  {
    group: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: "pages" },
      { label: "Posts", href: "/admin/posts", icon: "posts" },
      { label: "Media", href: "/admin/media", icon: "media" },
      { label: "Menus", href: "/admin/menus", icon: "menus" },
    ],
  },
  {
    group: "Design",
    items: [
      { label: "Templates", href: "/admin/templates", icon: "templates" },
      { label: "Saved Sections", href: "/admin/saved-sections", icon: "saved" },
      { label: "Headers", href: "/admin/headers", icon: "header" },
      { label: "Footers", href: "/admin/footers", icon: "footer" },
      { label: "Popups", href: "/admin/popups", icon: "popup" },
      { label: "Global Styles", href: "/admin/styles", icon: "styles" },
    ],
  },
  {
    group: "Engage",
    items: [
      { label: "Forms", href: "/admin/forms", icon: "forms" },
      { label: "Leads", href: "/admin/leads", icon: "leads", badge: "leads" },
      { label: "Chat", href: "/admin/chat", icon: "chat", badge: "chat" },
    ],
  },
  {
    group: "Site",
    items: [
      { label: "SEO", href: "/admin/seo", icon: "seo" },
      { label: "Users", href: "/admin/users", icon: "users" },
      { label: "Activity", href: "/admin/activity", icon: "revisions" },
      { label: "Revisions", href: "/admin/revisions", icon: "revisions" },
      { label: "Settings", href: "/admin/settings", icon: "settings" },
      { label: "Tools", href: "/admin/tools", icon: "tools" },
    ],
  },
];

function NavList({ badges, onNavigate }: { badges: Partial<Record<BadgeKey, number>>; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
  return (
    <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-4 [scrollbar-width:thin]">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{g.group}</p>
          <div className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              const badge = item.badge ? badges[item.badge] : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "bg-gradient-to-r from-[#a10140] to-[#c81a5e] text-white shadow-[0_4px_14px_rgba(161,1,64,0.35)]"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className={active ? "text-white" : "text-white/40 group-hover:text-white/70"}>
                    <Icon d={I[item.icon]} />
                  </span>
                  {item.label}
                  {badge ? (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ff2e73] px-1.5 text-[11px] font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-5">
      <span
        aria-hidden
        className="h-7 w-7 shrink-0 bg-white"
        style={{
          WebkitMaskImage: "url(/figma/vector1.svg)",
          maskImage: "url(/figma/vector1.svg)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      <span className="text-[15px] font-bold tracking-wide text-white">
        DESIGNIK <span className="text-[#ff5b93]">CMS</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome: sidebar + topbar + content                                  */
/* ------------------------------------------------------------------ */
export function AdminChrome({
  user,
  title,
  badges,
  wide,
  logoutAction,
  children,
}: {
  user: { name: string; role: string };
  title: string;
  badges: Partial<Record<BadgeKey, number>>;
  wide?: boolean;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f3f4f7] text-[#1b1c20]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-[#131318] lg:flex">
        <Brand />
        <NavList badges={badges} />
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[268px] flex-col bg-[#131318] shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
                <Icon d={I.close} />
              </button>
            </div>
            <NavList badges={badges} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/[0.06] bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden">
            <Icon d={I.menu} />
          </button>
          <h1 className="truncate text-[17px] font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-neutral-600 transition hover:border-[#a10140]/40 hover:text-[#a10140] sm:flex"
            >
              <Icon d={I.external} className="h-3.5 w-3.5" />
              View site
            </a>
            <div className="hidden h-6 w-px bg-neutral-200 sm:block" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-[12px] font-bold text-white">
                {initials}
              </span>
              <span className="hidden leading-tight md:block">
                <span className="block text-[13px] font-semibold">{user.name}</span>
                <span className="block text-[11px] capitalize text-neutral-400">{user.role.replaceAll("_", " ").toLowerCase()}</span>
              </span>
            </div>
            <form action={logoutAction}>
              <button aria-label="Logout" title="Logout" className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600">
                <Icon d={I.logout} />
              </button>
            </form>
          </div>
        </header>

        <div className={wide ? "p-0" : "mx-auto max-w-[1440px] p-4 sm:p-6"}>{children}</div>
      </div>
    </main>
  );
}
