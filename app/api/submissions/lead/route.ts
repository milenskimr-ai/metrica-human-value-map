import { APP_CONFIG } from "@/config/app";
import { createT } from "@/lib/i18n";
import { getSupabaseAdmin, TABLE } from "@/lib/server/supabase";
import { fail, notConfigured, ok, readJson } from "@/lib/server/http";
import { sessionRow } from "@/lib/server/records";
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

  const now = new Date().toISOString();
  const leadFields = {
    ...lead,
    phone,
    lead_submitted_at: now,
    consent_given: true,
    consent_at: now, // server time, not client time
    consent_version: APP_CONFIG.consentVersion,
    consent_text: createT(body.language)("lead.consent"), // exact wording in the visitor's language
  };

  const db = getSupabaseAdmin();
  if (!db) return notConfigured("lead", { id: body.sessionId, ...leadFields });

  const { data, error } = await db.from(TABLE).update(leadFields).eq("id", body.sessionId).select("id");
  if (error) {
    console.error("lead: update failed", error.message);
    return fail(500, "storage_error");
  }
  if (!data || data.length === 0) {
    // The completed-test call never arrived (e.g. flaky network) — store everything now.
    const row = { ...sessionRow(body.sessionId, body.language, body.conferenceMode === true, answers), ...leadFields };
    const { error: insertError } = await db.from(TABLE).insert(row);
    if (insertError) {
      console.error("lead: insert failed", insertError.message);
      return fail(500, "storage_error");
    }
  }
  return ok();
}
