import type { Level } from "@/config/scoring";
import type { DimensionResult } from "./scoring";
import type { Contribution } from "./weights";

const MAX_REASONS = 2;

/**
 * Picks which answer-based reasons explain a dimension's level.
 *  HIGH   → strongest positive contributions
 *  LOW    → weakest / negative contributions
 *  MEDIUM → one from each end
 * Only contributions with a text in locales ("reasons.<dimension>.<question>.<answer>") are used.
 */
export function explanationKeys(result: DimensionResult, hasText: (key: string) => boolean): string[] {
  const keyOf = (c: Contribution) => `reasons.${result.dimension}.${c.questionId}.${c.answerId}`;
  const withText = result.contributions.filter((c) => hasText(keyOf(c)));
  const desc = [...withText].sort((a, b) => b.points - a.points);
  const asc = [...desc].reverse();

  const order: Record<Level, Contribution[]> = {
    high: desc,
    low: asc,
    medium: interleave(desc, asc),
  };

  const picked: string[] = [];
  for (const c of order[result.level]) {
    const key = keyOf(c);
    if (!picked.includes(key)) picked.push(key);
    if (picked.length === MAX_REASONS) break;
  }
  return picked;
}

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== undefined) out.push(a[i]);
    if (b[i] !== undefined) out.push(b[i]);
  }
  return out;
}
