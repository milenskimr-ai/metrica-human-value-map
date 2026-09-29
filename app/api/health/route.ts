import { NextResponse } from "next/server";
import { getSupabaseAdmin, TABLE } from "@/lib/server/supabase";
import { isAdminConfigured } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Pre-flight check for the conference: is storage configured and reachable?
 * Returns only yes/no flags — never data or secrets.
 */
export async function GET() {
  const db = getSupabaseAdmin();
  let database: "ok" | "error" | "not_configured" = "not_configured";
  if (db) {
    const { error } = await db.from(TABLE).select("id", { head: true, count: "exact" }).limit(1);
    database = error ? "error" : "ok";
  }
  const ok = database === "ok" && isAdminConfigured();
  return NextResponse.json({ ok, database, admin: isAdminConfigured() ? "ok" : "not_configured" }, { status: ok ? 200 : 503 });
}
