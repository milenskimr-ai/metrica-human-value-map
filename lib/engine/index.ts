import type { Answers } from "@/config/questions";
import type { Dimension } from "@/config/scoring";
import type { OpportunityCategory } from "@/config/opportunity";
import { buildJourney, type JourneyStageResult } from "./journey";
import { findBiggestOpportunity } from "./opportunity";
import { scoreAll, type DimensionResult } from "./scoring";

export interface DiagnosticResult {
  dimensions: Record<Dimension, DimensionResult>;
  journey: JourneyStageResult[];
  opportunity: OpportunityCategory;
}

/** Pure function: same answers → same result. No randomness, no external calls. */
export function computeResult(answers: Answers): DiagnosticResult {
  return {
    dimensions: scoreAll(answers),
    journey: buildJourney(answers),
    opportunity: findBiggestOpportunity(answers),
  };
}

export type { DimensionResult, JourneyStageResult };
export { explanationKeys } from "./explanations";
