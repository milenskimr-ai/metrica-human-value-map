import "server-only";
import { APP_CONFIG } from "@/config/app";
import type { Answers } from "@/config/questions";
import { SCORING_VERSION } from "@/config/scoring";
import { computeResult } from "@/lib/engine";
import { createT, type Lang } from "@/lib/i18n";

/** Scores are always recomputed on the server — client-sent scores are never trusted. */
export function sessionRow(id: string, language: Lang, conferenceMode: boolean, answers: Answers, completedAt = new Date()) {
  const r = computeResult(answers);
  const d = r.dimensions;
  return {
    id,
    language,
    conference_mode: conferenceMode,
    completed_at: completedAt,
    answers,
    business_type: answers.business_type?.[0] ?? null,
    monthly_contacts: answers.monthly_contacts?.[0] ?? null,
    biggest_challenge: answers.biggest_challenge?.[0] ?? null,
    automation_score: d.automation.score,
    human_value_score: d.human_value.score,
    cx_maturity_score: d.cx_maturity.score,
    automation_level: d.automation.level,
    human_value_level: d.human_value.level,
    cx_maturity_level: d.cx_maturity.level,
    biggest_opportunity: r.opportunity,
    scoring_version: SCORING_VERSION,
  };
}
export type SessionRow = ReturnType<typeof sessionRow>;

export interface LeadInput {
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  website: string;
  phone: string | null;
}

/** Consent time is server time; consent text is the exact wording shown in the visitor's language. */
export function leadFields(lead: LeadInput, language: Lang, now = new Date()) {
  return {
    ...lead,
    lead_submitted_at: now,
    consent_given: true,
    consent_at: now,
    consent_version: APP_CONFIG.consentVersion,
    consent_text: createT(language)("lead.consent"),
  };
}
export type LeadFields = ReturnType<typeof leadFields>;
