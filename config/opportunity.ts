/**
 * BIGGEST OPPORTUNITY — INITIAL PLACEHOLDER RULES
 * ---------------------------------------------------------------
 * Each category collects points from the visitor's answers.
 * The category with the most points is shown as
 * "YOUR BIGGEST OPPORTUNITY". Ties are broken by TIE_BREAK_ORDER.
 *
 * Texts: /locales/*.json → opportunity.categories.<category>
 */

import type { WeightTable } from "./scoring";

export type OpportunityCategory =
  | "automation"
  | "retention"
  | "complaint_handling"
  | "sales_consultation"
  | "service_processes"
  | "customer_intelligence";

export const OPPORTUNITY_WEIGHTS: Record<OpportunityCategory, WeightTable> = {
  automation: {
    monthly_contacts: { "500_2000": 3, over_2000: 4 },
    contact_reasons: { order_status: 3, product_information: 2, returns: 2, payment: 2 },
    biggest_challenge: { cost: 5, people: 4, slow_response: 4 },
    human_attention: { order_status_customer: 2, standard_return: 2 },
  },
  retention: {
    business_type: { online_brand: 1, retail_ecommerce: 1 },
    contact_reasons: { complaint: 1 },
    biggest_challenge: { unused_customer_insight: 2 },
    human_attention: { angry_loyal_customer: 4 },
  },
  complaint_handling: {
    contact_reasons: { complaint: 4, returns: 1 },
    biggest_challenge: { unhappy_customers: 6 },
    human_attention: { angry_loyal_customer: 2 },
  },
  sales_consultation: {
    business_type: { online_brand: 1, retail_ecommerce: 1 },
    contact_reasons: { product_advice: 4, product_information: 1 },
    human_attention: { purchase_hesitation: 5 },
  },
  service_processes: {
    monthly_contacts: { unknown: 3 },
    biggest_challenge: { inconsistent_quality: 6, slow_response: 2 },
    complex_problem: { multiple_steps: 5, wait: 5, depends: 6, unknown: 4 },
  },
  customer_intelligence: {
    monthly_contacts: { unknown: 2 },
    biggest_challenge: { unused_customer_insight: 6 },
    complex_problem: { unknown: 2 },
  },
};

export const TIE_BREAK_ORDER: readonly OpportunityCategory[] = [
  "complaint_handling",
  "service_processes",
  "sales_consultation",
  "retention",
  "automation",
  "customer_intelligence",
];
