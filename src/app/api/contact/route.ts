import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { sendNotification } from "@/lib/mailer";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    name?: string;
    message?: string;
    source?: string;
    phone?: string;
    budget?: string;
    service?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, name, message, source, phone, budget, service } = body;
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  const subject =
    source === "newsletter"
      ? `New Designik newsletter subscriber: ${email}`
      : `New Designik enquiry from ${name || email}`;

  // Store the lead for the admin panel (best-effort; never blocks the reply)
  try {
    await db.insert(leads).values({
      name: name || null,
      email,
      phone: phone || null,
      budget: budget || null,
      service: service || null,
      message: message || null,
      source: source || "contact",
    });
  } catch (err) {
    console.error("lead insert failed", err);
  }

  const text = [
    `Source: ${source || "contact"}`,
    `Email: ${email}`,
    name ? `Name: ${name}` : null,
    phone ? `Phone: ${phone}` : null,
    service ? `Service: ${service}` : null,
    budget ? `Budget: ${budget}` : null,
    message ? `Message: ${message}` : null,
    `Received: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Email the team (best-effort — the lead is already saved either way).
  await sendNotification({ subject, text, replyTo: email });

  return NextResponse.json({ ok: true });
}
