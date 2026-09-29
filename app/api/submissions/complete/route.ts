import { getSupabaseAdmin, TABLE } from "@/lib/server/supabase";
import { fail, notConfigured, ok, readJson } from "@/lib/server/http";
import { sessionRow } from "@/lib/server/records";
import { isLang, isUuid, parseAnswers } from "@/lib/server/validation";

/** Stores an anonymous completed test (no contact data). */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(400, "invalid_body");

  const answers = parseAnswers(body.answers);
  if (!isUuid(body.sessionId) || !isLang(body.language) || !answers) return fail(400, "invalid_input");

  const row = sessionRow(body.sessionId, body.language, body.conferenceMode === true, answers);
  const db = getSupabaseAdmin();
  if (!db) return notConfigured("completed test", row);

  // A repeated call for the same session is ignored (keeps the original completion time).
  const { error } = await db.from(TABLE).upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("complete: insert failed", error.message);
    return fail(500, "storage_error");
  }
  return ok();
}
