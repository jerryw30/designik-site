// Smoke test for the hosting storefront pipeline. Exercises every query the
// screens and APIs run, plus a full checkout → provision → block lifecycle
// against a throwaway order (cleaned up afterwards).
//   npm run test:hosting
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
let failed = 0;
const check = (label, ok, extra = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failed++;
};

// Screens' queries
const plans = await sql`select * from hosting_plans where active = true order by position asc`;
check("active plans for /hosting", plans.length >= 3, `${plans.length} plans`);
const orders = await sql`select * from hosting_orders order by created_at desc`;
check("orders list for /admin/hosting", Array.isArray(orders), `${orders.length} orders`);

// Checkout lifecycle on a throwaway row
const ref = `DGK-SMOKE${Date.now().toString(36).slice(-4).toUpperCase()}`;
const host = `smoke-test-${Date.now().toString(36)}.designik.us`;
const [plan] = plans;
const [inserted] = await sql`
  insert into hosting_orders (order_ref, plan_id, plan_name, plan_price, customer_name,
    customer_email, domain_type, domain_name, domain_price, total_paid, payment_status, payment_ref)
  values (${ref}, ${plan.id}, ${plan.name}, ${plan.price_monthly}, 'Smoke Test',
    'smoke@test.invalid', 'temp', ${host}, 0, ${plan.price_monthly}, 'TEST_PAID', 'TEST-SMOKE')
  returning id`;
check("checkout insert", Boolean(inserted?.id));

const [dup] = await sql`select id from hosting_orders where domain_name = ${host} limit 1`;
check("duplicate-domain guard query", dup?.id === inserted.id);

await sql`update hosting_orders set status = 'ACTIVE', storage_gb_override = 15, wp_admin_url = 'https://x/wp-admin', wp_username = 'admin' where id = ${inserted.id}`;
const [active] = await sql`select * from hosting_orders where id = ${inserted.id}`;
check("provision update", active.status === "ACTIVE" && active.storage_gb_override === 15);

await sql`update hosting_orders set blocked = true where id = ${inserted.id}`;
const [blockedRow] = await sql`select id from hosting_orders where customer_email = 'smoke@test.invalid' and blocked = true limit 1`;
check("blocked-email guard query", Boolean(blockedRow));

await sql`delete from hosting_orders where id = ${inserted.id}`;
const [gone] = await sql`select id from hosting_orders where id = ${inserted.id}`;
check("cleanup", !gone);

console.log(failed ? `\n${failed} CHECK(S) FAILED` : "\nAll hosting smoke checks passed.");
process.exit(failed ? 1 : 0);
