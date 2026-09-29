import "server-only";
import { QUESTIONS, type Answers } from "@/config/questions";
import { LANGUAGES, type Lang } from "@/lib/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);

/** Accepts only known question/answer IDs, a complete test, and valid selection counts. */
export function parseAnswers(input: unknown): Answers | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const out: Answers = {};
  for (const q of QUESTIONS) {
    const value = raw[q.id];
    if (!Array.isArray(value) || value.length === 0) return null;
    const ids = [...new Set(value)];
    if (!ids.every((a) => typeof a === "string" && (q.answers as readonly string[]).includes(a))) return null;
    if (q.type === "single" && ids.length !== 1) return null;
    if ("maxSelections" in q && ids.length > q.maxSelections) return null;
    out[q.id] = ids as string[];
  }
  return out;
}

export function cleanText(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  return s.length > 0 && s.length <= max ? s : null;
}

export function cleanEmail(v: unknown): string | null {
  const s = cleanText(v, 254)?.toLowerCase() ?? null;
  return s && EMAIL_RE.test(s) ? s : null;
}
