// Seed the three launch hosting plans. Idempotent: skips slugs that exist.
//   npm run hosting:seed
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const PLANS = [
  {
    name: "Starter", slug: "starter", price: 999, storage: 10, position: 0,
    features: [
      "WordPress pre-installed & configured",
      "Free yourname.designik.us subdomain",
      "Free SSL certificate",
      "Starter theme collection",
      "Email support",
    ],
  },
  {
    name: "Pro", slug: "pro", price: 1999, storage: 25, position: 1,
    features: [
      "Everything in Starter",
      "Premium theme collection",
      "Plugin bundle pre-installed",
      "Daily backups",
      "Priority support",
    ],
  },
  {
    name: "Business", slug: "business", price: 3999, storage: 50, position: 2,
    features: [
      "Everything in Pro",
      "Page-builder pro tools",
      "E-commerce ready (WooCommerce)",
      "Performance optimization",
      "Same-day support",
    ],
  },
];

for (const p of PLANS) {
  const [exists] = await sql`select id from hosting_plans where slug = ${p.slug} limit 1`;
  if (exists) { console.log(`skip  ${p.slug} (exists)`); continue; }
  await sql`insert into hosting_plans (name, slug, price_monthly, storage_gb, features, position, active)
            values (${p.name}, ${p.slug}, ${p.price}, ${p.storage}, ${JSON.stringify(p.features)}::jsonb, ${p.position}, true)`;
  console.log(`seed  ${p.slug} — $${(p.price / 100).toFixed(2)}/mo, ${p.storage}GB`);
}
const [{ n }] = await sql`select count(*)::int as n from hosting_plans`;
console.log(`${n} plan(s) total.`);
