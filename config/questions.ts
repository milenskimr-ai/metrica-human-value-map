/**
 * QUESTIONS
 * ---------------------------------------------------------------
 * Stable, language-independent IDs for every question and answer.
 * The database and the scoring engine only ever use these IDs.
 *
 * Visible texts live in /locales/{bg,en}.json under
 *   questions.<questionId>.title
 *   questions.<questionId>.answers.<answerId>
 *
 * To change wording: edit the locale files, not this file.
 * To add/remove an answer: edit this list AND both locale files.
 */

export interface QuestionDef {
  id: string;
  type: "single" | "multi";
  answers: readonly string[];
  /** multi only: maximum number of selections */
  maxSelections?: number;
  /** show the "human attention" insight screen after this question */
  insightAfter?: boolean;
  /** visual variant; "scenario" renders larger story-like answer cards */
  variant?: "default" | "scenario";
}

export const QUESTIONS = [
  {
    id: "business_type",
    type: "single",
    answers: ["online_brand", "marketplace", "retail_ecommerce", "services", "other"],
  },
  {
    id: "monthly_contacts",
    type: "single",
    answers: ["under_100", "100_500", "500_2000", "over_2000", "unknown"],
  },
  {
    id: "contact_reasons",
    type: "multi",
    maxSelections: 3,
    answers: [
      "order_status",
      "product_information",
      "change_order",
      "returns",
      "complaint",
      "product_advice",
      "payment",
      "other",
    ],
  },
  {
    id: "channels",
    type: "multi",
    answers: ["phone", "email", "chat", "social", "messaging", "contact_form"],
  },
  {
    id: "biggest_challenge",
    type: "single",
    answers: [
      "cost",
      "people",
      "slow_response",
      "inconsistent_quality",
      "unhappy_customers",
      "unused_customer_insight",
      "no_major_problem",
    ],
  },
  {
    id: "complex_problem",
    type: "single",
    answers: ["direct_resolution", "multiple_steps", "wait", "depends", "unknown"],
  },
  {
    id: "human_attention",
    type: "single",
    variant: "scenario",
    insightAfter: true,
    answers: [
      "order_status_customer",
      "purchase_hesitation",
      "angry_loyal_customer",
      "standard_return",
    ],
  },
] as const satisfies readonly QuestionDef[];

export type Question = (typeof QUESTIONS)[number];
export type QuestionId = Question["id"];
export type AnswerIdOf<Q extends QuestionId> = Extract<Question, { id: Q }>["answers"][number];

/** Answers keyed by question ID. Always an array (single-choice = 1 item). */
export type Answers = Partial<Record<QuestionId, string[]>>;

export const TOTAL_QUESTIONS = QUESTIONS.length;
