/**
 * Register the site's existing images in the Media Library.
 *
 * These files already ship in public/ (149MB of Figma exports). They are
 * registered as *pointers* — a row carrying filePath, title and altText, with
 * content_base64 left NULL — so the library can name and alt them without
 * copying a fifth of a gigabyte of base64 into Neon.
 *
 * Idempotent: re-running skips paths already registered, so widening the scope
 * later is just another run.
 *
 *   node --env-file=.env.local scripts/import-site-media.mjs           # dry run
 *   node --env-file=.env.local scripts/import-site-media.mjs --write   # apply
 *   node --env-file=.env.local scripts/import-site-media.mjs --write --all
 *
 * Default scope is every image referenced by src/lib/assets.ts (the ones
 * actually rendered on the site). --all widens it to every image in public/.
 */
import { readFile, stat, readdir } from "node:fs/promises";
import { join, extname, basename, relative } from "node:path";
import { neon } from "@neondatabase/serverless";

const WRITE = process.argv.includes("--write");
const ALL = process.argv.includes("--all");
const ROOT = process.cwd();
const PUBLIC = join(ROOT, "public");

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// Words that should stay capitalised rather than becoming "Seo" / "Tv".
const ACRONYMS = { seo: "SEO", tv: "TV", ui: "UI", ux: "UX", cta: "CTA", pf: "PF" };

const fixAcronyms = (s) =>
  s
    .split(" ")
    .map((w) => ACRONYMS[w.toLowerCase()] || w)
    .join(" ");

/** "heroScene" -> "Hero Scene"; falls back to the filename when there's no key. */
const titleFromKey = (key) =>
  fixAcronyms(
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase())
      .trim(),
  );

/** "image-photoroom-1-2--277-73.png" -> "Image Photoroom 1 2" */
const titleFromFile = (file) =>
  basename(file, extname(file))
    .replace(/--\d+[-\d]*$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

/** Pull key -> "/figma/x.png" pairs out of the assets registry. */
async function fromAssetsRegistry() {
  const src = await readFile(join(ROOT, "src/lib/assets.ts"), "utf8");
  const out = new Map();
  for (const m of src.matchAll(/(\w+):\s*A\("([^"]+)"\)/g)) {
    out.set(`/figma/${m[2]}`, titleFromKey(m[1]));
  }
  return out;
}

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full)));
    else if (MIME[extname(entry.name).toLowerCase()]) found.push(full);
  }
  return found;
}

async function fromPublic() {
  const out = new Map();
  for (const full of await walk(PUBLIC)) {
    const url = "/" + relative(PUBLIC, full).split(/[\\/]/).join("/");
    out.set(url, titleFromFile(full));
  }
  return out;
}

const wanted = ALL ? await fromPublic() : await fromAssetsRegistry();
console.log(`Scope: ${ALL ? "every image in public/" : "images used by the site (assets.ts)"}`);
console.log(`Referenced: ${wanted.size}`);

// Drop anything whose file is missing, and collect real byte sizes.
const candidates = [];
let missing = 0;
for (const [url, title] of wanted) {
  try {
    const info = await stat(join(PUBLIC, url));
    candidates.push({
      url,
      title,
      filename: basename(url),
      mimeType: MIME[extname(url).toLowerCase()],
      byteSize: info.size,
    });
  } catch {
    missing++;
    console.log(`  ! missing on disk, skipped: ${url}`);
  }
}

const sql = neon(process.env.DATABASE_URL);

const cols = await sql`
  select column_name from information_schema.columns
  where table_name = 'media_assets' and column_name = 'file_path'`;
if (!cols.length) {
  console.error(
    "\nERROR: media_assets.file_path does not exist yet.\n" +
      "Run the migration first:  npm run db:migrate\n",
  );
  process.exit(1);
}

const existing = new Set(
  (await sql`select file_path from media_assets where file_path is not null`).map(
    (r) => r.file_path,
  ),
);
const fresh = candidates.filter((c) => !existing.has(c.url));

const totalMb = (fresh.reduce((n, c) => n + c.byteSize, 0) / 1024 / 1024).toFixed(1);
console.log(
  `On disk: ${candidates.length}${missing ? ` (${missing} missing)` : ""} · ` +
    `already registered: ${candidates.length - fresh.length} · to add: ${fresh.length} (${totalMb}MB referenced, ~0 stored)`,
);

if (!fresh.length) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (!WRITE) {
  console.log("\nDRY RUN — first 15 that would be added:");
  for (const c of fresh.slice(0, 15)) console.log(`  ${c.title.padEnd(26)} ${c.url}`);
  if (fresh.length > 15) console.log(`  … and ${fresh.length - 15} more`);
  console.log("\nRe-run with --write to apply.");
  process.exit(0);
}

// Insert in batches so one oversized statement can't stall the HTTP driver.
let added = 0;
for (let i = 0; i < fresh.length; i += 25) {
  const batch = fresh.slice(i, i + 25);
  await Promise.all(
    batch.map(
      (c) => sql`
        insert into media_assets
          (filename, mime_type, byte_size, content_base64, file_path, title, alt_text, caption, description, tags)
        values
          (${c.filename}, ${c.mimeType}, ${c.byteSize}, null, ${c.url}, ${c.title}, '', '', '', '[]'::jsonb)`,
    ),
  );
  added += batch.length;
  process.stdout.write(`\r  inserted ${added}/${fresh.length}`);
}
console.log(`\n\nDone. ${added} assets registered. They now appear in /admin/media.`);
