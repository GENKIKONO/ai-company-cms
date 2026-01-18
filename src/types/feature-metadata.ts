/**
 * Feature Metadata - プラン制限機能のメタデータ型定義
 *
 * 目的:
 * - 機能キー（ai_reports等）に対する表示名・説明・必要プランを統一管理
 * - FeatureGateUI コンポーネントで使用
 * - 管理者画面の feature_registry.display_name と整合
 */

import type { PlanType } from '@/config/plans';

// =====================================================
// 型定義
// =====================================================

/** 機能カテゴリ */
export type FeatureCategory = 'ai' | 'content' | 'analytics' | 'settings';

/** 機能制御タイプ */
export type FeatureControlType = 'on_off' | 'limit_number';

/** 機能メタデータ（静的情報） */
export interface FeatureMetadata {
  /** 機能キー（例: 'ai_reports'） */
  key: string;
  /** 表示名（例: 'AI月次レポート'） */
  displayName: string;
  /** 説明文（機能の価値を伝える） */
  description: string;
  /** カテゴリ */
  category: FeatureCategory;
  /** 制御タイプ */
  controlType: FeatureControlType;
  /** この機能が利用可能な最低プラン */
  availableFrom: PlanType;
  /** lucide アイコン名（オプション） */
  icon?: string;
}

/** クォータ情報（動的情報） */
export interface QuotaInfo {
  /** 使用済み数 */
  used: number;
  /** 上限数 */
  limit: number;
  /** 無制限かどうか */
  unlimited: boolean;
  /** 次のリセット日（ISO8601） */
  resetDate?: string;
  /** リセット周期（例: 'monthly'） */
  period?: string;
}

/** 機能ゲート情報（メタデータ + 動的状態） */
export interface FeatureGateInfo {
  /** 利用可能かどうか */
  available: boolean;
  /** 機能メタデータ */
  metadata: FeatureMetadata;
  /** 現在のプラン */
  currentPlan: PlanType;
  /** 現在のプラン表示名 */
  currentPlanName: string;
  /** アップグレード先プラン */
  upgradePlan?: PlanType;
  /** アップグレード先プラン表示名 */
  upgradePlanName?: string;
  /** アップグレード先プラン価格 */
  upgradePlanPrice?: number;
  /** クォータ情報（limit_number タイプのみ） */
  quota?: QuotaInfo;
}

/** プラン特典情報 */
export interface PlanBenefit {
  /** 特典テキスト */
  text: string;
  /** 現在との比較（例: '現在5件 → 20件'） */
  comparison?: string;
  /** この機能が対象の特典か */
  isTargetFeature?: boolean;
}

// =====================================================
// 機能メタデータマップ（静的定義）
// =====================================================

/**
 * 全機能のメタデータ定義
 *
 * NOTE: feature_registry.display_name と同期を保つ
 * 将来的にはDBから動的取得も検討
 */
export const FEATURE_METADATA_MAP: Record<string, FeatureMetadata> = {
  // AI系機能
  ai_reports: {
    key: 'ai_reports',
    displayName: 'AI月次レポート',
    description: '組織のコンテンツパフォーマンスとAI活用状況を月次で詳細分析。競合との差別化ポイントを発見できます。',
    category: 'ai',
    controlType: 'on_off',
    availableFrom: 'pro',
    icon: 'Brain',
  },
  ai_interview: {
    key: 'ai_interview',
    displayName: 'AIインタビュー',
    description: 'AIがあなたの代わりにヒアリングを実施。効率的に情報を収集し、コンテンツを自動生成します。',
    category: 'ai',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'Mic',
  },
  ai_visibility_analytics: {
    key: 'ai_visibility_analytics',
    displayName: 'AI可視性分析',
    description: 'AIボットからの検索可視性を分析。次世代の検索エンジン対策ができます。',
    category: 'ai',
    controlType: 'on_off',
    availableFrom: 'business',
    icon: 'Eye',
  },

  // コンテンツ系機能
  services: {
    key: 'services',
    displayName: 'サービス登録',
    description: '自社サービスを構造化データとして公開。AIやSEOに最適化された形で発信できます。',
    category: 'content',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'Briefcase',
  },
  materials: {
    key: 'materials',
    displayName: '営業資料',
    description: '営業資料やホワイトペーパーを添付。見込み客への情報提供を強化します。',
    category: 'content',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'FileText',
  },
  case_studies: {
    key: 'case_studies',
    displayName: '導入事例',
    description: '導入事例を公開して信頼性を向上。見込み客の意思決定を後押しします。',
    category: 'content',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'Award',
  },
  faqs: {
    key: 'faqs',
    displayName: 'FAQ',
    description: 'よくある質問を構造化して公開。問い合わせ削減とSEO向上を実現します。',
    category: 'content',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'HelpCircle',
  },
  posts: {
    key: 'posts',
    displayName: '記事・ニュース',
    description: 'お知らせや記事を公開。最新情報を発信してエンゲージメントを高めます。',
    category: 'content',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'Newspaper',
  },
  embeds: {
    key: 'embeds',
    displayName: '埋め込みウィジェット',
    description: '自社サイトにHub情報を埋め込み。一元管理で更新作業を効率化します。',
    category: 'content',
    controlType: 'limit_number',
    availableFrom: 'starter',
    icon: 'Code',
  },

  // 分析・設定系機能
  system_monitoring: {
    key: 'system_monitoring',
    displayName: 'システム監視',
    description: 'システム状態をリアルタイム監視。問題を早期発見して対処できます。',
    category: 'analytics',
    controlType: 'on_off',
    availableFrom: 'business',
    icon: 'Activity',
  },
  verified_badge: {
    key: 'verified_badge',
    displayName: '認証バッジ',
    description: '法人認証バッジを表示。信頼性を高めて成約率を向上させます。',
    category: 'settings',
    controlType: 'on_off',
    availableFrom: 'business',
    icon: 'BadgeCheck',
  },
  team_management: {
    key: 'team_management',
    displayName: 'チーム管理',
    description: 'チームメンバーの権限を細かく設定。組織的なコンテンツ管理が可能です。',
    category: 'settings',
    controlType: 'on_off',
    availableFrom: 'business',
    icon: 'Users',
  },
};

// =====================================================
// プラン別特典マップ
// =====================================================

/** プラン別の特典リスト */
export const PLAN_BENEFITS: Record<PlanType, PlanBenefit[]> = {
  trial: [
    { text: 'サービス登録 5件' },
    { text: 'Q&A項目 10件' },
    { text: '埋め込みウィジェット 1個' },
    { text: '14日間無料' },
  ],
  starter: [
    { text: 'サービス登録 5件' },
    { text: 'Q&A項目 10件' },
    { text: '埋め込みウィジェット 1個' },
    { text: 'メールサポート' },
  ],
  pro: [
    { text: 'AI月次レポート', isTargetFeature: true },
    { text: 'サービス登録 20件' },
    { text: 'Q&A項目 50件' },
    { text: '埋め込みウィジェット 5個' },
    { text: '営業資料添付 10個' },
    { text: '優先サポート' },
  ],
  business: [
    { text: 'AI月次レポート（拡張版）' },
    { text: 'AI可視性分析' },
    { text: 'サービス登録 無制限' },
    { text: 'Q&A項目 無制限' },
    { text: '埋め込みウィジェット 20個' },
    { text: '認証バッジ表示' },
    { text: 'チーム管理' },
    { text: '専任サポート' },
  ],
  enterprise: [
    { text: '全機能無制限' },
    { text: 'カスタム機能開発' },
    { text: 'SLA保証' },
    { text: 'API優先アクセス' },
    { text: '専任サポート' },
  ],
};

// =====================================================
// ヘルパー型
// =====================================================

/** 機能キー型（型安全性のため） */
export type FeatureKey = keyof typeof FEATURE_METADATA_MAP;

/** 機能キーの配列 */
export const FEATURE_KEYS = Object.keys(FEATURE_METADATA_MAP) as FeatureKey[];
