# AIO Hub デザインシステム要件定義書

## 1. 目的

このドキュメントは、AIO Hub プロジェクトにおけるデザインの変更と拡張を統一的に管理するための要件定義書です。時間が経っても直書きスタイルによる技術債務を発生させず、一元的な色管理とコンポーネント管理を維持することを目的とします。

**このドキュメントは開発前に必ず読むこと。** AI による後続プロンプトでもこのファイルを必ず参照し、ここに定義されたルールに従って実装してください。

## 2. 現状の構成

### 2.1 セクション背景システム（最上流）

**AioSection コンポーネント** (`src/components/layout/AioSection.tsx`) がすべてのセクション背景の最上流です。

```tsx
<AioSection tone="white|muted|primary">
  {/* セクションコンテンツ */}
</AioSection>
```

**現状の3階調:**
- `tone="white"`: 白背景（メインコンテンツ用）
- `tone="muted"`: 薄いグレー背景（区切り・強調用）
- `tone="primary"`: プライマリカラー背景（CTA・重要セクション用）

**適用状況:** 6/7ページで適用済み（85.7%完了）
- ✅ src/app/page.tsx (I18nHomePage経由)
- ✅ src/app/pricing/page.tsx
- ✅ src/app/organizations/page.tsx  
- ✅ src/app/hearing-service/page.tsx
- ✅ src/app/aio/page.tsx
- ✅ src/app/about/page.tsx

### 2.2 カード要素システム

**aio-surface クラス** がすべてのカード要素の統一スタイルです。

```css
.aio-surface {
  background-color: var(--aio-surface);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
}
```

### 2.3 色管理システム（Semantic Tokens）

**主系統:** `src/styles/design-tokens.css` のsemantic tokens

```css
/* Semantic layer - AIO specific tokens */
--aio-primary: var(--color-primary);
--aio-muted: var(--color-muted);
--aio-surface: #ffffff;
```

**物理色トークン（例外として残存）:**
```css
/* Physical palette */
--color-primary: #0066cc;
--color-muted: #f8f9fa;
--bg-primary: #007AFF;  /* ←HIGButton等で使用中 */
```

## 3. 変更してよい場所

### 3.1 セマンティックトークンの変更（推奨）

✅ **全ページ一括変更**
```css
/* src/styles/design-tokens.css */
--aio-primary: #10b981; /* 緑色に変更 */
```

✅ **新しいAioSectionセクションの追加**
```tsx
<AioSection tone="muted">
  <section className="section-spacing">
    {/* 新コンテンツ */}
  </section>
</AioSection>
```

✅ **aio-surfaceカードの追加**
```tsx
<div className="aio-surface">
  {/* カードコンテンツ */}
</div>
```

### 3.2 レイアウト変更の範囲

✅ **section-spacing, max-w-*, mx-auto, px-* などのユーティリティクラス**
✅ **テキストサイズ、余白調整**
✅ **既存AioSectionのtone値変更**

## 4. 変更してはいけない場所

### 4.1 直書きスタイルの禁止

❌ **各ページでの背景色直書き**
```css
/* 禁止例 */
.some-section {
  background: #ffffff;
  background-color: #f5f5f5;
}
```

❌ **Tailwindの背景クラス直書き**
```tsx
{/* 禁止例 */}
<section className="bg-white bg-gray-50">
```

❌ **HEX値の直接指定**
```css
/* 禁止例 */
color: #007AFF;
background: #0066cc;
```

### 4.2 トークン管理の禁止行為

❌ **存在しないトークン名の作成**
```css
/* 禁止例 */
--aio-danger: #ff0000;
--custom-blue: #1234ff;
```

❌ **複数ファイルでの色定義**
```css
/* 他のCSSファイルでの色定義は禁止 */
```

## 5. 今後の色変更の手順

### ブランドカラーを緑や別色に変更する場合の推奨手順：

#### ① セマンティックトークンを一時変更してプレビュー

```css
/* src/styles/design-tokens.css */
--aio-primary: #10b981; /* 仮の緑色 */
```

この変更で、AioSectionを使用している全6ページの背景色が一括変更されます。

#### ② プレビューで崩れた場所を確認

**予想される影響箇所:**
- HIGButton のプライマリボタン (src/components/ui/HIGButton.tsx)
- モバイルナビゲーション (src/components/MobileNav.tsx)
- about ページのテキスト色 (src/app/about/page.tsx)

#### ③ 崩れた場所の段階的semantic化

**HIGButton の例:**
```css
/* 変更前 */
'bg-[var(--bg-primary)]'

/* 変更後 */
'bg-[var(--aio-primary)]'
```

#### ④ 物理色トークンの整理

最後に不要になった物理色トークンを整理します：
```css
/* 整理対象 */
--bg-primary: #007AFF;  /* 使用箇所がなくなった場合 */
--color-primary: #0066cc;
```

## 6. まだモジュール化されていない場所

### 6.1 複雑レイアウト（慎重対応必須）

**src/app/about/page.tsx - Hero セクション**
- absolute背景システムとAioSectionの併用状態
- `<div className="absolute inset-0" style={{backgroundColor: 'var(--color-muted)'}} />`
- z-index競合リスクがあるため慎重な扱いが必要

### 6.2 物理色が残存している場所（人間確認必須）

**src/components/ui/HIGButton.tsx**
- 7箇所で --bg-primary を使用
- ボタンの見た目は画面確認しながら調整する領域
- **自動変換禁止**

**src/components/MobileNav.tsx**  
- 3箇所で --bg-primary を使用
- モバイルナビゲーションの視認性に関わる
- **自動変換禁止**

**src/app/about/page.tsx**
- 2箇所で --color-primary を使用
- テキスト色の視認性確認が必要
- **自動変換禁止**

### 6.3 例外的なコンポーネント

**ApplePricingPlans.tsx**
- 古いデザインシステムが残存している可能性
- 人間確認が必要

## 7. 運用ルール

### 7.1 開発前の確認事項

1. **このドキュメントを必ず読む**
2. **AioSectionパターンが使えないか検討する**
3. **新しい色が必要な場合はsemantic化する**
4. **物理色の直書きは避ける**

### 7.2 AI プロンプトでの参照

```
AI への指示例：
「DESIGN_SYSTEM.md の現状ルールに従って実装してください。
特に以下に注意：
- AioSection を最優先で使用
- 色の直書きは禁止
- HIGButton / MobileNav は自動変換しない」
```

### 7.3 コードレビュー時のチェックポイント

- [ ] 新しい背景色がAioSectionで実装されているか
- [ ] HEX値の直書きがないか  
- [ ] 未定義のトークン名を作成していないか
- [ ] 例外領域（HIGButton等）を自動変更していないか

### 7.4 色変更時の影響範囲

**低リスク（推奨）:**
- src/styles/design-tokens.css のsemantic tokens変更

**中リスク（人間確認必須）:**
- HIGButton, MobileNav の色調整

**高リスク（避ける）:**
- 各ページでの個別色指定
- 物理色トークンの直接変更

---

## 8. 構造モジュール化（プランと機能）- フェーズ1完了

### 8.1 目的

デザインをAioSection / aio-surfaceでモジュール化したのと同じように、「料金プランと機能の対応」も1か所に寄せて、あとからプランを増やしても各ページをバラバラに直さなくていいようにする。

各ページに機能を"直書き"していたのをやめ、`src/config/plans.ts` を中心に読ませる構造に寄せる。

今回は「UI・APIのごく浅い層だけ」反映して、安全に様子を見るフェーズ。

### 8.2 完了している範囲（フェーズ1でやったこと）

#### 重複ファイルの整理
- src/lib/plan-limits.ts を削除し、参照していたファイルをすべて src/config/plans.ts に寄せた
- 対象ファイル（importを書き換えたもの）:
  - src/app/api/my/faqs/route.ts
  - src/app/dashboard/components/AnalyticsDashboard.tsx  
  - src/app/api/my/case-studies/route.ts
  - src/app/api/diag/billing/route.ts
  - src/app/api/my/posts/route.ts
  - src/app/dashboard/services-info/page.tsx

#### デフォルトプラン名の表層修正
UIや軽いAPI層でハードコードされていた 'free' を 'trial' に揃えた。
- src/app/api/my/services/route.ts:118
- src/lib/subscriptions.ts:86
- tests/global-setup.ts:194
- tests/e2e/blog-plan-restrictions.spec.ts

**注意:** DBやStripeではまだ旧プラン名が残っているので注意。

#### config中心への一本化
- src/config/plans.ts を「プラン定義の正」として扱う前提にした
- ここに料金・機能・制限チェックの情報を集めていく方針

#### 表示コンポーネントでの旧チェックの是正
- src/components/pricing/PricingTable.tsx で `plan.id !== 'free'` のような古い条件があったので、`config/plans.ts` の `isPaidPlan()` を使う形に変更
- プラン名の直書きチェックを排除

### 8.3 まだやっていないこと（意図的に保留しているもの）

#### DBスキーマは変更していない
- src/lib/schemas/organization.ts の `z.enum(['free','basic','pro'])` はDB側の制約や既存データと直結しているので、このフェーズでは触っていない
- Supabaseのマイグレーションファイルも未変更

#### Stripe連携は変更していない
- src/app/api/stripe/webhook/route.ts / src/lib/stripe.ts / src/lib/subscriptions.ts にある旧プラン名は"受け口として"一旦残している
- これらは「本番の決済設定や既存サブスクを実機で確認してからやる」フェーズ2以降の作業

#### 旧プラン名の完全除去はしていない
- テスト・Webhook・マイグレーションの一部には旧プラン名がまだ存在する
- "見つけたら消す"ではなく、"マッピングしてから消す"方針

### 8.4 なぜフェーズを分けたか

デザインのモジュール化（AioSection化）はUIだけで完結したので一気にできたが、プラン名は**DB・Stripe・外部サービスに波及する**ため、一気にやるとロールバックが重くなる。

そのため「UI層だけを先に新しい考え方に寄せておく」中間フェーズを作った。

これにより、今後「プランを1つ増やす／名前を変える／機能を再配分する」といった変更をするときに、まずは config/plans.ts から手をつけられる状態になっている。

### 8.5 将来の作業（フェーズ2・3の予告）

- **フェーズ2:** Stripe/API層に「旧→新プラン名」のマッピング関数を入れていく（**要・人間確認**）
- **フェーズ3:** DBスキーマを新プラン名に寄せる（**本番バックアップ必須**）
- ここまで来てはじめて「旧プラン名をコードベースから物理的に削除してよい」

### 8.6 運用ルール（重要）

#### プラン変更時の作業手順
今後「新しいプランを追加する／既存プランの機能を変える」ときは **必ず src/config/plans.ts を先に編集する**。

#### ページ側での禁止事項
各ページ（/pricing, /hearing-service, /organizations）は、**プラン定義を"見る側"であって定義する場所ではない**。

ここに違反してページ側に直書きした場合は、今回のモジュール化の前提が壊れる。

#### 確認すべき場所
- PLAN_LIMITS: 機能制限の定義
- PLAN_FEATURES: プラン機能一覧
- PLAN_PRICES: 価格定義
- isPaidPlan(): 有料プラン判定ユーティリティ

### 8.7 機能レジストリ

#### 機能の一元管理
機能は src/config/features.ts に一元管理する。すべての機能は FeatureId として定義され、カテゴリ・ラベル・説明を持つ。

#### プランからの参照
プランは src/config/plans.ts の PLAN_FEATURE_MAP からこの機能を参照する。プラン側に機能を直書きせず、必ず features.ts 経由で参照する。

#### 表示コンポーネントでの禁止事項
表示コンポーネントはこの2つを勝手に書き換えない。機能追加・変更時は手での確認を必須にする。

#### 機能ステータスの運用ルール
- statusがplannedの機能はUIに出してはいけない
- 対象のUIは / (トップ), /pricing, /organizations, /hearing-service の4ページ
- 表示コンポーネントで機能を直書きしている場合は、features.tsにまだ無いだけかどうかを先に確認すること
- 将来statusをstableにしたら、そのときにだけUIを増やす

### 8.8 機能表示ロジック

#### 関数概要
**関数名:** `getVisibleFeaturesForPlan(planId: PlanType)`  
**目的:** features.ts と plans.ts の定義に基づいて、表示してよい機能だけを返す

#### フィルタリングルール
1. PLAN_FEATURE_MAP[planId] に存在しないIDはスキップ
2. features.ts に status が 'planned' または 'deprecated' のものは返さない
3. status が 'stable' のもののみ UI に表示できる

#### 使用対象ページ
- /pricing
- /organizations  
- /hearing-service
- /

#### 運用上の注意事項
- 表示側コンポーネント内に機能を直書きしない
- features.ts に未登録の機能は追加前に人間確認を行う
- Stripe や DB のプラン名はこの関数に影響しない

---

**最終更新:** 2024年 モジュール化完了時  
**責任者:** 開発チーム全員  
**更新時は必ずこのドキュメントを同時更新すること**