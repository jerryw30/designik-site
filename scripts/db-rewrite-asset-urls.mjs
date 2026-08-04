// Rewrite stored asset URLs to go through /api/static.
//
// Hostinger's CDN intercepts bare static paths (/figma/*, /video/*, the chat
// avatar) at the edge and 404s them from a stale per-domain store; /api/* is
// passed through to the app, whose /api/static route streams the same files
// from disk (and redirects back to the bare path on platforms where static
// serving is healthy, so this is safe on Vercel too).
//
// Dry run by default; pass --write to apply.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const WRITE = process.argv.includes("--write");

// (table, jsonb/text column) pairs that can contain asset URLs.
const TARGETS = [
  ["sections", "content"],
  ["pages", "data"],
  ["site_settings", "value"],
  ["admin_resources", "data"],
];

const REWRITES = [
  ['"/figma/', '"/api/static/figma/'],
  ['"/video/', '"/api/static/video/'],
  ['"/ikora-avatar-2.png', '"/api/static/ikora-avatar-2.png'],
  ['"/portfolio/', '"/api/static/portfolio/'],
];

for (const [table, col] of TARGETS) {
  let cols;
  try {
    cols = await sql`
      select data_type from information_schema.columns
      where table_name = ${table} and column_name = ${col}`;
  } catch {
    cols = [];
  }
  if (!cols.length) {
    console.log(`skip   ${table}.${col} (no such column)`);
    continue;
  }
  const [{ n }] = await sql.query(
    `select count(*)::int as n from ${table}
     where ${col}::text like '%"/figma/%'
        or ${col}::text like '%"/video/%'
        or ${col}::text like '%"/ikora-avatar-2.png%'`,
  );
  console.log(`${table}.${col}: ${n} row(s) contain bare asset URLs`);
  if (!n || !WRITE) continue;

  let expr = `${col}::text`;
  for (const [from, to] of REWRITES) {
    expr = `replace(${expr}, '${from.replace(/'/g, "''")}', '${to.replace(/'/g, "''")}')`;
  }
  const res = await sql.query(
    `update ${table} set ${col} = (${expr})::jsonb
     where ${col}::text like '%"/figma/%'
        or ${col}::text like '%"/video/%'
        or ${col}::text like '%"/ikora-avatar-2.png%'`,
  );
  console.log(`  -> updated ${res.length ?? n} row(s)`);
}
console.log(WRITE ? "\nDone." : "\nDry run only — pass --write to apply.");
