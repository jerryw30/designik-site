import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { globalStyles } from "@/cms/global-styles";
import { currentUser } from "@/lib/auth";
import { AdminShell } from "../admin-shell";
import { T } from "../theme";
import StyleEditor from "./style-editor";
export default async function StylesPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "global_styles"))
      .limit(1),
    value = row?.value as { draft?: unknown } | undefined;
  return (
    <AdminShell user={user} title="Global Styles and Fonts">
      <div className="mb-6">
        <h2 className={T.screenTitle}>Global Styles and Fonts</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Site-wide colors, typography, buttons, and custom fonts. Changes
          apply everywhere once published.
        </p>
      </div>
      <StyleEditor initial={globalStyles(value?.draft)} />
    </AdminShell>
  );
}
