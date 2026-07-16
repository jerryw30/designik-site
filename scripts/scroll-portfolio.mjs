import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "../_figma_ref/stack";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
  defaultViewport: { width: 1440, height: 860, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });

// find portfolio section top
const top = await page.evaluate(() => {
  const el = document.getElementById("portfolio");
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
});
console.log("portfolio top:", top);

const offsets = [0, 420, 840, 1260, 1680];
for (let i = 0; i < offsets.length; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), top + offsets[i]);
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: `${OUT}/stack-${i}.png` });
}
console.log("captured", offsets.length, "frames");
await browser.close();
