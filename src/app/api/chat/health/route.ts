import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ikoraProvider } from "@/ai/ikora";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * IKORA health check — GET /api/chat/health
 *
 * Reports whether each link in the chatbot chain is alive. Never exposes
 * secrets (booleans only). Add ?ping=1 to run a minimal live model call
 * (tiny prompt, no knowledge base) that verifies the API key actually works.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = ikoraProvider();
  const model =
    process.env.IKORA_MODEL ||
    (provider === "deepseek" ? "deepseek-chat" : provider === "groq" ? "llama-3.3-70b-versatile" : "claude-opus-4-8");

  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch (err) {
    console.error("[ikora-health] db check failed:", err);
  }

  const report: Record<string, unknown> = {
    ok: provider !== null && dbOk,
    provider: provider || "none",
    keyConfigured: provider !== null,
    dbOk,
    model,
    aiWouldRun: provider !== null,
    hint:
      provider !== null
        ? "AI provider configured. Use ?ping=1 to verify the key works with a live call."
        : "No AI key set — IKORA is skipped for every message. Add GROQ_API_KEY (or ANTHROPIC_API_KEY) in Vercel -> Settings -> Environment Variables, then redeploy.",
  };

  if (url.searchParams.get("ping") === "1" && provider) {
    const started = Date.now();
    try {
      let reply = "";
      if (provider === "anthropic") {
        const client = new Anthropic();
        const res = await client.messages.create({
          model,
          max_tokens: 16,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
        });
        const text = res.content.find((b) => b.type === "text");
        reply = text && "text" in text ? text.text : "";
      } else if (provider === "deepseek") {
        const ds = new OpenAI({ baseURL: "https://api.deepseek.com", apiKey: process.env.DEEPSEEK_API_KEY });
        const res = await ds.chat.completions.create({
          model,
          max_tokens: 16,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
        });
        reply = res.choices[0]?.message?.content || "";
      } else {
        const groq = new Groq();
        const res = await groq.chat.completions.create({
          model,
          max_tokens: 16,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
        });
        reply = res.choices[0]?.message?.content || "";
      }
      report.pingOk = true;
      report.pingLatencyMs = Date.now() - started;
      report.pingReply = reply.slice(0, 40);
    } catch (err) {
      report.ok = false;
      report.pingOk = false;
      report.pingLatencyMs = Date.now() - started;
      // Sanitized error — status + type only, never headers/keys.
      if (err instanceof Anthropic.APIError || err instanceof Groq.APIError || err instanceof OpenAI.APIError) {
        report.pingError = `${provider} API ${err.status}: ${err.name}`;
      } else {
        report.pingError = err instanceof Error ? err.name : "unknown error";
      }
      console.error("[ikora-health] ping failed:", err);
    }
  }

  return NextResponse.json(report);
}
