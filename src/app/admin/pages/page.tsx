import Link from "next/link";
import { and, count, desc, eq, ilike, isNotNull, isNull, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { SelectAllBox } from "../wp-ui";
import { bulkPages, createPage, deletePageForever, duplicatePage, restorePage, setPageStatus, trashPage } from "../actions";

export const dynamic = "force-dynamic";

const wpLink = "text-[#a10140] hover:text-[#7c0134] hover:underline";

function wpDate(d: Date) {
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${date} at ${time}`;
}

export default async function Pages({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; s?: string; new?: string; trash?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const query = await searchParams;
  const status = query.trash === "1" ? "trash" : query.status || "all";
  const search = (query.s || "").trim();

  const notTrashed = isNull(pages.deletedAt);
  const filters: Record<string, SQL | undefined> = {
    all: notTrashed,
    published: and(notTrashed, eq(pages.status, "PUBLISHED")),
    draft: and(notTrashed, eq(pages.status, "DRAFT")),
    trash: isNotNull(pages.deletedAt),
  };
  let where = filters[status] || filters.all;
  if (search) where = and(where, ilike(pages.title, `%${search}%`));

  const [rows, [allC], [pubC], [draftC], [trashC]] = await Promise.all([
    db
      .select({ page: pages, authorName: users.name })
      .from(pages)
      .leftJoin(users, eq(pages.authorId, users.id))
      .where(where)
      .orderBy(desc(pages.updatedAt)),
    db.select({ value: count() }).from(pages).where(filters.all),
    db.select({ value: count() }).from(pages).where(filters.published),
    db.select({ value: count() }).from(pages).where(filters.draft),
    db.select({ value: count() }).from(pages).where(filters.trash),
  ]);

  const views = [
    { key: "all", label: "All", count: allC.value, href: "/admin/pages" },
    { key: "published", label: "Published", count: pubC.value, href: "/admin/pages?status=published" },
    { key: "draft", label: "Draft", count: draftC.value, href: "/admin/pages?status=draft" },
    { key: "trash", label: "Trash", count: trashC.value, href: "/admin/pages?status=trash" },
  ].filter((v) => v.key === "all" || v.count > 0);

  const inTrash = status === "trash";

  return (
    <AdminShell user={user} title="Pages">
      {/* screen heading — WP style */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[23px] font-normal text-[#1d2327]">Pages</h2>
        <Link
          href="/admin/pages?new=1"
          className="rounded-lg border border-[#a10140] bg-white px-2.5 py-1 text-[13px] font-medium text-[#a10140] hover:bg-[#fdf2f7]"
        >
          Add New Page
        </Link>
        {search && <span className="text-[13px] text-[#50575e]">Search results for: <strong>&ldquo;{search}&rdquo;</strong></span>}
      </div>

      {/* inline create (Add New) */}
      {query.new === "1" && (
        <form action={createPage} className="mt-4 flex flex-wrap gap-2 rounded-lg border border-[#c3c4c7] bg-white p-4 shadow-sm">
          <input
            name="title"
            required
            autoFocus
            placeholder="Page title"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-[14px] outline-none focus:border-[#a10140] focus:shadow-[0_0_0_1px_#a10140]"
          />
          <button className="rounded-lg bg-[#a10140] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#7c0134]">
            Create &amp; edit visually
          </button>
          <Link href="/admin/pages" className="px-2 py-1.5 text-[13px] text-[#50575e] hover:text-[#7c0134]">
            Cancel
          </Link>
        </form>
      )}

      {/* subsubsub status links */}
      <ul className="mt-4 flex flex-wrap items-center gap-1.5 text-[13px]">
        {views.map((v, i) => (
          <li key={v.key} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#c3c4c7]">|</span>}
            <Link
              href={v.href}
              className={status === v.key ? "font-semibold text-black" : wpLink}
            >
              {v.label} <span className="text-[#50575e]">({v.count})</span>
            </Link>
          </li>
        ))}
      </ul>

      <form action={bulkPages}>
        {/* tablenav top */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select name="bulk" defaultValue="-1" className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-[13px]">
              <option value="-1">Bulk actions</option>
              {inTrash ? (
                <>
                  <option value="restore">Restore</option>
                  <option value="delete">Delete permanently</option>
                </>
              ) : (
                <>
                  <option value="publish">Publish</option>
                  <option value="draft">Move to Draft</option>
                  <option value="trash">Move to Trash</option>
                </>
              )}
            </select>
            <button className="rounded-lg border border-[#a10140] bg-white px-2.5 py-1 text-[13px] font-medium text-[#a10140] hover:bg-[#fdf2f7]">
              Apply
            </button>
          </div>
          {/* search box (separate GET form is invalid inside a form — use inputs targeting this form via formmethod) */}
          <div className="flex items-center gap-2">
            <input
              name="s"
              defaultValue={search}
              placeholder="Search pages…"
              form="pages-search"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#a10140] focus:shadow-[0_0_0_1px_#a10140]"
            />
            <button form="pages-search" className="rounded-lg border border-[#a10140] bg-white px-2.5 py-1 text-[13px] font-medium text-[#a10140] hover:bg-[#fdf2f7]">
              Search Pages
            </button>
          </div>
        </div>

        {/* list table */}
        <table className="mt-2.5 w-full border-collapse border border-[#c3c4c7] bg-white text-[13px] shadow-sm">
          <thead>
            <tr className="border-b border-[#c3c4c7] text-left text-[#1d2327]">
              <th className="w-10 px-3 py-2.5"><SelectAllBox /></th>
              <th className="px-3 py-2.5 font-normal">Title</th>
              <th className="hidden px-3 py-2.5 font-normal md:table-cell">Author</th>
              <th className="hidden px-3 py-2.5 font-normal sm:table-cell">URL</th>
              <th className="w-44 px-3 py-2.5 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[#50575e]">
                  No pages found.
                </td>
              </tr>
            )}
            {rows.map(({ page, authorName }) => (
              <tr key={page.id} className="group border-b border-[#f0f0f1] align-top hover:bg-[#f6f7f7]">
                <td className="px-3 py-3">
                  <input type="checkbox" name="ids" value={page.id} aria-label={`Select ${page.title}`} className="h-4 w-4 accent-[#a10140]" />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-semibold">
                    <Link href={`/admin/pages/${page.id}/edit`} className={`${wpLink} text-[14px]`}>
                      {page.title}
                    </Link>
                    {page.slug === "home" && <span className="ml-1.5 text-[#1d2327]">— Front Page</span>}
                    {page.status === "DRAFT" && !inTrash && <span className="ml-1.5 text-[#1d2327]">— Draft</span>}
                  </div>
                  {/* row actions — visible on hover like WP */}
                  <div className="mt-1 flex flex-wrap gap-1 text-[12.5px] opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                    {inTrash ? (
                      <>
                        <button formAction={restorePage.bind(null, page.id)} className={wpLink}>Restore</button>
                        {page.slug !== "home" && (
                          <>
                            <span className="text-[#c3c4c7]">|</span>
                            <button formAction={deletePageForever.bind(null, page.id)} className="text-[#dc2626] hover:underline">Delete Permanently</button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Link href={`/admin/pages/${page.id}/edit`} className={wpLink}>Edit</Link>
                        <span className="text-[#c3c4c7]">|</span>
                        <Link href={`/admin/pages/${page.id}/builder`} className={wpLink}>Edit visually</Link>
                        <span className="text-[#c3c4c7]">|</span>
                        <button formAction={duplicatePage.bind(null, page.id)} className={wpLink}>Duplicate</button>
                        <span className="text-[#c3c4c7]">|</span>
                        <a href={`/admin/pages/${page.id}/preview`} target="_blank" className={wpLink}>Preview</a>
                        <span className="text-[#c3c4c7]">|</span>
                        <button formAction={setPageStatus.bind(null, page.id, page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")} className={wpLink}>
                          {page.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </button>
                        {page.slug !== "home" && (
                          <>
                            <span className="text-[#c3c4c7]">|</span>
                            <button formAction={trashPage.bind(null, page.id)} className="text-[#dc2626] hover:underline">Trash</button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 md:table-cell">
                  <span className={wpLink}>{authorName || "—"}</span>
                </td>
                <td className="hidden px-3 py-2.5 text-[#50575e] sm:table-cell">/{page.slug === "home" ? "" : page.slug}</td>
                <td className="px-3 py-2.5 text-[#50575e]">
                  {page.status === "PUBLISHED" ? "Published" : "Last Modified"}
                  <br />
                  {wpDate(page.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-left text-[#1d2327]">
              <th className="px-3 py-2.5"><SelectAllBox /></th>
              <th className="px-3 py-2.5 font-normal">Title</th>
              <th className="hidden px-3 py-2.5 font-normal md:table-cell">Author</th>
              <th className="hidden px-3 py-2.5 font-normal sm:table-cell">URL</th>
              <th className="px-3 py-2.5 font-normal">Date</th>
            </tr>
          </tfoot>
        </table>

        {/* tablenav bottom */}
        <div className="mt-2.5 flex items-center justify-between text-[13px] text-[#50575e]">
          <div className="flex items-center gap-2">
            <select name="bulk2" defaultValue="-1" className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-[13px]">
              <option value="-1">Bulk actions</option>
            </select>
            <button className="rounded-lg border border-[#a10140] bg-white px-2.5 py-1 text-[13px] font-medium text-[#a10140] hover:bg-[#fdf2f7]">
              Apply
            </button>
          </div>
          <span>{rows.length} item{rows.length === 1 ? "" : "s"}</span>
        </div>
      </form>

      {/* separate GET form for search (submit target of the inputs above) */}
      <form id="pages-search" method="get" action="/admin/pages">
        {status !== "all" && status !== "trash" && <input type="hidden" name="status" value={status} />}
        {status === "trash" && <input type="hidden" name="status" value="trash" />}
      </form>
    </AdminShell>
  );
}
