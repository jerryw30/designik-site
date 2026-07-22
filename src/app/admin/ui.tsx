export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#140109] p-6 text-white">
      {/* ambient brand glow */}
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#a10140] opacity-25 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-[#db2f73] opacity-20 blur-[160px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-70px] top-[-60px] h-72 w-72 bg-white opacity-[0.04]"
        style={{
          WebkitMaskImage: "url(/figma/vector1.svg)",
          maskImage: "url(/figma/vector1.svg)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <section className="relative w-full max-w-md rounded-[26px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <div className="mb-9 flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-8 w-8 bg-white"
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
          <span className="text-lg font-bold tracking-wide">
            DESIGNIK <span className="text-[#ff5b93]">CMS</span>
          </span>
        </div>
        <h1 className="text-[28px] font-semibold leading-tight">{title}</h1>
        <p className="mb-8 mt-2 text-[14px] leading-relaxed text-white/55">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
