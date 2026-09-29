/**
 * Persistence adapter — the only place the UI talks to storage.
 *
 * PHASE 1 (current): records are kept in this browser's localStorage
 *   under "mhvm:dev-records" so the full flow can be tested without a backend.
 * PHASE 2: these functions will POST to a Next.js API route that writes
 *   to Supabase with the server-only service-role key.
 */

import type { Answers } from "@/config/questions";
import type { Dimension, Level } from "@/config/scoring";
import type { OpportunityCategory } from "@/config/opportunity";
import type { Lang } from "./i18n";

export interface CompletedTestRecord {
  sessionId: string;
  language: Lang;
  completedAt: string; // ISO timestamp
  conferenceMode: boolean;
  answers: Answers; // stable IDs only
  scores: Record<Dimension, number>;
  levels: Record<Dimension, Level>;
  biggestOpportunity: OpportunityCategory;
}

export interface LeadRecord {
  sessionId: string;
  language: Lang;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  website: string;
  phone: string | null;
  consentGiven: true;
  consentAt: string; // ISO timestamp of the moment the form was submitted with consent
  consentVersion: string;
  consentText: string; // exact wording shown to the visitor
}

const DEV_KEY = "mhvm:dev-records";

function devAppend(kind: string, record: unknown) {
  try {
    const list = JSON.parse(localStorage.getItem(DEV_KEY) ?? "[]");
    list.push({ kind, savedAt: new Date().toISOString(), record });
    localStorage.setItem(DEV_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode etc.) — ignore in Phase 1
  }
}

export async function saveCompletedTest(record: CompletedTestRecord): Promise<void> {
  devAppend("completed_test", record);
}

export async function saveLead(record: LeadRecord): Promise<void> {
  devAppend("lead", record);
}
