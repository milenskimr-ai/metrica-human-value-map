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

/** Without database env vars: accept (and log) in development, refuse in production. */
export function notConfigured(kind: string, payload: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev] MySQL not configured — ${kind} not stored:`, JSON.stringify(payload));
    return ok();
  }
  console.error("MySQL is not configured (MYSQL_HOST or MYSQL_SOCKET, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD)");
  return fail(503, "storage_not_configured");
}
