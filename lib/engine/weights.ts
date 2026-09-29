import type { Answers, QuestionId } from "@/config/questions";
import type { WeightTable } from "@/config/scoring";

export interface Contribution {
  questionId: QuestionId;
  answerId: string;
  points: number;
}

/** Every selected answer that appears in the weight table, with its points. */
export function collectContributions(weights: WeightTable, answers: Answers): Contribution[] {
  const out: Contribution[] = [];
  for (const [questionId, table] of Object.entries(weights) as [QuestionId, Record<string, number>][]) {
    for (const answerId of answers[questionId] ?? []) {
      const points = table[answerId];
      if (points !== undefined) out.push({ questionId, answerId, points });
    }
  }
  return out;
}

export const sumPoints = (items: Contribution[]) => items.reduce((s, c) => s + c.points, 0);
