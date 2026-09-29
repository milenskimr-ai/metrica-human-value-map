import type { Answers } from "@/config/questions";
import { OPPORTUNITY_WEIGHTS, TIE_BREAK_ORDER, type OpportunityCategory } from "@/config/opportunity";
import { collectContributions, sumPoints } from "./weights";

export function findBiggestOpportunity(answers: Answers): OpportunityCategory {
  let best: OpportunityCategory = TIE_BREAK_ORDER[0];
  let bestPoints = -Infinity;
  // TIE_BREAK_ORDER is iterated in priority order; only a strictly higher score replaces the leader.
  for (const category of TIE_BREAK_ORDER) {
    const points = sumPoints(collectContributions(OPPORTUNITY_WEIGHTS[category], answers));
    if (points > bestPoints) {
      best = category;
      bestPoints = points;
    }
  }
  return best;
}
