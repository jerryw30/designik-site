import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

/**
 * Disk-backed fallback for files in public/.
 *
 * After the primary domain moved to designik.us, Hostinger's provisioning
 * stopped serving the public/ folder: every /figma, /video and /portfolio
 * request 404s from the platform while dynamic routes (/api/*) keep working.
 * next.config wires fallback rewrites for those prefixes into this route, so
 * it only ever receives a request when the platform's own static layer has
 * already failed to serve the file — on Vercel and local dev it is dormant.
 *
 * Videos need Range support or seeking breaks in every browser, so partial
 * requests are honoured with 206 responses.
 */

export const runtime = "nodejs";

const PUBLIC_ROOT = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Refuse traversal and hidden files outright, then verify the resolved
  // path is still inside public/ — belt and braces.
  if (
    !segments?.length ||
    segments.some((s) => !s || s === ".." || s.startsWith("."))
  ) {
    return new Response("Not found", { status: 404 });
  }
  const filePath = path.resolve(PUBLIC_ROOT, ...segments);
  if (!filePath.startsWith(PUBLIC_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    // Distinct body on purpose: tells us the route ran but the file is not
    // in the deployed bundle, vs. the platform's own HTML 404.
    return new Response("Not found in public bundle", { status: 404 });
  }
  if (!stat.isFile()) return new Response("Not found", { status: 404 });

  const mime =
    MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const baseHeaders: Record<string, string> = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    // Media updates ship under new filenames (same policy as next.config's
    // headers() rule for these extensions), so long caching is safe.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = request.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      let start = m[1] ? parseInt(m[1], 10) : NaN;
      let end = m[2] ? parseInt(m[2], 10) : NaN;
      if (Number.isNaN(start)) {
        // suffix form: bytes=-N (last N bytes)
        start = Math.max(0, stat.size - end);
        end = stat.size - 1;
      } else if (Number.isNaN(end)) {
        end = stat.size - 1;
      }
      end = Math.min(end, stat.size - 1);
      if (start > end || start >= stat.size) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${stat.size}` },
        });
      }
      const stream = Readable.toWeb(
        createReadStream(filePath, { start, end }),
      ) as ReadableStream;
      return new Response(stream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(stat.size) },
  });
}
