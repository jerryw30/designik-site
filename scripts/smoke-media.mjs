import { createHash, randomBytes } from "node:crypto";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import puppeteer from "puppeteer-core";

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
const uploadName = `media-ui-${Date.now()}.svg`;
const uploadPath = join(tmpdir(), uploadName);
let browser;

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

  const executablePath = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  if (!executablePath) throw new Error("Chrome or Edge executable not found");
  writeFileSync(uploadPath, svg);
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
    sameSite: "Lax",
  });
  await page.goto("https://designik-site.vercel.app/admin/media", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const input = await page.$('input[type="file"]');
  if (!input) throw new Error("Media upload input missing");
  await input.uploadFile(uploadPath);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    page.click('form[enctype="multipart/form-data"] button'),
  ]);
  const [uploaded] = await sql.query(
    "select id,title,alt_text from media_assets where filename=$1",
    [uploadName],
  );
  if (!uploaded || uploaded.alt_text !== uploaded.title) {
    const body = await page.evaluate(() =>
      document.body.innerText.slice(0, 500),
    );
    throw new Error(`Browser upload workflow failed at ${page.url()}: ${body}`);
  }
  await sql.query("delete from media_assets where id=$1", [uploaded.id]);

  console.log(
    JSON.stringify({
      create: true,
      metadata: true,
      search: true,
      editor: true,
      delivery: true,
      trash: true,
      restore: true,
      browserUpload: true,
      cleanup: true,
    }),
  );
} finally {
  if (browser) await browser.close();
  if (existsSync(uploadPath)) unlinkSync(uploadPath);
  await sql.query("delete from media_assets where id=$1", [id]);
  await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
