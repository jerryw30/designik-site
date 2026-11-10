
import { neon } from "@neondatabase/serverless";
import {
  existsSync,
} from "node:fs";
import {
  mkdir,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  resolve,
} from "node:path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

if (!existsSync(resolve("frontend/package.json"))) {
  throw new Error(
    "Run this script from the main designik-site folder."
  );
}

const sql = neon(process.env.DATABASE_URL);

// Read published homepage content only.
const rows = await sql`
  SELECT
    s.id,
    s.type,
    s.visible,
    s.published_content
  FROM sections AS s
  INNER JOIN pages AS p
    ON p.id = s.page_id
  WHERE p.slug = 'home'
    AND p.status = 'PUBLISHED'
    AND p.deleted_at IS NULL
  ORDER BY s.position ASC
`;

// Keep only visible, published sections.
const visibleSections = rows.filter((section) => {
  const content = section.published_content;

  return (
    section.visible === true &&
    content &&
    typeof content === "object" &&
    content._cmsPublished !== false
  );
});

// Match the existing homepage snapshot:
// ignore any extra sections after the footer.
const footerIndex = visibleSections.findIndex(
  (section) => section.type === "footer"
);

if (footerIndex === -1) {
  throw new Error(
    "Published homepage footer not found. Export cancelled."
  );
}

const sections = visibleSections
  .slice(0, footerIndex + 1)
  .map((section) => ({
    id: section.id,
    type: section.type,
    visible: true,
    content: section.published_content,
  }));

const output = resolve(
  "frontend/src/data/homepage.json"
);

await mkdir(dirname(output), {
  recursive: true,
});

await writeFile(
  output,
  JSON.stringify({ sections }, null, 2) + "\n",
  "utf8"
);

console.log(
  "Homepage sections exported:",
  sections.length
);

console.log(
  "Static homepage data refreshed successfully."
);
