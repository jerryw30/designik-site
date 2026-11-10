
import { neon } from "@neondatabase/serverless";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT slug, title, updated_at, data
  FROM admin_resources
  WHERE module = 'posts'
    AND status = 'PUBLISHED'
    AND deleted_at IS NULL
  ORDER BY updated_at DESC
`;

const posts = rows.flatMap((row) => {
  if (
    typeof row.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)
  ) {
    console.warn("Skipping invalid blog slug");
    return [];
  }

  const data =
    row.data &&
    typeof row.data === "object" &&
    !Array.isArray(row.data)
      ? row.data
      : {};

  const getText = (key) =>
    typeof data[key] === "string" ? data[key] : "";

  return [{
    slug: row.slug,
    title: row.title,
    updatedAt: new Date(row.updated_at).toISOString(),
    excerpt: getText("excerpt"),
    content: getText("content"),
    category: getText("category"),
    featuredImage: getText("featuredImage"),
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag) => typeof tag === "string")
      : [],
  }];
});

const output = resolve(
  "frontend/src/data/blog-posts.json"
);

await mkdir(dirname(output), { recursive: true });

await writeFile(
  output,
  JSON.stringify({ posts }, null, 2) + "\n",
  "utf8"
);

console.log("Published blog posts exported:", posts.length);
console.log("Static blog data file created successfully.");
