// Read-only: exercise the SQL shapes the media screens generate, so a syntax
// or column error surfaces here instead of as a 500 behind the admin login.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const check = async (label, run) => {
  try {
    const rows = await run();
    console.log(`  OK   ${label.padEnd(34)} ${rows.length} row(s)`);
  } catch (err) {
    console.log(`  FAIL ${label.padEnd(34)} ${err.message}`);
    process.exitCode = 1;
  }
};

console.log("media screen queries:");

await check("library grid (active)", () =>
  sql`select id, filename, mime_type, byte_size, title, alt_text, file_path,
             created_at, deleted_at
      from media_assets where deleted_at is null
      order by created_at desc limit 600`);

await check("trash view", () =>
  sql`select id, title from media_assets where deleted_at is not null limit 600`);

await check("type filter (image/%)", () =>
  sql`select id from media_assets where deleted_at is null and mime_type ilike 'image/%' limit 600`);

await check("search filter", () =>
  sql`select id from media_assets
      where deleted_at is null and (title ilike '%hero%' or filename ilike '%hero%') limit 600`);

// The new SEO work-queue filter.
await check("missing alt text", () =>
  sql`select id, title from media_assets
      where deleted_at is null and mime_type ilike 'image/%' and btrim(alt_text) = ''
      limit 600`);

await check("picker JSON list", () =>
  sql`select id, title, filename, mime_type, byte_size, alt_text, file_path, created_at
      from media_assets where deleted_at is null order by created_at desc limit 600`);

const [{ n }] = await sql`
  select count(*)::int as n from media_assets
  where deleted_at is null and mime_type ilike 'image/%' and btrim(alt_text) = ''`;
console.log(`\nimages still missing alt text: ${n}`);
