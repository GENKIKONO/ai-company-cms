# AIO Hub 価格統一 - 未対応事項リスト

## 🚨 Supabase 関連（DB復旧後の対応が必要）

### データベーステーブルの更新
- [ ] **organizations テーブル**: プランカラムの値を新しいプラン名に統一
  - `plan` カラム: 'basic' → 'starter' への移行
  - 既存データの migration が必要
- [ ] **subscriptions テーブル**: アクティブな subscription の plan_type 更新  
- [ ] **stripe_products テーブル**: 新しい price_id との整合性確認

### RLS ポリシーの更新
- [ ] プラン名変更に伴う policy 条件の修正
- [ ] 新しい unified-plans.ts を参照する authorization logic の実装

## 🔴 Stripe 本番環境対応（要注意：実際の請求に影響）

### 既存商品の価格修正
- [ ] **CRITICAL**: Starter プラン商品の価格更新
  - 現在の Stripe 商品: ¥5,000
  - 正しい価格: ¥2,980
  - **年間 ¥24,240 × 契約数の差額が発生中**
- [ ] 既存顧客の subscription price 移行計画
- [ ] 新旧価格での請求期間の調整

### 環境変数・設定確認
- [ ] **STRIPE_MONTHLY_PRICE_ID**: 古い price_id が設定されている可能性
- [ ] **STRIPE_SETUP_FEE_PRODUCT_ID**: 商品IDの確認
- [ ] webhook endpoint の price_id 参照部分のチェック

### 実際の商品作成（本番）
```typescript
// 現在はコメントアウト状態 - 本番で有効化する際の手順
// 1. STRIPE_SAFE_MODE=false に変更
// 2. createAIOHubProducts() のコメントアウト解除  
// 3. 新しい価格で商品作成実行
// 4. 生成された price_id を環境変数に設定
```

## 🟡 設定ファイルの残存課題

### 旧設定ファイルの段階的廃止
- [ ] **src/app/aio/copy.ts**: 価格情報の重複削除
  ```typescript
  // pricing セクションの価格数字を unified-plans.ts 参照に変更
  // 現在: ハードコード価格が残存
  ```
- [ ] **src/config/hearing-service.ts**: 価格設定の統一検討
  - 独自サービス価格 vs 基本プラン価格の関連性整理
- [ ] **src/lib/pricing.ts**: 完全な wrapper 化
  - PRICING_CONFIG の廃止検討

### 参照関係の完全移行
- [ ] 全ファイルで `PLAN_PRICES` → `UNIFIED_PRICES` への移行完了確認
- [ ] import 文の統一（どのファイルをソースにするか明確化）

## 🔵 監視・テスト基盤

### 価格整合性の自動チェック
- [ ] **CI/CD パイプライン**: 価格不整合検出テストの追加
- [ ] **本番監視**: 表示価格 vs Stripe価格の定期チェック
- [ ] **アラート設定**: 価格差異検出時の通知

### E2E テストでの価格確認
- [ ] 決済フロー全体での価格整合性テスト
- [ ] 表示価格とStripe checkout価格の一致確認
- [ ] JSON-LD 構造化データの価格検証

## 📊 運用・マーケティング関連

### 既存顧客への影響調査  
- [ ] 現在 ¥5,000 で課金されている顧客数の特定
- [ ] 差額返金 or 次期請求での調整方針
- [ ] 顧客への説明・お詫び文の準備

### 料金ページの更新確認
- [ ] LP (aio/page.tsx) の価格表示確認
- [ ] 料金表コンポーネントでの整合性確認  
- [ ] マーケティング資料での価格統一

## 🛠️ 技術的負債の解消

### TypeScript型安全性の向上
- [ ] PlanType の strict typing 強化
- [ ] price 関連の number vs string 型の統一
- [ ] nullable price の適切な handling

### エラーハンドリング改善
- [ ] 価格取得失敗時のfallback処理
- [ ] Stripe API呼び出し失敗時の適切なエラー表示
- [ ] 開発環境での mock data の充実

## 📋 確認済み・対応済み事項

### ✅ 今回対応完了
- [x] `/src/config/unified-plans.ts` 作成（価格の単一ソース確立）
- [x] `src/lib/stripe.ts` 価格修正（5000→2980）
- [x] `src/app/aio/page.tsx` JSON-LD動的化
- [x] `src/app/hearing-service/page.tsx` JSON-LD動的化  
- [x] Stripe safe mode 実装（誤作成防止）
- [x] 価格整合性テスト作成

### ⚠️ 重要な注意事項
1. **Stripe実API**: 現在すべてsafe mode（モック）状態
2. **データベース**: Supabase復旧まで触らない
3. **本番価格**: ¥2,980が正しい starter プラン価格
4. **緊急度**: 誤徴収防止のため Stripe 価格修正は最優先

---

## 🎯 推奨対応順序

### Phase 1: 緊急対応
1. Stripe 本番価格修正（¥5,000→¥2,980）
2. 既存顧客への差額調整
3. 環境変数の price_id 更新

### Phase 2: Supabase 復旧後
1. データベーステーブル更新
2. RLS ポリシー修正  
3. E2E テスト実行

### Phase 3: 技術改善
1. 旧設定ファイル廃止
2. 監視・アラート設定
3. 型安全性向上