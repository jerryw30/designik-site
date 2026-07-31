// Read-only: list posts so the blog renderer can be spot-checked.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  select id, slug, status, title,
         left(coalesce(data->>'content',''), 60) as content_preview
  from admin_resources
  where module = 'posts' and deleted_at is null
  order by created_at desc limit 10`;
for (const r of rows)
  console.log(`${r.status.padEnd(9)} /blog/${(r.slug || "").padEnd(24)} ${JSON.stringify(r.content_preview)}`);
console.log(`\n${rows.length} post(s)`);
