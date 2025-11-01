# AI Visibility Dashboard Cards - Phase 2

## 新規追加カード構成

### 1. AI Visibility Score Overview Card
**表示位置**: ダッシュボード上部メインエリア
**API**: `GET /api/analytics/ai/visibility`
**プラン制限**: Pro以上

```typescript
interface OverviewCardData {
  overall_score: number;        // 73
  trend_direction: 'up' | 'down' | 'stable';  // +5pt from last week
  score_breakdown: {
    structured_data: number;    // 平均値
    ai_access: number;         // 平均値
    seo_performance: number;   // 平均値 (Phase 3まで固定50)
  };
  last_updated: string;
}
```

**UI表示内容**:
- 大きな数値表示（73pt）
- 前週比トレンド矢印
- 3要素の円グラフまたは棒グラフ
- 最終更新日時
- 「詳細分析」ボタン → 詳細ページへ

### 2. AI Content Performance Ranking Card
**表示位置**: ダッシュボード中央左
**API**: `GET /api/analytics/ai/visibility` (content_scores)
**プラン制限**: Pro以上

```typescript
interface ContentRankingData {
  top_content: {
    url: string;
    title: string;
    total_score: number;
    ai_bot_hits: number;
    unique_bots: number;
  }[];
  performance_summary: {
    excellent: number;    // スコア80+
    good: number;        // スコア60-79
    needs_improvement: number; // スコア<60
  };
}
```

**UI表示内容**:
- Top 5 コンテンツリスト
- 各項目: タイトル、スコア、Bot Hit数
- パフォーマンス分布（3段階色分け）
- 「全て表示」リンク

### 3. AI Visibility Trend Chart Card
**表示位置**: ダッシュボード中央右
**API**: `GET /api/analytics/ai/visibility` (score_trend)
**プラン制限**: Pro以上

```typescript
interface TrendChartData {
  trend_data: {
    date: string;
    score: number;
    total_urls: number;
  }[];
  period: string; // "過去30日"
}
```

**UI表示内容**:
- 折れ線グラフ（30日間のスコア推移）
- Y軸: スコア (0-100)
- X軸: 日付
- ホバーで詳細値表示
- 期間選択ドロップダウン（7日/30日/90日）

### 4. Score Calculation Status Card
**表示位置**: ダッシュボード下部
**API**: `POST /api/analytics/ai/recalculate` (status確認)
**プラン制限**: Pro以上

```typescript
interface CalculationStatusData {
  last_calculation: string;
  is_calculating: boolean;
  next_scheduled: string; // 自動計算予定時刻
  manual_trigger_available: boolean;
}
```

**UI表示内容**:
- 最終計算日時
- 計算状態インジケーター
- 「手動再計算」ボタン
- 進行中の場合はプログレスバー
- スケジュール情報

### 5. Improvement Suggestions Card
**表示位置**: ダッシュボード右サイド
**API**: `GET /api/analytics/ai/visibility` (analysis)
**プラン制限**: Business以上 (Advanced analytics)

```typescript
interface ImprovementSuggestionsData {
  suggestions: {
    type: 'structured_data' | 'ai_access' | 'seo';
    priority: 'high' | 'medium' | 'low';
    affected_urls: number;
    recommendation: string;
    expected_impact: number; // スコア向上予想値
  }[];
}
```

**UI表示内容**:
- 改善提案リスト（優先度順）
- 各提案の期待効果
- 影響するURL数
- アクションボタン（「詳細を見る」等）

## フィーチャーフラグ連携

### feature_registry エントリ
```sql
INSERT INTO feature_registry (feature_key, display_name, category, control_type, is_active) VALUES
('ai_visibility_analytics', 'AI Visibility Analytics', 'analytics', 'on_off', true),
('ai_visibility_advanced', 'AI Visibility Advanced Analytics', 'analytics', 'on_off', true);
```

### plan_features 設定
```sql
-- Starter: 基本分析のみ無効
INSERT INTO plan_features (plan_type, feature_key, config_value) VALUES
('starter', 'ai_visibility_analytics', '{"enabled": false}');

-- Pro: 基本分析有効
INSERT INTO plan_features (plan_type, feature_key, config_value) VALUES
('pro', 'ai_visibility_analytics', '{"enabled": true}'),
('pro', 'ai_visibility_advanced', '{"enabled": false}');

-- Business: 全機能有効
INSERT INTO plan_features (plan_type, feature_key, config_value) VALUES
('business', 'ai_visibility_analytics', '{"enabled": true}'),
('business', 'ai_visibility_advanced', '{"enabled": true}');
```

## レスポンシブ対応

### モバイル表示
- Overview Card: 簡略版（スコアと矢印のみ）
- Ranking Card: Top 3のみ表示
- Trend Chart: 小型グラフ、期間固定
- その他カード: タブ切り替え式

### デスクトップ表示
- 全カード同時表示
- グラフ詳細表示
- ホバーエフェクト
- サイドバーメニュー連携

## Phase 3 拡張予定

### GSC連携後の追加要素
- SEO Performance Card (実データ)
- AI vs SEO Correlation Chart
- Search Query Analysis
- 統合レポート機能

### エクスポート機能
- PDF レポート生成
- CSV データエクスポート
- 定期レポート配信設定