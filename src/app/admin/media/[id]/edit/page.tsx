import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../../admin-shell";
import { T, wpDate } from "../../../theme";
import { trashMedia, updateMedia } from "../../actions";
import { CopyUrlButton, MediaPreview } from "../../media-client";

function formatBytes(bytes: number) {
  return bytes < 1024 ** 2
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default async function EditMedia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { id } = await params;
  const [asset] = await db
    .select({
      id: mediaAssets.id,
      filename: mediaAssets.filename,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      title: mediaAssets.title,
      altText: mediaAssets.altText,
      caption: mediaAssets.caption,
      description: mediaAssets.description,
      tags: mediaAssets.tags,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
    .limit(1);
  if (!asset) notFound();
  const tags = Array.isArray(asset.tags)
    ? asset.tags
        .filter((tag): tag is string => typeof tag === "string")
        .join(", ")
    : "";
  return (
    <AdminShell user={user} title="Edit media">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className={T.screenTitle}>Edit media</h2>
        <Link href="/admin/media" className={`${T.mutedLink} text-[13px]`}>
          ← Media Library
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-xl border border-black/[0.06] bg-[#16171c] p-6 shadow-[0_1px_3px_rgba(16,17,22,0.05)]">
          <MediaPreview
            id={asset.id}
            mimeType={asset.mimeType}
            title={asset.altText || asset.title}
            className="max-h-[70vh] max-w-full rounded-md object-contain"
          />
        </section>
        <div className="space-y-4">
          <section className={T.card}>
            <div className={T.cardHeader}>
              <h3 className="text-[14px] font-semibold text-[#1b1c20]">
                File details
              </h3>
            </div>
            <div className="px-5 py-4">
              <dl className="space-y-1 text-[12.5px] text-neutral-500">
                <div className="truncate font-medium text-neutral-700">
                  {asset.filename}
                </div>
                <div>
                  {asset.mimeType} · {formatBytes(asset.byteSize)}
                </div>
                <div>Uploaded {wpDate(asset.createdAt)}</div>
              </dl>
              <div className="mt-4 flex gap-2">
                <a
                  href={`/api/media/${asset.id}`}
                  target="_blank"
                  className={T.btnSmall}
                >
                  View file
                </a>
                <CopyUrlButton url={`/api/media/${asset.id}`} />
              </div>
            </div>
          </section>
          <section className={T.card}>
            <div className={T.cardHeader}>
              <h3 className="text-[14px] font-semibold text-[#1b1c20]">
                Attachment details
              </h3>
            </div>
            <div className="px-5 py-5">
              <form action={updateMedia} className="space-y-4">
                <input type="hidden" name="id" value={asset.id} />
                <label className="block">
                  <span className={T.label}>Title</span>
                  <input
                    name="title"
                    defaultValue={asset.title}
                    required
                    className={T.input}
                  />
                </label>
                {asset.mimeType.startsWith("image/") && (
                  <label className="block">
                    <span className={T.label}>Alternative text</span>
                    <input
                      name="altText"
                      defaultValue={asset.altText}
                      className={T.input}
                    />
                    <span className={`${T.help} block`}>
                      Describe the purpose of the image for accessibility.
                    </span>
                  </label>
                )}
                <label className="block">
                  <span className={T.label}>Caption</span>
                  <textarea
                    name="caption"
                    defaultValue={asset.caption}
                    className={`${T.input} min-h-20`}
                  />
                </label>
                <label className="block">
                  <span className={T.label}>Description</span>
                  <textarea
                    name="description"
                    defaultValue={asset.description}
                    className={`${T.input} min-h-24`}
                  />
                </label>
                <label className="block">
                  <span className={T.label}>Tags</span>
                  <input
                    name="tags"
                    defaultValue={tags}
                    placeholder="team, homepage, brand"
                    className={T.input}
                  />
                  <span className={`${T.help} block`}>
                    Separate tags with commas.
                  </span>
                </label>
                <button className={`${T.btnPrimary} w-full`}>
                  Save attachment
                </button>
              </form>
              <form
                action={trashMedia}
                className="mt-5 border-t border-black/[0.05] pt-4 text-center"
              >
                <input type="hidden" name="id" value={asset.id} />
                <button className={`${T.dangerLink} text-[13px]`}>
                  Move to trash
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
