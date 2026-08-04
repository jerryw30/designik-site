import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { login } from "../actions";
import { PasswordInput } from "../password-input";
import { AuthCard } from "../ui";

// Queries Neon (user count + site settings via the layout). Prerendering this
// at build makes every deploy depend on the database being awake — Neon's
// free-tier compute suspends when idle, and its cold-start intermittently
// fails Hostinger builds. Render at request time instead.
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/admin");
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (!total) redirect("/admin/setup");
  const error = (await searchParams).error;
  return <AuthCard title="Welcome back" subtitle="Sign in to manage the Designik website.">
    <form action={login} className="space-y-4">
      <input name="email" type="email" placeholder="Email address" required className="admin-input" />
      <PasswordInput name="password" placeholder="Password" required autoComplete="current-password" className="admin-input" tone="dark" />
      {error && <p className="text-sm text-red-300">Incorrect email or password.</p>}
      <button className="admin-button w-full">Sign in</button>
    </form>
  </AuthCard>;
}
