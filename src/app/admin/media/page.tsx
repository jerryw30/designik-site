import { and, desc, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { deleteMediaPermanently, restoreMedia } from "./actions";
import { CopyUrlButton, MediaPreview } from "./media-client";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default async function MediaLibrary({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const type = typeof query.type === "string" ? query.type : "all";
  const trash = query.trash === "1";
  const filters = [
    trash ? isNotNull(mediaAssets.deletedAt) : isNull(mediaAssets.deletedAt),
  ];
  if (search)
    filters.push(
      or(
        ilike(mediaAssets.title, `%${search}%`),
        ilike(mediaAssets.filename, `%${search}%`),
      )!,
    );
  if (["image", "video", "audio", "application"].includes(type))
    filters.push(ilike(mediaAssets.mimeType, `${type}/%`));
  const items = await db
    .select({
      id: mediaAssets.id,
      filename: mediaAssets.filename,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      title: mediaAssets.title,
      altText: mediaAssets.altText,
      createdAt: mediaAssets.createdAt,
      deletedAt: mediaAssets.deletedAt,
    })
    .from(mediaAssets)
    .where(and(...filters))
    .orderBy(desc(mediaAssets.createdAt))
    .limit(250);
  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt));

  return (
    <AdminShell user={user} title="Media Library">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">
            {trash ? "Media trash" : "Media Library"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {total.count} active asset{total.count === 1 ? "" : "s"}. Upload and
            reuse images, video, audio, PDFs, and fonts.
          </p>
        </div>
        <Link
          href={trash ? "/admin/media" : "/admin/media?trash=1"}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium"
        >
          {trash ? "Back to library" : "Trash"}
        </Link>
      </div>
      {!trash && (
        <form
          action="/api/media/upload"
          method="post"
          encType="multipart/form-data"
          className="mb-6 rounded-2xl border border-dashed border-pink-300 bg-white p-6"
        >
          <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <label className="text-sm font-medium">
              Upload files{" "}
              <span className="font-normal text-neutral-400">
                (up to 4 MB each)
              </span>
              <input
                name="files"
                type="file"
                multiple
                required
                accept="image/*,video/*,audio/*,application/pdf,font/*"
                className="mt-2 block w-full rounded-xl border p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:font-semibold file:text-pink-700"
              />
            </label>
            <button className="admin-button min-w-36">Upload media</button>
          </div>
        </form>
      )}
      <form className="mb-5 grid gap-3 rounded-xl border bg-white p-3 md:grid-cols-[1fr_180px_auto]">
        {trash && <input type="hidden" name="trash" value="1" />}
        <input
          name="search"
          defaultValue={search}
          placeholder="Search filename or title…"
          className="admin-input"
        />
        <select name="type" defaultValue={type} className="admin-input">
          <option value="all">All media types</option>
          <option value="image">Images</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="application">Documents</option>
        </select>
        <button className="rounded-lg border px-5 text-sm font-medium">
          Filter
        </button>
      </form>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <Link
                href={`/admin/media/${item.id}/edit`}
                className="block aspect-[4/3] overflow-hidden bg-neutral-100"
              >
                <MediaPreview
                  id={item.id}
                  mimeType={item.mimeType}
                  title={item.altText || item.title}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="p-4">
                <Link
                  href={`/admin/media/${item.id}/edit`}
                  className="block truncate font-semibold hover:text-pink-600"
                >
                  {item.title}
                </Link>
                <p className="mt-1 truncate text-xs text-neutral-400">
                  {item.filename}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {item.mimeType} · {formatBytes(item.byteSize)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {trash ? (
                    <>
                      <form action={restoreMedia}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="rounded-lg border px-3 py-2 text-xs font-medium">
                          Restore
                        </button>
                      </form>
                      <form action={deleteMediaPermanently}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600">
                          Delete permanently
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/admin/media/${item.id}/edit`}
                        className="rounded-lg border px-3 py-2 text-xs font-medium"
                      >
                        Edit
                      </Link>
                      <CopyUrlButton url={`/api/media/${item.id}`} />
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-white p-16 text-center text-neutral-500">
          {trash
            ? "Trash is empty."
            : "No media matches this view. Upload the first asset above."}
        </div>
      )}
    </AdminShell>
  );
}
