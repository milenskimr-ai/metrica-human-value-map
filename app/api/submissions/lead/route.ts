import { getDb } from "@/lib/server/db";
import { fail, notConfigured, ok, readJson } from "@/lib/server/http";
import { leadFields, sessionRow } from "@/lib/server/records";
import { upsertLead } from "@/lib/server/sessions-repo";
import { cleanEmail, cleanText, isLang, isUuid, parseAnswers } from "@/lib/server/validation";

/** Attaches contact details + consent to a completed test. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(400, "invalid_body");

  // Honeypot: hidden field real visitors never fill in. Pretend success for bots.
  if (typeof body.fax === "string" && body.fax.length > 0) return ok();

  const answers = parseAnswers(body.answers);
  if (!isUuid(body.sessionId) || !isLang(body.language) || !answers) return fail(400, "invalid_input");
  if (body.consent !== true) return fail(400, "consent_required");

  const lead = {
    first_name: cleanText(body.firstName, 100),
    last_name: cleanText(body.lastName, 100),
    company: cleanText(body.company, 200),
    email: cleanEmail(body.email),
    website: cleanText(body.website, 300),
  };
  if (Object.values(lead).some((v) => v === null)) return fail(400, "invalid_input");
  const phone = body.phone ? cleanText(body.phone, 40) : null;

  const fields = leadFields({ ...(lead as Record<keyof typeof lead, string>), phone }, body.language);
  const row = sessionRow(body.sessionId, body.language, body.conferenceMode === true, answers);

  const db = getDb();
  if (!db) return notConfigured("lead", { id: body.sessionId, ...fields });

  try {
    await upsertLead(db, row, fields);
  } catch (e) {
    console.error("lead: save failed", (e as Error).message);
    return fail(500, "storage_error");
  }
  return ok();
}
