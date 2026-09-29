/**
 * CUSTOMER JOURNEY MAP — INITIAL PLACEHOLDER RULES
 * ---------------------------------------------------------------
 * Every stage has a default mode. Rules below override the mode
 * and mark the stage as "relevant to you" when an answer matches.
 * Rules are applied top to bottom — a later rule wins.
 *
 * Philosophy: Routine → AUTOMATE, Complexity → AI + HUMAN,
 *             Emotion / trust / loyalty → HUMAN
 *
 * Stage names and hints: /locales/*.json → journey.stages
 */

import type { AnswerIdOf, QuestionId } from "./questions";

export type JourneyMode = "automate" | "ai_human" | "human";

export const JOURNEY_STAGES = [
  "discover",
  "buy",
  "order",
  "delivery",
  "support",
  "complaint",
  "retention",
] as const;
export type JourneyStage = (typeof JOURNEY_STAGES)[number];

export const JOURNEY_DEFAULTS: Record<JourneyStage, JourneyMode> = {
  discover: "automate",
  buy: "ai_human",
  order: "automate",
  delivery: "automate",
  support: "ai_human",
  complaint: "human",
  retention: "human",
};

type Rule = {
  [Q in QuestionId]: {
    question: Q;
    answers: readonly AnswerIdOf<Q>[];
    stage: JourneyStage;
    mode: JourneyMode;
  };
}[QuestionId];

export const JOURNEY_RULES: readonly Rule[] = [
  { question: "contact_reasons", answers: ["product_information"], stage: "discover", mode: "automate" },
  { question: "contact_reasons", answers: ["product_advice"], stage: "buy", mode: "human" },
  { question: "human_attention", answers: ["purchase_hesitation"], stage: "buy", mode: "human" },
  { question: "contact_reasons", answers: ["payment"], stage: "order", mode: "automate" },
  { question: "contact_reasons", answers: ["change_order"], stage: "order", mode: "ai_human" },
  { question: "contact_reasons", answers: ["order_status"], stage: "delivery", mode: "automate" },
  { question: "contact_reasons", answers: ["returns"], stage: "support", mode: "automate" },
  { question: "complex_problem", answers: ["multiple_steps", "wait", "depends"], stage: "support", mode: "ai_human" },
  { question: "contact_reasons", answers: ["complaint"], stage: "complaint", mode: "human" },
  { question: "biggest_challenge", answers: ["unhappy_customers"], stage: "complaint", mode: "human" },
  { question: "human_attention", answers: ["angry_loyal_customer"], stage: "complaint", mode: "human" },
  { question: "biggest_challenge", answers: ["unused_customer_insight"], stage: "retention", mode: "ai_human" },
  { question: "human_attention", answers: ["angry_loyal_customer"], stage: "retention", mode: "human" },
];
