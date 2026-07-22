import { and, desc, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
import { deleteMediaPermanently, restoreMedia } from "./actions";
import { CopyUrlButton, MediaPreview, MediaUploadForm } from "./media-client";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

const ERROR_NOTICES: Record<string, string> = {
  missing: "Select at least one file to upload.",
  size: "A file exceeded the 4 MB upload limit. Nothing was uploaded.",
  type: "One of the files is not a supported media type. Nothing was uploaded.",
};

const SUCCESS_NOTICES: Record<string, string> = {
  uploaded: "Media uploaded.",
  trashed: "Asset moved to trash.",
  restored: "Asset restored to the library.",
  deleted: "Asset permanently deleted.",
};

function noticeFor(query: Record<string, string | string[] | undefined>) {
  const error = typeof query.error === "string" ? query.error : "";
  if (error)
    return { tone: "error" as const, text: ERROR_NOTICES[error] || "Upload failed." };
  for (const key of Object.keys(SUCCESS_NOTICES))
    if (query[key] === "1")
      return { tone: "success" as const, text: SUCCESS_NOTICES[key] };
  return null;
}

export default async function MediaLibrary({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "media")) redirect("/admin");
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
  const notice = noticeFor(query);

  return (
    <AdminShell user={user} title="Media Library">
      {notice && (
        <p
          role="status"
          className={`mb-5 rounded-lg border px-4 py-3 text-[13px] font-medium ${
            notice.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {notice.text}
        </p>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={T.screenTitle}>
            {trash ? "Media trash" : "Media Library"}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {total.count} active asset{total.count === 1 ? "" : "s"}. Upload and
            reuse images, video, audio, PDFs, and fonts.
          </p>
        </div>
        <Link
          href={trash ? "/admin/media" : "/admin/media?trash=1"}
          className={T.btn}
        >
          {trash ? "Back to library" : "Trash"}
        </Link>
      </div>
      {!trash && <MediaUploadForm />}
      <form
        className={`${T.card} mb-5 grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_190px_auto]`}
      >
        {trash && <input type="hidden" name="trash" value="1" />}
        <input
          name="search"
          defaultValue={search}
          placeholder="Search filename or title…"
          className={T.input}
        />
        <select name="type" defaultValue={type} className={T.select}>
          <option value="all">All media types</option>
          <option value="image">Images</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="application">Documents</option>
        </select>
        <button className={T.btn}>Filter</button>
      </form>
      {items.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => {
            const tile = (
              <MediaPreview
                id={item.id}
                mimeType={item.mimeType}
                title={item.altText || item.title}
                className="h-full w-full object-cover"
              />
            );
            const tileClass =
              "block aspect-square overflow-hidden rounded-lg border border-black/[0.06] bg-neutral-100 shadow-[0_1px_3px_rgba(16,17,22,0.05)]";
            return (
            <article key={item.id} className="group">
              {trash ? (
                // Trashed assets have no edit screen — restore first.
                <div className={tileClass}>{tile}</div>
              ) : (
                <Link
                  href={`/admin/media/${item.id}/edit`}
                  className={`${tileClass} ring-2 ring-transparent transition group-hover:ring-[#a10140]`}
                >
                  {tile}
                </Link>
              )}
              <div className="mt-2.5 px-0.5">
                {trash ? (
                  <span className="block truncate text-[13px] font-semibold text-[#1b1c20]">
                    {item.title}
                  </span>
                ) : (
                  <Link
                    href={`/admin/media/${item.id}/edit`}
                    className="block truncate text-[13px] font-semibold text-[#1b1c20] transition-colors hover:text-[#a10140]"
                  >
                    {item.title}
                  </Link>
                )}
                <p className="mt-0.5 truncate text-[11.5px] text-neutral-400">
                  {item.filename}
                </p>
                <p className="mt-0.5 text-[11.5px] text-neutral-400">
                  {item.mimeType} · {formatBytes(item.byteSize)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {trash ? (
                    <>
                      <form action={restoreMedia}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className={T.btnSmall}>Restore</button>
                      </form>
                      <form action={deleteMediaPermanently}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-2.5 py-1 text-[12.5px] font-medium text-red-600 transition hover:bg-red-50">
                          Delete permanently
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/admin/media/${item.id}/edit`}
                        className={T.btnSmall}
                      >
                        Edit
                      </Link>
                      <CopyUrlButton url={`/api/media/${item.id}`} />
                    </>
                  )}
                </div>
              </div>
            </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-16 text-center text-[13px] text-neutral-500">
          {trash
            ? "Trash is empty."
            : "No media matches this view. Upload the first asset above."}
        </div>
      )}
    </AdminShell>
  );
}
