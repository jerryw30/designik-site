export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#18020b] p-6 text-white"><section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/[.07] p-8 shadow-2xl"><div className="mb-8 text-2xl font-bold">DESIGNIK <span className="text-pink-400">EDITOR</span></div><h1 className="text-3xl font-semibold">{title}</h1><p className="mb-8 mt-2 text-white/60">{subtitle}</p>{children}</section></main>;
}
