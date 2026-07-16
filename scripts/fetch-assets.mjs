import fs from "node:fs";
import path from "node:path";

const SRC = "C:/Users/Moiz/.claude/projects/C--Users-Moiz-Desktop-Designik-new-site/226ea01a-63d9-4035-963e-87b8e80e6577/tool-results/mcp-7365afad-d8f0-42f2-99e9-22bb8246f736-get_design_context-1782252148457.txt";
const OUT = path.resolve("public/figma");
fs.mkdirSync(OUT, { recursive: true });

const j = JSON.parse(fs.readFileSync(SRC, "utf8"));
const code = j[0].text;

// parse: const NAME = "https://...asset/UUID";
const re = /const\s+(\w+)\s*=\s*"(https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^"]+)"/g;
const map = new Map();
let m;
while ((m = re.exec(code))) {
  if (!map.has(m[2])) map.set(m[2], m[1]);
}
console.log("unique assets:", map.size);

function ext(buf, ct) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57) return "webp";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "gif";
  const head = buf.slice(0, 200).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "svg";
  if (ct?.includes("svg")) return "svg";
  return "bin";
}

function kebab(name) {
  return name
    .replace(/^img/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "asset";
}

const manifest = [];
let i = 0;
for (const [url, name] of map) {
  i++;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.log(`FAIL ${res.status} ${name}`); continue; }
    const ct = res.headers.get("content-type") || "";
    const buf = Buffer.from(await res.arrayBuffer());
    const e = ext(buf, ct);
    const base = kebab(name);
    let file = `${base}.${e}`;
    let n = 1;
    while (fs.existsSync(path.join(OUT, file))) { file = `${base}-${n++}.${e}`; }
    fs.writeFileSync(path.join(OUT, file), buf);
    manifest.push({ constant: name, file, bytes: buf.length, type: e, url });
    if (i % 10 === 0) console.log(`...${i}/${map.size}`);
  } catch (err) {
    console.log(`ERR ${name}: ${err.message}`);
  }
}
fs.writeFileSync(path.join(OUT, "_manifest.json"), JSON.stringify(manifest, null, 2));
console.log("DONE. saved", manifest.length, "assets to public/figma");
const byType = manifest.reduce((a, x) => ((a[x.type] = (a[x.type] || 0) + 1), a), {});
console.log("by type:", byType);
