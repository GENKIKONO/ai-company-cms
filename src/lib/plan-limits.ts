// Plan limits for Single-Org Mode (client-safe)
export const PLAN_LIMITS = {
  free:   { services: 3, posts: 5, case_studies: 2, faqs: 10 },
  basic:  { services: 50, posts: 200, case_studies: 50, faqs: 200 },
  pro:    { services: 200, posts: 1000, case_studies: 200, faqs: 2000 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
export type ResourceType = keyof typeof PLAN_LIMITS.free;