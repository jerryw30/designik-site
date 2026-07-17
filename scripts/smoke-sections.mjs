import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let pageId;
let templateId;

try {
  const [source] = await sql.query(
    "select s.* from sections s join pages p on p.id=s.page_id where p.slug='home' and s.type='stats' limit 1",
    [],
  );
  if (!source) throw new Error("Stats source section not found");
  const [page] = await sql.query(
    "insert into pages(title,slug,status) values($1,$2,'DRAFT') returning id",
    ["Section smoke page", `section-smoke-${suffix}`],
  );
  pageId = page.id;
  const [first] = await sql.query(
    "insert into sections(page_id,type,name,position,draft_content,published_content,styles,responsive,animation,visible) values($1,$2,$3,0,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,true) returning id",
    [
      pageId,
      source.type,
      source.name,
      JSON.stringify(source.draft_content),
      JSON.stringify({ _cmsPublished: false }),
      JSON.stringify(source.styles),
      JSON.stringify(source.responsive),
      JSON.stringify(source.animation),
    ],
  );
  const nested = structuredClone(source.draft_content || {});
  nested.items = Array.isArray(nested.items) ? nested.items : [];
  nested.items.push({ value: 77, suffix: "%", label: "Smoke item", unit: "" });
  await sql.query("update sections set draft_content=$1::jsonb where id=$2", [
    JSON.stringify(nested),
    first.id,
  ]);
  const [draft] = await sql.query(
    "select jsonb_array_length(draft_content->'items') as draft_count, published_content from sections where id=$1",
    [first.id],
  );
  if (draft.published_content?._cmsPublished !== false)
    throw new Error("Draft leaked into published content");
  await sql.query(
    "update sections set published_content=draft_content where id=$1",
    [first.id],
  );
  const [published] = await sql.query(
    "select jsonb_array_length(published_content->'items') as published_count from sections where id=$1",
    [first.id],
  );
  if (published.published_count !== draft.draft_count)
    throw new Error("Nested publish failed");
  const [template] = await sql.query(
    "insert into admin_resources(module,title,slug,status,data) values('saved-sections',$1,$2,'PUBLISHED',$3::jsonb) returning id",
    [
      "Stats smoke template",
      `stats-smoke-${suffix}`,
      JSON.stringify({
        type: source.type,
        name: source.name,
        draftContent: nested,
      }),
    ],
  );
  templateId = template.id;
  const [stored] = await sql.query(
    "select data from admin_resources where id=$1 and module='saved-sections'",
    [templateId],
  );
  const [second] = await sql.query(
    "insert into sections(page_id,type,name,position,draft_content,published_content) values($1,$2,$3,1,$4::jsonb,$5::jsonb) returning id",
    [
      pageId,
      stored.data.type,
      stored.data.name,
      JSON.stringify(stored.data.draftContent),
      JSON.stringify({ _cmsPublished: false }),
    ],
  );
  await sql.query(
    "update sections set position=case when id=$1 then 1 when id=$2 then 0 end where id in ($1,$2)",
    [first.id, second.id],
  );
  const ordered = await sql.query(
    "select id from sections where page_id=$1 order by position",
    [pageId],
  );
  if (ordered[0]?.id !== second.id || ordered[1]?.id !== first.id)
    throw new Error("Reorder failed");
  console.log(
    JSON.stringify({
      nestedDraft: true,
      publishIsolation: true,
      nestedPublish: true,
      saveTemplate: true,
      insertTemplate: true,
      reorder: true,
      cleanup: true,
    }),
  );
} finally {
  if (pageId) await sql.query("delete from pages where id=$1", [pageId]);
  if (templateId)
    await sql.query("delete from admin_resources where id=$1", [templateId]);
}
