/**
 * Application Route Constants
 *
 * UI改修時のリンク切れ防止のため、ルートを定数化
 * href="/path" の代わりに href={ROUTES.pathName} を使用
 *
 * ⚠️ ハードコード禁止: 新しいルートを追加する場合は必ずここに定義すること
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