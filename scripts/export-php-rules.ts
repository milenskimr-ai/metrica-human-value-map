/**
 * Writes the scoring rules for the PHP backend (php/api/_lib/rules.json) from the
 * same TypeScript config and locale files the browser uses — one source of truth.
 * Run by scripts/build-php-site.sh; never edit rules.json by hand.
 */
import { writeFileSync } from "node:fs";
import { APP_CONFIG } from "../config/app";
import { QUESTIONS } from "../config/questions";
import { DIMENSIONS, LEVEL_THRESHOLDS, SCORING, SCORING_VERSION } from "../config/scoring";
import { OPPORTUNITY_WEIGHTS, TIE_BREAK_ORDER } from "../config/opportunity";
import { createT } from "../lib/i18n";

const out = process.argv[2] ?? "php/api/_lib/rules.json";

const rules = {
  generatedFrom: "config/*.ts + locales/*.json — do not edit by hand",
  scoringVersion: SCORING_VERSION,
  consentVersion: APP_CONFIG.consentVersion,
  consentText: { bg: createT("bg")("lead.consent"), en: createT("en")("lead.consent") },
  questions: QUESTIONS.map((q) => ({
    id: q.id,
    type: q.type,
    answers: [...q.answers],
    ...("maxSelections" in q ? { maxSelections: q.maxSelections } : {}),
  })),
  levelThresholds: LEVEL_THRESHOLDS,
  dimensions: Object.fromEntries(DIMENSIONS.map((d) => [d, SCORING[d]])),
  opportunityWeights: OPPORTUNITY_WEIGHTS,
  tieBreakOrder: TIE_BREAK_ORDER,
};

writeFileSync(out, JSON.stringify(rules, null, 2) + "\n");
console.log(`Wrote ${out}`);
