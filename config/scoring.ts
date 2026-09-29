/**
 * ================================================================
 *  INITIAL PLACEHOLDER SCORING
 * ================================================================
 * These weights are NOT a validated methodology. They are simple,
 * transparent placeholder rules so the MVP works end to end.
 * Replace them with Metrica's final scoring matrix.
 *
 * HOW IT WORKS (per dimension):
 *   score = base + sum of points for every selected answer
 *   score is then clamped to 0–100
 *   level: score < thresholds.medium  -> LOW
 *          score < thresholds.high    -> MEDIUM
 *          otherwise                  -> HIGH
 *
 * Multi-select questions add the points of every selected answer.
 * Answers not listed = 0 points. Negative points are allowed.
 *
 * Explanations on the result screen are picked from the answers
 * that contributed most (texts in /locales/*.json → "reasons").
 * ================================================================
 */

import type { AnswerIdOf, QuestionId } from "./questions";

export type Dimension = "automation" | "human_value" | "cx_maturity";
export type Level = "low" | "medium" | "high";

export type WeightTable = {
  [Q in QuestionId]?: Partial<Record<AnswerIdOf<Q>, number>>;
};

export interface DimensionConfig {
  base: number;
  weights: WeightTable;
}

/** Bump when weights change — stored with every result so old and new results can be told apart. */
export const SCORING_VERSION = "placeholder-v1";

export const DIMENSIONS: readonly Dimension[] = ["automation", "human_value", "cx_maturity"];

export const LEVEL_THRESHOLDS = {
  medium: 40, // 40–69 = MEDIUM
  high: 70, //   70+  = HIGH
};

export const SCORING: Record<Dimension, DimensionConfig> = {
  // ---------------------------------------------------------------
  // AUTOMATION OPPORTUNITY — INITIAL PLACEHOLDER
  // Grows with volume and routine / repetitive contact reasons.
  // ---------------------------------------------------------------
  automation: {
    base: 10,
    weights: {
      monthly_contacts: { under_100: 0, "100_500": 10, "500_2000": 20, over_2000: 30, unknown: 10 },
      contact_reasons: {
        order_status: 15,
        product_information: 10,
        change_order: 8,
        returns: 12,
        payment: 8,
        complaint: 0,
        product_advice: 0,
        other: 3,
      },
      channels: { phone: 0, email: 3, chat: 3, social: 2, messaging: 3, contact_form: 3 },
      biggest_challenge: {
        cost: 12,
        people: 10,
        slow_response: 12,
        inconsistent_quality: 6,
        unhappy_customers: 0,
        unused_customer_insight: 3,
        no_major_problem: 0,
      },
      complex_problem: { multiple_steps: 5, wait: 5 },
      // Spending human attention on routine = automation opportunity
      human_attention: { order_status_customer: 5, standard_return: 5 },
    },
  },

  // ---------------------------------------------------------------
  // HUMAN VALUE OPPORTUNITY — INITIAL PLACEHOLDER
  // Grows with complaints, advice/sales, complex cases, loyalty.
  // ---------------------------------------------------------------
  human_value: {
    base: 0,
    weights: {
      business_type: { online_brand: 8, marketplace: 5, retail_ecommerce: 8, services: 10, other: 5 },
      monthly_contacts: { under_100: 3, "100_500": 5, "500_2000": 8, over_2000: 10, unknown: 5 },
      contact_reasons: {
        order_status: 0,
        product_information: 5,
        change_order: 5,
        returns: 5,
        complaint: 15,
        product_advice: 15,
        payment: 0,
        other: 3,
      },
      channels: { phone: 5, messaging: 3, chat: 3, social: 2 },
      biggest_challenge: {
        cost: 3,
        people: 5,
        slow_response: 5,
        inconsistent_quality: 12,
        unhappy_customers: 20,
        unused_customer_insight: 20,
        no_major_problem: 0,
      },
      complex_problem: { direct_resolution: 5, multiple_steps: 12, wait: 12, depends: 10, unknown: 8 },
      human_attention: {
        order_status_customer: 0,
        purchase_hesitation: 15,
        angry_loyal_customer: 15,
        standard_return: 0,
      },
    },
  },

  // ---------------------------------------------------------------
  // CX MATURITY — INITIAL PLACEHOLDER
  // + clear routes to empowered people, structured channels
  // − transfers, waiting, "depends who is working", unknown volumes
  // ---------------------------------------------------------------
  cx_maturity: {
    base: 50,
    weights: {
      monthly_contacts: { unknown: -15 },
      channels: { phone: 3, email: 3, chat: 4, social: 2, messaging: 3, contact_form: 3 },
      biggest_challenge: {
        cost: 0,
        people: -5,
        slow_response: -10,
        inconsistent_quality: -10,
        unhappy_customers: -5,
        unused_customer_insight: -5,
        no_major_problem: 5,
      },
      complex_problem: {
        direct_resolution: 25,
        multiple_steps: -15,
        wait: -15,
        depends: -20,
        unknown: -20,
      },
      human_attention: {
        order_status_customer: -5,
        purchase_hesitation: 8,
        angry_loyal_customer: 10,
        standard_return: -5,
      },
    },
  },
};
