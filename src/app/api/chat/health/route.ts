import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * IKORA health check — GET /api/chat/health
 *
 * Reports whether each link in the chatbot chain is alive. Never exposes
 * secrets (booleans only). Add ?ping=1 to run a minimal live Claude call
 * (tiny prompt, no knowledge base) that verifies the API key actually works.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const model = process.env.IKORA_MODEL || "claude-opus-4-8";

  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch (err) {
    console.error("[ikora-health] db check failed:", err);
  }

  const report: Record<string, unknown> = {
    ok: keyConfigured && dbOk,
    keyConfigured,
    dbOk,
    model,
    aiWouldRun: keyConfigured,
    hint: keyConfigured
      ? "Key present. Use ?ping=1 to verify it works against the Claude API."
      : "ANTHROPIC_API_KEY is NOT set in this deployment — IKORA is skipped for every message. Add it in Vercel → Settings → Environment Variables, then redeploy.",
  };

  if (url.searchParams.get("ping") === "1" && keyConfigured) {
    const started = Date.now();
    try {
      const client = new Anthropic();
      const res = await client.messages.create({
        model,
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
      });
      const text = res.content.find((b) => b.type === "text");
      report.pingOk = true;
      report.pingLatencyMs = Date.now() - started;
      report.pingReply = text && "text" in text ? text.text.slice(0, 40) : "";
    } catch (err) {
      report.ok = false;
      report.pingOk = false;
      report.pingLatencyMs = Date.now() - started;
      // Sanitized error — status + type only, never headers/keys.
      if (err instanceof Anthropic.APIError) {
        report.pingError = `Claude API ${err.status}: ${err.name}`;
      } else {
        report.pingError = err instanceof Error ? err.name : "unknown error";
      }
      console.error("[ikora-health] ping failed:", err);
    }
  }

  return NextResponse.json(report);
}
