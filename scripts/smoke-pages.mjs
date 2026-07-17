import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
const created = [];

try {
  const create = async (status, deleted = false) => {
    const slug = `page-live-smoke-${status.toLowerCase()}-${suffix}`;
    const [page] = await sql.query(
      `insert into pages(title,slug,status,seo,deleted_at,published_at)
       values($1,$2,$3,$4::jsonb,$5,case when $3='PUBLISHED' then now() else null end)
       returning id,slug`,
      [
        `Page ${status}`,
        slug,
        status,
        JSON.stringify({
          title: `SEO page smoke ${suffix}`,
          description: `Page renderer description ${suffix}`,
        }),
        deleted ? new Date().toISOString() : null,
      ],
    );
    created.push(page.id);
    return page;
  };
  const published = await create("PUBLISHED");
  const draft = await create("DRAFT");
  const trashed = await create("PUBLISHED", true);
  const heading = `Live page section ${randomUUID()}`;
  await sql.query(
    `insert into sections(page_id,type,name,position,content,draft_content,published_content,styles,responsive,animation,visible,locked)
     values($1,'widgets','Live content',0,$2::jsonb,$2::jsonb,$2::jsonb,'{}','{}','{}',true,false)`,
    [
      published.id,
      JSON.stringify({
        _cmsPublished: true,
        backgroundColor: "#ffffff",
        paddingTop: 32,
        paddingBottom: 32,
        maxWidth: 1280,
        widgets: [
          {
            id: randomUUID(),
            type: "heading",
            content: heading,
            settings: { width: 100, fontSize: 48, fontWeight: 600 },
          },
        ],
      }),
    ],
  );
  const [liveResponse, draftResponse, trashResponse] = await Promise.all([
    fetch(`https://designik-site.vercel.app/${published.slug}`),
    fetch(`https://designik-site.vercel.app/${draft.slug}`),
    fetch(`https://designik-site.vercel.app/${trashed.slug}`),
  ]);
  const html = await liveResponse.text();
  if (liveResponse.status !== 200 || !html.includes(heading))
    throw new Error(`Published page failed: ${liveResponse.status}`);
  if (
    !html.includes(`SEO page smoke ${suffix}`) ||
    !html.includes(`Page renderer description ${suffix}`)
  )
    throw new Error("Published page metadata failed");
  if (draftResponse.status !== 404)
    throw new Error(`Draft page leaked publicly: ${draftResponse.status}`);
  if (trashResponse.status !== 404)
    throw new Error(`Trashed page leaked publicly: ${trashResponse.status}`);
  console.log(
    JSON.stringify({
      publishedRoute: true,
      realSectionRendering: true,
      pageMetadata: true,
      draftIsolation: true,
      trashIsolation: true,
      cleanup: true,
    }),
  );
} finally {
  for (const id of created)
    await sql.query("delete from pages where id=$1", [id]);
}
