import { count, countDistinct, desc, gte, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pageViews } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";

export const dynamic = "force-dynamic";

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full rounded-full bg-gradient-to-r from-[#a10140] to-[#db2f73]" style={{ width: `${Math.max(2, pct)}%` }} />
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  const [
    [today],
    [week],
    [month],
    daily,
    topPages,
    topReferrers,
    countries,
    devices,
  ] = await Promise.all([
    db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(gte(pageViews.createdAt, daysAgo(0))),
    db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(gte(pageViews.createdAt, daysAgo(6))),
    db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(gte(pageViews.createdAt, daysAgo(29))),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${pageViews.createdAt}), 'YYYY-MM-DD')`, views: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, daysAgo(13)))
      .groupBy(sql`date_trunc('day', ${pageViews.createdAt})`)
      .orderBy(sql`date_trunc('day', ${pageViews.createdAt})`),
    db
      .select({ path: pageViews.path, views: count(), sessions: countDistinct(pageViews.sessionId) })
      .from(pageViews)
      .where(gte(pageViews.createdAt, daysAgo(29)))
      .groupBy(pageViews.path)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ host: pageViews.referrerHost, views: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, daysAgo(29)))
      .groupBy(pageViews.referrerHost)
      .orderBy(desc(count()))
      .limit(11),
    db
      .select({ country: pageViews.country, views: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, daysAgo(29)))
      .groupBy(pageViews.country)
      .orderBy(desc(count()))
      .limit(8),
    db
      .select({ device: pageViews.device, views: count() })
      .from(pageViews)
      .where(gte(pageViews.createdAt, daysAgo(29)))
      .groupBy(pageViews.device)
      .orderBy(desc(count())),
  ]);

  // fill 14-day series
  const byDay = new Map(daily.map((d) => [d.day, d.views]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = daysAgo(13 - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, label: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }), views: byDay.get(key) || 0 };
  });
  const maxDay = Math.max(1, ...series.map((s) => s.views));

  const direct = topReferrers.find((r) => !r.host);
  const external = topReferrers.filter((r) => r.host).slice(0, 8);
  const refTotal = Math.max(1, (direct?.views || 0) + external.reduce((a, r) => a + r.views, 0));
  const pageMax = Math.max(1, ...topPages.map((p) => p.views));
  const deviceTotal = Math.max(1, devices.reduce((a, d) => a + d.views, 0));
  const countryMax = Math.max(1, ...countries.map((c) => c.views));

  const stats = [
    { label: "Views today", value: today.views, sub: `${today.sessions} visitors` },
    { label: "Last 7 days", value: week.views, sub: `${week.sessions} visitors` },
    { label: "Last 30 days", value: month.views, sub: `${month.sessions} visitors` },
  ];

  return (
    <AdminShell user={user} title="Analytics">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={T.screenTitle}>Analytics</h2>
        <span className="text-[13px] text-neutral-400">First-party tracking — views, visitors, sources and geography.</span>
      </div>

      {/* headline stats */}
      <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={T.cardPad}>
            <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">{s.label}</p>
            <p className="mt-1.5 text-[30px] font-semibold leading-none">{s.value}</p>
            <p className="mt-1.5 text-[12.5px] text-neutral-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* daily chart */}
      <section className={`${T.card} mt-5`}>
        <div className={T.cardHeader}>
          <h3 className="text-[15px] font-semibold">Views — last 14 days</h3>
        </div>
        <div className="flex h-48 items-end gap-1.5 px-5 pb-4 pt-6 sm:gap-2.5">
          {series.map((s) => (
            <div key={s.key} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${s.label}: ${s.views} views`}>
              <span className="text-[10px] tabular-nums text-neutral-400 opacity-0 transition group-hover:opacity-100">{s.views}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#a10140] to-[#db2f73] transition-opacity group-hover:opacity-80"
                style={{ height: `${Math.max(3, (s.views / maxDay) * 100)}%` }}
              />
              <span className="truncate text-[9.5px] text-neutral-400">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* top pages */}
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold">Top pages · 30 days</h3>
          </div>
          {topPages.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No traffic recorded yet.</p>
          ) : (
            <ul className="space-y-3.5 p-5">
              {topPages.map((p) => (
                <li key={p.path}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-medium">{p.path}</span>
                    <span className="shrink-0 text-[12px] text-neutral-500">
                      {p.views} views · {p.sessions} visitors
                    </span>
                  </div>
                  <Bar pct={(p.views / pageMax) * 100} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* traffic sources */}
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold">Where visitors come from · 30 days</h3>
          </div>
          {!direct && external.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No traffic recorded yet.</p>
          ) : (
            <ul className="space-y-3.5 p-5">
              <li>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium">Direct / typed in</span>
                  <span className="text-[12px] text-neutral-500">{direct?.views || 0} views</span>
                </div>
                <Bar pct={((direct?.views || 0) / refTotal) * 100} />
              </li>
              {external.map((r) => (
                <li key={r.host}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-medium">{r.host}</span>
                    <span className="shrink-0 text-[12px] text-neutral-500">{r.views} views</span>
                  </div>
                  <Bar pct={(r.views / refTotal) * 100} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* countries */}
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold">Countries · 30 days</h3>
          </div>
          {countries.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No geography data yet.</p>
          ) : (
            <ul className="space-y-3.5 p-5">
              {countries.map((c) => {
                let name = "Unknown";
                try {
                  name = c.country ? COUNTRY_NAMES.of(c.country) || c.country : "Unknown";
                } catch {
                  name = c.country || "Unknown";
                }
                return (
                  <li key={c.country || "unknown"}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-medium">{name}</span>
                      <span className="text-[12px] text-neutral-500">{c.views} views</span>
                    </div>
                    <Bar pct={(c.views / countryMax) * 100} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* devices */}
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold">Devices · 30 days</h3>
          </div>
          {devices.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No device data yet.</p>
          ) : (
            <ul className="space-y-3.5 p-5">
              {devices.map((d) => (
                <li key={d.device || "unknown"}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium capitalize">{d.device || "unknown"}</span>
                    <span className="text-[12px] text-neutral-500">
                      {d.views} views · {Math.round((d.views / deviceTotal) * 100)}%
                    </span>
                  </div>
                  <Bar pct={(d.views / deviceTotal) * 100} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
