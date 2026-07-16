import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.resolve("public/figma");
const man = JSON.parse(fs.readFileSync(path.join(DIR, "_manifest.json"), "utf8"));

// content images = png/jpg (skip the huge backgrounds optionally) + show svgs too small
const imgs = man.filter((a) => ["png", "jpg", "webp"].includes(a.type));

const cell = 200;
const pad = 8;
const labelH = 22;
const cols = 6;
const rows = Math.ceil(imgs.length / cols);
const W = cols * (cell + pad) + pad;
const H = rows * (cell + labelH + pad) + pad;

const composites = [];
for (let i = 0; i < imgs.length; i++) {
  const a = imgs[i];
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = pad + col * (cell + pad);
  const y = pad + row * (cell + labelH + pad);
  try {
    const thumb = await sharp(path.join(DIR, a.file))
      .resize(cell, cell, { fit: "contain", background: { r: 245, g: 245, b: 245 } })
      .png()
      .toBuffer();
    composites.push({ input: thumb, top: y, left: x });
  } catch {}
  const label = `${a.file} ${a.w || "?"}x${a.h || "?"}`;
  const svg = Buffer.from(
    `<svg width="${cell}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="15" font-family="monospace" font-size="11" fill="#fff">${label.slice(0, 32)}</text></svg>`
  );
  composites.push({ input: svg, top: y + cell, left: x });
}

await sharp({ create: { width: W, height: H, channels: 3, background: { r: 230, g: 230, b: 230 } } })
  .composite(composites)
  .png()
  .toFile(path.resolve("../_figma_ref/contact-sheet.png"));
console.log("wrote contact-sheet.png", W, "x", H, "with", imgs.length, "images");
