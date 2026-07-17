import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const slug = `cms-smoke-${Date.now().toString(36)}`;
let id;

try {
  const [created] = await sql.query(
    "insert into admin_resources(module,title,slug,status,data) values('posts',$1,$2,'DRAFT',$3::jsonb) returning id,status",
    [
      "CMS smoke post",
      slug,
      JSON.stringify({
        content: "First draft",
        category: "Testing",
        tags: ["smoke"],
      }),
    ],
  );
  id = created.id;
  await sql.query(
    "update admin_resources set title=$1,data=$2::jsonb,updated_at=now() where id=$3",
    [
      "CMS smoke post edited",
      JSON.stringify({
        content: "Published body",
        category: "Testing",
        tags: ["smoke", "publish"],
      }),
      id,
    ],
  );
  await sql.query("update admin_resources set status='PUBLISHED' where id=$1", [
    id,
  ]);
  const [published] = await sql.query(
    "select title,status,data->>'content' as content from admin_resources where module='posts' and slug=$1 and status='PUBLISHED' and deleted_at is null",
    [slug],
  );
  if (!published || published.content !== "Published body")
    throw new Error("Published post could not be read");
  await sql.query(
    "update admin_resources set status='TRASH',deleted_at=now() where id=$1",
    [id],
  );
  const [trashed] = await sql.query(
    "select status,deleted_at from admin_resources where id=$1",
    [id],
  );
  if (trashed.status !== "TRASH" || !trashed.deleted_at)
    throw new Error("Trash transition failed");
  await sql.query(
    "update admin_resources set status='DRAFT',deleted_at=null where id=$1",
    [id],
  );
  const [restored] = await sql.query(
    "select status,deleted_at from admin_resources where id=$1",
    [id],
  );
  if (restored.status !== "DRAFT" || restored.deleted_at)
    throw new Error("Restore transition failed");
  await sql.query(
    "update admin_resources set status='TRASH',deleted_at=now() where id=$1",
    [id],
  );
  await sql.query(
    "delete from admin_resources where id=$1 and status='TRASH'",
    [id],
  );
  const [remaining] = await sql.query(
    "select count(*)::int as total from admin_resources where id=$1",
    [id],
  );
  if (remaining.total !== 0) throw new Error("Permanent delete failed");
  id = undefined;
  console.log(
    JSON.stringify({
      create: true,
      edit: true,
      publish: true,
      publicRead: true,
      trash: true,
      restore: true,
      delete: true,
    }),
  );
} finally {
  if (id) await sql.query("delete from admin_resources where id=$1", [id]);
}
