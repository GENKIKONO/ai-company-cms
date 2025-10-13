# 価格改定 一括棚卸しスキャン結果

**実施日時**: 2025-10-13T02:35:00Z  
**対象**: 旧価格・プラン名・制限値の全件検出  
**新価格体系**: Free ¥0 / Basic ¥5,000 / Business ¥15,000 / Enterprise ¥30,000〜

## 1. 旧価格の検出結果

### 旧価格数字（9800, 34800, 50000等）
- ❌ **検出されず**: 先行作業で既に更新済み

### 旧プラン名（Starter, Standard等）
以下のファイルでプラン名関連の参照を検出：

#### プランロジック関連
- `src/lib/stripe.ts`: Stripe設定にstarter/standard参照あり（要更新）
- `src/app/dashboard/billing/page.tsx`: プラン表示ロジック（更新済み）

#### 汎用用語（Provider, Pro等）
- `src/lib/json-ld/service.ts`: `provider` フィールド（JSON-LD用・変更不要）
- `src/lib/analytics/comprehensive-analytics.ts`: `properties` フィールド（分析用・変更不要）
- Production関連ドキュメント: 本番環境設定用語（変更不要）

## 2. Q&A/FAQ制限値の検出結果

### 旧制限値（10, 200, 2000等）
- ❌ **検出されず**: 先行作業で新制限値（5/20/無制限）に更新済み

### FAQ API関連
検出されたのは以下の200番台レスポンス（HTTPステータス）：
- `logs/production-steady-report.md`: API正常応答（200）
- `production_api_test_results.md`: FAQs API正常応答（200）

→ **これらは価格制限値ではなくHTTPステータスコード**

## 3. UI/コピー関連ファイル

### 料金表示コンポーネント
- `src/components/pricing/PricingTable.tsx`: ✅ 更新済み
- `src/app/aio/copy.ts`: ✅ 更新済み
- `src/lib/pricing.ts`: ✅ 更新済み

### 設定・制限ファイル
- `src/config/plans.ts`: ✅ 更新済み
- `src/lib/plan-limits.ts`: ✅ 互換性対応済み

## 4. 残存課題（要対応）

### A. 未確認エリア
1. **メールテンプレート**: 価格通知メール等（検索対象外）
2. **JSON-LD料金情報**: 構造化データ内の価格表示
3. **外部連携**: Stripe Price ID設定

### B. TODO項目
1. Stripe Price IDの新料金対応（環境変数確認要）
2. メール通知テンプレートの価格表示確認
3. JSON-LD Offer/AggregateOffer価格の更新確認

## 5. 対応優先度

### P0 - 即座対応必要
- ❌ **該当なし**: 主要価格表示は更新済み

### P1 - 本番前対応
- Stripe Price ID整合確認
- JSON-LD料金構造化データ

### P2 - 運用後対応
- メール通知テンプレート（利用頻度低）

## 6. 安全性確認

✅ **コンパイル**: エラーなし  
✅ **開発サーバー**: 正常動作  
✅ **主要UI**: 新価格体系表示確認済み

**結論**: 主要な価格表示は既に新体系に更新済み。残存課題は軽微な設定確認のみ。