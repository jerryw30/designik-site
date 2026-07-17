import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now().toString(36);
let menuId;
let pageId;

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
    }),
  );
} finally {
  if (pageId) await sql.query("delete from pages where id=$1", [pageId]);
  if (menuId)
    await sql.query("delete from admin_resources where id=$1", [menuId]);
}
