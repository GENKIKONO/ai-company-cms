# Auth Wrapper 使用ガイド

> このドキュメントは認証取得の「正しい方法」を定義する正本です。
> レビュー基準・新規開発の参照先として使用してください。

---

## 目的

**Supabase Auth の直叩きを禁止し、Core wrapper 経由に統一する。**

### なぜ Core wrapper を使うのか

1. **一貫性**: 認証取得のロジックを一箇所に集約
2. **型安全性**: `AuthUser` / `AuthUserFull` 型で統一
3. **保守性**: 認証ロジック変更時の影響範囲を限定
4. **CI検出**: 直叩きは `npm run check:architecture` で FAIL

---

## 早見表: どの関数を使うか

### サーバー側（API Route / Server Component / Server Action）

| ユースケース | 関数 | 戻り値 |
|-------------|------|--------|
| ユーザー取得（認証任意） | `getUserWithClient(supabase)` | `AuthUser \| null` |
| ユーザー取得（認証必須） | `requireUserWithClient(supabase)` | `AuthUser` (throws) |
| セッション取得（token必要） | `getSessionWithClient(supabase)` | `Session \| null` |
| セッション取得（token必須） | `requireSessionWithClient(supabase)` | `Session` (throws) |
| user_metadata が必要 | `getUserFullWithClient(supabase)` | `AuthUserFull \| null` |
| user_metadata 必須 | `requireUserFullWithClient(supabase)` | `AuthUserFull` (throws) |
| JWT トークン検証 | `getUserFromTokenWithClient(supabase, token)` | `{ user, error }` |
| site_admin 判定 | `isSiteAdminWithClient(supabase)` | `boolean` |

**インポート元**: `@/lib/core/auth-state`

### クライアント側（'use client' コンポーネント）

| ユースケース | 関数 | 戻り値 |
|-------------|------|--------|
| ユーザー取得 | `getCurrentUserClient()` | `AppUser \| null` |
| 生の User 型が必要 | `getRawUserClient()` | `User \| null` |
| セッション取得 | `getSessionClient()` | `Session \| null` |
| 認証状態変更の監視 | `onAuthChangeClient(callback)` | `{ subscription }` |
| セッション更新 | `refreshSessionClient()` | `{ error }` |
| サインアウト | `signOutClient()` | `{ error }` |

**インポート元**: `@/lib/core/auth-state.client`

---

## OK例 / NG例

### API Route（サーバー）

```typescript
// ❌ NG: 直叩き
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();  // 禁止
  // ...
}

// ✅ OK: Core wrapper
import { getUserWithClient } from '@/lib/core/auth-state';

export async function GET() {
  const supabase = await createClient();
  const user = await getUserWithClient(supabase);  // OK
  // ...
}
```

### 認証必須エンドポイント

```typescript
// ❌ NG: 手動チェック
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();  // 禁止
  if (!user) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  // ...
}

// ✅ OK: requireUserWithClient
import { requireUserWithClient, AuthRequiredError } from '@/lib/core/auth-state';

export async function POST() {
  try {
    const supabase = await createClient();
    const user = await requireUserWithClient(supabase);  // 未認証なら throw
    // ...
  } catch (e) {
    if (e instanceof AuthRequiredError) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    throw e;
  }
}
```

### Client Component

```typescript
// ❌ NG: 直叩き
'use client';
import { supabaseBrowser } from '@/lib/supabase/client';

function MyComponent() {
  useEffect(() => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();  // 禁止
  }, []);
}

// ✅ OK: Core wrapper
'use client';
import { getCurrentUserClient } from '@/lib/core/auth-state.client';

function MyComponent() {
  useEffect(() => {
    const user = await getCurrentUserClient();  // OK
  }, []);
}
```

### user_metadata / app_metadata が必要な場合

```typescript
// ❌ NG: 直叩きして metadata アクセス
const { data: { user } } = await supabase.auth.getUser();
const fullName = user?.user_metadata?.full_name;  // 禁止

// ✅ OK: getUserFullWithClient
import { getUserFullWithClient } from '@/lib/core/auth-state';

const user = await getUserFullWithClient(supabase);
const fullName = user?.user_metadata?.full_name;  // OK（型安全）
```

### JWT トークン検証（特殊ケース）

```typescript
// API で Bearer トークンを検証する場合

// ❌ NG: 直叩き
const { data: { user } } = await supabase.auth.getUser(token);  // 禁止

// ✅ OK: getUserFromTokenWithClient
import { getUserFromTokenWithClient } from '@/lib/core/auth-state';

const { user, error } = await getUserFromTokenWithClient(supabase, token);
if (error) {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
```

---

## 例外: Allowlist

### 唯一の例外

**[docs/auth/auth-direct-calls-allowlist.md](./auth-direct-calls-allowlist.md)** に記載されたファイルのみ、Auth 直叩きが許可されています。

### Allowlist の用途

| カテゴリ | 用途 | ファイル数 |
|---------|------|-----------|
| Middleware | Edge Runtime認証チェック | 1 |

> **Phase 20:** 診断APIはCore wrapper経由に移行済み。Allowlistはmiddleware.tsのみ。

### 「増やさない」方針

- Allowlist は **削減** の方向で管理
- 新規追加は原則禁止
- どうしても必要な場合は PR レビューで承認を得る

---

## CI での検出

```bash
npm run check:architecture
```

### Check X の動作

- Allowlist 外で Auth 直叩きがあれば **FAIL**
- Current > Limit（現在1）でも **FAIL**

### 違反時の対応

1. エラーメッセージで違反ファイルを確認
2. 該当箇所を Core wrapper に置換
3. 再度 `npm run check:architecture` で PASS を確認

---

## 関連ドキュメント

- [Auth直叩き許容リスト（Allowlist）](./auth-direct-calls-allowlist.md)
- [コアアーキテクチャ要件定義](../core-architecture.md)
- **[設計境界（Boundaries）ガイド](../architecture/boundaries.md)** ← 境界の全体像

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-12-28 | Phase 15 で新規作成 |
