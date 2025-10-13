// Plan limits for Single-Org Mode (client-safe)
// NOTE: This file is deprecated. Use @/config/plans.ts instead.
// Kept for backward compatibility.

export const PLAN_LIMITS = {
  free: { 
    services: 1, 
    materials: 0, 
    embeds: 1,
    external_links: 0,
    category_tags: 0,
    logo_size: 'small',
    verified_badge: false,
    ai_reports: false,
    system_monitoring: false,
    qa_items: 5,
    case_studies: 2,
    posts: 5,
    faqs: 5
  },
  basic: { 
    services: 10, 
    materials: 5, 
    embeds: 5,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'medium',
    verified_badge: false,
    ai_reports: false,
    system_monitoring: false,
    qa_items: 20,
    case_studies: 10,
    posts: 50,
    faqs: 20
  },
  business: { 
    services: 50, 
    materials: 20, 
    embeds: 20,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'large',
    verified_badge: true,
    ai_reports: 'basic',
    system_monitoring: true,
    qa_items: Number.POSITIVE_INFINITY,
    case_studies: Number.POSITIVE_INFINITY,
    posts: Number.POSITIVE_INFINITY,
    faqs: Number.POSITIVE_INFINITY,
    approval_flow: true,
    auth_badges: true,
    search_console: true
  },
  enterprise: { 
    services: Number.POSITIVE_INFINITY, 
    materials: Number.POSITIVE_INFINITY, 
    embeds: Number.POSITIVE_INFINITY,
    external_links: Number.POSITIVE_INFINITY,
    category_tags: Number.POSITIVE_INFINITY,
    logo_size: 'large_svg',
    verified_badge: true,
    ai_reports: 'advanced',
    system_monitoring: true,
    qa_items: Number.POSITIVE_INFINITY,
    case_studies: Number.POSITIVE_INFINITY,
    posts: Number.POSITIVE_INFINITY,
    faqs: Number.POSITIVE_INFINITY,
    approval_flow: true,
    auth_badges: true,
    search_console: true,
    custom_features: true,
    dedicated_support: true,
    sla_guarantee: true
  }
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;