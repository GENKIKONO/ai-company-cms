# Auth直叩き許容リスト（Allowlist）

> **Phase 12 で凍結**: 2024-12-28
> **Phase 13 で強化**: allowlist 外は CI FAIL
> **Phase 14 で集約**: A系ファイルを 8→3 に削減
> このドキュメントは `npm run check:architecture` の Check X と連動しています。

---

## 機械可読 Allowlist（CI が参照する正本）

以下のブロック内のファイルのみ Auth 直叩きが許可されます。
**このリスト外のファイルで Auth 直叩きが検出された場合、CI は FAIL します。**

<!-- AUTH_DIRECT_CALLS_ALLOWLIST_START -->
- src/middleware.ts
  reason: "Next.js制約（middlewareのみ）"
  remove_when: "Next.jsがCore wrapperを許容したら"
  review_by: "2026-06-30"
<!-- AUTH_DIRECT_CALLS_ALLOWLIST_END -->

---

## 概要

Supabase Auth 直叩き（`.auth.getUser()` / `.auth.getSession()` / `.onAuthStateChange()`）は
原則として **Core wrapper** 経由で行う方針です。

> 📖 **Core wrapper の使い方は [Auth Wrapper 使用ガイド](./auth-wrapper-usage.md) を参照**

ただし、以下のカテゴリに該当するファイルは **意図的に直叩きを許容** しています。

---

## 許容上限

| カテゴリ | ファイル数 | calls | 説明 |
|---------|-----------|-------|------|
| B (middleware) | 1 | 2 | Next.js middleware（Edge Runtime制約） |
| **合計** | **1** | **2** | Check X の上限値 |

> **Phase 19:** 手動testページを E2E smoke テストに置き換え、allowlist を縮退しました。
> **Phase 20:** diag/auth/route.ts を Core wrapper 経由に移行し、allowlist から撤去。

---

## カテゴリ A: 診断用ファイル（撤去済み）

> **Phase 20 で完全撤去:** `diag/auth/route.ts` を Core wrapper 経由に移行。
> Auth 直叩きのない診断 API として継続運用中。

### 過去の撤去履歴

| ファイルパス | 撤去Phase | 代替方法 |
|-------------|----------|---------|
| `src/app/api/diag/auth/route.ts` | Phase 20 | Core wrapper 経由 |
| `src/app/test/realtime/page.tsx` | Phase 19 | E2E smoke テスト |
| `src/app/test/admin-api/page.tsx` | Phase 19 | E2E smoke テスト |

---

## カテゴリ B: Middleware（1 call / 1ファイル）

| ファイルパス | calls | 理由 |
|-------------|-------|------|
| `src/middleware.ts` | 1 | Edge Runtimeでの認証チェック必須 |

### 理由
- Next.js middleware は Edge Runtime で動作
- リクエスト処理の最初期段階で認証状態を確認する必要がある
- Core wrapper を経由するとパフォーマンス影響が大きい

---

## CI での検出

```bash
npm run check:architecture
```

### Check X の動作

- **PASS条件**: Current ≤ 3 かつ allowlist外ヒット = 0
- **FAIL条件**: Current > 3 または allowlist外ヒット > 0

FAIL時には以下が出力されます：
1. 違反箇所の grep 結果
2. 修正方法（Core wrapper 使用の案内）

---

## 新規追加が必要な場合

1. **まず Core wrapper で対応できないか検討する**
   - Server: `getUserWithClient()`, `requireUserWithClient()`
   - Client: `getCurrentUserClient()`, `getRawUserClient()`

2. **本当に直叩きが必要な場合**
   - このドキュメントに追加理由を明記
   - `scripts/check-architecture.sh` の `AUTH_DIRECT_LIMIT` を更新
   - PR レビューで承認を得る

---

## Core Wrapper 一覧

### Server-side（`src/lib/core/auth-state.ts`）

| 関数 | 戻り値 | 用途 |
|------|--------|------|
| `getUserWithClient(supabase)` | `AuthUser \| null` | 基本的なユーザー取得 |
| `getUserFullWithClient(supabase)` | `AuthUserFull \| null` | metadata付きユーザー取得 |
| `requireUserWithClient(supabase)` | `AuthUser` (throws) | 認証必須エンドポイント用 |
| `getUserFromTokenWithClient(supabase, token)` | `{user, error}` | JWT検証用 |

### Client-side（`src/lib/core/auth-state.client.ts`）

| 関数 | 戻り値 | 用途 |
|------|--------|------|
| `getCurrentUserClient()` | `AuthUser \| null` | クライアントでのユーザー取得 |
| `getRawUserClient()` | `User \| null` | Supabase生Userが必要な場合 |
| `refreshSessionClient()` | `{error}` | セッションリフレッシュ |

---

## 関連ドキュメント

- **[Auth Wrapper 使用ガイド](./auth-wrapper-usage.md)** - Core wrapper の使い方・OK例/NG例
- [コアアーキテクチャ要件定義](../core-architecture.md)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-12-28 | Phase 12 で上限16を凍結、本ドキュメント作成 |
| 2024-12-28 | Phase 13 で機械可読ブロック追加、allowlist外はCI FAIL |
| 2024-12-28 | Phase 14 でA系を集約（8→3ファイル）、上限16→9に削減 |
| 2024-12-28 | Phase 15 で auth-wrapper-usage.md との相互リンク追加 |
| 2024-12-28 | Phase 18 で各エントリにメタ情報（reason/remove_when/review_by）追加 |
| 2024-12-29 | Phase 19 で手動testページを撤去、E2E smoke で代替。上限9→3に削減 |
| 2024-12-29 | Phase 20 で diag/auth をCore wrapper経由に移行。上限3→1に削減 |
