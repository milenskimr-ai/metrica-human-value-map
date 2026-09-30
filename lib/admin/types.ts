import type { Answers } from "@/config/questions";
import type { Level } from "@/config/scoring";

/** One completed test as shown in the admin dashboard (mirrors the diagnostic_sessions table). */
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
