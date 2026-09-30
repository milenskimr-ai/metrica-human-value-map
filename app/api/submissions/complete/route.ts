import { getDb } from "@/lib/server/db";
import { fail, notConfigured, ok, readJson } from "@/lib/server/http";
import { sessionRow } from "@/lib/server/records";
import { insertCompletedTest } from "@/lib/server/sessions-repo";
import { isLang, isUuid, parseAnswers } from "@/lib/server/validation";

/** Stores an anonymous completed test (no contact data). */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(400, "invalid_body");

  const answers = parseAnswers(body.answers);
  if (!isUuid(body.sessionId) || !isLang(body.language) || !answers) return fail(400, "invalid_input");

  const row = sessionRow(body.sessionId, body.language, body.conferenceMode === true, answers);
  const db = getDb();
  if (!db) return notConfigured("completed test", row);

  try {
    await insertCompletedTest(db, row);
  } catch (e) {
    console.error("complete: insert failed", (e as Error).message);
    return fail(500, "storage_error");
  }
  return ok();
}
