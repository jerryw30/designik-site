import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../../../admin-shell";
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
      <div className="mb-5">
        <Link href="/admin/media" className="text-sm font-medium text-pink-600">
          ← Media Library
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-2xl border bg-neutral-900 p-6">
          <MediaPreview
            id={asset.id}
            mimeType={asset.mimeType}
            title={asset.altText || asset.title}
            className="max-h-[70vh] max-w-full object-contain"
          />
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Attachment details</h2>
          <dl className="mt-3 space-y-1 text-xs text-neutral-500">
            <div>{asset.filename}</div>
            <div>
              {asset.mimeType} · {formatBytes(asset.byteSize)}
            </div>
            <div>Uploaded {asset.createdAt.toLocaleString()}</div>
          </dl>
          <div className="mt-4 flex gap-2">
            <a
              href={`/api/media/${asset.id}`}
              target="_blank"
              className="rounded-lg border px-3 py-2 text-xs font-medium"
            >
              View file
            </a>
            <CopyUrlButton url={`/api/media/${asset.id}`} />
          </div>
          <form action={updateMedia} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={asset.id} />
            <label className="block text-sm font-medium">
              Title
              <input
                name="title"
                defaultValue={asset.title}
                required
                className="admin-input mt-1.5"
              />
            </label>
            {asset.mimeType.startsWith("image/") && (
              <label className="block text-sm font-medium">
                Alternative text
                <input
                  name="altText"
                  defaultValue={asset.altText}
                  className="admin-input mt-1.5"
                />
                <span className="mt-1 block text-xs font-normal text-neutral-400">
                  Describe the purpose of the image for accessibility.
                </span>
              </label>
            )}
            <label className="block text-sm font-medium">
              Caption
              <textarea
                name="caption"
                defaultValue={asset.caption}
                className="admin-input mt-1.5 min-h-20"
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                name="description"
                defaultValue={asset.description}
                className="admin-input mt-1.5 min-h-24"
              />
            </label>
            <label className="block text-sm font-medium">
              Tags
              <input
                name="tags"
                defaultValue={tags}
                placeholder="team, homepage, brand"
                className="admin-input mt-1.5"
              />
            </label>
            <button className="admin-button w-full">Save attachment</button>
          </form>
          <form action={trashMedia} className="mt-4 border-t pt-4">
            <input type="hidden" name="id" value={asset.id} />
            <button className="text-sm font-medium text-red-600">
              Move to trash
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
