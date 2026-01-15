/**
 * AIOHub 機能レジストリ
 * プラン機能の一元管理
 */

export type FeatureCategory =
  | 'core'
  | 'ai-visibility'
  | 'content'
  | 'integration'
  | 'admin';

export type FeatureStatus = 'stable' | 'planned' | 'deprecated';

export type FeatureId =
  | 'structuredData'
  | 'aiCrawlCheck'
  | 'aiVisibilityScore'
  | 'hearingService'
  | 'orgDirectory'
  | 'faqModule'
  | 'pricingModule';

export const FEATURES: Record<FeatureId, {
  id: FeatureId;
  label: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
}> = {
  structuredData: {
    id: 'structuredData',
    label: '構造化データ出力',
    description: '登録された企業情報をAI/検索が読みやすいJSON-LD等に変換します。',
    category: 'core',
    status: 'stable',
  },
  aiCrawlCheck: {
    id: 'aiCrawlCheck',
    label: 'AIクロール検知',
    description: 'クロール対象に載るための前提チェックを行う想定の機能。まだ実装フェーズ2予定のため仮登録にしておきます。',
    category: 'ai-visibility',
    status: 'planned',
  },
  aiVisibilityScore: {
    id: 'aiVisibilityScore',
    label: 'AIビジビリティスコア',
    description: 'AIにどれだけ出やすい状態かを可視化するためのスコアリング機能。まだ実装前なので説明だけ保持します。',
    category: 'ai-visibility',
    status: 'planned',
  },
  hearingService: {
    id: 'hearingService',
    label: 'ヒアリング代行',
    description: 'ヒアリング代行サービスページでの表示・管理に関わる機能。',
    category: 'content',
    status: 'stable',
  },
  orgDirectory: {
    id: 'orgDirectory',
    label: '企業ディレクトリ表示',
    description: '企業一覧ページでのカード表示に必要な機能。',
    category: 'content',
    status: 'stable',
  },
  faqModule: {
    id: 'faqModule',
    label: 'FAQセクション',
    description: 'AIOHubに掲載するFAQブロックの表示/編集に関わる機能。',
    category: 'content',
    status: 'stable',
  },
  pricingModule: {
    id: 'pricingModule',
    label: '料金テーブル表示',
    description: '現行の料金プラン表示（/pricing, hearing-service内）に関わる機能。',
    category: 'content',
    status: 'stable',
  },
};