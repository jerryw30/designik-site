import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { setupAdmin } from "../actions";
import { AuthCard } from "../ui";

export default async function Setup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (total) redirect("/admin/login");
  const error = (await searchParams).error;
  return <AuthCard title="Create administrator" subtitle="One-time secure setup for the Designik editor.">
    <form action={setupAdmin} className="space-y-4">
      <input name="name" placeholder="Your name" required className="admin-input" />
      <input name="email" type="email" placeholder="Email address" required className="admin-input" />
      <input name="password" type="password" minLength={10} placeholder="Password (10+ characters)" required className="admin-input" />
      {error && <p className="text-sm text-red-300">Enter a valid name, email, and password.</p>}
      <button className="admin-button w-full">Create account</button>
    </form>
  </AuthCard>;
}
