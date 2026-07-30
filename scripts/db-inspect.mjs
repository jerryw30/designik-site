// Read-only inspection of the live database. Safe to run any time.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name`;
console.log("TABLES:", tables.map((r) => r.table_name).join(", "), "\n");

for (const name of [
  "leads",
  "chat_conversations",
  "chat_messages",
  "page_views",
  "activity_log",
  "media_assets",
  "users",
  "sections",
]) {
  try {
    const rows = await sql.query(`select count(*)::int as c from "${name}"`);
    console.log(`  ${name.padEnd(20)} ${rows[0].c} rows`);
  } catch (err) {
    console.log(`  ${name.padEnd(20)} ERROR: ${err.message}`);
  }
}

const cols = await sql`
  select column_name, is_nullable from information_schema.columns
  where table_name = 'media_assets' order by column_name`;
console.log(
  "\nmedia_assets columns:",
  cols.map((c) => `${c.column_name}${c.is_nullable === "YES" ? "?" : ""}`).join(", "),
);
