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
const token = randomBytes(32).toString("base64url"),
  tokenHash = createHash("sha256").update(token).digest("hex");
const settingKey = `tools_smoke_${Date.now()}`;
let browser;
try {
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [admin.id, tokenHash],
  );
  const headers = { cookie: `designik_admin_session=${token}` };
  const [screen, exportResponse] = await Promise.all([
    fetch("https://designik-site.vercel.app/admin/tools", { headers }),
    fetch("https://designik-site.vercel.app/admin/tools/export", { headers }),
  ]);
  const [screenHtml, exportText] = await Promise.all([
    screen.text(),
    exportResponse.text(),
  ]);
  if (
    screen.status !== 200 ||
    !screenHtml.includes("Import and export") ||
    !screenHtml.includes("Download JSON backup")
  )
    throw new Error("Tools screen failed");
  if (
    exportResponse.status !== 200 ||
    !exportResponse.headers
      .get("content-disposition")
      ?.includes("designik-backup")
  )
    throw new Error("Backup download failed");
  const exported = JSON.parse(exportText);
  if (
    exported.format !== "designik-cms-backup" ||
    exported.version !== 1 ||
    !Array.isArray(exported.pages) ||
    !Array.isArray(exported.sections) ||
    !Array.isArray(exported.resources) ||
    !Array.isArray(exported.settings) ||
    !Array.isArray(exported.media)
  )
    throw new Error("Backup payload incomplete");
  if (
    "users" in exported ||
    "sessions" in exported ||
    "submissions" in exported
  )
    throw new Error(
      "Private authentication or submission data leaked into backup",
    );
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
  await page.setCookie({
    name: "designik_admin_session",
    value: token,
    domain: "designik-site.vercel.app",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  await page.goto("https://designik-site.vercel.app/admin/tools", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  const backup = {
    format: "designik-cms-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    pages: [],
    sections: [],
    resources: [],
    settings: [
      { key: settingKey, value: { imported: true, marker: settingKey } },
    ],
    media: [],
  };
  const result = await page.evaluate(
    async ({ payload }) => {
      const data = new FormData();
      data.append(
        "backup",
        new File([payload], "tools-smoke.json", { type: "application/json" }),
      );
      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: data,
      });
      return {
        ok: response.ok,
        url: response.url,
        text: (await response.text()).slice(0, 100),
      };
    },
    { payload: JSON.stringify(backup) },
  );
  if (!result.ok || !result.url.includes("/admin/tools?imported=1"))
    throw new Error(
      `Production backup import failed: ${JSON.stringify(result)}`,
    );
  const [setting] = await sql.query(
    "select value from site_settings where key=$1",
    [settingKey],
  );
  if (!setting?.value?.imported || setting.value.marker !== settingKey)
    throw new Error("Imported setting did not persist");
  console.log(
    JSON.stringify({
      toolsRoute: true,
      download: true,
      completePayload: true,
      secretsExcluded: true,
      validatedImport: true,
      mergePersistence: true,
      cleanup: true,
    }),
  );
} finally {
  if (browser) await browser.close();
  await sql.query("delete from site_settings where key=$1", [settingKey]);
  await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
