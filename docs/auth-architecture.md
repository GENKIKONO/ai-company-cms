# 認証アーキテクチャ

> **バージョン:** 1.0
> **最終更新:** 2025年1月
> **ステータス:** 確定

---

## 1. 概要

AIOHubの認証システムは、主に以下の3つの認証方式を使用する:

1. **Supabase Auth**: 通常ユーザー（Dashboard, Account領域）
2. **独立認証 (ops_admin)**: 運用管理者（Ops領域）
3. **site_admin**: サイト管理者（Admin, ManagementConsole領域）

---

## 2. 組織紐付けの優先順位

ユーザーが所属する組織を特定する際、以下の優先順位で検索を行う:

### 2.1 検索順序

| 優先度 | 方法 | 説明 |
|--------|------|------|
| 1 | クエリパラメータ `organizationId` | 明示的に指定された組織 |
| 2 | `v_current_user_orgs` (organization_members経由) | 正規パス |
| 3 | `organizations.created_by` | 後方互換フォールバック |

### 2.2 created_by フォールバック

**発火条件:**
- `organization_members` テーブルにユーザーの紐付けレコードがない
- かつ `organizations.created_by` が該当ユーザーのIDと一致する

**対象ケース:**
- 旧データ: `organization_members` にレコードがない組織作成者
- マイグレーション未完了のユーザー

**実装箇所:**
- `src/lib/auth/org-middleware.ts` の `withOrgAuth()` 関数内

### 2.3 フォールバック削除条件

以下のSQLで対象レコード数を確認:

```sql
SELECT COUNT(*) FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members m
  WHERE m.organization_id = o.id
    AND m.user_id = o.created_by
);
```

**結果が0になれば:**
- `created_by` フォールバックを安全に削除可能
- `org-middleware.ts` の該当コードブロックを撤去

### 2.4 観測

フォールバック発火時は以下のログが出力される:

```
[withOrgAuth] created_by fallback triggered { orgId: "...", reason: "no_membership_record" }
```

このログを監視し、発火頻度が0に近づいたらマイグレーション完了と判断できる。

---

## 3. Middleware認証フロー

### 3.1 保護対象パス

`src/middleware.ts` で以下のパスプレフィックスを保護:

```typescript
PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/account',
  '/admin',
  '/management-console',
  '/my',
]
```

### 3.2 /ops の例外

`/ops/**` は上記リストに含まれない（意図的）。
独立認証システム（`ops_admin` cookie）を使用するため。

詳細は `docs/core-architecture.md` の「3.2.0 /ops 領域の独立認証」を参照。

---

## 4. 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/middleware.ts` | 認証ミドルウェア（保護パス判定） |
| `src/lib/auth/org-middleware.ts` | 組織認証コンテキスト提供 |
| `src/lib/ops-guard.ts` | /ops 独立認証ガード |
| `src/lib/core/auth-state.ts` | 認証状態取得の統一API |

---

**文書終了**
