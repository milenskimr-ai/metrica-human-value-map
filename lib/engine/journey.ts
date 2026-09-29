import type { Answers } from "@/config/questions";
import {
  JOURNEY_DEFAULTS,
  JOURNEY_RULES,
  JOURNEY_STAGES,
  type JourneyMode,
  type JourneyStage,
} from "@/config/journey";

export interface JourneyStageResult {
  stage: JourneyStage;
  mode: JourneyMode;
  /** true when at least one of the visitor's answers points to this stage */
  relevant: boolean;
}

export function buildJourney(answers: Answers): JourneyStageResult[] {
  const map = new Map<JourneyStage, JourneyStageResult>(
    JOURNEY_STAGES.map((stage) => [stage, { stage, mode: JOURNEY_DEFAULTS[stage], relevant: false }]),
  );
  for (const rule of JOURNEY_RULES) {
    const selected = answers[rule.question] ?? [];
    if ((rule.answers as readonly string[]).some((a) => selected.includes(a))) {
      map.set(rule.stage, { stage: rule.stage, mode: rule.mode, relevant: true });
    }
  }
  return JOURNEY_STAGES.map((s) => map.get(s)!);
}
