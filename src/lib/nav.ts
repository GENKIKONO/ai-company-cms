/**
 * ナビゲーション定義 - 単一ソース
 *
 * Dashboard/Mobile ナビの共通定義
 * 新IA構成: Home / Overview / My Page / AI Studio / Insights / Settings
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
  DocumentPlusIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  LinkIcon,
  CodeBracketIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

// アイコン型定義
type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

// ナビ項目の型定義
export interface NavItem {
  name: string;
  href: string;
  icon: HeroIcon;
}

// ナビグループの型定義
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// 条件付きナビ項目（org manager用など）
export interface ConditionalNavItem extends NavItem {
  condition: 'orgManager';
}

/**
 * ダッシュボードナビゲーション構成
 * グループ化された新IA構造
 */
export const dashboardNavGroups: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { name: 'ダッシュボード', href: '/dashboard', icon: HomeIcon },
    ],
  },
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { name: 'アクティビティ', href: '/dashboard/activity', icon: ClockIcon },
    ],
  },
  {
    id: 'mypage',
    label: 'My Page',
    items: [
      { name: '記事管理', href: '/dashboard/posts', icon: DocumentTextIcon },
      { name: 'サービス管理', href: '/dashboard/services', icon: BriefcaseIcon },
      { name: '事例管理', href: '/dashboard/case-studies', icon: UserGroupIcon },
      { name: 'FAQ管理', href: '/dashboard/faqs', icon: QuestionMarkCircleIcon },
      { name: '営業資料', href: '/dashboard/materials', icon: FolderIcon },
    ],
  },
  {
    id: 'aistudio',
    label: 'AI Studio',
    items: [
      { name: '企業専用AIチャット', href: '/dashboard/org-ai-chat', icon: DocumentPlusIcon },
      { name: 'AIインタビュー', href: '/dashboard/interview', icon: ChatBubbleBottomCenterTextIcon },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { name: 'Q&A統計', href: '/dashboard/qna-stats', icon: ChartBarIcon },
      { name: '分析レポート', href: '/dashboard/analytics/ai-seo-report', icon: ChartBarIcon },
      { name: 'AIレポート', href: '/dashboard/ai-reports', icon: DocumentChartBarIcon },
      { name: 'AI引用', href: '/dashboard/ai-citations', icon: LinkIcon },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { name: '埋め込み設定', href: '/dashboard/embed', icon: CodeBracketIcon },
      { name: '請求管理', href: '/dashboard/billing', icon: CreditCardIcon },
      { name: '設定', href: '/dashboard/settings', icon: Cog6ToothIcon },
      { name: 'ヘルプ', href: '/dashboard/help', icon: ChatBubbleLeftRightIcon },
      { name: 'アカウント', href: '/account', icon: UserCircleIcon },
    ],
  },
];

/**
 * 条件付きナビ項目（org manager専用）
 */
export const conditionalNavItems: ConditionalNavItem[] = [
  {
    name: '管理',
    href: '/dashboard/manage',
    icon: ShieldCheckIcon,
    condition: 'orgManager',
  },
];

/**
 * パスがナビ項目にマッチするか判定
 */
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
