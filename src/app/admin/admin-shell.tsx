import Link from "next/link";
import { logout } from "./actions";

const groups = [
  ["Dashboard", "/admin", "⌂"],
  ["Pages", "/admin/pages", "▤"],
  ["Posts", "/admin/posts", "✎"],
  ["Media", "/admin/media", "▧"],
  ["Templates", "/admin/templates", "◇"],
  ["Saved Sections", "/admin/saved-sections", "▱"],
  ["Header Builder", "/admin/headers", "▔"],
  ["Footer Builder", "/admin/footers", "▁"],
  ["Popup Builder", "/admin/popups", "□"],
  ["Forms", "/admin/forms", "☷"],
  ["Leads", "/admin/leads", "◎"],
  ["Menus", "/admin/menus", "☰"],
  ["Global Styles", "/admin/styles", "◉"],
  ["SEO", "/admin/seo", "⌕"],
  ["Users", "/admin/users", "♟"],
  ["Revisions", "/admin/revisions", "↶"],
  ["Settings", "/admin/settings", "⚙"],
  ["Tools", "/admin/tools", "⇄"],
] as const;

export function AdminShell({
  user,
  title,
  children,
  wide = false,
}: {
  user: { name: string; role: string };
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#202126]">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-[#17181d] text-white">
        <div className="flex h-16 items-center border-b border-white/10 px-5 font-bold">
          DESIGNIK <span className="ml-1 text-pink-400">CMS</span>
        </div>
        <nav className="space-y-1 p-3">
          {groups.map(([label, href, icon]) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              <span className="w-5 text-center text-white/45">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-7">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <a href="/" target="_blank" className="font-medium text-pink-600">
              View site
            </a>
            <span>
              {user.name} · {user.role.replaceAll("_", " ")}
            </span>
            <form action={logout}>
              <button className="hover:text-red-600">Logout</button>
            </form>
          </div>
        </header>
        <div className={wide ? "p-0" : "mx-auto max-w-[1500px] p-7"}>
          {children}
        </div>
      </div>
    </main>
  );
}
