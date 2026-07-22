import { createHash } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminResources, formSubmissions } from "@/db/schema";
import type { FormDefinition } from "@/app/admin/forms/actions";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Junk ids would fail the uuid cast in Postgres with a 500 — 404 instead.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return NextResponse.json({ error: "Form is not available" }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (String(body.website || ""))
    return NextResponse.json({ ok: true, message: "Thank you." });
  const [form] = await db
    .select()
    .from(adminResources)
    .where(and(eq(adminResources.id, id), eq(adminResources.module, "forms")))
    .limit(1);
  if (!form)
    return NextResponse.json(
      { error: "Form is not available" },
      { status: 404 },
    );
  if (form.status !== "PUBLISHED") {
    const user = await currentUser();
    if (!user || !can(user.role, "manage_forms"))
      return NextResponse.json(
        { error: "Form is not available" },
        { status: 404 },
      );
  }
  const definition = form.data as FormDefinition,
    clean: Record<string, string | boolean> = {};
  for (const field of definition.fields) {
    const raw = body[field.name],
      value =
        field.type === "checkbox"
          ? Boolean(raw)
          : String(raw ?? "")
              .trim()
              .slice(0, 10000);
    if (field.required && (value === "" || value === false))
      return NextResponse.json(
        { error: `${field.label} is required` },
        { status: 422 },
      );
    if (
      field.type === "email" &&
      value &&
      !/^\S+@\S+\.\S+$/.test(String(value))
    )
      return NextResponse.json(
        { error: `${field.label} must be a valid email` },
        { status: 422 },
      );
    if (
      field.type === "select" &&
      value &&
      !field.options.includes(String(value))
    )
      return NextResponse.json(
        { error: `${field.label} contains an invalid option` },
        { status: 422 },
      );
    clean[field.name] = value;
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
    ipHash = createHash("sha256")
      .update(`${process.env.AUTH_SECRET || "designik"}:${ip}`)
      .digest("hex");
  const [{ total }] = await db
    .select({ total: count() })
    .from(formSubmissions)
    .where(
      and(
        eq(formSubmissions.formId, id),
        eq(formSubmissions.ipHash, ipHash),
        gt(formSubmissions.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );
  if (total >= 10)
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  await db.insert(formSubmissions).values({
    formId: id,
    data: clean,
    ipHash,
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
  });
  return NextResponse.json({
    ok: true,
    message:
      definition.successMessage ||
      "Thank you. Your submission has been received.",
  });
}
