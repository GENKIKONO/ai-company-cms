/**
 * Application Route Constants
 *
 * UI改修時のリンク切れ防止のため、ルートを定数化
 * href="/path" の代わりに href={ROUTES.pathName} を使用
 *
 * ⚠️ ハードコード禁止: 新しいルートを追加する場合は必ずここに定義すること
 */

export const ROUTES = {
  // Dashboard routes - Overview (統合トップ)
  dashboard: '/dashboard',
  dashboardActivity: '/dashboard/activity',

  // Dashboard routes - My Page
  dashboardPosts: '/dashboard/posts',
  dashboardFaqs: '/dashboard/faqs',
  dashboardServices: '/dashboard/services',
  dashboardCaseStudies: '/dashboard/case-studies',
  dashboardMaterials: '/dashboard/materials',

  // Dashboard routes - AI Studio
  dashboardAiStudio: '/dashboard/ai-studio',
  dashboardInterview: '/dashboard/interview',
  dashboardOrgAiChat: '/dashboard/org-ai-chat',

  // Dashboard routes - Insights
  dashboardInsights: '/dashboard/insights',
  dashboardQnaStats: '/dashboard/qna-stats',
  dashboardAiSeoReport: '/dashboard/analytics/ai-seo-report',
  dashboardAiReports: '/dashboard/ai-reports',
  dashboardAiCitations: '/dashboard/ai-citations',

  // Dashboard routes - Settings
  dashboardEmbed: '/dashboard/embed',
  dashboardBilling: '/dashboard/billing',
  dashboardSettings: '/dashboard/settings',
  dashboardHelp: '/dashboard/help',

  // Dashboard routes - Admin (org manager)
  dashboardManage: '/dashboard/manage',

  // Legacy (後方互換)
  dashboardCompany: '/dashboard/company',

  // Account routes（ユーザー個人設定）
  account: '/account',
  accountProfile: '/account/profile',
  accountSecurity: '/account/security',
  accountNotifications: '/account/notifications',

  // Admin routes（管理者専用）
  admin: '/admin',
  managementConsole: '/management-console',

  // My routes（レガシー互換 - /dashboard へリダイレクト）
  my: '/my',

  // Auth routes
  auth: '/auth',
  authLogin: '/auth/login',
  authSignin: '/auth/signin',
  authSignup: '/auth/signup',
  login: '/login',
  signin: '/signin',

  // Public routes
  home: '/',
} as const;

/**
 * 認証が必要なルートプレフィックス
 * middleware.ts で使用 - ここを Single Source of Truth とする
 *
 * 注意: 順序は長いパスを先に（/management-console が /m にマッチしないように）
 */
export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.dashboard,
  ROUTES.account,
  ROUTES.admin,
  ROUTES.managementConsole,
  ROUTES.my,
] as const;