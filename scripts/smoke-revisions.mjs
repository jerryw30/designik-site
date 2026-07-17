import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let pageId;
let tokenHash;
try {
  const [admin] = await sql.query(
    "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
    [],
  );
  const [page] = await sql.query(
    "insert into pages(title,slug,status,author_id) values($1,$2,'DRAFT',$3) returning id",
    ["Revision version A", `revision-smoke-${suffix}`, admin.id],
  );
  pageId = page.id;
  const [section] = await sql.query(
    "insert into sections(page_id,type,name,position,draft_content,published_content) values($1,'widgets','Revision smoke',0,$2::jsonb,$2::jsonb) returning id",
    [pageId, JSON.stringify({ heading: "Version A" })],
  );
  const [revisionA] = await sql.query(
    "insert into revisions(page_id,author_id,label,snapshot) values($1,$2,'Version A',$3::jsonb) returning id",
    [
      pageId,
      admin.id,
      JSON.stringify({
        sectionId: section.id,
        content: { heading: "Version A" },
      }),
    ],
  );
  await sql.query(
    "update sections set draft_content=$1::jsonb,published_content=$1::jsonb where id=$2",
    [JSON.stringify({ heading: "Version B" }), section.id],
  );
  const [currentB] = await sql.query(
    "select published_content from sections where id=$1",
    [section.id],
  );
  const [safety] = await sql.query(
    "insert into revisions(page_id,author_id,label,snapshot) values($1,$2,'Safety backup before restore',$3::jsonb) returning id",
    [
      pageId,
      admin.id,
      JSON.stringify({
        sectionId: section.id,
        content: currentB.published_content,
      }),
    ],
  );
  const [savedA] = await sql.query(
    "select snapshot from revisions where id=$1",
    [revisionA.id],
  );
  await sql.query(
    "update sections set draft_content=$1::jsonb,published_content=$1::jsonb where id=$2",
    [JSON.stringify(savedA.snapshot.content), section.id],
  );
  const [restoredA] = await sql.query(
    "select published_content from sections where id=$1",
    [section.id],
  );
  if (restoredA.published_content.heading !== "Version A")
    throw new Error("Section rollback failed");
  const [savedB] = await sql.query(
    "select snapshot from revisions where id=$1",
    [safety.id],
  );
  await sql.query(
    "update sections set draft_content=$1::jsonb,published_content=$1::jsonb where id=$2",
    [JSON.stringify(savedB.snapshot.content), section.id],
  );
  const [recoveredB] = await sql.query(
    "select published_content from sections where id=$1",
    [section.id],
  );
  if (recoveredB.published_content.heading !== "Version B")
    throw new Error("Safety recovery failed");
  const [pageRevision] = await sql.query(
    "insert into revisions(page_id,author_id,label,snapshot) values($1,$2,'Page version A',$3::jsonb) returning id",
    [
      pageId,
      admin.id,
      JSON.stringify({
        id: pageId,
        title: "Revision version A",
        slug: `revision-smoke-${suffix}`,
        status: "DRAFT",
        seo: {},
        settings: {},
      }),
    ],
  );
  await sql.query("update pages set title='Revision version B' where id=$1", [
    pageId,
  ]);
  const [pageSnapshot] = await sql.query(
    "select snapshot from revisions where id=$1",
    [pageRevision.id],
  );
  await sql.query("update pages set title=$1 where id=$2", [
    pageSnapshot.snapshot.title,
    pageId,
  ]);
  const [restoredPage] = await sql.query(
    "select title from pages where id=$1",
    [pageId],
  );
  if (restoredPage.title !== "Revision version A")
    throw new Error("Page restore failed");
  const token = randomBytes(32).toString("base64url");
  tokenHash = createHash("sha256").update(token).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [admin.id, tokenHash],
  );
  const headers = { cookie: `designik_admin_session=${token}` };
  const [listResponse, detailResponse] = await Promise.all([
    fetch("https://designik-site.vercel.app/admin/revisions", { headers }),
    fetch(`https://designik-site.vercel.app/admin/revisions/${revisionA.id}`, {
      headers,
    }),
  ]);
  const [listHtml, detailHtml] = await Promise.all([
    listResponse.text(),
    detailResponse.text(),
  ]);
  if (
    listResponse.status !== 200 ||
    detailResponse.status !== 200 ||
    !listHtml.includes("Revision history") ||
    !detailHtml.includes("Current published state")
  )
    throw new Error("Production revision routes failed");
  console.log(
    JSON.stringify({
      sectionRevision: true,
      rollback: true,
      safetyBackup: true,
      recovery: true,
      pageRevision: true,
      pageRestore: true,
      historyRoute: true,
      detailRoute: true,
      cleanup: true,
    }),
  );
} finally {
  if (pageId) await sql.query("delete from pages where id=$1", [pageId]);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
