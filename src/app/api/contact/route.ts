import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, siteSettings } from "@/db/schema";
import { websiteSettings } from "@/cms/website-settings";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request: Request) {
  const [record] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "website_settings"))
    .limit(1);
  const stored = record?.value as { published?: unknown } | undefined;
  const configured = websiteSettings(stored?.published);
  const TO =
    configured.contact.email ||
    process.env.CONTACT_TO ||
    "designguyluke@gmail.com";
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

  // Send via SMTP when configured; otherwise accept gracefully (dev/preview).
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: SMTP_FROM || `Designik Website <${SMTP_USER}>`,
        to: TO,
        replyTo: email,
        subject,
        text,
      });
    } catch (err) {
      console.error("[contact] email send failed:", err);
      return NextResponse.json(
        {
          error:
            "We couldn't send your message right now. Please try again later.",
        },
        { status: 502 },
      );
    }
  } else {
    // No SMTP configured yet — log so nothing is lost during setup.
    console.info("[contact] (no SMTP configured) would email", TO, "\n" + text);
  }

  return NextResponse.json({ ok: true });
}
