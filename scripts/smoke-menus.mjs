import { createHash, randomBytes, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let menuId;
let pageId;
let tokenHash;

try {
  const rootId = randomUUID();
  const childId = randomUUID();
  const items = [
    {
      id: rootId,
      label: "Services",
      url: "#services",
      parentId: null,
      target: "_self",
    },
    {
      id: childId,
      label: "Web Design",
      url: "/web-design",
      parentId: rootId,
      target: "_self",
    },
  ];
  const [menu] = await sql.query(
    "insert into admin_resources(module,title,slug,status,data) values('menus',$1,$2,'DRAFT',$3::jsonb) returning id",
    ["Menu smoke", `menu-smoke-${suffix}`, JSON.stringify({ items })],
  );
  menuId = menu.id;
  const edited = [
    ...items,
    {
      id: randomUUID(),
      label: "Contact",
      url: "#contact",
      parentId: null,
      target: "_self",
    },
  ];
  await sql.query(
    "update admin_resources set data=$1::jsonb,updated_at=now() where id=$2",
    [JSON.stringify({ items: edited }), menuId],
  );
  const [stored] = await sql.query(
    "select data from admin_resources where id=$1",
    [menuId],
  );
  if (
    stored.data.items.length !== 3 ||
    stored.data.items[1].parentId !== rootId
  )
    throw new Error("Menu edit or hierarchy failed");
  const [page] = await sql.query(
    "insert into pages(title,slug,status) values($1,$2,'DRAFT') returning id",
    ["Menu smoke page", `menu-smoke-page-${suffix}`],
  );
  pageId = page.id;
  const links = stored.data.items
    .filter((item) => !item.parentId)
    .map((root) => ({
      label: root.label,
      href: root.url,
      target: root.target,
      children: stored.data.items
        .filter((item) => item.parentId === root.id)
        .map((child) => ({
          label: child.label,
          href: child.url,
          target: child.target,
        })),
    }));
  const [header] = await sql.query(
    "insert into sections(page_id,type,name,position,draft_content,published_content) values($1,'header','Header',0,$2::jsonb,$2::jsonb) returning id",
    [pageId, JSON.stringify({ links })],
  );
  const [publishedHeader] = await sql.query(
    "select published_content from sections where id=$1",
    [header.id],
  );
  if (
    publishedHeader.published_content.links[0].children[0].label !==
    "Web Design"
  )
    throw new Error("Header dropdown mapping failed");
  await sql.query("update admin_resources set status='PUBLISHED' where id=$1", [
    menuId,
  ]);
  const [user] = await sql.query(
    "select id from users where active=true order by created_at limit 1",
    [],
  );
  const token = randomBytes(32).toString("base64url");
  tokenHash = createHash("sha256").update(token).digest("hex");
  await sql.query(
    "insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '5 minutes')",
    [user.id, tokenHash],
  );
  const headers = { cookie: `designik_admin_session=${token}` };
  const [listResponse, editResponse, previewResponse] = await Promise.all([
    fetch("https://designik-site.vercel.app/admin/menus", { headers }),
    fetch(`https://designik-site.vercel.app/admin/menus/${menuId}/edit`, {
      headers,
    }),
    fetch(`https://designik-site.vercel.app/admin/menus/${menuId}/preview`, {
      headers,
    }),
  ]);
  const editHtml = await editResponse.text();
  const previewHtml = await previewResponse.text();
  if (
    listResponse.status !== 200 ||
    editResponse.status !== 200 ||
    previewResponse.status !== 200 ||
    !editHtml.includes("Add menu item") ||
    !previewHtml.includes("Menu preview")
  )
    throw new Error("Production menu routes failed");
  await sql.query(
    "update admin_resources set status='TRASH',deleted_at=now() where id=$1",
    [menuId],
  );
  await sql.query(
    "update admin_resources set status='DRAFT',deleted_at=null where id=$1",
    [menuId],
  );
  await sql.query(
    "update admin_resources set status='TRASH',deleted_at=now() where id=$1",
    [menuId],
  );
  await sql.query(
    "delete from admin_resources where id=$1 and status='TRASH'",
    [menuId],
  );
  menuId = undefined;
  console.log(
    JSON.stringify({
      create: true,
      edit: true,
      reorderSchema: true,
      dropdownHierarchy: true,
      headerMapping: true,
      publish: true,
      trash: true,
      restore: true,
      delete: true,
      productionRoutes: true,
    }),
  );
} finally {
  if (pageId) await sql.query("delete from pages where id=$1", [pageId]);
  if (menuId)
    await sql.query("delete from admin_resources where id=$1", [menuId]);
  if (tokenHash)
    await sql.query("delete from sessions where token_hash=$1", [tokenHash]);
}
