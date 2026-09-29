/**
 * Persistence adapter — the only place the UI talks to storage.
 * Sends data to our own API routes; they validate it, recompute the scores
 * and write to Supabase with the server-only service-role key.
 */

import type { Answers } from "@/config/questions";
import type { Lang } from "./i18n";

export interface CompletedTestPayload {
  sessionId: string;
  language: Lang;
  conferenceMode: boolean;
  answers: Answers; // stable IDs only
}

export interface LeadPayload extends CompletedTestPayload {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  website: string;
  phone: string | null;
  consent: true;
  /** honeypot — must stay empty */
  fax: string;
}

async function post(path: string, body: unknown, keepalive = false) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive,
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
}

/** Fire-and-forget: the visitor always sees their result, even if saving fails. */
export async function saveCompletedTest(payload: CompletedTestPayload): Promise<void> {
  try {
    await post("/api/submissions/complete", payload, true);
  } catch (e) {
    console.warn(e);
  }
}

/** Throws on failure so the form can show an error and let the visitor retry. */
export async function saveLead(payload: LeadPayload): Promise<void> {
  await post("/api/submissions/lead", payload);
}
