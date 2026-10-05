/**
 * The PHP backend recomputes scores on the server. It must give exactly the same result
 * as the TypeScript engine the browser shows — for every answer, profile and random mix.
 * Needs `php` on PATH and php/api/_lib/rules.json (npm run rules).
 */
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { QUESTIONS, type Answers } from "@/config/questions";
import { DIMENSIONS } from "@/config/scoring";
import { computeResult } from "@/lib/engine";
import { validAnswers } from "../support/answers";

const php = process.env.PHP_BIN || "php";

function phpScores(sets: Answers[]) {
  const out = execFileSync(php, ["tests/php/score-cli.php"], { input: JSON.stringify(sets), maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out.toString()) as ({ dimensions: Record<string, { score: number; level: string }>; opportunity: string } | null)[];
}

/** Deterministic pseudo-random generator so failures are reproducible. */
function rng(seed: number) {
  return () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
}

function randomAnswers(rand: () => number): Answers {
  const a: Answers = {};
  for (const q of QUESTIONS) {
    const pool = [...q.answers].sort(() => rand() - 0.5);
    const max = q.type === "single" ? 1 : "maxSelections" in q ? q.maxSelections : pool.length;
    a[q.id] = pool.slice(0, 1 + Math.floor(rand() * max));
  }
  return a;
}

describe("PHP scoring = TypeScript scoring", () => {
  const sets: Answers[] = [validAnswers()];
  for (const q of QUESTIONS) for (const a of q.answers) sets.push(validAnswers({ [q.id]: [a] }));
  const rand = rng(42);
  for (let i = 0; i < 1000; i++) sets.push(randomAnswers(rand));

  it(`matches on ${sets.length} answer sets`, () => {
    const fromPhp = phpScores(sets);
    sets.forEach((answers, i) => {
      const ts = computeResult(answers);
      const p = fromPhp[i];
      expect(p, JSON.stringify(answers)).not.toBeNull();
      for (const d of DIMENSIONS) {
        expect(p!.dimensions[d], `${d} for ${JSON.stringify(answers)}`).toEqual({
          score: ts.dimensions[d].score,
          level: ts.dimensions[d].level,
        });
      }
      expect(p!.opportunity, JSON.stringify(answers)).toBe(ts.opportunity);
    });
  });

  it("rejects the same invalid answers", () => {
    const bad: Answers[] = [
      validAnswers({ biggest_challenge: ["hacked"] }),
      validAnswers({ contact_reasons: ["order_status", "returns", "payment", "other"] }),
      validAnswers({ business_type: ["online_brand", "services"] }),
      { ...validAnswers(), channels: [] },
    ];
    expect(phpScores(bad)).toEqual([null, null, null, null]);
  });
});
