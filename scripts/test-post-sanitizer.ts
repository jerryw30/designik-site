/**
 * Attack suite for the post-body sanitiser.
 *
 * Post editing is open to CONTENT_EDITOR and MARKETING_MANAGER, who are not
 * admins, and post HTML is rendered into a public page with
 * dangerouslySetInnerHTML. Every payload below must come out inert.
 *
 *   node --experimental-strip-types scripts/test-post-sanitizer.ts
 */
import { sanitizePostHtml } from "../src/lib/rich-text.ts";

let failures = 0;

/** The output must not contain `banned` (case-insensitive). */
function blocks(label: string, input: string, banned: string) {
  const out = sanitizePostHtml(input);
  const leaked = out.toLowerCase().includes(banned.toLowerCase());
  if (leaked) failures++;
  console.log(`  ${leaked ? "LEAK" : "ok  "}  ${label.padEnd(38)} -> ${out || "(empty)"}`);
}

/** The output must still contain `expected` — formatting we rely on. */
function keeps(label: string, input: string, expected: string) {
  const out = sanitizePostHtml(input);
  const kept = out.includes(expected);
  if (!kept) failures++;
  console.log(`  ${kept ? "ok  " : "LOST"}  ${label.padEnd(38)} -> ${out || "(empty)"}`);
}

console.log("blocked payloads:");
blocks("script tag", '<script>alert(1)</script>', "script");
blocks("inline onerror", '<img src=x onerror="alert(1)">', "onerror");
blocks("onclick handler", '<p onclick="alert(1)">hi</p>', "onclick");
blocks("javascript: href", '<a href="javascript:alert(1)">x</a>', "javascript");
blocks("JaVaScRiPt: case dodge", '<a href="JaVaScRiPt:alert(1)">x</a>', "javascript");
blocks("data: html href", '<a href="data:text/html,<script>alert(1)</script>">x</a>', "data:text/html");
blocks("iframe", '<iframe src="https://evil.test"></iframe>', "iframe");
blocks("svg onload", '<svg onload="alert(1)"></svg>', "onload");
blocks("form + input", '<form action="https://evil.test"><input name="p"></form>', "<form");
blocks("style tag", "<style>body{display:none}</style>", "<style");
blocks("meta refresh", '<meta http-equiv="refresh" content="0;url=https://evil.test">', "meta");
blocks("object embed", '<object data="evil.swf"></object>', "object");
blocks("css expression", '<p style="width:expression(alert(1))">x</p>', "expression");
blocks("position fixed overlay", '<div style="position:fixed;top:0">x</div>', "position");
blocks("background-image url", '<p style="background-image:url(//evil.test/x)">x</p>', "background-image");

console.log("\npreserved formatting:");
keeps("bold", "<p><strong>bold</strong></p>", "<strong>bold</strong>");
keeps("heading", "<h2>Title</h2>", "<h2>Title</h2>");
keeps("bullet list", "<ul><li>one</li></ul>", "<li>one</li>");
keeps("text colour", '<span style="color:#a10140">x</span>', "color:#a10140");
keeps("font size px", '<span style="font-size:26px">x</span>', "font-size:26px");
keeps("font size keyword", '<span style="font-size:x-large">x</span>', "font-size:x-large");
keeps("alignment", '<p style="text-align:center">x</p>', "text-align:center");
keeps("internal link", '<a href="/blog/x">x</a>', 'href="/blog/x"');
keeps("mailto link", '<a href="mailto:a@b.co">mail</a>', "mailto:a@b.co");
keeps("blockquote", "<blockquote>q</blockquote>", "<blockquote>q</blockquote>");

console.log("\nlink hardening:");
const ext = sanitizePostHtml('<a href="https://example.com">x</a>');
const hardened = ext.includes('rel="noopener noreferrer"') && ext.includes('target="_blank"');
if (!hardened) failures++;
console.log(`  ${hardened ? "ok  " : "FAIL"}  external link gets target+rel     -> ${ext}`);

console.log(
  failures === 0
    ? "\nAll sanitiser checks passed."
    : `\n${failures} CHECK(S) FAILED — do not ship.`,
);
process.exit(failures === 0 ? 0 : 1);
