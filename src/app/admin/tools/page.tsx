import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";

export default async function Tools({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "tools")) redirect("/admin");
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  return (
    <AdminShell user={user} title="Tools">
      <div className="mb-6">
        <h2 className={T.screenTitle}>Import and export</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Create a portable backup or merge a validated Designik CMS backup into
          this website.
        </p>
      </div>
      {query.imported === "1" && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          Backup imported successfully. {query.pages || "0"} page records
          processed.
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Import failed:{" "}
          {error === "size"
            ? "backup exceeds 8 MB"
            : error === "json"
              ? "invalid JSON"
              : error === "format"
                ? "unsupported backup format"
                : error === "db"
                  ? "the backup could not be written to the database — it may have been applied partially, so review your content before retrying"
                  : "select a backup file"}
          .
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold text-[#1b1c20]">
              Export website
            </h3>
          </div>
          <div className="p-5">
            <p className="text-[13px] leading-6 text-neutral-500">
              Downloads pages, draft/published sections, templates, global
              designs, settings, and Media Library files. Passwords,
              administrator sessions, and private form submissions are excluded.
            </p>
            {/* Plain anchor: next/link would prefetch the route handler and
                trigger a backup export (and audit entry) on hover. */}
            <a
              href="/admin/tools/export"
              download
              className={`${T.btnPrimary} mt-5`}
            >
              Download JSON backup
            </a>
          </div>
        </section>
        <section className={T.card}>
          <div className={T.cardHeader}>
            <h3 className="text-[15px] font-semibold text-[#1b1c20]">
              Import website
            </h3>
          </div>
          <div className="p-5">
            <p className="text-[13px] leading-6 text-neutral-500">
              Merge a Designik backup into the current database. Existing
              matching pages and resources are updated; unrelated content is
              preserved.
            </p>
            <form
              action="/api/admin/import"
              method="post"
              encType="multipart/form-data"
              className="mt-5 space-y-4"
            >
              <div>
                <input
                  type="file"
                  name="backup"
                  required
                  accept="application/json,.json"
                  className="block w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-[13px] text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#a10140]/10 file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-[#a10140]"
                />
                <p className={T.help}>JSON backups up to 8 MB.</p>
              </div>
              <button className={`${T.btn} w-full`}>
                Validate and import backup
              </button>
            </form>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
