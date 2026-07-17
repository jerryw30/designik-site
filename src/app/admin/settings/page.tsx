import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { websiteSettings } from "@/cms/website-settings";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import {
  publishSettings,
  resetSettingsDraft,
  saveSettingsDraft,
} from "./actions";
const Input = ({
  label,
  name,
  value,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
}) => (
  <label className="block text-sm">
    {label}
    <input
      type={type}
      name={name}
      defaultValue={value}
      className="mt-1 block w-full rounded-lg border p-2"
    />
  </label>
);
export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "website_settings"))
      .limit(1),
    stored = row?.value as { draft?: unknown } | undefined,
    value = websiteSettings(stored?.draft);
  return (
    <AdminShell user={user} title="Website Settings">
      <form className="space-y-6">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Site identity</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Site name"
              name="siteName"
              value={value.identity.siteName}
            />
            <Input
              label="Tagline"
              name="tagline"
              value={value.identity.tagline}
            />
            <Input
              label="Logo URL"
              name="logoUrl"
              value={value.identity.logoUrl}
            />
            <Input
              label="Favicon URL"
              name="faviconUrl"
              value={value.identity.faviconUrl}
            />
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Contact information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              type="email"
              label="Contact recipient email"
              name="email"
              value={value.contact.email}
            />
            <Input label="Phone" name="phone" value={value.contact.phone} />
            <label className="block text-sm md:col-span-2">
              Address
              <textarea
                name="address"
                defaultValue={value.contact.address}
                className="mt-1 block w-full rounded-lg border p-2"
              />
            </label>
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Social profiles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Instagram URL"
              name="instagram"
              value={value.social.instagram}
            />
            <Input
              label="LinkedIn URL"
              name="linkedin"
              value={value.social.linkedin}
            />
            <Input
              label="Facebook URL"
              name="facebook"
              value={value.social.facebook}
            />
            <Input label="X/Twitter URL" name="x" value={value.social.x} />
            <Input
              label="YouTube URL"
              name="youtube"
              value={value.social.youtube}
            />
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Regional settings</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Language code"
              name="language"
              value={value.regional.language}
            />
            <Input
              label="Timezone"
              name="timezone"
              value={value.regional.timezone}
            />
            <Input
              label="Date format"
              name="dateFormat"
              value={value.regional.dateFormat}
            />
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Maintenance mode</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="maintenance"
              defaultChecked={value.behavior.maintenance}
            />
            Enable maintenance page for public visitors
          </label>
          <label className="mt-4 block text-sm">
            Maintenance message
            <textarea
              name="maintenanceMessage"
              defaultValue={value.behavior.maintenanceMessage}
              className="mt-1 block w-full rounded-lg border p-2"
            />
          </label>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Custom code</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Trusted administrator code only. Draft code is never executed.
          </p>
          <label className="block text-sm">
            Custom CSS
            <textarea
              name="css"
              defaultValue={value.custom.css}
              className="mt-1 block min-h-40 w-full rounded-lg border bg-neutral-950 p-3 font-mono text-xs text-emerald-300"
            />
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              Head JavaScript
              <textarea
                name="headCode"
                defaultValue={value.custom.headCode}
                className="mt-1 block min-h-40 w-full rounded-lg border bg-neutral-950 p-3 font-mono text-xs text-emerald-300"
              />
            </label>
            <label className="block text-sm">
              Footer JavaScript
              <textarea
                name="footerCode"
                defaultValue={value.custom.footerCode}
                className="mt-1 block min-h-40 w-full rounded-lg border bg-neutral-950 p-3 font-mono text-xs text-emerald-300"
              />
            </label>
          </div>
        </section>
        <div className="sticky bottom-4 flex gap-2 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur">
          <button
            formAction={saveSettingsDraft}
            className="rounded-lg border px-4 py-2"
          >
            Save draft
          </button>
          <button formAction={publishSettings} className="admin-button">
            Publish settings
          </button>
          <button
            formAction={resetSettingsDraft}
            formNoValidate
            className="ml-auto text-sm text-red-600"
          >
            Reset draft
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
