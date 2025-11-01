# Phase 3: SEO Integration & AI×SEO 相関分析 ダッシュボードUI設計

## 📍 新規ページ: `/dashboard/analytics/ai-seo-report`

### レイアウト構成

```
┌─────────────────────────────────────────────────────────────────┐
│ AI × SEO 相関分析レポート                              📊        │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│ │ 1. 相関スコア    │ │ 2. SEOサマリー   │ │ 3. データ更新    │     │
│ │ Card            │ │ Card            │ │ Card            │     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 4. パフォーマンスマトリックス ヒートマップ                    │ │
│ │ (2×2 Grid: AI強/弱 × SEO強/弱)                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│ │ 5. Top Queries   │ │ 6. Top Pages    │ │ 7. トレンド      │     │
│ │ & Pages         │ │ Performance     │ │ チャート        │     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 8. 最適化機会 & 推奨アクション                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 各カードの詳細仕様

### 1. AI × SEO 相関スコア Card
**API**: `GET /api/analytics/ai/combined`
**プラン制限**: Business以上

```typescript
interface CorrelationScoreCard {
  correlation_score: number;        // 0.73
  correlation_strength: string;     // "strong"
  sample_size: number;             // 42
  trend_direction: 'up' | 'down' | 'stable';
}
```

**UI表示**:
- 大きな相関スコア表示（0.73）
- 相関強度ラベル（Strong Correlation）
- 散布図（AI Score vs SEO Position）
- サンプルサイズ表示
- 前期比トレンド矢印

### 2. SEO メトリクス概要 Card
**API**: `GET /api/analytics/seo/gsc`
**プラン制限**: Business以上

```typescript
interface SEOSummaryCard {
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

**UI表示**:
- インプレッション数（45,670）
- クリック数（1,234）
- 平均CTR（2.7%）
- 平均掲載順位（12.5位）
- 前期比変化率（緑・赤のアイコン）

### 3. データ更新ステータス Card
**機能**: GSCデータ手動収集

**UI表示**:
- 最終更新日時
- 「GSCデータ収集」ボタン
- 進行状況インジケーター
- 次回自動更新予定時刻

### 4. パフォーマンスマトリックス ヒートマップ
**API**: `GET /api/analytics/ai/combined` (performance_matrix)

```typescript
interface PerformanceMatrix {
  ai_strong_seo_strong: ContentItem[];
  ai_strong_seo_weak: ContentItem[];
  ai_weak_seo_strong: ContentItem[];
  ai_weak_seo_weak: ContentItem[];
}
```

**UI表示**:
- 2×2 ヒートマップ
- 各象限のURL数と代表例
- クリックで詳細URL一覧ポップアップ
- 色分け（緑=好調、赤=要改善）

### 5. Top Queries & Pages Card
**API**: `GET /api/analytics/seo/gsc` + `GET /api/analytics/ai/combined`

**UI表示**:
- Top 5 検索クエリリスト
- Top 5 パフォーマンスページ
- 各項目にAIスコアも併記
- タブ切り替え（Queries/Pages）

### 6. Top Pages Performance Card
**API**: `GET /api/analytics/ai/combined` (performance_matrix)

**UI表示**:
- Combined Score 順のページランキング
- AI Score / SEO Position / Combined Score
- パフォーマンスカテゴリアイコン
- 詳細ページリンク

### 7. AI×SEO トレンドチャート Card
**API**: `GET /api/analytics/ai/combined` (trend_analysis)

```typescript
interface TrendChart {
  trend_data: {
    date: string;
    ai_avg_score: number;
    seo_avg_position: number;
    correlation_daily: number;
  }[];
}
```

**UI表示**:
- デュアル軸チャート（AI Score & SEO Position）
- 相関係数の日別推移線
- 期間選択（7日/30日/90日）

### 8. 最適化機会 & 推奨アクション Card
**API**: `GET /api/analytics/ai/combined` (insights)

```typescript
interface OptimizationOpportunities {
  ai_boost_needed: string[];     // SEO良い、AI弱い
  seo_boost_needed: string[];    // AI良い、SEO弱い
  content_quality_check: string[]; // 両方弱い
}
```

**UI表示**:
- 3つの最適化カテゴリ
- 各カテゴリの対象URL数
- 具体的なアクション提案
- 「詳細分析」「改善提案」ボタン

---

## 🎨 デザインシステム連携

### カラーパレット
- **AI強**: `var(--aio-success)` (緑)
- **SEO強**: `var(--aio-primary)` (青)
- **両方強**: `var(--aio-success-light)` (薄緑)
- **要改善**: `var(--aio-warning)` (オレンジ)
- **両方弱**: `var(--aio-error)` (赤)

### アイコン
- 📊 相関分析
- 🔍 SEO データ
- 🤖 AI データ
- ⚡ パフォーマンス
- 📈 トレンド
- 🎯 最適化機会

### レスポンシブ対応
**モバイル (< 768px)**:
- 1列レイアウト
- カードのスタック表示
- 簡略化グラフ
- タブ切り替えでコンテンツ整理

**タブレット (768px - 1024px)**:
- 2列レイアウト
- メインカードは横幅100%
- サイドカードは50%ずつ

**デスクトップ (> 1024px)**:
- 3列レイアウト
- 全カード同時表示

---

## 🚀 実装コンポーネント例

### React コンポーネント構成

```typescript
// /dashboard/analytics/ai-seo-report/page.tsx
export default function AISEOReportPage() {
  return (
    <DashboardLayout>
      <AISeoDashboard />
    </DashboardLayout>
  );
}

// components/dashboard/ai-seo/AISeoDashboard.tsx
export function AISeoDashboard() {
  const { data, isLoading } = useAISeoAnalytics(orgId);
  
  return (
    <div className="dashboard-grid">
      <CorrelationScoreCard data={data?.ai_seo_correlation} />
      <SEOSummaryCard orgId={orgId} />
      <DataUpdateCard orgId={orgId} />
      <PerformanceMatrixCard data={data?.performance_matrix} />
      <TopQueriesPagesCard orgId={orgId} />
      <TopPagesPerformanceCard data={data?.performance_matrix} />
      <TrendChartCard data={data?.trend_analysis} />
      <OptimizationOpportunitiesCard data={data?.insights} />
    </div>
  );
}
```

### カスタムフック

```typescript
// hooks/useAISeoAnalytics.ts
export function useAISeoAnalytics(orgId: string, options?: {
  trendDays?: number;
  refreshInterval?: number;
}) {
  return useSWR(
    `/api/analytics/ai/combined?org_id=${orgId}&trend_days=${options?.trendDays || 30}`,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 5 * 60 * 1000, // 5分
    }
  );
}

// hooks/useGSCData.ts
export function useGSCData(orgId: string) {
  return useSWR(
    `/api/analytics/seo/gsc?org_id=${orgId}`,
    fetcher
  );
}
```

---

## 📊 データフロー

```
1. ユーザーがページアクセス
2. useAISeoAnalytics が API 呼び出し
3. /api/analytics/ai/combined が統合分析実行
4. ai_visibility_scores + seo_search_console_metrics + ai_bot_logs 結合
5. 相関分析・4象限分類・インサイト生成
6. リアルタイムでダッシュボード更新
```

---

## 🔧 技術スタック

- **UI**: React + TypeScript
- **スタイリング**: CSS Modules + デザインシステム変数
- **データ取得**: SWR
- **チャート**: Chart.js / Recharts
- **ヒートマップ**: D3.js / カスタム実装
- **状態管理**: React Query / SWR

---

## 🎯 Phase 4 拡張予定

### 高度な分析機能
- **競合分析**: 同業他社との相関比較
- **AI予測**: 将来のランキング・トラフィック予測
- **自動最適化**: 構造化データ自動生成提案

### エクスポート機能
- **PDF レポート**: 週次・月次サマリー
- **CSV エクスポート**: 詳細データ分析用
- **API アクセス**: 外部ツール連携

これで Phase 3 の完全な実装ガイドが完成しました。