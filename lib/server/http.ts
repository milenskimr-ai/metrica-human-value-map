import "server-only";
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 10_000;

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export const ok = () => NextResponse.json({ ok: true });
export const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

/** Without Supabase env vars: accept (and log) in development, refuse in production. */
export function notConfigured(kind: string, payload: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev] Supabase not configured — ${kind} not stored:`, JSON.stringify(payload));
    return ok();
  }
  console.error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  return fail(503, "storage_not_configured");
}
