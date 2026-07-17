import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  designLabels,
  designValue,
  type DesignModule,
} from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources, mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { DesignEditor } from "@/app/admin/design-editor";
import { logout } from "@/app/admin/actions";

const modules = new Set([
  "headers",
  "footers",
  "popups",
  "templates",
  "saved-sections",
]);
export const dynamic = "force-dynamic";

export default async function EditDesign({
  params,
}: {
  params: Promise<{ module: string; id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { module: moduleInput, id } = await params;
  if (!modules.has(moduleInput)) notFound();
  const designModule = moduleInput as DesignModule;
  const [record] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!record) notFound();
  const assets = await db
    .select({
      id: mediaAssets.id,
      title: mediaAssets.title,
      mimeType: mediaAssets.mimeType,
    })
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt))
    .orderBy(mediaAssets.title);
  const value = designValue(designModule, record.data);
  return (
    <main className="min-h-screen bg-[#111216] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/${designModule}`}
            className="text-white/50 hover:text-white"
          >
            ← {designLabels[designModule].title}
          </Link>
          <b>
            DESIGNIK <span className="text-pink-400">GLOBAL BUILDER</span>
          </b>
          <span className="text-sm text-white/40">{record.status}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>{user.name}</span>
          <form action={logout}>
            <button>Sign out</button>
          </form>
        </div>
      </header>
      <DesignEditor
        id={id}
        module={designModule}
        initialTitle={record.title}
        initialStatus={record.status}
        initial={value.draft}
        media={assets}
        previewUrl={`/admin/${designModule}/${id}/preview`}
      />
    </main>
  );
}
