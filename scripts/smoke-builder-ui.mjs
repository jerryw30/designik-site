import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import puppeteer from "puppeteer-core";

const sql = neon(process.env.DATABASE_URL);
const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const [user] = await sql.query(
  "select id from users where active=true order by created_at limit 1",
  [],
);
const [pageRecord] = await sql.query(
  "select id from pages where slug='home' limit 1",
  [],
);
const candidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];
const executablePath = candidates.find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge executable not found");

await sql.query(
  "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
  [user.id, tokenHash],
);
let browser;
try {
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.setCookie({
    name: "designik_admin_session",
    value: token,
    domain: "designik-site.vercel.app",
    path: "/",
    httpOnly: true,
    secure: true,
  });
  await page.goto(
    `https://designik-site.vercel.app/admin/pages/${pageRecord.id}/builder`,
    { waitUntil: "networkidle2", timeout: 60000 },
  );
  const columns = await page.$$eval(".builder-grid > *", (elements) =>
    elements.map((element) =>
      Math.round(element.getBoundingClientRect().width),
    ),
  );
  if (columns.length !== 3)
    throw new Error(`Expected 3 builder columns, found ${columns.length}`);
  const statsButton = await page
    .$$("aside:first-child button")
    .then(async (buttons) => {
      for (const button of buttons)
        if (
          (await button.evaluate((node) => node.textContent))
            ?.trim()
            .includes("Stats")
        )
          return button;
    });
  if (!statsButton) throw new Error("Stats navigator control not found");
  await statsButton.click();
  await page.waitForFunction(
    () => document.body.innerText.includes("Add item"),
    { timeout: 10000 },
  );
  const controls = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return {
      copy: text.includes("copy"),
      paste: text.includes("paste"),
      template: text.includes("template"),
      nestedItems: text.includes("add item"),
      tablet: text.includes("tablet"),
      mobile: text.includes("mobile"),
    };
  });
  if (Object.values(controls).some((value) => !value))
    throw new Error(`Missing builder control: ${JSON.stringify(controls)}`);
  const clickDevice = async (label) => {
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await button.evaluate((node) =>
        node.textContent?.trim().toLowerCase(),
      );
      if (text === label) {
        await button.click();
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    return page.$eval('iframe[title="Draft website preview"]', (frame) =>
      Math.round(frame.parentElement.getBoundingClientRect().width),
    );
  };
  const tabletWidth = await clickDevice("tablet");
  const mobileWidth = await clickDevice("mobile");
  if (tabletWidth !== 768 || mobileWidth !== 390)
    throw new Error(
      `Responsive preview widths failed: ${tabletWidth}, ${mobileWidth}`,
    );
  console.log(
    JSON.stringify({
      status: "ok",
      columns,
      tabletWidth,
      mobileWidth,
      ...controls,
    }),
  );
} finally {
  if (browser) await browser.close();
  await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
