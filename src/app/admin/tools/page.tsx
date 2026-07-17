import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";

export default async function Tools({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  return (
    <AdminShell user={user} title="Tools">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold">Import and export</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Create a portable backup or merge a validated Designik CMS backup into
          this website.
        </p>
      </div>
      {query.imported === "1" && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Backup imported successfully. {query.pages || "0"} page records
          processed.
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Import failed:{" "}
          {error === "size"
            ? "backup exceeds 8 MB"
            : error === "json"
              ? "invalid JSON"
              : error === "format"
                ? "unsupported backup format"
                : "select a backup file"}
          .
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-semibold">Export website</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Downloads pages, draft/published sections, templates, global
            designs, settings, and Media Library files. Passwords, administrator
            sessions, and private form submissions are excluded.
          </p>
          <Link
            href="/admin/tools/export"
            className="admin-button mt-6 inline-flex"
          >
            Download JSON backup
          </Link>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h3 className="text-xl font-semibold">Import website</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Merge a Designik backup into the current database. Existing matching
            pages and resources are updated; unrelated content is preserved.
          </p>
          <form
            action="/api/admin/import"
            method="post"
            encType="multipart/form-data"
            className="mt-5 space-y-4"
          >
            <input
              type="file"
              name="backup"
              required
              accept="application/json,.json"
              className="block w-full rounded-xl border p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-pink-700"
            />
            <button className="admin-button w-full">
              Validate and import backup
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
