import "server-only";
import { ADMIN_COLUMNS, type AdminRow } from "@/lib/admin/types";
import { getSupabaseAdmin, TABLE } from "./supabase";

const PAGE = 1000; // Supabase returns at most 1000 rows per request
const MAX_ROWS = 50_000;

export type AdminDataResult = { status: "ok"; rows: AdminRow[] } | { status: "not_configured" } | { status: "error" };

export async function fetchAllSessions(): Promise<AdminDataResult> {
  const db = getSupabaseAdmin();
  if (!db) return { status: "not_configured" };

  const rows: AdminRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await db
      .from(TABLE)
      .select(ADMIN_COLUMNS)
      .order("completed_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("admin: fetch failed", error.message);
      return { status: "error" };
    }
    rows.push(...((data ?? []) as unknown as AdminRow[]));
    if (!data || data.length < PAGE) break;
  }
  return { status: "ok", rows };
}
