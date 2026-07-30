// Read-only: what does Drizzle think has already been applied?
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const t = await sql`
  select table_schema, table_name from information_schema.tables
  where table_name = '__drizzle_migrations'`;

if (!t.length) {
  console.log("__drizzle_migrations: DOES NOT EXIST");
  console.log("=> `drizzle-kit migrate` would replay migrations from 0000.");
} else {
  console.log("__drizzle_migrations found in schema:", t[0].table_schema);
  const rows = await sql.query(
    `select hash, created_at from "${t[0].table_schema}"."__drizzle_migrations" order by created_at`,
  );
  console.log(`applied: ${rows.length}`);
  for (const r of rows) console.log("  ", r.hash?.slice(0, 16), new Date(Number(r.created_at)).toISOString());
}
