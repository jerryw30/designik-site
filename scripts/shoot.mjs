import puppeteer from "puppeteer-core";
import sharp from "sharp";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:3000/";
const W = Number(process.argv[2] || 1440);
const OUT = process.argv[3] || "../_figma_ref/render";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb", `--window-size=${W},1000`],
  defaultViewport: { width: W, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

// Scroll through to trigger whileInView reveals
const height = await page.evaluate(() => document.body.scrollHeight);
const step = 700;
for (let y = 0; y < height; y += step) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 180));
}
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 700));

const full = `${OUT}/full-${W}.png`;
await page.screenshot({ path: full, fullPage: true });
const meta = await sharp(full).metadata();
console.log("captured", full, meta.width, "x", meta.height);

// slice into readable bands
const bandH = 1000;
const bands = Math.ceil(meta.height / bandH);
for (let i = 0; i < bands; i++) {
  const top = i * bandH;
  const h = Math.min(bandH, meta.height - top);
  await sharp(full).extract({ left: 0, top, width: meta.width, height: h }).toFile(`${OUT}/band-${W}-${String(i).padStart(2, "0")}.png`);
}
console.log("sliced into", bands, "bands at width", W);

await browser.close();
