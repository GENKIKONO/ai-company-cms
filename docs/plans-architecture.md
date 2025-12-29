# プラン・機能アーキテクチャ

> **目的:** デザインと分離された「プラン・機能定義」の管理方針を定義

---

## 1. 概要

このドキュメントは、AIO Hub の料金プランと機能の管理方針を定義します。
デザインシステム（`DESIGN_SYSTEM.md`）とは独立して管理されます。

---

## 2. 正となるファイル

| ファイル | 内容 |
|---------|------|
| `src/config/plans.ts` | プラン定義・価格・制限 |
| `src/config/features.ts` | 機能定義・カテゴリ |

**重要:** 上記2ファイルが「正」であり、UIは常にここを参照します。

---

## 3. 構造モジュール化の経緯

### 3.1 フェーズ1（完了）

#### 完了した作業:

**重複ファイルの整理**
- `src/lib/plan-limits.ts` を削除し、参照していたファイルをすべて `src/config/plans.ts` に寄せた
- 対象ファイル:
  - src/app/api/my/faqs/route.ts
  - src/app/dashboard/components/AnalyticsDashboard.tsx
  - src/app/api/my/case-studies/route.ts
  - src/app/api/diag/billing/route.ts
  - src/app/api/my/posts/route.ts
  - src/app/dashboard/services-info/page.tsx

**デフォルトプラン名の表層修正**
- UIや軽いAPI層でハードコードされていた 'free' を 'trial' に揃えた
- 対象:
  - src/app/api/my/services/route.ts:118
  - src/lib/subscriptions.ts:86
  - tests/global-setup.ts:194
  - tests/e2e/blog-plan-restrictions.spec.ts

**注意:** DBやStripeではまだ旧プラン名が残っている

### 3.2 まだやっていないこと（意図的に保留）

- **DBスキーマは変更していない**
  - `src/lib/schemas/organization.ts` の `z.enum(['free','basic','pro'])` はDB側の制約や既存データと直結
  - Supabaseのマイグレーションファイルも未変更

- **Stripe連携は変更していない**
  - `src/app/api/stripe/webhook/route.ts` / `src/lib/stripe.ts` / `src/lib/subscriptions.ts` にある旧プラン名は"受け口として"一旦残存

- **旧プラン名の完全除去はしていない**
  - テスト・Webhook・マイグレーションの一部には旧プラン名がまだ存在
  - "見つけたら消す"ではなく、"マッピングしてから消す"方針

---

## 4. 運用ルール

### 4.1 プラン変更時の作業手順

今後「新しいプランを追加する／既存プランの機能を変える」ときは **必ず `src/config/plans.ts` を先に編集する**。

### 4.2 ページ側での禁止事項

各ページ（/pricing, /hearing-service, /organizations）は、**プラン定義を"見る側"であって定義する場所ではない**。

ここに違反してページ側に直書きした場合は、モジュール化の前提が壊れる。

### 4.3 確認すべき関数・定数

| 名前 | 内容 |
|-----|------|
| `PLAN_LIMITS` | 機能制限の定義 |
| `PLAN_FEATURES` | プラン機能一覧 |
| `PLAN_PRICES` | 価格定義 |
| `isPaidPlan()` | 有料プラン判定ユーティリティ |

---

## 5. 機能レジストリ

### 5.1 機能の一元管理

機能は `src/config/features.ts` に一元管理する。すべての機能は `FeatureId` として定義され、カテゴリ・ラベル・説明を持つ。

### 5.2 プランからの参照

プランは `src/config/plans.ts` の `PLAN_FEATURE_MAP` からこの機能を参照する。プラン側に機能を直書きせず、必ず features.ts 経由で参照する。

### 5.3 表示コンポーネントでの禁止事項

表示コンポーネントはこの2つを勝手に書き換えない。機能追加・変更時は人間確認を必須にする。

---

## 6. 機能表示ロジック

### 6.1 関数概要

**関数名:** `getVisibleFeaturesForPlan(planId: PlanType)`
**目的:** features.ts と plans.ts の定義に基づいて、表示してよい機能だけを返す

### 6.2 フィルタリングルール

1. `PLAN_FEATURE_MAP[planId]` に存在しないIDはスキップ
2. `features.ts` に `status` が `'planned'` または `'deprecated'` のものは返さない
3. `status` が `'stable'` のもののみ UI に表示できる

### 6.3 使用対象ページ

- `/pricing`
- `/organizations`
- `/hearing-service`
- `/`

### 6.4 運用上の注意事項

- 表示側コンポーネント内に機能を直書きしない
- `features.ts` に未登録の機能は追加前に人間確認を行う
- Stripe や DB のプラン名はこの関数に影響しない

---

## 7. 将来の作業（フェーズ2・3の予告）

- **フェーズ2:** Stripe/API層に「旧→新プラン名」のマッピング関数を入れていく（**要・人間確認**）
- **フェーズ3:** DBスキーマを新プラン名に寄せる（**本番バックアップ必須**）
- ここまで来てはじめて「旧プラン名をコードベースから物理的に削除してよい」

---

## 8. Admin階層モデル

### 8.1 階層構造

```
Admin
  └─ Plan（複数）
       └─ Feature（複数）
            └─ FeatureLimit（各プラン×機能で上限）
       └─ User（user_subscriptions経由）
            └─ AnalyticsEvent（利用記録）
```

### 8.2 コード構造

| モジュール | 役割 |
|-----------|------|
| `src/lib/featureGate.ts` | 機能ゲート・クォータ判定（唯一の参照元） |
| `src/lib/billing/index.ts` | プラン管理・サブスクリプション（Admin CRUD） |
| `src/lib/admin/audit.ts` | 監査ログ記録 |
| `src/components/admin/AdminPageShell.tsx` | Adminページ共通シェル |

### 8.3 featureGate.ts

**重要:** 機能設定は必ず `featureGate.ts` 経由で取得する

```typescript
// 表示用（キャッシュOK）
import { isFeatureEnabled, getFeatureConfig } from '@/lib/featureGate';

// 実行時強制（サーバ必須）
import { guardWithQuota, checkAndConsumeQuota } from '@/lib/featureGate';
```

**QuotaResult統一形式:**
```typescript
interface QuotaResult {
  ok: boolean;           // 成功/失敗
  code: QuotaResultCode; // 'OK' | 'NO_PLAN' | 'DISABLED' | 'EXCEEDED' | 'ERROR'
  remaining?: number;    // 残りクォータ
  limit?: number;        // 上限値
  period?: string | null;// 'monthly' | 'yearly' | null
}
```

### 8.4 Admin認証レベル

| レベル | 関数 | 用途 |
|--------|------|------|
| Site Admin | `isSiteAdmin()` | 一般的なAdmin機能 |
| Super Admin | `requireSuperAdminUser()` | Console/Metrics等の高度な操作 |

### 8.5 AdminPageShellパターン

新規Adminページは `AdminPageShell` を使用：

```tsx
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function NewAdminPage() {
  return (
    <AdminPageShell pageTitle="ページ名">
      <AdminPageHeader
        title="ページタイトル"
        description="説明"
      />
      {/* コンテンツ */}
    </AdminPageShell>
  );
}
```

**既存ページ移行方針:**
- Super Admin専用ページ（console, metrics）: `requireSuperAdminUser` を維持
- 他のAdminページ: 変更時に段階的に移行

### 8.6 監査ログ

更新系APIには監査ログを記録：

```typescript
import { writeAdminAuditLog, buildActionName, computeDiff } from '@/lib/admin/audit';

// 更新後
await writeAdminAuditLog(supabase, {
  actor_user_id: user.id,
  action: buildActionName('plan', 'update'),
  entity_type: 'plans',
  entity_id: id,
  before: diff.before,
  after: diff.after,
});
```

### 8.7 PLAN_LIMITS と canExecute の責務境界（重要）

> **絶対ルール:**
> - **PLAN_LIMITS** = UI表示用の目安（比較表や説明にのみ使用）
> - **canExecute** = 実行可否・クォータ消費の最終決定（DB/RPCが正）

**禁止事項:**
- UIで `PLAN_LIMITS` の値を理由に「実行を拒否」する実装は禁止
- `FeatureLocked` の表示はOK、ただし最終判定は必ずサーバ/DB側

**正しい実装パターン:**
```typescript
// ❌ NG: UI側でPLAN_LIMITSを見て実行を止める
if (currentCount >= PLAN_LIMITS[plan].faqs) {
  showError('上限です');
  return;
}

// ✅ OK: サーバ側でcanExecuteを使って判定
const result = await canExecute(supabase, {
  subject: { type: 'org', id: orgId },
  feature_key: 'faq_module',
  limit_key: 'max_count',
  amount: 1,
  period: 'total',
});
if (!result.ok) {
  return Response.json({ error: 'Quota exceeded' }, { status: 429 });
}
```

**理由:**
- DB側の `check_and_consume_quota` RPCが唯一の正本
- PLAN_LIMITS はキャッシュ遅延・DB変更・特別対応などで実際と乖離する可能性あり
- 二重チェックは許容するが、最終判定は常にサーバ側

### 8.8 Subject統一（旧orgId対応）

> **注**: 2024-12 アーキテクチャ改訂により、`orgId?: string | null` は廃止。
> Subject型 `{ type: 'org' | 'user', id: string }` に統一。

新API（推奨）:
- `getEffectiveFeatures(supabase, subject: Subject)`
- `canExecute(supabase, { subject, featureKey, limitKey, amount })`

レガシーAPI（後方互換、段階的に廃止予定）:
- `getFeatureSetForUser(supabase, userId?, orgId?)`
- `checkAndConsumeQuota(supabase, featureKey, amount?, userId?, orgId?)`
- `getCurrentPlanId(supabase, userId?, orgId?)`

詳細は `docs/core-architecture.md` §6.1 を参照。

### 8.9 FeatureLocked 表示コンポーネント（正本）

> **絶対ルール:**
> - 機能ロック表示は **`@/components/feature/FeatureLocked`** を使用する
> - ページローカル定義は禁止
> - プラン名のハードコードは禁止（機能ベースの説明のみ）

**使用例:**
```tsx
import { FeatureLocked } from '@/components/feature/FeatureLocked';

// 機能が無効な場合
if (!hasAccess) {
  return (
    <FeatureLocked
      title="機能名"
      description="この機能の説明"
      features={['利用可能な機能1', '利用可能な機能2']}
    />
  );
}
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| title | string | 機能のタイトル |
| description | string | 機能の説明文 |
| features | string[] | この機能で利用できる項目一覧 |

**禁止事項:**
- `requiredPlan` / `currentPlan` のようなプラン名表示
- ページ内でのローカルFeatureLocked定義
- 固定のプラン名文字列（'starter', 'pro' 等）の直書き

---

**最終更新:** 2024年12月（FeatureLocked統一対応）
