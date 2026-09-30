import { describe, expect, it } from "vitest";
import { QUESTIONS, type Answers } from "@/config/questions";
import { DIMENSIONS, LEVEL_THRESHOLDS } from "@/config/scoring";
import { JOURNEY_STAGES } from "@/config/journey";
import { TIE_BREAK_ORDER } from "@/config/opportunity";
import { computeResult, explanationKeys } from "@/lib/engine";
import { levelFor } from "@/lib/engine/scoring";
import { hasKey } from "@/lib/i18n";
import { validAnswers } from "../support/answers";

/** Every possible single-choice combination is too many; sample systematically instead. */
function* sampleAnswers(): Generator<Answers> {
  for (const q of QUESTIONS) {
    for (const a of q.answers) yield validAnswers({ [q.id]: [a] });
  }
}

describe("scoring engine", () => {
  it("is deterministic", () => {
    expect(computeResult(validAnswers())).toEqual(computeResult(validAnswers()));
  });

  it("keeps every score within 0–100 with a level matching the thresholds", () => {
    for (const answers of sampleAnswers()) {
      const r = computeResult(answers);
      for (const d of DIMENSIONS) {
        const { score, level } = r.dimensions[d];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(level).toBe(levelFor(score));
      }
    }
  });

  it("maps thresholds to levels", () => {
    expect(levelFor(LEVEL_THRESHOLDS.medium - 1)).toBe("low");
    expect(levelFor(LEVEL_THRESHOLDS.medium)).toBe("medium");
    expect(levelFor(LEVEL_THRESHOLDS.high - 1)).toBe("medium");
    expect(levelFor(LEVEL_THRESHOLDS.high)).toBe("high");
  });

  it("rates a direct route to a human as more mature than 'depends who is working'", () => {
    const direct = computeResult(validAnswers({ complex_problem: ["direct_resolution"] }));
    const depends = computeResult(validAnswers({ complex_problem: ["depends"] }));
    expect(direct.dimensions.cx_maturity.score).toBeGreaterThan(depends.dimensions.cx_maturity.score);
  });

  it("rates high contact volume as a bigger automation opportunity than low volume", () => {
    const high = computeResult(validAnswers({ monthly_contacts: ["over_2000"] }));
    const low = computeResult(validAnswers({ monthly_contacts: ["under_100"] }));
    expect(high.dimensions.automation.score).toBeGreaterThan(low.dimensions.automation.score);
  });

  it("always returns all 7 journey stages and a known opportunity", () => {
    for (const answers of sampleAnswers()) {
      const r = computeResult(answers);
      expect(r.journey.map((s) => s.stage)).toEqual([...JOURNEY_STAGES]);
      expect(TIE_BREAK_ORDER).toContain(r.opportunity);
    }
  });

  it("only picks explanation texts that exist in both languages", () => {
    for (const answers of sampleAnswers()) {
      const r = computeResult(answers);
      for (const d of DIMENSIONS) {
        const keys = explanationKeys(r.dimensions[d], (k) => hasKey("en", k));
        expect(keys.length).toBeLessThanOrEqual(2);
        for (const k of keys) expect(hasKey("bg", k), k).toBe(true);
      }
    }
  });
});

describe("locales", () => {
  it("have a label for every question and answer in both languages", () => {
    for (const lang of ["bg", "en"] as const) {
      for (const q of QUESTIONS) {
        expect(hasKey(lang, `questions.${q.id}.title`)).toBe(true);
        for (const a of q.answers) expect(hasKey(lang, `questions.${q.id}.answers.${a}`), `${lang} ${q.id}.${a}`).toBe(true);
      }
      for (const o of TIE_BREAK_ORDER) expect(hasKey(lang, `opportunity.categories.${o}.text`)).toBe(true);
      for (const s of JOURNEY_STAGES) expect(hasKey(lang, `journey.stages.${s}.name`)).toBe(true);
      for (const k of ["lead.consent", "idle.title", "idle.continue"]) expect(hasKey(lang, k)).toBe(true);
    }
  });
});
