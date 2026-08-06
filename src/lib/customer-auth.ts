import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { hostingCustomers, hostingCustomerSessions } from "@/db/schema";

/**
 * Auth for hosting-storefront customers. Mirrors src/lib/auth.ts (opaque
 * token, sha256 hash in DB, httpOnly cookie) but with its own cookie and
 * tables so a customer session can never be confused with an admin session.
 */

const COOKIE = "designik_customer_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export type Customer = { id: string; name: string; email: string };

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(hostingCustomerSessions).values({ customerId, tokenHash: hash(token), expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function currentCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: hostingCustomers.id, name: hostingCustomers.name, email: hostingCustomers.email })
    .from(hostingCustomerSessions)
    .innerJoin(hostingCustomers, eq(hostingCustomerSessions.customerId, hostingCustomers.id))
    .where(
      and(
        eq(hostingCustomerSessions.tokenHash, hash(token)),
        gt(hostingCustomerSessions.expiresAt, new Date()),
        eq(hostingCustomers.blocked, false),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function destroyCustomerSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token)
    await db.delete(hostingCustomerSessions).where(eq(hostingCustomerSessions.tokenHash, hash(token)));
  store.delete(COOKIE);
}

/** Create an account; returns the customer or a reason it can't be made. */
export async function registerCustomer(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true; customer: Customer } | { ok: false; error: string }> {
  if (name.trim().length < 2) return { ok: false, error: "Enter your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const [existing] = await db
    .select({ id: hostingCustomers.id })
    .from(hostingCustomers)
    .where(eq(hostingCustomers.email, email))
    .limit(1);
  if (existing) return { ok: false, error: "That email already has an account — log in instead." };
  const [row] = await db
    .insert(hostingCustomers)
    .values({ name: name.trim(), email, passwordHash: await bcrypt.hash(password, 10) })
    .returning({ id: hostingCustomers.id, name: hostingCustomers.name, email: hostingCustomers.email });
  return { ok: true, customer: row };
}

export async function verifyCustomer(
  email: string,
  password: string,
): Promise<{ ok: true; customer: Customer } | { ok: false; error: string }> {
  const [row] = await db
    .select()
    .from(hostingCustomers)
    .where(eq(hostingCustomers.email, email))
    .limit(1);
  // Same message for wrong email and wrong password — don't leak which.
  if (!row || !(await bcrypt.compare(password, row.passwordHash)))
    return { ok: false, error: "Incorrect email or password." };
  if (row.blocked) return { ok: false, error: "This account is blocked. Contact support@designik.us." };
  return { ok: true, customer: { id: row.id, name: row.name, email: row.email } };
}
