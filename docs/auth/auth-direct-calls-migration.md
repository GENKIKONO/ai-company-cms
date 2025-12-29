# Auth 直叩き削減ガイド

## 概要

本プロジェクトでは、Supabase Auth の直接呼び出しを段階的に削減し、`@/lib/core/auth-state` 経由に統一する方針です。

## 禁止API（直叩き）

以下のAPI呼び出しは新規追加禁止です。既存のものは段階的に削減します。

```typescript
// NG: 直叩き
supabase.auth.getUser()
supabase.auth.getSession()
supabase.auth.onAuthStateChange()
```

## 正本（Core経由）

### サーバーサイド（API Routes / Server Components / Server Actions）

```typescript
import { getUserWithClient, requireUserWithClient } from '@/lib/core/auth-state';

// 認証オプショナル
const user = await getUserWithClient(supabase);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 認証必須（未認証時はthrow）
const user = await requireUserWithClient(supabase);
```

### user_metadata が必要な場合

```typescript
import { getUserFullWithClient, requireUserFullWithClient } from '@/lib/core/auth-state';

// user_metadata / app_metadata にアクセスする場合
const user = await getUserFullWithClient(supabase);
console.log(user?.user_metadata?.full_name);
```

### Session (access_token) が必要な場合

```typescript
import { getSessionWithClient, requireSessionWithClient } from '@/lib/core/auth-state';

// Edge Function 呼び出し時など
const session = await getSessionWithClient(supabase);
if (!session?.access_token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const response = await fetch(edgeFunctionUrl, {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
});
```

### クライアントサイド

```typescript
import { useAuth } from '@/lib/core/auth-state.client';

const { user, isLoading, error } = useAuth();
```

### クライアント: Session 取得

```typescript
import { getSessionClient } from '@/lib/core/auth-state.client';

// Edge Function 呼び出し時
const session = await getSessionClient();
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${session?.access_token}` }
});
```

### クライアント: 認証状態変更リスナー

```typescript
import { onAuthChangeClient } from '@/lib/core/auth-state.client';

useEffect(() => {
  let subscription: { unsubscribe: () => void } | null = null;

  onAuthChangeClient((event, session) => {
    // 認証状態変更時の処理
    console.log('Auth event:', event, session?.user?.id);
  }).then(result => {
    subscription = result.data.subscription;
  });

  // 重要: 必ず cleanup で unsubscribe を呼ぶ
  return () => {
    subscription?.unsubscribe();
  };
}, []);
```

## 型定義

```typescript
// 基本ユーザー型（user_metadata なし）
type AuthUser = {
  id: string
  email: string | null
  app_role: string | null
}

// 拡張ユーザー型（user_metadata 含む）
type AuthUserFull = AuthUser & {
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
  created_at: string | null
  last_sign_in_at: string | null
}
```

## 削減優先順位

1. **getSession（最優先）**
   - API Routes で access_token が必要な場合
   - Edge Function 呼び出し時の Bearer token 取得
   - → `getSessionWithClient(supabase)` / `getSessionClient()` を使用

2. **onAuthStateChange（次点）**
   - 認証状態のリアルタイム監視
   - → `onAuthChangeClient(callback)` を使用
   - 注意: unsubscribe を必ず cleanup で呼ぶこと

3. **getUser（継続削減）**
   - API Routes / Server Components
   - → `getUserWithClient(supabase)` を使用

## ベースライン管理

ベースラインは `scripts/check-architecture.sh` 内の **固定定数** で管理されています。

```bash
# scripts/check-architecture.sh 内
BASELINE_AUTH_DIRECT=177  # Phase 1完了時点の値（固定）
```

```bash
# 現在の直叩き件数を確認
npm run check:architecture
```

### 固定ベースラインポリシー（Phase 2以降）

- **自動更新は行わない**（抜け道防止）
- ベースライン更新が必要な場合は、手動で `BASELINE_AUTH_DIRECT` を書き換える
- 更新時は履歴コメントを残すこと

### CI ガードレール

- 直叩き件数がベースラインを**超えると FAIL**
- ベースライン以下は **PASS**

## 置換手順

1. ファイルの import に Core モジュールを追加
   ```typescript
   import { getUserWithClient } from '@/lib/core/auth-state';
   ```

2. 直叩きパターンを置換
   ```typescript
   // Before
   const { data: authData, error: authError } = await supabase.auth.getUser();
   if (authError || !authData.user) {
     return createAuthError();
   }
   const userId = authData.user.id;

   // After
   const user = await getUserWithClient(supabase);
   if (!user) {
     return createAuthError();
   }
   const userId = user.id;
   ```

3. 残存する `authData.user` 参照を `user` に置換

4. typecheck 実行して型エラーを確認
   ```bash
   npm run typecheck
   ```

5. check:architecture 実行してベースライン減少を確認
   ```bash
   npm run check:architecture
   ```

## 許可ディレクトリ（ホワイトリスト）

以下のディレクトリは Core 実装のため直叩きが許可されています。

- `lib/core/` - Core 実装（正本）
- `lib/auth/` - 認証ヘルパー
- `lib/supabase/` - Supabase クライアント初期化
- `middleware.ts` - Next.js ミドルウェア

## 除外対象（意図的に残す直叩き）

以下は特殊用途のため直叩きを許可。Phase 4 以降で対応検討。

### 診断・デバッグ用途
- `src/app/api/diag/**` - 診断API
- `src/app/api/debug/**` - デバッグAPI
- `src/app/api/selftest/**` - セルフテストAPI

### テスト用途
- `src/app/test/**` - テストページ

### Realtime 系（Phase 4 完了）
- `src/lib/hooks/use*Realtime.ts` - ✅ getSessionClient 経由に移行済み
- `src/lib/realtime/**` - ✅ getSessionWithClient 経由に移行済み
- `src/lib/reports/realtime.ts` - ✅ getSessionClient 経由に移行済み
- onAuthStateChange - ✅ onAuthChangeClient 経由に移行済み

## 移行進捗

| Phase | 開始時 Current | 終了時 Current | Delta | 内容 |
|-------|---------------|---------------|-------|------|
| Phase 1 | 210 | 177 | -33 | 初期削減 |
| Phase 2 | 177 | 156 | -21 | getUserWithClient 統一 |
| Phase 3 | 145 | 118 | -27 | getUser 追加削減 |
| Phase 4 | 118 | 102 | -16 | getSession/onAuthStateChange Core統一 |
| Phase 5 | 102 | 87 | -15 | 最終収束・封じ込め完了 |
| Phase 6 | 87 | 78 | -9 | D1 (Admin CMS API) 置換 |
| Phase 7 | 78 | 66 | -12 | D1 (Admin Alerts/Reviews/Ops) 置換 |

※ Baseline: 177（Phase 1 完了時点で固定）
※ Delta: -111（Baseline 177 → Current 66）

### Phase 5 詳細（最終収束フェーズ）

**目標**
- 残存を「管理可能な負債」に封じ込め
- 新規追加は CI で即 FAIL

**分類テーブル（66件の内訳 - Phase 7終了時点）**

| 分類 | 内容 | 件数 | 対応方針 |
|------|------|------|----------|
| A | diag / debug / selftest | ~15 | 意図的に残す |
| B | middleware / Next.js制約 | 1 | 技術的制約 |
| C | Realtime系 | 0 | Phase 4 で完了 |
| D | Admin / Ops / 内部API | ~27 | Phase 6/7 で一部置換 |
| E | 置換可能 → 置換済み | -36 | Phase 5B/6B/7B で対応 |
| - | Core正本（カウント外） | ~10 | 正本のため除外 |

**Phase 5B で置換したファイル（15件）**
- `src/lib/organizations.ts` (2)
- `src/lib/organizations-server.ts` (3)
- `src/lib/billing/index.ts` (3)
- `src/lib/featureGate.ts` (2)
- `src/app/my/faqs/page.tsx` (2)
- `src/app/my/faqs/new/page.tsx` (1)
- `src/app/my/faqs/[id]/edit/page.tsx` (2)

### Phase 6 詳細（D1 カテゴリ削減）

**目標**
- D カテゴリ（Admin/Ops API）から -8 以上削減
- A/B カテゴリは触らない

**Phase 6B で置換したファイル（9件）**
- `src/app/api/admin/cms/site-settings/route.ts` (3) - GET/POST/DELETE
- `src/app/api/admin/cms/assets/route.ts` (3) - GET/POST/DELETE
- `src/app/api/admin/cms/sections/route.ts` (3) - GET/POST/DELETE

### Phase 7 詳細（D1 カテゴリ追加削減）

**目標**
- D カテゴリ（Admin/Ops API）から -10～-15 削減（最小 -8 必達）
- A/B カテゴリは触らない

**Phase 7B で置換したファイル（12件）**
- `src/app/api/admin/alerts/route.ts` (2) - GET/POST
- `src/app/api/admin/alerts/[id]/route.ts` (1) - PATCH
- `src/app/api/admin/alerts/rules/[id]/route.ts` (1) - PATCH
- `src/app/api/admin/reviews/reopen/route.ts` (2) - POST/GET
- `src/app/api/admin/reviews/history/route.ts` (1) - GET
- `src/app/api/admin/feature-management/overrides/route.ts` (3) - GET/POST/DELETE
- `src/app/api/ops/status/route.ts` (1) - GET
- `src/app/api/ops/login_api/route.ts` (1) - POST

## Phase 7 時点で残している直叩き

### 残存理由
- **Next.js middleware 制約**: middleware.ts は Next.js の仕様で Server Components 用の createClient が使えない
- **診断・デバッグ用途**: diag/debug/selftest は意図的にRaw APIを使用（トラブルシュートのため）
- **Admin / Ops API**: 利用頻度が低く、リスク低減のため後回し
- **Supabase User型必要**: auth.ts など Supabase の User 型をそのまま返す必要がある箇所

### 方針
- **新規追加は禁止**（CI の check:architecture で FAIL）
- 既存は将来のフレームワーク更新時に再検討
- 各分類の責任者/チームが明確な場合は個別対応可

## 参照ドキュメント

- [Core アーキテクチャ要件定義](../core-architecture.md)
- [auth-state.ts](../../src/lib/core/auth-state.ts) - サーバーサイド正本
- [auth-state.client.ts](../../src/lib/core/auth-state.client.ts) - クライアントサイド正本
