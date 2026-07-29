import { count, countDistinct, desc, gte, sql, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { chatConversations, pageViews } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";

export const dynamic = "force-dynamic";

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

/** Country code → flag emoji (regional indicator letters). */
function flagEmoji(code: string | null | undefined) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

const RANGES = [
  { key: "1d", label: "Today", days: 0 },
  { key: "7d", label: "7 days", days: 6 },
  { key: "30d", label: "30 days", days: 29 },
  { key: "90d", label: "90 days", days: 89 },
  { key: "12m", label: "12 months", days: 364 },
  { key: "all", label: "All time", days: null },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full rounded-full bg-gradient-to-r from-[#a10140] to-[#db2f73]" style={{ width: `${Math.max(2, pct)}%` }} />
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const range = (RANGES.find((r) => r.key === params.range)?.key || "30d") as RangeKey;
  const rangeDef = RANGES.find((r) => r.key === range)!;
  const since = rangeDef.days === null ? null : daysAgo(rangeDef.days);
  const inRange: SQL[] = since ? [gte(pageViews.createdAt, since)] : [];
  const whereRange = inRange.length ? inRange[0] : undefined;

  // Long ranges bucket by month, short ones by day.
  const monthly = rangeDef.days === null || rangeDef.days > 92;
  const bucket = monthly ? sql`date_trunc('month', ${pageViews.createdAt})` : sql`date_trunc('day', ${pageViews.createdAt})`;
  const bucketFmt = monthly ? "YYYY-MM" : "YYYY-MM-DD";

  const [
    [today],
    [week],
    [inRangeTotals],
    seriesRaw,
    topPages,
    topReferrers,
    countries,
    devices,
    [chats],
  ] = await Promise.all([
    db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(gte(pageViews.createdAt, daysAgo(0))),
    db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(gte(pageViews.createdAt, daysAgo(6))),
    whereRange
      ? db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(whereRange)
      : db.select({ views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews),
    (whereRange
      ? db
          .select({ day: sql<string>`to_char(${bucket}, ${bucketFmt})`, views: count() })
          .from(pageViews)
          .where(whereRange)
      : db.select({ day: sql<string>`to_char(${bucket}, ${bucketFmt})`, views: count() }).from(pageViews)
    )
      .groupBy(bucket)
      .orderBy(bucket),
    (whereRange
      ? db
          .select({ path: pageViews.path, views: count(), sessions: countDistinct(pageViews.sessionId) })
          .from(pageViews)
          .where(whereRange)
      : db.select({ path: pageViews.path, views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews)
    )
      .groupBy(pageViews.path)
      .orderBy(desc(count()))
      .limit(10),
    (whereRange
      ? db.select({ host: pageViews.referrerHost, views: count() }).from(pageViews).where(whereRange)
      : db.select({ host: pageViews.referrerHost, views: count() }).from(pageViews)
    )
      .groupBy(pageViews.referrerHost)
      .orderBy(desc(count()))
      .limit(11),
    (whereRange
      ? db.select({ country: pageViews.country, views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews).where(whereRange)
      : db.select({ country: pageViews.country, views: count(), sessions: countDistinct(pageViews.sessionId) }).from(pageViews)
    )
      .groupBy(pageViews.country)
      .orderBy(desc(count()))
      .limit(250),
    (whereRange
      ? db.select({ device: pageViews.device, views: count() }).from(pageViews).where(whereRange)
      : db.select({ device: pageViews.device, views: count() }).from(pageViews)
    )
      .groupBy(pageViews.device)
      .orderBy(desc(count())),
    since
      ? db.select({ total: count() }).from(chatConversations).where(gte(chatConversations.createdAt, since))
      : db.select({ total: count() }).from(chatConversations),
  ]);

  // fill the series so empty buckets still show
  const byDay = new Map(seriesRaw.map((d) => [d.day, d.views]));
  let series: { key: string; label: string; views: number }[];
  if (monthly) {
    const months = rangeDef.days === null ? Math.max(1, seriesRaw.length) : 12;
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - (months - 1));
    if (rangeDef.days === null && seriesRaw.length) {
      const [y, m] = seriesRaw[0].day.split("-").map(Number);
      start.setFullYear(y, m - 1, 1);
    }
    const n = (new Date().getFullYear() - start.getFullYear()) * 12 + (new Date().getMonth() - start.getMonth()) + 1;
    series = Array.from({ length: n }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), views: byDay.get(key) || 0 };
    });
  } else {
    const n = (rangeDef.days ?? 0) + 1;
    series = Array.from({ length: n }, (_, i) => {
      const d = daysAgo((rangeDef.days ?? 0) - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { key, label: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }), views: byDay.get(key) || 0 };
    });
  }
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
    { label: `Views · ${rangeDef.label}`, value: inRangeTotals.views, sub: `${inRangeTotals.sessions} visitors` },
    { label: `Chats · ${rangeDef.label}`, value: chats.total, sub: "conversations started" },
  ];

  return (
    <AdminShell user={user} title="Analytics">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={T.screenTitle}>Analytics</h2>
        <span className="text-[13px] text-neutral-400">
          Real first-party tracking — views, visitors, sources and geography from your live traffic.
        </span>
      </div>

      {/* date range filter */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/analytics?range=${r.key}`}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
              r.key === range
                ? "bg-gradient-to-r from-[#a10140] to-[#db2f73] text-white shadow-sm"
                : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* headline stats */}
      <div className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={T.cardPad}>
            <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-400">{s.label}</p>
            <p className="mt-1.5 text-[30px] font-semibold leading-none">{s.value}</p>
            <p className="mt-1.5 text-[12.5px] text-neutral-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* chart over the selected range */}
      <section className={`${T.card} mt-5`}>
        <div className={T.cardHeader}>
          <h3 className="text-[15px] font-semibold">Views · {rangeDef.label}</h3>
        </div>
        <div className="flex h-48 items-end gap-1 overflow-x-auto px-5 pb-4 pt-6 sm:gap-1.5">
          {series.map((s) => (
            <div
              key={s.key}
              className="group flex h-full min-w-[10px] flex-1 flex-col items-center justify-end gap-1.5"
              title={`${s.label}: ${s.views} views`}
            >
              <span className="text-[10px] tabular-nums text-neutral-400 opacity-0 transition group-hover:opacity-100">{s.views}</span>
              {/* Pixel heights — percentage bars collapse inside auto-height flex columns. */}
              <div
                className={`w-full rounded-t-md transition-opacity group-hover:opacity-80 ${
                  s.views > 0 ? "bg-gradient-to-t from-[#a10140] to-[#db2f73]" : "bg-neutral-200"
                }`}
                style={{ height: `${s.views > 0 ? Math.max(6, Math.round((s.views / maxDay) * 118)) : 3}px` }}
              />
              <span className={`truncate text-[9.5px] text-neutral-400 ${series.length > 20 && !monthly ? "hidden sm:block" : ""}`}>
                {series.length > 40 && !monthly ? "" : s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* top pages */}
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold">Top pages · {rangeDef.label}</h3>
          </div>
          {topPages.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No traffic recorded in this range.</p>
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
            <h3 className="text-[15px] font-semibold">Where visitors come from · {rangeDef.label}</h3>
          </div>
          {!direct && external.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No traffic recorded in this range.</p>
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

        {/* countries — every country seen in the range, with flags */}
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold">
              Countries · {rangeDef.label}
              <span className="ml-2 text-[12px] font-normal text-neutral-400">{countries.filter((c) => c.country).length} countries</span>
            </h3>
          </div>
          {countries.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No geography data in this range.</p>
          ) : (
            <ul className="max-h-[420px] space-y-3.5 overflow-y-auto p-5">
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
                      <span className="text-[13px] font-medium">
                        <span className="mr-1.5">{flagEmoji(c.country)}</span>
                        {name}
                      </span>
                      <span className="shrink-0 text-[12px] text-neutral-500">
                        {c.views} views · {c.sessions} visitors
                      </span>
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
            <h3 className="text-[15px] font-semibold">Devices · {rangeDef.label}</h3>
          </div>
          {devices.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-neutral-400">No device data in this range.</p>
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
