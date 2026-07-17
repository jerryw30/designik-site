import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import puppeteer from "puppeteer-core";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
const title = `Page action smoke ${suffix}`;
const slug = `page-action-smoke-${suffix}`;
const heading = `Published hero ${suffix}`;
let pageId;
let copyId;
let tokenHash;
let browser;

const waitFor = async (check, label) => {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${label}`);
};

try {
  const [user] = await sql.query(
    "select id from users where active=true and role='SUPER_ADMIN' order by created_at limit 1",
    [],
  );
  const [created] = await sql.query(
    "insert into pages(title,slug,status,author_id) values($1,$2,'DRAFT',$3) returning id",
    [title, slug, user.id],
  );
  pageId = created.id;
  await sql.query(
    `insert into sections(page_id,type,name,position,content,draft_content,published_content,styles,responsive,animation,visible,locked)
     values($1,'hero','Hero',0,'{}','{}','{"_cmsPublished":false}','{}','{}','{}',true,false)`,
    [pageId],
  );
  const token = randomBytes(32).toString("base64url");
  tokenHash = createHash("sha256").update(token).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '10 minutes')",
    [user.id, tokenHash],
  );
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ];
  const executablePath = candidates.find(existsSync);
  if (!executablePath) throw new Error("Chrome or Edge not found");
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: "designik_admin_session",
    value: token,
    domain: "designik-site.vercel.app",
    path: "/",
    httpOnly: true,
    secure: true,
  });
  await page.goto(
    `https://designik-site.vercel.app/admin/pages/${pageId}/builder`,
    { waitUntil: "networkidle2", timeout: 60000 },
  );
  const changed = await page.evaluate((nextHeading) => {
    const label = [...document.querySelectorAll("aside:last-child label")].find(
      (item) => item.firstChild?.textContent?.trim() === "Heading",
    );
    const input = label?.querySelector("input");
    if (!(input instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, nextHeading);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, heading);
  if (!changed) throw new Error("Hero heading control not found");
  const clickBuilder = async (label) =>
    page.evaluate((text) => {
      const button = [
        ...document.querySelectorAll("aside:last-child button"),
      ].find((item) => item.textContent?.trim() === text);
      if (button instanceof HTMLButtonElement) button.click();
      return Boolean(button);
    }, label);
  if (!(await clickBuilder("Save draft")))
    throw new Error("Hero save button not found");
  await waitFor(async () => {
    const [section] = await sql.query(
      "select draft_content,published_content from sections where page_id=$1 and type='hero'",
      [pageId],
    );
    return (
      section?.draft_content?.heading === heading &&
      section?.published_content?.heading !== heading
    );
  }, "isolated Hero draft");
  const preview = await fetch(
    `https://designik-site.vercel.app/admin/pages/${pageId}/preview`,
    { headers: { cookie: `designik_admin_session=${token}` } },
  ).then((response) => response.text());
  if (!preview.includes(heading)) throw new Error("Hero draft preview failed");
  if (!(await clickBuilder("Publish")))
    throw new Error("Hero publish button not found");
  await waitFor(async () => {
    const [section] = await sql.query(
      "select published_content from sections where page_id=$1 and type='hero'",
      [pageId],
    );
    return section?.published_content?.heading === heading;
  }, "Hero publication");

  const clickRow = async (trash, rowTitle, action) => {
    await page.goto(
      `https://designik-site.vercel.app/admin/pages${trash ? "?trash=1" : ""}`,
      { waitUntil: "networkidle2", timeout: 60000 },
    );
    const clicked = await page.evaluate(
      ({ rowTitle, action }) => {
        const row = [...document.querySelectorAll("tr")].find((item) =>
          item.textContent?.includes(rowTitle),
        );
        const button = [...(row?.querySelectorAll("button") || [])].find(
          (item) => item.textContent?.trim() === action,
        );
        if (button instanceof HTMLButtonElement) button.click();
        return Boolean(button);
      },
      { rowTitle, action },
    );
    if (!clicked) throw new Error(`${action} action not found for ${rowTitle}`);
  };

  await clickRow(false, title, "Publish");
  await waitFor(async () => {
    const [record] = await sql.query("select status from pages where id=$1", [
      pageId,
    ]);
    return record?.status === "PUBLISHED";
  }, "page publication");
  const live = await fetch(`https://designik-site.vercel.app/${slug}`).then(
    (response) => response.text(),
  );
  if (!live.includes(heading)) throw new Error("Published live page failed");

  await clickRow(false, title, "Duplicate");
  await waitFor(async () => {
    const [copy] = await sql.query(
      "select id from pages where title=$1 and id<>$2 order by created_at desc limit 1",
      [`${title} Copy`, pageId],
    );
    copyId = copy?.id;
    return Boolean(copyId);
  }, "page duplicate");
  const [copiedSection] = await sql.query(
    "select draft_content from sections where page_id=$1 and type='hero'",
    [copyId],
  );
  if (copiedSection?.draft_content?.heading !== heading)
    throw new Error("Duplicate did not copy page sections");

  await clickRow(false, title, "Trash");
  await waitFor(async () => {
    const [record] = await sql.query(
      "select deleted_at from pages where id=$1",
      [pageId],
    );
    return Boolean(record?.deleted_at);
  }, "page trash");
  await clickRow(true, title, "Restore");
  await waitFor(async () => {
    const [record] = await sql.query(
      "select deleted_at from pages where id=$1",
      [pageId],
    );
    return record && !record.deleted_at;
  }, "page restore");
  await clickRow(false, title, "Trash");
  await waitFor(async () => {
    const [record] = await sql.query(
      "select deleted_at from pages where id=$1",
      [pageId],
    );
    return Boolean(record?.deleted_at);
  }, "second page trash");
  await clickRow(true, title, "Delete forever");
  await waitFor(async () => {
    const [record] = await sql.query("select id from pages where id=$1", [
      pageId,
    ]);
    return !record;
  }, "permanent page deletion");
  pageId = undefined;
  console.log(
    JSON.stringify({
      heroDraftIsolation: true,
      heroPreview: true,
      heroPublish: true,
      livePage: true,
      duplicate: true,
      duplicatedSections: true,
      trash: true,
      restore: true,
      permanentDelete: true,
    }),
  );
} finally {
  if (browser) await browser.close();
  if (pageId) await sql.query("delete from pages where id=$1", [pageId]);
  if (copyId) await sql.query("delete from pages where id=$1", [copyId]);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
