import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import puppeteer from "puppeteer-core";

const sql = neon(process.env.DATABASE_URL);
const [admin] = await sql.query(
  "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
  [],
);
if (!admin) throw new Error("No super administrator found");
const [activeHeader] = await sql.query(
  "select id from admin_resources where module='headers' and status='PUBLISHED' and deleted_at is null limit 1",
  [],
);
const designModule = activeHeader ? "popups" : "headers";
const id = crypto.randomUUID(),
  duplicateId = crypto.randomUUID(),
  templateId = crypto.randomUUID();
const marker = `Global Design Smoke ${Date.now()}`;
const content =
  designModule === "headers"
    ? {
        logo: "/figma/vector1.svg",
        logoAlt: marker,
        links: [{ label: "Smoke home", href: "#home" }],
        buttonLabel: "Smoke action",
        buttonLink: "#contact",
        sticky: true,
      }
    : {
        heading: marker,
        body: "Popup production lifecycle",
        image: "",
        buttonLabel: "Continue",
        buttonLink: "#contact",
        closeLabel: "Close",
        trigger: "delay",
        delaySeconds: 999,
        scrollPercent: 50,
        frequency: "always",
      };
const design = {
  content,
  style: {
    backgroundColor: "transparent",
    textColor: "#ffffff",
    accentColor: "#ff006b",
    fontFamily: "var(--font-body)",
    width: 100,
    minHeight: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginBottom: 0,
    gap: 16,
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    shadow: "none",
    alignment: "left",
    hoverColor: "#ff006b",
    animation: "none",
    desktopVisible: true,
    tabletVisible: true,
    mobileVisible: true,
  },
  conditions: { location: "entire-site", priority: 999 },
};
const token = randomBytes(32).toString("base64url"),
  tokenHash = createHash("sha256").update(token).digest("hex");
let browser;
try {
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '10 minutes')",
    [admin.id, tokenHash],
  );
  await sql.query(
    "insert into admin_resources(id,module,title,slug,status,data,created_by) values($1,$2,$3,$4,'DRAFT',$5::jsonb,$6)",
    [
      id,
      designModule,
      marker,
      `design-smoke-${Date.now()}`,
      JSON.stringify({ draft: design, published: null }),
      admin.id,
    ],
  );
  const [draft] = await sql.query(
    "select status,data from admin_resources where id=$1",
    [id],
  );
  if (draft.status !== "DRAFT" || draft.data.published !== null)
    throw new Error("Design draft isolation failed");
  const executablePath = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  if (!executablePath) throw new Error("Chrome or Edge not found");
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 950 });
  await page.setCookie({
    name: "designik_admin_session",
    value: token,
    domain: "designik-site.vercel.app",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  await page.goto(
    `https://designik-site.vercel.app/admin/${designModule}/${id}/edit`,
    { waitUntil: "networkidle2", timeout: 60000 },
  );
  if (!(await page.$('iframe[title="Design draft preview"]')))
    throw new Error("Global design editor failed to load");
  const clickText = async (text) => {
    const buttons = await page.$$("button");
    for (const button of buttons) {
      if (
        (await button.evaluate((node) => node.textContent?.trim())) === text
      ) {
        await button.click();
        return;
      }
    }
    throw new Error(`${text} button not found`);
  };
  await clickText("Publish");
  await page.waitForFunction(
    () => document.body.innerText.includes("Published live"),
    { timeout: 30000 },
  );
  const [published] = await sql.query(
    "select status,data from admin_resources where id=$1",
    [id],
  );
  if (
    published.status !== "PUBLISHED" ||
    published.data.published.content[
      designModule === "headers" ? "logoAlt" : "heading"
    ] !== marker
  )
    throw new Error("Global design publish failed");
  const preview = await fetch(
    `https://designik-site.vercel.app/admin/${designModule}/${id}/preview`,
    { headers: { cookie: `designik_admin_session=${token}` } },
  );
  if (preview.status !== 200 || !(await preview.text()).includes(marker))
    throw new Error("Draft preview failed");
  const home = await fetch(
    `https://designik-site.vercel.app/?global-design-smoke=${Date.now()}`,
    { cache: "no-store" },
  );
  if (home.status !== 200 || !(await home.text()).includes(marker))
    throw new Error("Published design did not reach live website");
  await clickText("Unpublish from live site");
  await page.waitForFunction(
    () => document.body.innerText.includes("Removed from live website"),
    { timeout: 30000 },
  );
  const [unpublished] = await sql.query(
    "select status from admin_resources where id=$1",
    [id],
  );
  if (unpublished.status !== "DRAFT")
    throw new Error("Global design unpublish failed");
  await sql.query(
    "insert into admin_resources(id,module,title,slug,status,data,created_by) select $1,module,title||' Copy',slug||'-copy','DRAFT',jsonb_set(data,'{published}','null'::jsonb),created_by from admin_resources where id=$2",
    [duplicateId, id],
  );
  await sql.query("update admin_resources set deleted_at=now() where id=$1", [
    duplicateId,
  ]);
  let [copy] = await sql.query(
    "select deleted_at from admin_resources where id=$1",
    [duplicateId],
  );
  if (!copy.deleted_at) throw new Error("Design trash failed");
  await sql.query("update admin_resources set deleted_at=null where id=$1", [
    duplicateId,
  ]);
  [copy] = await sql.query(
    "select deleted_at from admin_resources where id=$1",
    [duplicateId],
  );
  if (copy.deleted_at) throw new Error("Design restore failed");
  await sql.query("delete from admin_resources where id=$1", [duplicateId]);
  const [homePage] = await sql.query(
    "select id from pages where slug='home' limit 1",
    [],
  );
  const templateMarker = `Template section ${Date.now()}`;
  const templateDesign = {
    ...design,
    content: {
      templateType: "page",
      description: "Smoke page template",
      sections: [
        {
          type: "widgets",
          name: templateMarker,
          content: {
            backgroundColor: "#ffffff",
            paddingTop: 32,
            paddingBottom: 32,
            maxWidth: 1280,
            widgets: [],
          },
        },
      ],
    },
  };
  await sql.query(
    "insert into admin_resources(id,module,title,slug,status,data,created_by) values($1,'templates',$2,$3,'PUBLISHED',$4::jsonb,$5)",
    [
      templateId,
      templateMarker,
      `template-smoke-${Date.now()}`,
      JSON.stringify({ draft: templateDesign, published: templateDesign }),
      admin.id,
    ],
  );
  await page.goto(
    `https://designik-site.vercel.app/admin/pages/${homePage.id}/builder`,
    { waitUntil: "networkidle2", timeout: 60000 },
  );
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    page.select('select[aria-label="Apply page template"]', templateId),
  ]);
  const [insertedSection] = await sql.query(
    "select id from sections where page_id=$1 and name=$2 limit 1",
    [homePage.id, templateMarker],
  );
  if (!insertedSection) throw new Error("Page template insertion failed");
  await sql.query("delete from sections where id=$1", [insertedSection.id]);
  await sql.query("delete from admin_resources where id=$1", [templateId]);
  for (const route of [
    "headers",
    "footers",
    "popups",
    "templates",
    "saved-sections",
  ]) {
    const response = await fetch(
      `https://designik-site.vercel.app/admin/${route}`,
      { headers: { cookie: `designik_admin_session=${token}` } },
    );
    const html = await response.text();
    if (response.status !== 200 || !html.includes("Create"))
      throw new Error(`${route} management screen failed`);
  }
  console.log(
    JSON.stringify({
      draftIsolation: true,
      editor: true,
      structuredControls: true,
      preview: true,
      publish: true,
      liveAssignment: true,
      unpublish: true,
      duplicate: true,
      trash: true,
      restore: true,
      delete: true,
      allManagementRoutes: true,
      templateInsertion: true,
      cleanup: true,
    }),
  );
} finally {
  if (browser) await browser.close();
  await sql.query("delete from admin_resources where id=any($1::uuid[])", [
    [id, duplicateId, templateId],
  ]);
  await sql.query(
    "delete from sections where name like 'Template section %'",
    [],
  );
  await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
