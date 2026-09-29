import type { Answers } from "@/config/questions";
import { DIMENSIONS, LEVEL_THRESHOLDS, SCORING, type Dimension, type Level } from "@/config/scoring";
import { collectContributions, sumPoints, type Contribution } from "./weights";

export interface DimensionResult {
  dimension: Dimension;
  score: number; // 0–100
  level: Level;
  contributions: Contribution[];
}

export function levelFor(score: number): Level {
  if (score >= LEVEL_THRESHOLDS.high) return "high";
  if (score >= LEVEL_THRESHOLDS.medium) return "medium";
  return "low";
}

export function scoreDimension(dimension: Dimension, answers: Answers): DimensionResult {
  const config = SCORING[dimension];
  const contributions = collectContributions(config.weights, answers);
  const raw = config.base + sumPoints(contributions);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return { dimension, score, level: levelFor(score), contributions };
}

export function scoreAll(answers: Answers): Record<Dimension, DimensionResult> {
  return Object.fromEntries(DIMENSIONS.map((d) => [d, scoreDimension(d, answers)])) as Record<
    Dimension,
    DimensionResult
  >;
}
