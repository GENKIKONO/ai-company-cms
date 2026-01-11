/**
 * Allowlist for dashboard secure views
 *
 * Purpose: Centralize view name references for type safety and typo prevention
 */

export const allowedViews = {
  posts: 'v_dashboard_posts_secure',
  services: 'v_dashboard_services_secure',
  case_studies: 'v_dashboard_case_studies_secure',
  faqs: 'v_dashboard_faqs_secure',
} as const;

export type AllowedViewKey = keyof typeof allowedViews;
export type AllowedViewName = (typeof allowedViews)[AllowedViewKey];

/**
 * Type guard to check if a string is an allowed view name
 */
export function isAllowedView(name: string): name is AllowedViewName {
  return Object.values(allowedViews).includes(name as AllowedViewName);
}

/**
 * Get view name by key (type-safe)
 */
export function getViewName<K extends AllowedViewKey>(key: K): (typeof allowedViews)[K] {
  return allowedViews[key];
}
