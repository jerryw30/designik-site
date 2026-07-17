import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const [admin] = await sql.query(
  "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
  [],
);
if (!admin) throw new Error("No active super administrator found");
const id = crypto.randomUUID();
const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="20"><rect width="32" height="20" fill="#ff006b"/></svg>`;

try {
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [admin.id, tokenHash],
  );
  await sql.query(
    `insert into media_assets(id,filename,mime_type,byte_size,content_base64,title,alt_text,uploaded_by)
    values($1,'media-smoke.svg','image/svg+xml',$2,$3,'Media smoke','Accessible smoke image',$4)`,
    [id, Buffer.byteLength(svg), Buffer.from(svg).toString("base64"), admin.id],
  );
  let [asset] = await sql.query("select * from media_assets where id=$1", [id]);
  if (
    !asset ||
    asset.title !== "Media smoke" ||
    asset.alt_text !== "Accessible smoke image"
  )
    throw new Error("Media create failed");
  await sql.query(
    "update media_assets set title='Updated media smoke',caption='A caption',description='A description',tags=$2::jsonb,updated_at=now() where id=$1",
    [id, JSON.stringify(["smoke", "image"])],
  );
  [asset] = await sql.query("select * from media_assets where id=$1", [id]);
  if (asset.title !== "Updated media smoke" || asset.tags.length !== 2)
    throw new Error("Media metadata update failed");

  const headers = { cookie: `designik_admin_session=${token}` };
  const [libraryResponse, editResponse, fileResponse] = await Promise.all([
    fetch(
      `https://designik-site.vercel.app/admin/media?search=Updated+media+smoke`,
      { headers },
    ),
    fetch(`https://designik-site.vercel.app/admin/media/${id}/edit`, {
      headers,
    }),
    fetch(
      `https://designik-site.vercel.app/api/media/${id}?smoke=${Date.now()}`,
    ),
  ]);
  const [libraryHtml, editHtml, fileText] = await Promise.all([
    libraryResponse.text(),
    editResponse.text(),
    fileResponse.text(),
  ]);
  if (
    libraryResponse.status !== 200 ||
    !libraryHtml.includes("Updated media smoke")
  )
    throw new Error("Production media search failed");
  if (
    editResponse.status !== 200 ||
    !editHtml.includes("Attachment details") ||
    !editHtml.includes("Accessible smoke image")
  )
    throw new Error("Production media editor failed");
  if (
    fileResponse.status !== 200 ||
    fileResponse.headers.get("content-type") !== "image/svg+xml" ||
    fileText !== svg
  )
    throw new Error("Public media delivery failed");

  await sql.query("update media_assets set deleted_at=now() where id=$1", [id]);
  const deletedResponse = await fetch(
    `https://designik-site.vercel.app/api/media/${id}?deleted=${Date.now()}`,
  );
  if (deletedResponse.status !== 404)
    throw new Error("Trashed media remained publicly available");
  await sql.query("update media_assets set deleted_at=null where id=$1", [id]);
  const restoredResponse = await fetch(
    `https://designik-site.vercel.app/api/media/${id}?restored=${Date.now()}`,
  );
  if (restoredResponse.status !== 200) throw new Error("Media restore failed");

  console.log(
    JSON.stringify({
      create: true,
      metadata: true,
      search: true,
      editor: true,
      delivery: true,
      trash: true,
      restore: true,
      cleanup: true,
    }),
  );
} finally {
  await sql.query("delete from media_assets where id=$1", [id]);
  await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
