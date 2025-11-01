# AI × SEO 相関分析ダッシュボード - Phase 3

## ページ: `/dashboard/analytics/ai-report` (Phase 3 追加分)

### 1. AI × SEO 相関スコア Card
**表示位置**: ダッシュボード上部中央
**API**: `GET /api/analytics/ai/combined`
**プラン制限**: Business以上

```typescript
interface CorrelationScoreData {
  correlation_score: number;        // 0.73
  correlation_strength: string;     // "strong"
  sample_size: number;             // 42
  trend_direction: 'up' | 'down' | 'stable';
}
```

**UI表示内容**:
- 大きな相関スコア表示（0.73）
- 相関強度ラベル（Strong Correlation）
- 散布図（AI Score vs SEO Position）
- サンプルサイズ表示
- 前期比トレンド

### 2. Performance Matrix Heatmap Card
**表示位置**: ダッシュボード中央
**API**: `GET /api/analytics/ai/combined` (performance_matrix)
**プラン制限**: Business以上

```typescript
interface PerformanceMatrixData {
  matrix: {
    ai_strong_seo_strong: number;
    ai_strong_seo_weak: number;
    ai_weak_seo_strong: number;
    ai_weak_seo_weak: number;
  };
  top_performers: {
    url: string;
    combined_score: number;
  }[];
}
```

**UI表示内容**:
- 2×2 ヒートマップ（AI強/弱 × SEO強/弱）
- 各象限のURL数
- クリックで詳細URL一覧表示
- Top 5 パフォーマーリスト

### 3. SEO Metrics Overview Card
**表示位置**: ダッシュボード右上
**API**: `GET /api/analytics/seo/gsc` (metrics)
**プラン制限**: Business以上

```typescript
interface SEOMetricsData {
  total_impressions: number;
  total_clicks: number;
  average_ctr: number;
  average_position: number;
  period_comparison: {
    impressions_change: number;
    clicks_change: number;
  };
}
```

**UI表示内容**:
- インプレッション数（45,670）
- クリック数（1,234）
- 平均CTR（2.7%）
- 平均掲載順位（12.5位）
- 前期比変化率

### 4. Top Queries & Pages Card
**表示位置**: ダッシュボード中央右
**API**: `GET /api/analytics/seo/gsc` (top_queries, top_pages)
**プラン制限**: Business以上

```typescript
interface TopQueriesData {
  top_queries: {
    query: string;
    impressions: number;
    clicks: number;
    position: number;
  }[];
  top_pages: {
    url: string;
    impressions: number;
    ai_score?: number; // 相関表示用
  }[];
}
```

**UI表示内容**:
- Top 5 検索クエリリスト
- Top 5 パフォーマンスページ
- 各項目にAIスコアも併記
- タブ切り替え（Queries/Pages）

### 5. Optimization Opportunities Card
**表示位置**: ダッシュボード下部
**API**: `GET /api/analytics/ai/combined` (insights.optimization_opportunities)
**プラン制限**: Business以上

```typescript
interface OptimizationData {
  ai_boost_needed: {
    count: number;
    urls: string[];
    potential_impact: string;
  };
  seo_boost_needed: {
    count: number;
    urls: string[];
    potential_impact: string;
  };
  content_quality_check: {
    count: number;
    urls: string[];
  };
}
```

**UI表示内容**:
- 3つの最適化機会カテゴリ
- 各カテゴリの対象URL数
- 期待効果の説明
- アクションボタン（「詳細分析」「改善提案」）

### 6. AI × SEO Trend Chart Card
**表示位置**: ダッシュボード下部中央
**API**: `GET /api/analytics/ai/combined` (trend_analysis)
**プラン制限**: Business以上

```typescript
interface TrendChartData {
  trend_data: {
    date: string;
    ai_avg_score: number;
    seo_avg_position: number;
    correlation_daily: number;
  }[];
  insights: {
    ai_trend: 'improving' | 'declining' | 'stable';
    seo_trend: 'improving' | 'declining' | 'stable';
  };
}
```

**UI表示内容**:
- デュアル軸チャート（AI Score & SEO Position）
- 相関係数の日別推移
- トレンドインサイト
- 期間選択（7日/30日/90日）

## フィーチャーフラグ拡張

### feature_registry 追加エントリ
```sql
INSERT INTO feature_registry (feature_key, display_name, category, control_type, is_active) VALUES
('ai_seo_correlation', 'AI × SEO 相関分析', 'analytics', 'on_off', true),
('gsc_integration', 'Google Search Console連携', 'integrations', 'on_off', true);
```

### plan_features 更新
```sql
-- Business のみ: Phase 3 機能有効
INSERT INTO plan_features (plan_type, feature_key, config_value) VALUES
('business', 'ai_seo_correlation', '{"enabled": true}'),
('business', 'gsc_integration', '{"enabled": true}');

-- Pro 以下: Phase 3 機能無効
INSERT INTO plan_features (plan_type, feature_key, config_value) VALUES
('pro', 'ai_seo_correlation', '{"enabled": false}'),
('pro', 'gsc_integration', '{"enabled": false}'),
('starter', 'ai_seo_correlation', '{"enabled": false}'),
('starter', 'gsc_integration', '{"enabled": false}');
```

## インタラクション設計

### ドリルダウン機能
1. **相関スコアカード**: クリック → 散布図詳細ページ
2. **ヒートマップ**: 象限クリック → 該当URL一覧表示
3. **最適化機会**: カテゴリクリック → 具体的改善提案表示

### データ更新
- **手動更新**: 「GSCデータ収集」ボタン
- **自動更新**: 日次バッチ処理（管理者設定）
- **リアルタイム**: AI Botアクセスのみ

### エクスポート機能
- **PDF レポート**: 週次・月次サマリー
- **CSV エクスポート**: 詳細データ分析用
- **API アクセス**: 外部ツール連携

## アラート・通知

### 重要指標変化
- 相関スコアが±0.2以上変化
- 高パフォーマンスURLの順位急落
- AI Bot アクセス急増/急減

### 最適化提案
- SEO強×AI弱コンテンツの構造化データ不備検出
- AI強×SEO弱コンテンツのキーワード最適化提案
- 両方弱いコンテンツの品質改善アラート

## モバイル対応

### スマートフォン
- カード優先順位付き表示
- スワイプ可能カルーセル
- 簡略化グラフ

### タブレット
- 2カラムレイアウト
- 要素サイズ調整
- タッチ操作最適化

## Phase 4 拡張予定

### 競合分析
- 同業他社との相関比較
- 業界ベンチマーク表示

### AI 予測
- 将来の順位・アクセス予測
- 最適化効果シミュレーション

### 自動最適化
- 構造化データ自動生成
- SEOタイトル・説明文改善提案