import "server-only";
import type { Answers } from "@/config/questions";
import { SCORING_VERSION } from "@/config/scoring";
import { computeResult } from "@/lib/engine";
import type { Lang } from "@/lib/i18n";

/** Scores are always recomputed on the server — client-sent scores are never trusted. */
export function sessionRow(id: string, language: Lang, conferenceMode: boolean, answers: Answers) {
  const r = computeResult(answers);
  const d = r.dimensions;
  return {
    id,
    language,
    conference_mode: conferenceMode,
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
