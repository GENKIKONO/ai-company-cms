# 例外許容リスト（Exceptions Allowlist）

> **Phase 18 で新規作成**: 2024-12-28
> **正本:** このドキュメントは Check 10/11 の例外ファイルの単一ソースです。
> **CI連携:** `npm run check:architecture` の Check 10/11/14 がこのファイルを参照します。

---

## 概要

このドキュメントは、以下の例外を機械可読形式で管理します：

| Check | 対象 | 説明 |
|-------|------|------|
| Check 10 | プラン名分岐 | `plan === 'xxx'` 等の直接分岐 |
| Check 11 | feature_flags直読み | `org.feature_flags[...]` 等の直接アクセス |

**原則:**
- 例外は **削減の方向** で管理
- 新規追加は **Check 14 で検知** され、BASELINE更新が必要
- 各エントリには **reason/remove_when/review_by** が必須

---

## Check 10: プラン名分岐の許容ファイル

以下のファイルのみ、プラン名での直接分岐（`plan === 'xxx'` 等）が許可されます。

<!-- PLAN_BRANCH_ALLOWLIST_START -->
- src/app/management-console/users/page.tsx
  reason: "管理画面 - プラン切替UI"
  remove_when: "管理画面がfeatureGate対応したら"
  review_by: "2026-06-30"
- src/app/api/oem/keys/route.ts
  reason: "OEM - レート制限ロジック"
  remove_when: "OEMがfeatureGate対応したら"
  review_by: "2026-06-30"
- src/app/api/billing/checkout-segmented/route.ts
  reason: "Stripe連携 - ユーザー入力バリデーション"
  remove_when: "不可（Stripe連携の制約）"
  review_by: "2026-06-30"
- src/config/plans.ts
  reason: "プラン定義の正本"
  remove_when: "不可（正本定義）"
  review_by: "2026-06-30"
- src/config/features.ts
  reason: "機能定義の正本"
  remove_when: "不可（正本定義）"
  review_by: "2026-06-30"
- src/app/organizations/page.tsx
  reason: "表示用途のみ（バッジスタイル/ソート重み）"
  remove_when: "不可（表示ロジック、featureGateでは代替不可）"
  review_by: "2026-06-30"
<!-- PLAN_BRANCH_ALLOWLIST_END -->

### 置換不可の理由（2024-12確認）

| ファイル | 理由 |
|---------|------|
| `organizations/page.tsx` | ソート重み・CSSスタイル・表示名は機能アクセス制御ではない |
| `api/billing/checkout-segmented/route.ts` | Stripeチェックアウトのユーザー入力バリデーション |
| `config/plans.ts`, `config/features.ts` | 正本定義ファイル |

---

## Check 11: feature_flags直読みの許容ファイル

> **ファイル単位の例外: なし（完全撤廃済み）**

2024-12時点で、feature_flags直読みのファイル単位例外は完全に撤廃されています。

ディレクトリ単位の除外（内部実装用）のみ存在:
- `lib/org-features/` - 内部実装
- `lib/featureGate.ts` - 正本
- `types/` - 型定義

<!-- FEATURE_FLAGS_ALLOWLIST_START -->
<!-- 現在、ファイル単位の例外はありません -->
<!-- FEATURE_FLAGS_ALLOWLIST_END -->

---

## 新規例外の追加手順

1. **まず正規パターンで対応できないか検討**
   - Check 10: `featureGate.getEffectiveFeatures` で対応可能か
   - Check 11: `featureGate` 経由で対応可能か

2. **どうしても必要な場合**
   - このドキュメントの該当ブロックにエントリを追加
   - **reason**: なぜ正規パターンでは対応できないか
   - **remove_when**: 撤去条件（「不可」の場合はその理由）
   - **review_by**: 次回レビュー期限（YYYY-MM-DD）
   - PRレビューで承認を得る
   - Check 14 が FAIL するため、BASELINE更新をレビュアーに依頼

3. **BASELINE更新（レビュアー/管理者）**
   - `scripts/check-architecture.sh` の該当 BASELINE 値を更新
   - 増加理由をコミットメッセージに明記

---

## Check 15: デザイントークン例外 (blue-* パターン)

> **Phase 3 (PR7-D) で追加**: 2024-12-29
> **Phase 4 (PR7-E) で機械可読化**: 2024-12-29

以下のblue-*パターンは、セマンティックトークン（`--aio-*`）への置換対象外として維持します。

### 例外カテゴリ

| カテゴリ | パターン例 | 理由 |
|---------|-----------|------|
| **chart** | `bg-blue-400/500` | データ可視化の色一貫性（グラフバー、プログレスバー） |
| **status** | `text-blue-600 bg-blue-50` | ステータスバッジ（info相当、他色との対称性） |
| **decorative** | `from-blue-600 via-purple-600` | グラデーション装飾（デザイン意図が明確） |
| **icon** | `text-blue-500/600` | アイコン強調色（視認性確保） |
| **pricing** | `border-blue-400` | プレミアムプラン強調（料金表UI） |
| **partners** | `bg-blue-600` | パートナーページブランドカラー |

### 機械可読許容リスト

<!-- BLUE_EXCEPTIONS_START -->
- src/app/admin/metrics/components/charts/AiCitationsChart.tsx: category=chart reason="AI引用チャートのバー色" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/admin/metrics/components/charts/AlertEventsChart.tsx: category=chart reason="アラートイベントチャートのバー色" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/admin/metrics/components/charts/RlsDeniedWeeklyChart.tsx: category=chart reason="RLS拒否チャートのバー色" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/admin/metrics/components/charts/SecurityIncidentsChart.tsx: category=chart reason="セキュリティチャートのバー色" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/admin/metrics/components/MetricsCharts.tsx: category=chart reason="メトリクスチャート補足テキスト" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/components/admin/EmbedRealtimeStats.tsx: category=chart reason="リアルタイム統計チャート" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/components/admin/EmbedUsageChart.tsx: category=chart reason="使用量チャート" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/components/admin/EmbedTopSources.tsx: category=chart reason="ソース統計チャート" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/components/analytics/AIVisibilityReport.tsx: category=chart reason="AI可視性スコアバー" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/components/analytics/StructuredDataScore.tsx: category=chart reason="構造化データスコアバー" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/ops/analytics/page.tsx: category=chart reason="運用分析チャート" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/admin/translations/analytics/page.tsx: category=chart reason="翻訳分析プログレスバー" remove_when="不可(データ可視化)" review_by="2026-06-30"
- src/app/admin/translations/page.tsx: category=status reason="翻訳ステータスバッジ" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/admin/reviews/components/ReviewHistory.tsx: category=status reason="レビューステータスバッジ" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/admin/console/AlertsPanel.tsx: category=status reason="アラートinfo状態" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/admin/console/SummaryCards.tsx: category=icon reason="サマリーアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/app/admin/console/SchemaDiffPanel.tsx: category=status reason="実行中ステータス" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/admin/console/JobsPanel.tsx: category=status reason="ジョブ統計表示" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/admin/news/page.tsx: category=status reason="選択状態" remove_when="不可(UI状態)" review_by="2026-06-30"
- src/components/admin/TranslationStatusWidget.tsx: category=icon reason="翻訳アイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/components/admin/EmbeddingStatusWidget.tsx: category=icon reason="埋め込みアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/components/admin/FeatureMatrixRow.tsx: category=status reason="コンテンツカテゴリ色" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/admin/error-log-viewer.tsx: category=status reason="LOW severity" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/admin/SiteSettingsForm.tsx: category=decorative reason="グラデーション装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/admin/embeddings/page.tsx: category=icon reason="埋め込みアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/app/admin/console/ContentRefreshKpiCards.tsx: category=icon reason="KPIアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/components/pricing/PricingTable.tsx: category=pricing reason="プレミアムプラン強調" remove_when="不可(料金UI)" review_by="2026-06-30"
- src/components/aio/PricingSection.tsx: category=pricing reason="プラン枠線" remove_when="不可(料金UI)" review_by="2026-06-30"
- src/app/(public)/partners/page.tsx: category=partners reason="パートナーページブランドカラー" remove_when="不可(ブランドUI)" review_by="2026-06-30"
- src/app/(public)/partners/dashboard/page.tsx: category=partners reason="パートナーダッシュボード" remove_when="不可(ブランドUI)" review_by="2026-06-30"
- src/app/(public)/service/sections/ClosingCTA.tsx: category=decorative reason="CTAセクション装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/cms/GhostwriterInput.tsx: category=decorative reason="AIライター装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/cms/DynamicSection.tsx: category=decorative reason="ダイナミックセクション装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/dashboard/FirstTimeUserOnboarding.tsx: category=decorative reason="オンボーディング装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/LandingPage.tsx: category=decorative reason="ランディングページ装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/(public)/I18nHomePage.tsx: category=decorative reason="ホームページ装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/(public)/search/page.tsx: category=decorative reason="検索ページ装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/(public)/search/enhanced/page.tsx: category=status reason="検索タブ状態" remove_when="不可(UI状態)" review_by="2026-06-30"
- src/app/(public)/news/page.tsx: category=status reason="お知らせテキスト" remove_when="不可(ブランドUI)" review_by="2026-06-30"
- src/app/(public)/auth/signup/page.tsx: category=decorative reason="サインアップ装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/(public)/auth/forgot-password/page.tsx: category=decorative reason="パスワードリセット装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/(public)/contact/page.tsx: category=decorative reason="お問い合わせ装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/app/(public)/o/[slug]/case-studies/page.tsx: category=icon reason="タグアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/app/(public)/o/[slug]/case-studies/[id]/page.tsx: category=decorative reason="事例詳細装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/search/SearchResultCard.tsx: category=status reason="検索結果タグ" remove_when="不可(UI状態)" review_by="2026-06-30"
- src/components/ui/VerifiedBadge.tsx: category=icon reason="認証バッジアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/components/ui/loading.tsx: category=decorative reason="ローディングスピナー" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/ui/toast.tsx: category=status reason="infoトースト" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/dashboard/ui/DashboardAlert.tsx: category=status reason="ダッシュボードアラートinfo" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/dashboard/ui/DashboardBadge.tsx: category=status reason="ダッシュボードバッジ" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/dashboard/ai-reports/components/ReportSection.tsx: category=icon reason="レポートアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/app/dashboard/components/AIVisibilityCard.tsx: category=status reason="スコア表示色" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/app/dashboard/interview/[sessionId]/page.tsx: category=icon reason="インタビューアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/app/dashboard/analytics/interview/InterviewAnalyticsDashboard.tsx: category=icon reason="分析アイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/app/management-console/hearings/page.tsx: category=status reason="ヒアリングステータス" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/interview/ContentGenerationPanel.tsx: category=status reason="生成中ステータス" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/examples/InterviewSessionsRealtime.tsx: category=status reason="セッションステータス" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/quota/OrgQuotaBadge.tsx: category=status reason="クォータインジケータ" remove_when="不可(ステータス表示)" review_by="2026-06-30"
- src/components/aio/CTASection.tsx: category=decorative reason="CTAセクション装飾" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/qa/QAManager.tsx: category=icon reason="QAアイコン" remove_when="不可(アイコン色)" review_by="2026-06-30"
- src/components/header/ClientAuthHeader.tsx: category=decorative reason="ヘッダーボタン" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/components/header/DynamicHeader.tsx: category=decorative reason="ヘッダーボタン" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/design-system/components/UnifiedCTA.tsx: category=decorative reason="統一CTAコンポーネント" remove_when="不可(デザイン意図)" review_by="2026-06-30"
- src/config/hearing-service.ts: category=decorative reason="設定定義" remove_when="不可(設定)" review_by="2026-06-30"
<!-- BLUE_EXCEPTIONS_END -->

### Baseline

```
BLUE_EXCEPTIONS_BASELINE=64
```

> **Note**: 実際にblue-*を含むファイルは44件。allowlistエントリを削減可能（今後のタスク）。

---

## 関連ドキュメント

- [Auth直叩き許容リスト](../auth/auth-direct-calls-allowlist.md) - Auth例外の管理
- [設計境界（Boundaries）ガイド](./boundaries.md) - 境界ルールの全体像
- [レビューゲートガイド](./review-gates.md) - PRレビューの運用ルール
- [コアアーキテクチャ要件定義](../core-architecture.md) - CIガードレール一覧

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-12-28 | Phase 18 で新規作成（Check 10/11 whitelist を docs 正本化） |
| 2024-12-29 | Phase 20 で review_by 日付を 2026-06-30 に更新 |
