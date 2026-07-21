"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";

export async function markLeadRead(formData: FormData) {
  await requirePermission("manage_forms");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.update(leads).set({ status: "READ" }).where(eq(leads.id, id));
  revalidatePath("/admin/leads");
}

export async function markLeadNew(formData: FormData) {
  await requirePermission("manage_forms");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.update(leads).set({ status: "NEW" }).where(eq(leads.id, id));
  revalidatePath("/admin/leads");
}

export async function deleteLead(formData: FormData) {
  await requirePermission("manage_forms");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/admin/leads");
}
