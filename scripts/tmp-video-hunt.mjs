import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
for (const [table, col] of [["sections","content"],["site_settings","value"],["admin_resources","data"]]) {
  const rows = await sql.query(
    `select 1 as one from ${table} where ${col}::text like '%/video/interactive%' limit 5`);
  console.log(`${table}.${col}: ${rows.length} row(s) still contain /video/interactive`);
}
const hero = await sql.query(
  `select (regexp_matches(content::text, '.{50}interactive-tv.{30}', 'g'))[1] as ctx
   from sections where content::text like '%interactive-tv%' limit 6`);
for (const r of hero) console.log("  ctx:", JSON.stringify(r.ctx));
