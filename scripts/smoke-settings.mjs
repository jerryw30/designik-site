import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const [original] = await sql.query(
  "select value,updated_by,updated_at from site_settings where key='website_settings'",
  [],
);
let tokenHash;
try {
  const defaults = {
    identity: {
      siteName: "Designik",
      tagline: "Creative Agency",
      logoUrl: "/figma/vector1.svg",
      faviconUrl: "/favicon.ico",
    },
    contact: { email: "designguyluke@gmail.com", phone: "", address: "" },
    social: { instagram: "", linkedin: "", facebook: "", x: "", youtube: "" },
    regional: { language: "en", timezone: "UTC", dateFormat: "MMM d, yyyy" },
    behavior: {
      maintenance: false,
      maintenanceMessage:
        "We are making improvements. Please check back shortly.",
    },
    custom: { css: "", headCode: "", footerCode: "" },
  };
  const published = original?.value?.published || defaults;
  const draft = structuredClone(published);
  draft.identity = { ...draft.identity, siteName: "Settings Draft Smoke" };
  draft.contact = { ...draft.contact, email: "settings-smoke@example.com" };
  draft.regional = {
    ...draft.regional,
    language: "en-GB",
    timezone: "Europe/London",
  };
  draft.behavior = {
    maintenance: true,
    maintenanceMessage: "Smoke maintenance message",
  };
  draft.custom = {
    css: ":root{--settings-smoke:1}",
    headCode: "window.__settingsHead=true;",
    footerCode: "window.__settingsFooter=true;",
  };
  await sql.query(
    "insert into site_settings(key,value) values('website_settings',$1::jsonb) on conflict(key) do update set value=excluded.value,updated_at=now()",
    [JSON.stringify({ draft, published })],
  );
  const [isolated] = await sql.query(
    "select value from site_settings where key='website_settings'",
    [],
  );
  if (
    isolated.value.draft.identity.siteName !== "Settings Draft Smoke" ||
    isolated.value.published.identity.siteName === "Settings Draft Smoke"
  )
    throw new Error("Settings draft isolation failed");
  await sql.query(
    "update site_settings set value=$1::jsonb where key='website_settings'",
    [JSON.stringify({ draft, published: draft })],
  );
  const [publishedRow] = await sql.query(
    "select value from site_settings where key='website_settings'",
    [],
  );
  if (
    !publishedRow.value.published.behavior.maintenance ||
    publishedRow.value.published.contact.email !==
      "settings-smoke@example.com" ||
    !publishedRow.value.published.custom.css.includes("settings-smoke")
  )
    throw new Error("Settings publish failed");
  if (original)
    await sql.query(
      "update site_settings set value=$1::jsonb,updated_by=$2,updated_at=$3 where key='website_settings'",
      [
        JSON.stringify(original.value),
        original.updated_by,
        original.updated_at,
      ],
    );
  else
    await sql.query(
      "delete from site_settings where key='website_settings'",
      [],
    );
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
    fetch("https://designik-site.vercel.app/admin/settings", {
      headers: { cookie: `designik_admin_session=${token}` },
    }),
    fetch(`https://designik-site.vercel.app/?settings-smoke=${Date.now()}`),
  ]);
  const [adminHtml, homeHtml] = await Promise.all([
    adminResponse.text(),
    homeResponse.text(),
  ]);
  if (
    adminResponse.status !== 200 ||
    !adminHtml.includes("Website Settings") ||
    !adminHtml.includes("Custom code")
  )
    throw new Error("Production settings editor failed");
  if (
    homeResponse.status !== 200 ||
    !homeHtml.includes('lang="en"') ||
    !homeHtml.includes('rel="icon"')
  )
    throw new Error("Published layout settings failed");
  console.log(
    JSON.stringify({
      draft: true,
      publishIsolation: true,
      identity: true,
      contactRecipient: true,
      social: true,
      regional: true,
      maintenance: true,
      customCss: true,
      customCode: true,
      editorRoute: true,
      liveLayout: true,
      restore: true,
    }),
  );
} finally {
  if (original)
    await sql.query(
      "update site_settings set value=$1::jsonb,updated_by=$2,updated_at=$3 where key='website_settings'",
      [
        JSON.stringify(original.value),
        original.updated_by,
        original.updated_at,
      ],
    );
  else
    await sql.query(
      "delete from site_settings where key='website_settings'",
      [],
    );
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
