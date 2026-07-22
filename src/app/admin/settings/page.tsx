import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { websiteSettings } from "@/cms/website-settings";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
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
  help,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  help?: string;
}) => (
  <label className="block">
    <span className={T.label}>{label}</span>
    <input type={type} name={name} defaultValue={value} className={T.input} />
    {help && <p className={T.help}>{help}</p>}
  </label>
);
const CardTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className={T.cardHeader}>
    <div>
      <h2 className="text-[15px] font-semibold text-[#1b1c20]">{title}</h2>
      {sub && <p className="mt-0.5 text-[12px] text-neutral-400">{sub}</p>}
    </div>
  </div>
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
      <div className="mb-6">
        <h2 className={T.screenTitle}>Website Settings</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Identity, contact, and site-wide behavior. Draft changes go live when
          you publish.
        </p>
      </div>
      <form className="space-y-6">
        <section className={T.card}>
          <CardTitle
            title="Site identity"
            sub="How the website presents itself across pages and search."
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Input
              label="Site name"
              name="siteName"
              value={value.identity.siteName}
            />
            <Input
              label="Tagline"
              name="tagline"
              value={value.identity.tagline}
              help="A short phrase shown alongside the site name."
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
              help="Small icon shown in browser tabs."
            />
          </div>
        </section>
        <section className={T.card}>
          <CardTitle
            title="Contact information"
            sub="Used on the public site and for form notifications."
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Input
              type="email"
              label="Contact recipient email"
              name="email"
              value={value.contact.email}
              help="Form submissions are delivered to this address."
            />
            <Input label="Phone" name="phone" value={value.contact.phone} />
            <label className="block md:col-span-2">
              <span className={T.label}>Address</span>
              <textarea
                name="address"
                defaultValue={value.contact.address}
                className={`${T.input} min-h-20`}
              />
            </label>
          </div>
        </section>
        <section className={T.card}>
          <CardTitle
            title="Social profiles"
            sub="Full profile URLs, including https://."
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
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
        <section className={T.card}>
          <CardTitle title="Regional settings" />
          <div className="grid gap-5 p-5 md:grid-cols-3">
            <Input
              label="Language code"
              name="language"
              value={value.regional.language}
              help="For example: en, en-US."
            />
            <Input
              label="Timezone"
              name="timezone"
              value={value.regional.timezone}
              help="IANA name, e.g. America/Denver."
            />
            <Input
              label="Date format"
              name="dateFormat"
              value={value.regional.dateFormat}
            />
          </div>
        </section>
        <section className={T.card}>
          <CardTitle
            title="Maintenance mode"
            sub="Temporarily hide the public site behind a maintenance page."
          />
          <div className="p-5">
            <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
              <input
                type="checkbox"
                name="maintenance"
                defaultChecked={value.behavior.maintenance}
                className={T.checkbox}
              />
              Enable maintenance page for public visitors
            </label>
            <label className="mt-4 block">
              <span className={T.label}>Maintenance message</span>
              <textarea
                name="maintenanceMessage"
                defaultValue={value.behavior.maintenanceMessage}
                className={`${T.input} min-h-20`}
              />
              <p className={T.help}>
                Shown to visitors while maintenance mode is on.
              </p>
            </label>
          </div>
        </section>
        <section className={T.card}>
          <CardTitle
            title="Custom code"
            sub="Trusted administrator code only. Draft code is never executed."
          />
          <div className="p-5">
            <label className="block">
              <span className={T.label}>Custom CSS</span>
              <textarea
                name="css"
                defaultValue={value.custom.css}
                className="block min-h-40 w-full rounded-lg border border-neutral-800 bg-[#16171c] p-3 font-mono text-xs leading-relaxed text-emerald-300 outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15"
              />
            </label>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className={T.label}>Head JavaScript</span>
                <textarea
                  name="headCode"
                  defaultValue={value.custom.headCode}
                  className="block min-h-40 w-full rounded-lg border border-neutral-800 bg-[#16171c] p-3 font-mono text-xs leading-relaxed text-emerald-300 outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15"
                />
              </label>
              <label className="block">
                <span className={T.label}>Footer JavaScript</span>
                <textarea
                  name="footerCode"
                  defaultValue={value.custom.footerCode}
                  className="block min-h-40 w-full rounded-lg border border-neutral-800 bg-[#16171c] p-3 font-mono text-xs leading-relaxed text-emerald-300 outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15"
                />
              </label>
            </div>
          </div>
        </section>
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.06] bg-white/95 p-3.5 shadow-[0_8px_30px_rgba(16,17,22,0.14)] backdrop-blur">
          <button formAction={saveSettingsDraft} className={T.btn}>
            Save draft
          </button>
          <button formAction={publishSettings} className={T.btnPrimary}>
            Publish settings
          </button>
          <button
            formAction={resetSettingsDraft}
            formNoValidate
            className={`ml-auto text-[13px] ${T.dangerLink}`}
          >
            Reset draft
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
