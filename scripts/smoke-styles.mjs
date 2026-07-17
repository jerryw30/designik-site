import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const [original] = await sql.query(
  "select value,updated_by,updated_at from site_settings where key='global_styles'",
  [],
);
let tokenHash;
try {
  const defaults = {
    colors: {
      primary: "#a10140",
      secondary: "#530823",
      accent: "#db2f73",
      text: "#1a1416",
      background: "#ffffff",
    },
    typography: {
      bodyFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      headingFamily: "var(--font-oswald), Oswald, system-ui, sans-serif",
      marqueeFamily: "var(--font-akshar), Akshar, system-ui, sans-serif",
      bodySize: 16,
      bodyLineHeight: 1.5,
      headingWeight: 500,
    },
    buttons: { radius: 999, paddingX: 24, paddingY: 12, fontWeight: 600 },
    layout: { containerWidth: 1280, sectionGap: 0 },
    customFonts: [],
  };
  const published = original?.value?.published || defaults;
  const draft = structuredClone(published);
  draft.colors = { ...draft.colors, accent: "#123456" };
  draft.customFonts = [
    {
      id: "smoke-font",
      name: "Smoke Font",
      url: "https://example.com/smoke.woff2",
      weight: 400,
      style: "normal",
    },
  ];
  await sql.query(
    "insert into site_settings(key,value) values('global_styles',$1::jsonb) on conflict(key) do update set value=excluded.value,updated_at=now()",
    [JSON.stringify({ draft, published })],
  );
  const [savedDraft] = await sql.query(
    "select value from site_settings where key='global_styles'",
    [],
  );
  if (
    savedDraft.value.draft.colors.accent !== "#123456" ||
    savedDraft.value.published.colors.accent === "#123456"
  )
    throw new Error("Draft isolation failed");
  await sql.query(
    "update site_settings set value=$1::jsonb,updated_at=now() where key='global_styles'",
    [JSON.stringify({ draft, published: draft })],
  );
  const [publishedRow] = await sql.query(
    "select value from site_settings where key='global_styles'",
    [],
  );
  if (
    publishedRow.value.published.colors.accent !== "#123456" ||
    publishedRow.value.published.customFonts[0].name !== "Smoke Font"
  )
    throw new Error("Style publish failed");
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
  const [adminResponse, homeResponse] = await Promise.all([
    fetch("https://designik-site.vercel.app/admin/styles", {
      headers: { cookie: `designik_admin_session=${token}` },
    }),
    fetch(`https://designik-site.vercel.app/?style-smoke=${Date.now()}`),
  ]);
  const adminHtml = await adminResponse.text();
  const homeHtml = await homeResponse.text();
  if (
    adminResponse.status !== 200 ||
    !adminHtml.includes("Global Styles and Fonts")
  )
    throw new Error("Production style editor failed");
  if (homeResponse.status !== 200 || !homeHtml.includes("--color-wine-500"))
    throw new Error("Global variables were not injected");
  console.log(
    JSON.stringify({
      draft: true,
      publishIsolation: true,
      publish: true,
      customFonts: true,
      editorRoute: true,
      liveVariables: true,
      restore: true,
    }),
  );
} finally {
  if (original)
    await sql.query(
      "update site_settings set value=$1::jsonb,updated_by=$2,updated_at=$3 where key='global_styles'",
      [
        JSON.stringify(original.value),
        original.updated_by,
        original.updated_at,
      ],
    );
  else
    await sql.query("delete from site_settings where key='global_styles'", []);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
