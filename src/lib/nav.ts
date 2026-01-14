/**
 * ナビゲーション定義 - 単一ソース
 *
 * Dashboard/Mobile ナビの共通定義
 * モード切替型ナビゲーション: Overview / My Page / AI Studio / Insights / Settings
 *
 * ⚠️ ハードコード禁止: ルートは ROUTES (src/lib/routes.ts) を使用
 */

import { ComponentType, SVGProps } from 'react';
import {
  HomeIcon,
  ClockIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  FolderIcon,
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  LinkIcon,
  PresentationChartLineIcon,
  CodeBracketIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ROUTES } from './routes';

// アイコン型定義
type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

// ナビ項目の型定義
export interface NavItem {
  name: string;
  href: string;
  icon: HeroIcon;
}

// ナビモードの型定義
export type NavMode = 'overview' | 'myPage' | 'aiStudio' | 'insights' | 'settings';

// モード定義
export interface NavModeConfig {
  id: NavMode;
  label: string;
  icon: HeroIcon;
  items: NavItem[];
}

// 条件付きナビ項目（org manager用など）
export interface ConditionalNavItem extends NavItem {
  condition: 'orgManager';
}

/**
 * ナビゲーションモード定義
 * 各モードの子項目を定義
 */
export const navModeConfigs: NavModeConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: HomeIcon,
    items: [
      { name: 'ダッシュボード', href: ROUTES.dashboard, icon: HomeIcon },
      { name: 'アクティビティ', href: ROUTES.dashboardActivity, icon: ClockIcon },
    ],
  },
  {
    id: 'myPage',
    label: 'My Page',
    icon: DocumentTextIcon,
    items: [
      { name: '記事管理', href: ROUTES.dashboardPosts, icon: DocumentTextIcon },
      { name: 'FAQ管理', href: ROUTES.dashboardFaqs, icon: QuestionMarkCircleIcon },
      { name: 'サービス管理', href: ROUTES.dashboardServices, icon: BriefcaseIcon },
      { name: '事例管理', href: ROUTES.dashboardCaseStudies, icon: UserGroupIcon },
      { name: '営業資料', href: ROUTES.dashboardMaterials, icon: FolderIcon },
    ],
  },
  {
    id: 'aiStudio',
    label: 'AI Studio',
    icon: SparklesIcon,
    items: [
      { name: 'AI Studio', href: ROUTES.dashboardAiStudio, icon: SparklesIcon },
      { name: 'AIインタビュー', href: ROUTES.dashboardInterview, icon: ChatBubbleBottomCenterTextIcon },
      { name: '企業専用AIチャット', href: ROUTES.dashboardOrgAiChat, icon: ChatBubbleOvalLeftEllipsisIcon },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: ChartBarIcon,
    items: [
      { name: 'Insights', href: ROUTES.dashboardInsights, icon: PresentationChartLineIcon },
      { name: 'Q&A統計', href: ROUTES.dashboardQnaStats, icon: ChartBarIcon },
      { name: '分析レポート', href: ROUTES.dashboardAiSeoReport, icon: ChartBarIcon },
      { name: 'AIレポート', href: ROUTES.dashboardAiReports, icon: DocumentChartBarIcon },
      { name: 'AI引用', href: ROUTES.dashboardAiCitations, icon: LinkIcon },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    items: [
      { name: '埋め込み設定', href: ROUTES.dashboardEmbed, icon: CodeBracketIcon },
      { name: '請求管理', href: ROUTES.dashboardBilling, icon: CreditCardIcon },
      { name: '設定', href: ROUTES.dashboardSettings, icon: Cog6ToothIcon },
      { name: 'ヘルプ', href: ROUTES.dashboardHelp, icon: ChatBubbleLeftRightIcon },
      { name: 'アカウント', href: ROUTES.account, icon: UserCircleIcon },
    ],
  },
];

/**
 * 条件付きナビ項目（org manager専用）
 */
export const conditionalNavItems: ConditionalNavItem[] = [
  {
    name: '管理',
    href: ROUTES.dashboardManage,
    icon: ShieldCheckIcon,
    condition: 'orgManager',
  },
];

/**
 * パスがナビ項目にマッチするか判定
 */
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard;
  }
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}

/**
 * パスからアクティブなモードを取得
 * deep link時にモードを自動判定するために使用
 */
export function getActiveModeFromPathname(pathname: string): NavMode | null {
  // 条件付きナビ項目（管理）のチェック
  for (const item of conditionalNavItems) {
    if (isNavItemActive(item.href, pathname)) {
      return null; // Admin は通常モードではない
    }
  }

  // 各モードをチェック
  for (const config of navModeConfigs) {
    for (const item of config.items) {
      if (isNavItemActive(item.href, pathname)) {
        return config.id;
      }
    }
  }

  // デフォルトは overview
  return 'overview';
}

/**
 * モードIDから設定を取得
 */
export function getNavModeConfig(mode: NavMode): NavModeConfig | null {
  return navModeConfigs.find(config => config.id === mode) || null;
}

/**
 * 全モードの一覧を取得（ボタン表示用）
 */
export function getAllNavModes(): NavModeConfig[] {
  return navModeConfigs;
}

// ============================================================
// 後方互換用エクスポート（既存コードとの互換性維持）
// ============================================================

// 旧 NavGroup 型（互換用）
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// 旧 dashboardNavGroups（互換用 - NavModeConfig から変換）
export const dashboardNavGroups: NavGroup[] = navModeConfigs.map(config => ({
  id: config.id,
  label: config.label,
  items: config.items,
}));

// 旧関数（互換用）
export function getActiveCategoryId(pathname: string): string | null {
  return getActiveModeFromPathname(pathname);
}

export function getNavGroupById(categoryId: string): NavGroup | null {
  const config = navModeConfigs.find(c => c.id === categoryId);
  if (!config) return null;
  return {
    id: config.id,
    label: config.label,
    items: config.items,
  };
}
