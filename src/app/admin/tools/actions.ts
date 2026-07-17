"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";

type Backup = {
  format: string;
  version: number;
  pages: Record<string, unknown>[];
  sections: Record<string, unknown>[];
  resources: Record<string, unknown>[];
  settings: Record<string, unknown>[];
  media: Record<string, unknown>[];
};
const recordArray = (value: unknown) =>
  Array.isArray(value) &&
  value.every((item) => item && typeof item === "object");
const text = (value: unknown) => String(value ?? "");
export async function importBackup(form: FormData) {
  await requirePermission("manage_settings");
  const file = form.get("backup");
  if (!(file instanceof File) || !file.size)
    redirect("/admin/tools?error=missing");
  if (file.size > 8 * 1024 * 1024) redirect("/admin/tools?error=size");
  let data: Backup;
  try {
    data = JSON.parse(await file.text()) as Backup;
  } catch {
    redirect("/admin/tools?error=json");
  }
  if (
    data.format !== "designik-cms-backup" ||
    data.version !== 1 ||
    !recordArray(data.pages) ||
    !recordArray(data.sections) ||
    !recordArray(data.resources) ||
    !recordArray(data.settings) ||
    !recordArray(data.media)
  )
    redirect("/admin/tools?error=format");
  const sql = neon(process.env.DATABASE_URL!);
  const pageMap = new Map<string, string>();
  for (const page of data.pages) {
    const oldId = text(page.id),
      slug = text(page.slug),
      title = text(page.title) || "Untitled";
    if (!oldId || !slug) continue;
    const [existing] = await sql.query(
      "select id from pages where slug=$1 limit 1",
      [slug],
    );
    const id = existing?.id || oldId;
    pageMap.set(oldId, id);
    if (existing)
      await sql.query(
        "update pages set title=$2,status=$3,seo=$4::jsonb,settings=$5::jsonb,published_at=$6,deleted_at=$7,updated_at=now() where id=$1",
        [
          id,
          title,
          text(page.status) || "DRAFT",
          JSON.stringify(page.seo || {}),
          JSON.stringify(page.settings || {}),
          page.publishedAt || page.published_at || null,
          page.deletedAt || page.deleted_at || null,
        ],
      );
    else
      await sql.query(
        "insert into pages(id,title,slug,status,seo,settings,published_at,deleted_at) values($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)",
        [
          id,
          title,
          slug,
          text(page.status) || "DRAFT",
          JSON.stringify(page.seo || {}),
          JSON.stringify(page.settings || {}),
          page.publishedAt || page.published_at || null,
          page.deletedAt || page.deleted_at || null,
        ],
      );
  }
  for (const section of data.sections) {
    const id = text(section.id),
      pageId = pageMap.get(text(section.pageId || section.page_id));
    if (!id || !pageId) continue;
    const values = [
      id,
      pageId,
      text(section.type) || "widgets",
      text(section.name) || "Section",
      Number(section.position || 0),
      JSON.stringify(section.content || {}),
      JSON.stringify(section.draftContent || section.draft_content || {}),
      JSON.stringify(
        section.publishedContent || section.published_content || {},
      ),
      JSON.stringify(section.styles || {}),
      JSON.stringify(section.responsive || {}),
      JSON.stringify(section.animation || {}),
      section.visible !== false,
      section.locked === true,
    ];
    await sql.query(
      `insert into sections(id,page_id,type,name,position,content,draft_content,published_content,styles,responsive,animation,visible,locked) values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13) on conflict(id) do update set page_id=excluded.page_id,type=excluded.type,name=excluded.name,position=excluded.position,content=excluded.content,draft_content=excluded.draft_content,published_content=excluded.published_content,styles=excluded.styles,responsive=excluded.responsive,animation=excluded.animation,visible=excluded.visible,locked=excluded.locked,updated_at=now()`,
      values,
    );
  }
  for (const resource of data.resources) {
    const moduleName = text(resource.module),
      slug = text(resource.slug);
    if (!moduleName || !slug) continue;
    await sql.query(
      `insert into admin_resources(id,module,title,slug,status,data,created_by,deleted_at) values($1,$2,$3,$4,$5,$6::jsonb,null,$7) on conflict(module,slug) do update set title=excluded.title,status=excluded.status,data=excluded.data,deleted_at=excluded.deleted_at,updated_at=now()`,
      [
        text(resource.id) || crypto.randomUUID(),
        moduleName,
        text(resource.title) || "Untitled",
        slug,
        text(resource.status) || "DRAFT",
        JSON.stringify(resource.data || {}),
        resource.deletedAt || resource.deleted_at || null,
      ],
    );
  }
  for (const setting of data.settings) {
    const key = text(setting.key);
    if (!key) continue;
    await sql.query(
      "insert into site_settings(key,value) values($1,$2::jsonb) on conflict(key) do update set value=excluded.value,updated_at=now()",
      [key, JSON.stringify(setting.value || {})],
    );
  }
  for (const asset of data.media) {
    const id = text(asset.id),
      filename = text(asset.filename),
      mime = text(asset.mimeType || asset.mime_type),
      content = text(asset.contentBase64 || asset.content_base64);
    if (!id || !filename || !mime || !content) continue;
    await sql.query(
      `insert into media_assets(id,filename,mime_type,byte_size,content_base64,title,alt_text,caption,description,tags,uploaded_by,deleted_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,null,$11) on conflict(id) do update set filename=excluded.filename,mime_type=excluded.mime_type,byte_size=excluded.byte_size,content_base64=excluded.content_base64,title=excluded.title,alt_text=excluded.alt_text,caption=excluded.caption,description=excluded.description,tags=excluded.tags,deleted_at=excluded.deleted_at,updated_at=now()`,
      [
        id,
        filename,
        mime,
        Number(asset.byteSize || asset.byte_size || 0),
        content,
        text(asset.title) || filename,
        text(asset.altText || asset.alt_text),
        text(asset.caption),
        text(asset.description),
        JSON.stringify(asset.tags || []),
        asset.deletedAt || asset.deleted_at || null,
      ],
    );
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  redirect(`/admin/tools?imported=1&pages=${pageMap.size}`);
}
