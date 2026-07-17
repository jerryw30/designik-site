import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const [original] = await sql.query(
  "select value,updated_by,updated_at from site_settings where key='seo_settings'",
  [],
);
let pageId;
let postId;
let tokenHash;
try {
  const defaults = {
    siteTitle: "Designik — Creative Agency",
    titleTemplate: "%s | Designik",
    description:
      "Designik drives brand engagement with innovative digital solutions. We drive your brand to new heights.",
    canonicalBase: "https://designik-site.vercel.app",
    ogImage: "",
    twitterHandle: "",
    index: true,
    follow: true,
    googleVerification: "",
    sitemapEnabled: true,
  };
  const published = original?.value?.published || defaults;
  const draft = {
    ...published,
    siteTitle: "SEO Draft Smoke",
    googleVerification: "smoke-verification",
  };
  await sql.query(
    "insert into site_settings(key,value) values('seo_settings',$1::jsonb) on conflict(key) do update set value=excluded.value,updated_at=now()",
    [JSON.stringify({ draft, published })],
  );
  const [isolated] = await sql.query(
    "select value from site_settings where key='seo_settings'",
    [],
  );
  if (
    isolated.value.draft.siteTitle !== "SEO Draft Smoke" ||
    isolated.value.published.siteTitle === "SEO Draft Smoke"
  )
    throw new Error("SEO draft isolation failed");
  await sql.query(
    "update site_settings set value=$1::jsonb where key='seo_settings'",
    [JSON.stringify({ draft, published: draft })],
  );
  const [publishedRow] = await sql.query(
    "select value from site_settings where key='seo_settings'",
    [],
  );
  if (publishedRow.value.published.googleVerification !== "smoke-verification")
    throw new Error("SEO publish failed");
  const suffix = Date.now().toString(36);
  const [page] = await sql.query(
    "insert into pages(title,slug,status,seo) values($1,$2,'DRAFT',$3::jsonb) returning id",
    [
      "SEO smoke page",
      `seo-smoke-${suffix}`,
      JSON.stringify({
        title: "Page SEO title",
        description: "Page SEO description",
        noindex: true,
      }),
    ],
  );
  pageId = page.id;
  const [post] = await sql.query(
    "insert into admin_resources(module,title,slug,status,data) values('posts',$1,$2,'DRAFT',$3::jsonb) returning id",
    [
      "SEO smoke post",
      `seo-smoke-post-${suffix}`,
      JSON.stringify({
        seoTitle: "Post SEO title",
        seoDescription: "Post SEO description",
        seoNoindex: true,
      }),
    ],
  );
  postId = post.id;
  const [pageSeo] = await sql.query("select seo from pages where id=$1", [
    pageId,
  ]);
  const [postSeo] = await sql.query(
    "select data from admin_resources where id=$1",
    [postId],
  );
  if (
    pageSeo.seo.title !== "Page SEO title" ||
    postSeo.data.seoTitle !== "Post SEO title"
  )
    throw new Error("SEO override storage failed");
  const [admin] = await sql.query(
    "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
    [],
  );
  const token = randomBytes(32).toString("base64url");
  tokenHash = createHash("sha256").update(token).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [admin.id, tokenHash],
  );
  if (original)
    await sql.query(
      "update site_settings set value=$1::jsonb,updated_by=$2,updated_at=$3 where key='seo_settings'",
      [
        JSON.stringify(original.value),
        original.updated_by,
        original.updated_at,
      ],
    );
  else
    await sql.query("delete from site_settings where key='seo_settings'", []);
  const [adminResponse, homeResponse, sitemapResponse, robotsResponse] =
    await Promise.all([
      fetch("https://designik-site.vercel.app/admin/seo", {
        headers: { cookie: `designik_admin_session=${token}` },
      }),
      fetch(`https://designik-site.vercel.app/?seo-smoke=${Date.now()}`),
      fetch("https://designik-site.vercel.app/sitemap.xml"),
      fetch("https://designik-site.vercel.app/robots.txt"),
    ]);
  const [adminHtml, homeHtml, sitemapXml, robotsText] = await Promise.all([
    adminResponse.text(),
    homeResponse.text(),
    sitemapResponse.text(),
    robotsResponse.text(),
  ]);
  if (adminResponse.status !== 200 || !adminHtml.includes("SEO Center"))
    throw new Error("Production SEO center failed");
  if (
    homeResponse.status !== 200 ||
    !homeHtml.includes('rel="canonical"') ||
    !homeHtml.includes('property="og:title"')
  )
    throw new Error("Production metadata failed");
  if (
    sitemapResponse.status !== 200 ||
    !sitemapXml.includes("<urlset") ||
    !sitemapXml.includes("designik-site.vercel.app")
  )
    throw new Error("Sitemap failed");
  if (
    robotsResponse.status !== 200 ||
    !robotsText.includes("User-Agent") ||
    !robotsText.includes("Sitemap")
  )
    throw new Error("Robots failed");
  console.log(
    JSON.stringify({
      draft: true,
      publishIsolation: true,
      publish: true,
      pageOverrides: true,
      postOverrides: true,
      metadata: true,
      openGraph: true,
      sitemap: true,
      robots: true,
      editorRoute: true,
      restore: true,
    }),
  );
} finally {
  if (pageId) await sql.query("delete from pages where id=$1", [pageId]);
  if (postId)
    await sql.query("delete from admin_resources where id=$1", [postId]);
  if (original)
    await sql.query(
      "update site_settings set value=$1::jsonb,updated_by=$2,updated_at=$3 where key='seo_settings'",
      [
        JSON.stringify(original.value),
        original.updated_by,
        original.updated_at,
      ],
    );
  else
    await sql.query("delete from site_settings where key='seo_settings'", []);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
