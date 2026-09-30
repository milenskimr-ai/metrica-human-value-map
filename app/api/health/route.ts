import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { pingTable } from "@/lib/server/sessions-repo";
import { isAdminConfigured } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Pre-flight / uptime check: is MySQL reachable and is admin access configured?
 * Returns only yes/no flags — never data or secrets.
 */
export async function GET() {
  const db = getDb();
  let database: "ok" | "error" | "not_configured" = "not_configured";
  if (db) {
    try {
      await pingTable(db);
      database = "ok";
    } catch (e) {
      console.error("health: database check failed", (e as Error).message);
      database = "error";
    }
  }
  const ok = database === "ok" && isAdminConfigured();
  return NextResponse.json({ ok, database, admin: isAdminConfigured() ? "ok" : "not_configured" }, { status: ok ? 200 : 503 });
}
