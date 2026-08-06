import { asc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingPlans } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { canViewArea } from "@/lib/roles";
import { AdminShell } from "../../admin-shell";
import { T } from "../../theme";
import { deletePlan, savePlan } from "../actions";

export const dynamic = "force-dynamic";

function PlanForm({
  plan,
}: {
  plan?: {
    id: string;
    name: string;
    slug: string;
    priceMonthly: number;
    storageGb: number;
    features: unknown;
    position: number;
    active: boolean;
  };
}) {
  return (
    <form action={savePlan} className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_110px_110px_80px]">
      <input type="hidden" name="id" value={plan?.id || ""} />
      <div>
        <label className={T.label}>Name</label>
        <input name="name" defaultValue={plan?.name} placeholder="Starter" required className={T.input} />
      </div>
      <div>
        <label className={T.label}>Slug</label>
        <input name="slug" defaultValue={plan?.slug} placeholder="starter" required className={T.input} />
      </div>
      <div>
        <label className={T.label}>$ / month</label>
        <input
          name="priceMonthly"
          type="number"
          step="0.01"
          min="0"
          defaultValue={plan ? (plan.priceMonthly / 100).toFixed(2) : ""}
          placeholder="9.99"
          required
          className={T.input}
        />
      </div>
      <div>
        <label className={T.label}>Storage GB</label>
        <input name="storageGb" type="number" min="1" defaultValue={plan?.storageGb} placeholder="10" required className={T.input} />
      </div>
      <div>
        <label className={T.label}>Order</label>
        <input name="position" type="number" defaultValue={plan?.position ?? 0} className={T.input} />
      </div>
      <div className="md:col-span-4">
        <label className={T.label}>Features — one per line, shown on the plan card</label>
        <textarea
          name="features"
          rows={4}
          defaultValue={((plan?.features as string[]) || []).join("\n")}
          placeholder={"WordPress pre-installed\nFree SSL certificate\nPremium theme included"}
          className={T.input}
        />
      </div>
      <div className="flex items-end gap-4 pb-1">
        <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
          <input type="checkbox" name="active" defaultChecked={plan ? plan.active : true} className={T.checkbox} />
          Active
        </label>
        <button className={T.btnPrimary}>{plan ? "Save" : "Add plan"}</button>
      </div>
    </form>
  );
}

export default async function PlansAdmin() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!canViewArea(user.role, "hosting")) redirect("/admin");

  const plans = await db.select().from(hostingPlans).orderBy(asc(hostingPlans.position));

  return (
    <AdminShell user={user} title="Hosting plans">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/hosting" className={T.mutedLink}>← Hosting orders</Link>
          <h1 className={`${T.screenTitle} mt-1`}>Plans & pricing</h1>
        </div>
        <Link href="/hosting" target="_blank" className={T.btn}>Preview storefront ↗</Link>
      </div>
      <p className={`${T.help} mt-1`}>
        Changes apply to the public /hosting page immediately. Prices are what customers pay monthly.
      </p>

      <div className="mt-5 space-y-5">
        {plans.map((p) => (
          <section key={p.id} className={T.card}>
            <div className={T.cardHeader}>
              <h2 className="text-[15px] font-semibold">
                {p.name}
                {!p.active && <span className={`ml-2 ${T.pillNeutral}`}>hidden</span>}
              </h2>
              <form action={deletePlan.bind(null, p.id)}>
                <button className={T.dangerLink}>Delete</button>
              </form>
            </div>
            <PlanForm plan={{ ...p, features: p.features }} />
          </section>
        ))}

        <section className={T.card}>
          <div className={T.cardHeader}><h2 className="text-[15px] font-semibold">Add a plan</h2></div>
          <PlanForm />
        </section>
      </div>
    </AdminShell>
  );
}
