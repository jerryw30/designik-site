
import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { sendNotification } from "@/lib/mailer";

const allowedOrigins = new Set([
  "http://localhost:4173",
]);

function withCors(response: NextResponse, request: Request) {
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Vary", "Origin");
  return response;
}

// Handle browser CORS preflight requests.
export function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin || !allowedOrigins.has(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
    },
  });
}

function isEmail(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  );
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
    return withCors(
      NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      ),
      request
    );
  }

  const {
    email,
    name,
    message,
    source,
    phone,
    budget,
    service,
  } = body;

  if (!isEmail(email)) {
    return withCors(
      NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 422 }
      ),
      request
    );
  }

  const subject =
    source === "newsletter"
      ? `New Designik newsletter subscriber: ${email}`
      : `New Designik enquiry from ${name || email}`;

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

  await sendNotification({
    subject,
    text,
    replyTo: email,
  });

  return withCors(
    NextResponse.json({ ok: true }),
    request
  );
}
