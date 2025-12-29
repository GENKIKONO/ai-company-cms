# ADR-001: Coreを唯一の入口にする

## ステータス
採用済み (2024-12-25)

## コンテキスト

AIOHubのコードベースにおいて、以下の問題が発生していた：

1. **認証処理の分散**: `@/lib/auth`, `@/lib/authz`, `@/lib/billing` に認証関連処理が散在
2. **isSiteAdmin の3重実装**: 各モジュールで異なるシグネチャで実装
3. **監査ログの直接呼び出し**: DashboardPageShellが `/api/ops_audit_simple` を直接fetch
4. **Core モジュールの死蔵**: `src/lib/core/*` が定義されていたが実際には使われていなかった

これらはLSP（Liskov Substitution Principle）違反であり、保守性とテスタビリティを損なっていた。

## 決定

**Coreモジュール (`src/lib/core/*`) を唯一の入口とする。**

### 具体的な変更

1. **isSiteAdmin**: `src/lib/core/auth-state.ts` に統合
   - `isSiteAdmin()`: Server Component / Route Handler 用（クライアント生成込み）
   - `isSiteAdminWithClient(supabase)`: 既存クライアントを再利用する場合

2. **監査ログ**:
   - サーバー用: `src/lib/core/audit-logger.ts` の `auditLogWrite` / `auditLogWriteRPC`
   - クライアント用: `src/lib/core/audit-logger.client.ts` の `auditLogWriteClient`

3. **既存モジュール**: Core からの re-export + `@deprecated` 注釈

4. **CIチェック**: `scripts/check-architecture.sh` でアーキテクチャ違反を検出

## 結果

### 良い点
- 認証・監査処理の真実が1箇所に集約
- 変更時の影響範囲が明確
- CIで違反を自動検出

### 悪い点
- 移行期間中は re-export による間接参照が発生
- 既存コードのリファクタリングが必要（段階的に実施）

### 注意点
- `@/lib/auth` の直接インポートは将来的に禁止（P0-1完了後）
- 新規コードは必ず Core 経由

## Phase 2-1b: Core Auth Entry Points

### Server用 (`src/lib/core/auth-state.ts`)

| 関数 | 用途 | 戻り値 |
|------|------|--------|
| `getUserServerOptional()` | ユーザー取得（認証任意） | `AuthUser \| null` |
| `requireUserServer()` | ユーザー取得（認証必須） | `AuthUser` (throw if null) |
| `isSiteAdmin()` | site_admin判定 | `boolean` |
| `isOrgMember(orgId)` | 組織メンバー判定 | `boolean` |
| `getOrgRole(orgId)` | 組織ロール取得 | `string \| null` |

### Client用 (`src/lib/core/auth-state.client.ts`)

| 関数 | 用途 | 戻り値 |
|------|------|--------|
| `getUserClient()` | ユーザー取得 | `AppUser \| null` |
| `getSessionClient()` | セッション取得 | `Session \| null` |
| `onAuthChangeClient(cb)` | 認証状態リスナー | `{ subscription }` |
| `signOutClient()` | サインアウト | `{ error }` |

### 禁止事項

```typescript
// ❌ 禁止: 直接呼び出し
const { data } = await supabase.auth.getUser();
const { data } = await supabase.auth.getSession();
supabase.auth.onAuthStateChange(...);

// ✅ 正解: Core経由
import { requireUserServer } from '@/lib/core/auth-state';
import { getUserClient, onAuthChangeClient } from '@/lib/core/auth-state.client';
```

## 関連ファイル
- `src/lib/core/auth-state.ts`
- `src/lib/core/auth-state.client.ts`
- `src/lib/core/audit-logger.ts`
- `src/lib/core/audit-logger.client.ts`
- `scripts/check-architecture.sh`
- `.architecture-baseline`
