# AIOHub パフォーマンス最適化計画

> **再開用プロンプト**: このファイルの「再開用プロンプト」セクションをコピーしてClaudeに貼り付けてください

---

## 再開用プロンプト

```
AIOHubのパフォーマンス最適化を実施してください。

## 背景
1億ユーザー規模に対応するため、以下のボトルネックを解消する必要があります。

## 優先度P0（即座に修正）

### 1. 認証フロー最適化
現状: 1ページロードで5-7回のauth.getUser()
- /api/dashboard/init → getUserWithClient() [1回目]
- DashboardPageShell → getCurrentUser() [2回目 ← 重複]
- DashboardPageShell → isSiteAdmin() [3回目]

修正:
- src/app/api/dashboard/init/route.ts: レスポンスにprofile情報追加
- src/components/dashboard/DashboardPageShell.tsx: getCurrentUser()呼び出し削除

### 2. DBクエリJOIN化
現状: organization_members + organizations を順序実行（2回DB往復）

修正:
- src/app/api/dashboard/init/route.ts (lines 236-283)
- src/app/api/my/organization/route.ts (lines 118-157)

```typescript
// Before
const membership = await supabase.from('organization_members')...
const org = await supabase.from('organizations')...

// After
const { data } = await supabase
  .from('organization_members')
  .select('organization_id, role, organizations(id, name, slug, plan)')
  .eq('user_id', user.id);
```

### 3. Promise.all並列化
対象:
- src/app/api/analytics/ai/combined/route.ts (lines 214-258)

## 優先度P1（次に修正）

### 4. メモリキャッシュ適用
src/lib/cache/memory-cache.ts は定義済みだがAPI Routeで未使用
- organization情報: 5分TTL
- featureGate結果: 60秒TTL（既存維持）

### 5. 型定義統合
Feature関連の型が4ファイルに分散:
- src/types/feature-metadata.ts
- src/types/features.ts
- src/lib/featureGate.ts
- src/lib/org-features/effective-features.ts
→ src/types/core/features.ts に統合

## 成功基準
- ダッシュボード初期表示: 800ms → 250ms
- DB往復回数/ページ: 8回 → 2回
- キャッシュヒット率: 60%以上

Phase 1から順に実装してください。各Phase完了後にtypecheckを実行して確認してください。
```

---

## 詳細要件定義

### Phase 1: 認証フロー最適化

#### 問題の詳細
```
DashboardPageShell.tsx:325 で getCurrentUser() を呼んでいるが、
これは /api/dashboard/init で既に取得済みの情報と重複している。

getCurrentUser() の内部実装:
1. supabase.auth.getUser() を呼ぶ
2. profiles テーブルをクエリ
→ 合計2回のDB往復が無駄

さらに isSiteAdmin() で is_site_admin RPC も呼んでいる
```

#### 修正手順
1. `/api/dashboard/init` のレスポンス型に `profile` フィールド追加
2. route.ts で profiles テーブルから必要な情報を取得
3. DashboardPageShell.tsx から getCurrentUser() 呼び出しを削除
4. initData から直接ユーザー情報を使用

#### コード変更例
```typescript
// route.ts - レスポンス型拡張
export interface DashboardInitResponse {
  // ... existing fields
  user: {
    id: string;
    email: string | null;
    profile?: {
      display_name: string | null;
      avatar_url: string | null;
    };
  } | null;
}

// route.ts - profile取得追加
const { data: profileData } = await supabase
  .from('profiles')
  .select('display_name, avatar_url')
  .eq('id', authUser.id)
  .maybeSingle();

// DashboardPageShell.tsx - 削除
// const currentUser = await getCurrentUser();  // ← 削除
```

---

### Phase 2: DBクエリ最適化

#### 2A: JOIN化

**現状のコード (route.ts:236-283)**
```typescript
// Step 4: organization_members クエリ
const { data: memberships } = await supabase
  .from('organization_members')
  .select('organization_id, role')
  .eq('user_id', authUser.id);

// Step 5: organizations クエリ (membershipsに依存)
const orgIds = memberships.map(m => m.organization_id);
const { data: orgsData } = await supabase
  .from('organizations')
  .select('id, name, slug, plan')
  .in('id', orgIds);
```

**改善後**
```typescript
// 1回のクエリで取得
const { data: membershipWithOrgs } = await supabase
  .from('organization_members')
  .select(`
    organization_id,
    role,
    organizations (
      id,
      name,
      slug,
      plan
    )
  `)
  .eq('user_id', authUser.id);

// データ整形
const memberships = membershipWithOrgs?.map(m => ({
  organization_id: m.organization_id,
  role: m.role
})) || [];

const orgsData = membershipWithOrgs?.map(m => m.organizations) || [];
```

#### 2B: Promise.all化

**現状 (analytics/ai/combined/route.ts)**
```typescript
const { data: aiScores } = await supabase.from('ai_visibility_scores')...
const { data: seoMetrics } = await supabase.from('seo_search_console_metrics')...
const { data: botLogs } = await supabase.from('ai_bot_logs')...
```

**改善後**
```typescript
const [aiScoresResult, seoMetricsResult, botLogsResult] = await Promise.all([
  supabase.from('ai_visibility_scores').select(...).eq('organization_id', orgId),
  supabase.from('seo_search_console_metrics').select(...).eq('organization_id', orgId),
  supabase.from('ai_bot_logs').select(...).eq('organization_id', orgId),
]);

const aiScores = aiScoresResult.data;
const seoMetrics = seoMetricsResult.data;
const botLogs = botLogsResult.data;
```

---

### Phase 3: キャッシュ戦略

#### 実装パターン
```typescript
import { memoryCache } from '@/lib/cache/memory-cache';

// organization情報のキャッシュ
const orgCacheKey = `org:${orgId}`;
const cachedOrg = memoryCache.get(orgCacheKey);

if (cachedOrg) {
  return cachedOrg;
}

const { data: org } = await supabase
  .from('organizations')
  .select('id, name, slug, plan')
  .eq('id', orgId)
  .single();

memoryCache.set(orgCacheKey, org, 5 * 60 * 1000); // 5分TTL
return org;
```

#### キャッシュ無効化
```typescript
// 更新時にキャッシュを削除
await supabase.from('organizations').update(data).eq('id', orgId);
memoryCache.delete(`org:${orgId}`);
revalidatePath('/dashboard');
```

---

### Phase 4: 型統合

#### 統合先ファイル構成
```
src/types/core/
├── features.ts      # Feature関連の全型定義
├── auth.ts          # 認証関連の型
└── api-response.ts  # API レスポンス共通型
```

#### features.ts の内容
```typescript
// 機能キー
export type FeatureKey =
  | 'ai_reports'
  | 'ai_interview'
  | 'embeds'
  | 'api_access'
  | ...;

// 機能設定
export interface FeatureConfig {
  key: FeatureKey;
  available: boolean;
  quota?: QuotaInfo;
}

// クォータ情報
export interface QuotaInfo {
  used: number;
  limit: number;
  unlimited: boolean;
  resetDate?: string;
}

// 機能ゲート結果
export interface FeatureGateResult {
  available: boolean;
  reason?: 'plan_limit' | 'quota_exceeded' | 'disabled';
  upgradeInfo?: {
    plan: string;
    price: number;
  };
}
```

---

## 検証コマンド

```bash
# 型チェック
npm run typecheck

# Lint
npm run lint

# アーキテクチャチェック
npm run check:architecture

# ビルド確認
npm run build
```

---

## 期待される効果

| 指標 | 現状 | 目標 | 改善率 |
|------|------|------|--------|
| ダッシュボード表示時間 | 800ms | 250ms | -69% |
| DB往復回数/ページ | 8回 | 2回 | -75% |
| auth.getUser()呼び出し | 5-7回 | 1回 | -85% |
| キャッシュヒット率 | 0% | 60% | +60% |
| 同時処理能力 | 50 req/s | 200 req/s | +300% |

---

## 注意事項

1. **RLS影響確認**: JOIN変更時はRLSポリシーが正しく適用されるか確認
2. **キャッシュ整合性**: 更新APIでは必ずキャッシュ無効化を実行
3. **段階的移行**: 型統合は後方互換エイリアスを維持しながら実施
4. **テスト**: 各Phase完了後に手動テストで動作確認

---

## 作成日
2026-01-18

## 作成者
Claude Code (Opus 4.5)
