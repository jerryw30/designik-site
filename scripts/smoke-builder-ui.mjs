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
const widgetSectionId = crypto.randomUUID();
const legacySectionId = crypto.randomUUID();
const widgetId = `widget-smoke-${Date.now()}`;
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
await sql.query(
  `insert into sections(id,page_id,type,name,position,content,draft_content,published_content,styles,responsive,animation,visible,locked)
   values($1,$2,'about','Legacy style smoke',(select coalesce(max(position),0)+1 from sections where page_id=$2),$3::jsonb,$3::jsonb,'{"_cmsPublished":false}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,true,false)`,
  [
    legacySectionId,
    pageRecord.id,
    JSON.stringify({
      eyebrow: "Style smoke eyebrow",
      headingAccent: "Visual",
      heading: "Inline style smoke",
      description: "Temporary legacy style test",
      buttonLabel: "Style test button",
      buttonLink: "#style-test",
    }),
  ],
);
await sql.query(
  `insert into sections(id,page_id,type,name,position,content,draft_content,published_content,styles,responsive,animation,visible,locked)
   values($1,$2,'widgets','Widget smoke',(select coalesce(max(position),0)+1 from sections where page_id=$2),$3::jsonb,$3::jsonb,'{"_cmsPublished":false}'::jsonb,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,true,false)`,
  [
    widgetSectionId,
    pageRecord.id,
    JSON.stringify({
      backgroundColor: "#ffffff",
      paddingTop: 32,
      paddingBottom: 32,
      maxWidth: 1280,
      widgets: [
        {
          id: widgetId,
          type: "image",
          content: "/figma/vector1.svg",
          settings: {
            color: "#202126",
            backgroundColor: "transparent",
            fontSize: 16,
            fontWeight: 400,
            align: "center",
            width: 100,
            height: 240,
            marginTop: 0,
            marginBottom: 0,
            padding: 0,
            borderWidth: 0,
            borderColor: "transparent",
            borderRadius: 0,
            shadow: "none",
            hoverColor: "#ff006b",
            hoverBackgroundColor: "transparent",
            animation: "none",
            desktopVisible: true,
            tabletVisible: true,
            mobileVisible: true,
            href: "#",
            alt: "Direct element smoke",
            gap: 16,
            columns: 2,
          },
        },
      ],
    }),
  ],
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
    let clicked = false;
    for (const button of buttons) {
      const text = await button.evaluate((node) =>
        node.textContent?.trim().toLowerCase(),
      );
      if (text === label) {
        await button.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error(`${label} preview button not found`);
    const expected = label === "tablet" ? 768 : label === "mobile" ? 390 : null;
    if (expected)
      await page.waitForFunction(
        (width) =>
          Math.round(
            document
              .querySelector('iframe[title="Draft website preview"]')
              ?.parentElement?.getBoundingClientRect().width || 0,
          ) === width,
        { timeout: 10000 },
        expected,
      );
    else await new Promise((resolve) => setTimeout(resolve, 400));
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
  const widgetButton = await page
    .$$("aside:first-child button")
    .then(async (buttons) => {
      for (const button of buttons)
        if (
          (await button.evaluate((node) => node.textContent))?.includes(
            "Widget smoke",
          )
        )
          return button;
    });
  if (!widgetButton)
    throw new Error("Widget section navigator control not found");
  await widgetButton.click();
  try {
    await page.waitForFunction(
      () =>
        document.body.innerText
          .toLowerCase()
          .includes("advanced widget controls"),
      { timeout: 10000 },
    );
  } catch {
    const panelText = await page.$eval("aside:last-child", (node) =>
      node.innerText.slice(0, 1200),
    );
    throw new Error(`Widget panel failed to open: ${panelText}`);
  }
  await clickDevice("desktop");
  const previewFrame = await (
    await page.$('iframe[title="Draft website preview"]')
  ).contentFrame();
  await previewFrame.waitForSelector(`[data-cms-element="${widgetId}"]`, {
    timeout: 10000,
  });
  await previewFrame.click(`[data-cms-element="${widgetId}"]`);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("details")].some(
        (item) =>
          item.textContent
            ?.toLowerCase()
            .includes("advanced widget controls") && item.open,
      ),
    { timeout: 10000 },
  );
  const advanced = await page.evaluate(() => ({
    directElement: [...document.querySelectorAll("details")].some(
      (item) =>
        item.textContent?.toLowerCase().includes("advanced widget controls") &&
        item.open,
    ),
    background: Boolean(
      document.querySelector('[aria-label="Widget background color"]'),
    ),
    dimensions: Boolean(
      document.querySelector('[aria-label="Widget Width %"]'),
    ),
    spacing: Boolean(document.querySelector('[aria-label="Widget Padding"]')),
    borders: Boolean(
      document.querySelector('[aria-label="Widget Border width"]'),
    ),
    shadow: Boolean(document.querySelector('[aria-label="Widget shadow"]')),
    hover: Boolean(document.querySelector('[aria-label="Widget hover color"]')),
    animation: Boolean(
      document.querySelector('[aria-label="Widget animation"]'),
    ),
    responsive: Boolean(
      document.querySelector('[aria-label="Widget Mobile visible"]'),
    ),
    mediaLibrary: Boolean(
      document.body.innerText.includes("Choose from Media Library"),
    ),
  }));
  if (Object.values(advanced).some((value) => !value))
    throw new Error(
      `Advanced widget controls failed: ${JSON.stringify(advanced)}`,
    );
  const heroHeading = await previewFrame.$("h1");
  if (!heroHeading) throw new Error("Hero heading was not rendered in preview");
  await heroHeading.click();
  await page.waitForSelector('[aria-label="Inline hero heading"]', {
    timeout: 10000,
  });
  const directHero = Boolean(
    await page.$('[aria-label="Inline hero heading"]'),
  );
  const heroButton = await previewFrame.evaluateHandle(() => {
    const hero = document.querySelector("h1")?.closest("[data-cms-section]");
    return [...(hero?.querySelectorAll("a") || [])].find((anchor) =>
      anchor.textContent?.toLowerCase().includes("get started"),
    );
  });
  if (!heroButton.asElement()) throw new Error("Hero button was not rendered");
  await heroButton.asElement().click();
  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector('[aria-label="Inline hero primaryLabel"]'),
      ) &&
      Boolean(document.querySelector('[aria-label="Inline hero primaryLink"]')),
    { timeout: 10000 },
  );
  const directLinkAndLabel = true;
  const statsLeaf = await previewFrame.evaluateHandle(() => {
    const stats = [...document.querySelectorAll("[data-cms-section]")].find(
      (section) => section.textContent?.includes("Clutch"),
    );
    return (
      [...(stats?.querySelectorAll("span") || [])].find(
        (span) => span.textContent?.trim() === "Clutch",
      ) || null
    );
  });
  const statsElement = statsLeaf.asElement();
  if (!statsElement) throw new Error("Stats nested text was not rendered");
  await statsElement.click();
  await page.waitForFunction(
    () => Boolean(document.querySelector('[aria-label="Inline reviewSite"]')),
    { timeout: 10000 },
  );
  const directLegacyNested = Boolean(
    await page.$('[aria-label="Inline reviewSite"]'),
  );
  const styleHeading = await previewFrame.evaluateHandle((sectionId) => {
    const section = document.querySelector(`[data-cms-section="${sectionId}"]`);
    return [...(section?.querySelectorAll("span") || [])].find(
      (span) => span.textContent?.trim() === "Inline style smoke",
    );
  }, legacySectionId);
  if (!styleHeading.asElement())
    throw new Error("Legacy style target was not rendered");
  await styleHeading.asElement().click();
  await page.waitForSelector('[aria-label="Element Text color"]', {
    timeout: 10000,
  });
  await page.$eval('[aria-label="Element Text color"]', (input) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, "#123456");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const saved = await page.evaluate(() => {
    const button = [
      ...document.querySelectorAll("aside:last-child button"),
    ].find((item) => item.textContent?.trim() === "Save draft");
    if (button instanceof HTMLButtonElement) button.click();
    return Boolean(button);
  });
  if (!saved) throw new Error("Legacy section save control not found");
  await page.waitForFunction(
    () => document.body.innerText.includes("Draft saved"),
    { timeout: 10000 },
  );
  const [savedLegacy] = await sql.query(
    "select draft_content from sections where id=$1",
    [legacySectionId],
  );
  const elementStyles = Object.values(
    savedLegacy.draft_content._elementStyles || {},
  );
  const independentElementStyle = elementStyles.some(
    (style) => style.color === "#123456",
  );
  if (!independentElementStyle)
    throw new Error("Independent legacy element style did not persist");
  const styledPreview = await fetch(
    `https://designik-site.vercel.app/admin/pages/${pageRecord.id}/preview`,
    { headers: { cookie: `designik_admin_session=${token}` } },
  ).then((response) => response.text());
  const elementStyleRuntime = styledPreview.includes("#123456");
  if (!elementStyleRuntime)
    throw new Error("Saved independent element style was not rendered");
  console.log(
    JSON.stringify({
      status: "ok",
      columns,
      tabletWidth,
      mobileWidth,
      ...controls,
      ...advanced,
      directHero,
      directLinkAndLabel,
      directLegacyNested,
      independentElementStyle,
      elementStyleRuntime,
    }),
  );
} finally {
  if (browser) await browser.close();
  await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
  await sql.query("delete from sections where id=$1", [widgetSectionId]);
  await sql.query("delete from sections where id=$1", [legacySectionId]);
}
