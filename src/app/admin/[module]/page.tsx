import { desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminResources, revisions, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import {
  createResource,
  deleteResource,
  toggleUser,
  updateResource,
} from "../resource-actions";
import { DesignList } from "../design-list";
import type { DesignModule } from "@/cms/design-resources";

const config: Record<
  string,
  { title: string; singular: string; description: string; fields?: string }
> = {
  posts: {
    title: "Posts",
    singular: "Post",
    description: "Create and publish structured blog content.",
  },
  media: {
    title: "Media Library",
    singular: "Media item",
    description: "Register and manage website asset URLs.",
    fields: "url",
  },
  templates: {
    title: "Templates",
    singular: "Template",
    description: "Reusable page and component layouts.",
  },
  "saved-sections": {
    title: "Saved Sections",
    singular: "Saved section",
    description: "Reusable and global page sections.",
  },
  headers: {
    title: "Header Builder",
    singular: "Header",
    description: "Create and manage assignable header configurations.",
  },
  footers: {
    title: "Footer Builder",
    singular: "Footer",
    description: "Create and manage assignable footer configurations.",
  },
  popups: {
    title: "Popup Builder",
    singular: "Popup",
    description: "Manage popup content and publication state.",
  },
  forms: {
    title: "Forms",
    singular: "Form",
    description: "Create forms and store their configuration.",
  },
  menus: {
    title: "Menus",
    singular: "Menu",
    description: "Manage navigation structures and locations.",
  },
  styles: {
    title: "Global Styles",
    singular: "Style preset",
    description: "Manage reusable design tokens and style presets.",
  },
  seo: {
    title: "SEO",
    singular: "SEO configuration",
    description: "Manage global and reusable search metadata.",
  },
  settings: {
    title: "Website Settings",
    singular: "Setting group",
    description: "Manage structured site configuration.",
  },
};

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { module } = await params;
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (
    ["headers", "footers", "popups", "templates", "saved-sections"].includes(
      module,
    )
  )
    return (
      <DesignList
        module={module as DesignModule}
        user={user}
        trash={(await searchParams).trash === "1"}
      />
    );
  if (module === "users") return <UsersScreen user={user} />;
  if (module === "revisions") return <RevisionsScreen user={user} />;
  const meta = config[module];
  if (!meta) notFound();
  const items = await db
    .select()
    .from(adminResources)
    .where(eq(adminResources.module, module))
    .orderBy(desc(adminResources.updatedAt));
  return (
    <AdminShell user={user} title={meta.title}>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Add {meta.singular}</h2>
          <p className="mt-1 text-sm text-neutral-500">{meta.description}</p>
          <form action={createResource} className="mt-5 space-y-3">
            <input type="hidden" name="module" value={module} />
            <label className="block text-sm">
              Name
              <input name="title" required className="admin-input mt-1.5" />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                name="description"
                className="admin-input mt-1.5 min-h-24"
              />
            </label>
            <button className="admin-button w-full">
              Create {meta.singular}
            </button>
          </form>
        </section>
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">All {meta.title}</h2>
              <p className="text-sm text-neutral-500">
                {items.length} record{items.length === 1 ? "" : "s"} stored in
                Neon.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => {
                const data = item.data as {
                  description?: string;
                  url?: string;
                };
                return (
                  <form
                    key={item.id}
                    action={updateResource}
                    className="rounded-2xl border bg-white p-5"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="module" value={module} />
                    <div className="grid gap-3 md:grid-cols-[1fr_150px_auto]">
                      <input
                        aria-label="Title"
                        name="title"
                        defaultValue={item.title}
                        className="admin-input"
                      />
                      <select
                        aria-label="Status"
                        name="status"
                        defaultValue={item.status}
                        className="admin-input"
                      >
                        <option>DRAFT</option>
                        <option>PUBLISHED</option>
                      </select>
                      <button className="admin-button">Save</button>
                    </div>
                    <textarea
                      aria-label="Description"
                      name="description"
                      defaultValue={data.description}
                      className="admin-input mt-3 min-h-20"
                    />
                    {meta.fields === "url" && (
                      <input
                        aria-label="Asset URL"
                        name="url"
                        defaultValue={data.url}
                        placeholder="Asset URL"
                        className="admin-input mt-3"
                      />
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        Slug: {item.slug} · Updated{" "}
                        {item.updatedAt.toLocaleString()}
                      </span>
                      <button
                        formAction={deleteResource}
                        className="text-red-600"
                        formNoValidate
                      >
                        Delete permanently
                      </button>
                    </div>
                  </form>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-neutral-500">
                No {meta.title.toLowerCase()} yet. Create the first one using
                the form.
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

async function UsersScreen({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
}) {
  const list = await db.select().from(users).orderBy(desc(users.createdAt));
  return (
    <AdminShell user={user} title="Users">
      <h2 className="mb-4 text-2xl font-semibold">
        Administrators and editors
      </h2>
      <div className="overflow-hidden rounded-2xl border bg-white">
        {list.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b p-5 last:border-0"
          >
            <div>
              <b>{item.name}</b>
              <p className="text-sm text-neutral-500">
                {item.email} · {item.role.replaceAll("_", " ")}
              </p>
            </div>
            <form action={toggleUser}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="active" value={String(!item.active)} />
              <button
                disabled={item.id === user.id || user.role !== "SUPER_ADMIN"}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
              >
                {item.active ? "Deactivate" : "Activate"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
async function RevisionsScreen({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
}) {
  const list = await db
    .select()
    .from(revisions)
    .orderBy(desc(revisions.createdAt))
    .limit(100);
  return (
    <AdminShell user={user} title="Revisions">
      <h2 className="mb-4 text-2xl font-semibold">Revision history</h2>
      <div className="overflow-hidden rounded-2xl border bg-white">
        {list.length ? (
          list.map((item) => (
            <div key={item.id} className="border-b p-5 last:border-0">
              <b>{item.label || "Revision"}</b>
              <p className="text-sm text-neutral-500">
                Page {item.pageId} · {item.createdAt.toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="p-10 text-neutral-500">No revisions recorded.</p>
        )}
      </div>
    </AdminShell>
  );
}
