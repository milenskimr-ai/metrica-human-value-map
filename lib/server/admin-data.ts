import "server-only";
import type { AdminRow } from "@/lib/admin/types";
import { getDb } from "./db";
import { listSessions } from "./sessions-repo";

export type AdminDataResult = { status: "ok"; rows: AdminRow[] } | { status: "not_configured" } | { status: "error" };

export async function fetchAllSessions(): Promise<AdminDataResult> {
  const db = getDb();
  if (!db) return { status: "not_configured" };
  try {
    return { status: "ok", rows: await listSessions(db) };
  } catch (e) {
    console.error("admin: fetch failed", (e as Error).message);
    return { status: "error" };
  }
}
