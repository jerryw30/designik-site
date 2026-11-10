
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptsDir);
const frontendDir = join(rootDir, "frontend");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

if (!existsSync(join(frontendDir, "package.json"))) {
  console.error("Frontend project not found.");
  process.exit(1);
}

function runNodeScript(filename) {
  console.log(`\nRunning ${filename}...\n`);

  const result = spawnSync(
    process.execPath,
    [join(scriptsDir, filename)],
    {
      cwd: rootDir,
      stdio: "inherit",
      env: process.env,
    }
  );

  if (result.error || result.status !== 0) {
    console.error(`${filename} failed.`);
    process.exit(result.status || 1);
  }
}

// Step 1: Refresh published homepage content.
runNodeScript("export-static-homepage.mjs");

// Step 2: Refresh published blog content.
runNodeScript("export-static-blog.mjs");

// Step 3: Generate the static frontend.
console.log("\nBuilding static frontend...\n");

const build = spawnSync("npm run build", {
  cwd: frontendDir,
  shell: true,
  stdio: "inherit",
  env: process.env,
});

if (build.error || build.status !== 0) {
  console.error("Static frontend build failed.");
  process.exit(build.status || 1);
}

// Step 4: Verify essential generated pages.
const requiredFiles = [
  "index.html",
  "blog.html",
  "privacy-policy.html",
  "terms-and-conditions.html",
];

let allPassed = true;

console.log("\nVerifying static pages...\n");

for (const filename of requiredFiles) {
  const path = join(frontendDir, "out", filename);
  const found = existsSync(path);

  console.log(`${found ? "PASS" : "FAIL"}: ${filename}`);

  if (!found) allPassed = false;
}

if (!allPassed) {
  console.error("\nSome static pages are missing.");
  process.exit(1);
}

console.log("\nStatic website build completed successfully.");
console.log("Output directory: frontend/out");
