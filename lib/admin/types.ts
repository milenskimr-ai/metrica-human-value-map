import type { Answers } from "@/config/questions";
import type { Level } from "@/config/scoring";

/** One completed test as shown in the admin dashboard (mirrors diagnostic_sessions). */
export interface AdminRow {
  id: string;
  language: "bg" | "en";
  conference_mode: boolean;
  completed_at: string;
  answers: Answers;
  biggest_challenge: string | null;
  automation_score: number;
  human_value_score: number;
  cx_maturity_score: number;
  automation_level: Level;
  human_value_level: Level;
  cx_maturity_level: Level;
  biggest_opportunity: string;
  scoring_version: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  website: string | null;
  phone: string | null;
  lead_submitted_at: string | null;
  consent_given: boolean;
  consent_at: string | null;
  consent_version: string | null;
  consent_text: string | null;
}

export const ADMIN_COLUMNS =
  "id,language,conference_mode,completed_at,answers,biggest_challenge,automation_score,human_value_score,cx_maturity_score,automation_level,human_value_level,cx_maturity_level,biggest_opportunity,scoring_version,first_name,last_name,company,email,website,phone,lead_submitted_at,consent_given,consent_at,consent_version,consent_text";
