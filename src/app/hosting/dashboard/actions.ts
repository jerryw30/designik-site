"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hostingCustomers } from "@/db/schema";
import { currentCustomer, destroyCustomerSession, verifyCustomer } from "@/lib/customer-auth";

export async function logoutCustomer() {
  await destroyCustomerSession();
  redirect("/hosting/account");
}

export async function changeCustomerPassword(form: FormData) {
  const customer = await currentCustomer();
  if (!customer) redirect("/hosting/account");
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) redirect("/hosting/dashboard?pw=short");
  const check = await verifyCustomer(customer.email, current);
  if (!check.ok) redirect("/hosting/dashboard?pw=wrong");
  await db
    .update(hostingCustomers)
    .set({ passwordHash: await bcrypt.hash(next, 10), updatedAt: new Date() })
    .where(eq(hostingCustomers.id, customer.id));
  redirect("/hosting/dashboard?pw=done");
}
