import type { Answers } from "@/config/questions";

export const validAnswers = (overrides: Answers = {}): Answers => ({
  business_type: ["online_brand"],
  monthly_contacts: ["500_2000"],
  contact_reasons: ["order_status", "returns", "complaint"],
  channels: ["phone", "email", "chat"],
  biggest_challenge: ["unhappy_customers"],
  complex_problem: ["multiple_steps"],
  human_attention: ["angry_loyal_customer"],
  ...overrides,
});
