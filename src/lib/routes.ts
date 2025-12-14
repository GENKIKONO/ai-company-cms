/**
 * Application Route Constants
 * 
 * UI改修時のリンク切れ防止のため、ルートを定数化
 * href="/path" の代わりに href={ROUTES.pathName} を使用
 */

export const ROUTES = {
  // Dashboard routes
  dashboard: '/dashboard',
  dashboardCompany: '/dashboard/company',
  dashboardEmbed: '/dashboard/embed',
  dashboardMaterials: '/dashboard/materials',
  dashboardServices: '/dashboard/services',
  dashboardFaqs: '/dashboard/faqs',
  dashboardBilling: '/dashboard/billing',
  dashboardSettings: '/dashboard/settings',
  
  // Auth routes
  auth: '/auth',
  authLogin: '/auth/login',
  authSignup: '/auth/signup',
  
  // Public routes
  home: '/',
} as const;