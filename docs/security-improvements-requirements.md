# AIOHub セキュリティ改善要件定義書

作成日: 2025-01-18
ステータス: 実装中

---

## 現状棚卸し

### ファイル構成（実際に存在するファイル）

#### 認証・認可
```
src/lib/auth/
├── require-admin.ts       # site_admin認証 (requireAdmin, isAuthorized)
├── admin-auth.ts          # Admin認証ロジック
├── server.ts              # サーバーサイド認証
├── flow-detection.ts      # 認証フロー検出
├── account-status-guard.ts # アカウントステータスガード
├── auth-state.ts          # 認証状態管理
├── determine-auth-state.ts # 認証状態判定
├── use-auth-state.ts      # 認証状態Hook
├── org-middleware.ts      # 組織ミドルウェア
└── generate-link.ts       # リンク生成
```

#### API ユーティリティ
```
src/lib/api/
├── error-responses.ts     # 統一エラーレスポンス（既存）
├── auth-middleware.ts     # 認証ミドルウェア
├── audit-logger.ts        # 監査ログ
└── response.ts            # レスポンスユーティリティ
```

#### レート制限
```
src/lib/rate-limit.ts      # インメモリレート制限（単一ファイル）
```

#### 型定義
```
tsconfig.json              # strict: false
tsconfig.strict.json       # strict: true（部分使用）
```

#### Admin APIエンドポイント（69ファイル）
```
src/app/api/admin/
├── alerts/                # 4ファイル
├── ai-visibility/         # 2ファイル
├── audit/                 # 2ファイル
├── billing/               # 10ファイル
├── billing-analytics/     # 3ファイル
├── billing-links/         # 2ファイル
├── cms/                   # 3ファイル
├── contacts/              # 1ファイル
├── content-refresh/       # 2ファイル
├── embeddings/            # 3ファイル
├── feature-management/    # 2ファイル
├── jobs/                  # 2ファイル
├── material-stats/        # 2ファイル
├── metrics/               # 1ファイル
├── migrate/               # 1ファイル
├── my-organizations/      # 1ファイル
├── org-groups/            # 7ファイル
├── organizations/         # 1ファイル
├── qna-stats/             # 2ファイル
├── rate-limit-metrics/    # 1ファイル
├── reviews/               # 3ファイル
├── rls-regression/        # 1ファイル
├── schema-diff/           # 2ファイル
├── security/              # 3ファイル
├── supabase-identity/     # 1ファイル
├── system/                # 1ファイル
├── translations/          # 2ファイル
├── upload-logo/           # 1ファイル
└── users/                 # 3ファイル
```

#### テストファイル（75ファイル）
```
tests/
├── e2e/                   # 56ファイル
├── visual/                # 3ファイル
├── ux-audit/              # 1ファイル
├── api/                   # 1ファイル
├── e2e-admin/             # 3ファイル
├── fixtures/              # 2ファイル
└── その他                  # 9ファイル
```

### 数値データ
| 項目 | 値 |
|------|------|
| any型使用箇所 | 385箇所 |
| Admin APIエンドポイント | 69ファイル |
| テストファイル | 75ファイル |
| strict mode | false |

---

## Phase 0: クリティカルセキュリティ (P0)

### 0.1 認証関数ユニットテスト追加

**現状**
- `src/lib/auth/require-admin.ts` のテストなし
- E2Eテストはあるがユニットテストがない

**対象ファイル**
```
src/lib/auth/require-admin.ts
```

**要件**
```typescript
// tests/unit/auth/require-admin.test.ts を新規作成
describe('requireAdmin', () => {
  it('should return authorized:true for site_admin user');
  it('should return 401 for unauthenticated user');
  it('should return 403 for non-admin authenticated user');
});
```

**成功基準**
- 認証関数のカバレッジ 80%以上
- CI/CDでユニットテスト実行

---

## Phase 1: 高優先度改善 (P1)

### 1.1 エラーレスポンス統一

**現状**
- `src/lib/api/error-responses.ts` は存在するが使用率低い
- 各APIで独自形式のエラーレスポンス

**対象ファイル**
```
src/lib/api/error-responses.ts  # 既存
src/app/api/admin/**/*.ts       # 69ファイル
src/app/api/my/**/*.ts          # 対象
src/app/api/dashboard/**/*.ts   # 対象
```

**統一フォーマット**
```typescript
// 既存の error-responses.ts を使用
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

// 使用例
import { forbiddenError, notFoundError, handleApiError } from '@/lib/api/error-responses';

// 現状: 独自形式
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// 改善後: 統一形式
return notFoundError('Organization');
```

**成功基準**
- 全Admin API（69ファイル）で統一形式使用
- カスタムエラーレスポンスゼロ

### 1.2 分散レート制限 (Redis)

**現状**
```typescript
// src/lib/rate-limit.ts
// インメモリレート制限ストア（本格運用時はRedisを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
```

**問題**
- サーバーレス環境でインスタンス間で共有されない
- スケール時に制限が効かない

**改善要件**
```typescript
// src/lib/rate-limit.ts を拡張
interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
}

// Redis実装を追加（Vercel KV or Upstash Redis）
class RedisRateLimitStore implements RateLimitStore {
  // 実装
}

// フォールバック: インメモリ
class MemoryRateLimitStore implements RateLimitStore {
  // 既存実装をラップ
}
```

**成功基準**
- 環境変数でRedis/Memory切替可能
- 本番環境でRedis使用

---

## Phase 2: 中優先度改善 (P2)

### 2.1 TypeScript Strict Mode移行

**現状**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false
  }
}
```

**問題**
- any型385箇所
- null/undefined安全性なし

**移行戦略**
```
Step 1: tsconfig.strict.json の対象ディレクトリ拡大
Step 2: 新規ファイルは strict: true 必須
Step 3: 既存ファイルを段階的に移行
```

**成功基準**
- any型 50箇所以下
- 新規ファイル any禁止

### 2.2 IPアローリスト実装

**対象ファイル**
```
src/lib/auth/require-admin.ts  # 追加
src/app/api/admin/**/*.ts      # 適用
```

**要件**
```typescript
// 環境変数
ADMIN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8

// 実装
async function checkIPAllowlist(request: Request): Promise<boolean> {
  const clientIP = getClientIP(request);
  const allowedCIDRs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  // CIDR判定
}
```

**成功基準**
- Admin APIにIP制限オプション追加
- 本番環境で有効化

---

## 実装順序

| 順序 | Phase | 項目 | 工数 | 効果 |
|------|-------|------|------|------|
| 1 | P0 | 認証ユニットテスト | 4h | セキュリティ基盤強化 |
| 2 | P1 | エラーレスポンス統一 | 8h | 一貫性・保守性向上 |
| 3 | P1 | Redis レート制限 | 6h | スケーラビリティ |
| 4 | P2 | Strict Mode移行 | 16h | 型安全性向上 |
| 5 | P2 | IPアローリスト | 4h | Admin保護強化 |

---

## 検証コマンド

```bash
# 型チェック
npm run typecheck

# Lint
npm run lint

# テスト
npm run test

# ビルド
npm run build

# アーキテクチャ検証
npm run check:architecture

# any型カウント
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
```

---

## 備考

### 完了済み作業（2025-01-18）
- Admin API 18ファイルに `requireAdmin()` 認証追加
- `feature-management` の無効化されていた認証を復活
- 型エラー修正（`authResult.user` → `authResult.userId`）
- **P0完了**: 認証関数ユニットテスト追加（29テスト全パス）
  - `src/tests/unit/auth/require-admin.test.ts` 新規作成
  - `src/tests/unit/api/error-responses.test.ts` 新規作成

### 実装進捗
| Phase | 項目 | ステータス | 備考 |
|-------|------|----------|------|
| P0 | 認証ユニットテスト | **完了** | 29テスト追加 |
| P1 | エラーレスポンス統一 | **完了** | 39/51ファイル統一 + 17ファイル（ドメイン維持） |
| P1 | Redis レート制限 | **完了** | Vercel KV + インメモリフォールバック |
| P2 | Strict Mode移行 | **部分完了** | セキュリティコア部分をstrict化 |
| P2 | IPアローリスト | **完了** | CIDR対応、オプション有効化 |

### 認証パターン統一方針（2025-01-18決定）
- **billing (10ファイル)**: 現状維持（SiteAdminRequiredError + 日本語エラーメッセージ）
- **org-groups (7ファイル)**: 現状維持（requireAdminPermission例外パターン）
- **security/* (3ファイル)**: 現状維持（ok/err パターン）
- **alerts/dashboard**: 現状維持（ok/err パターン）
- **ai-visibility/latest**: 現状維持（graceful degradation パターン）
- **その他**: `requireAdmin()` + `isAuthorized()` + `handleApiError()` パターンに統一

### 完了済みAdmin APIファイル（エラーレスポンス統一）
```
# 前回セッション完了分（24ファイル）
src/app/api/admin/upload-logo/route.ts
src/app/api/admin/contacts/route.ts
src/app/api/admin/billing-analytics/trends/route.ts
src/app/api/admin/billing-analytics/summary/route.ts
src/app/api/admin/billing-analytics/campaigns/route.ts
src/app/api/admin/my-organizations/route.ts
src/app/api/admin/rls-regression/route.ts
src/app/api/admin/supabase-identity/route.ts
src/app/api/admin/system/health/route.ts
src/app/api/admin/content-refresh/route.ts
src/app/api/admin/organizations/route.ts
src/app/api/admin/apply-migration/route.ts
src/app/api/admin/migrate/route.ts
src/app/api/admin/billing-links/route.ts
src/app/api/admin/alerts/route.ts
src/app/api/admin/jobs/ai-citations-aggregation/route.ts
src/app/api/admin/jobs/content-diff/route.ts
src/app/api/admin/ai-visibility/run/route.ts
src/app/api/admin/embeddings/route.ts
src/app/api/admin/embeddings/metrics/route.ts
src/app/api/admin/embeddings/jobs/route.ts
src/app/api/admin/translations/route.ts
src/app/api/admin/translations/metrics/route.ts
src/app/api/admin/users/route.ts

# セッション2完了分（11ファイル）
src/app/api/admin/metrics/route.ts              # 認証パターン変更 + エラーレスポンス
src/app/api/admin/rate-limit-metrics/route.ts   # 認証パターン変更 + エラーレスポンス
src/app/api/admin/reviews/route.ts              # 認証パターン変更 + エラーレスポンス
src/app/api/admin/reviews/history/route.ts      # エラーレスポンス統一
src/app/api/admin/reviews/reopen/route.ts       # エラーレスポンス統一
src/app/api/admin/cms/assets/route.ts           # 認証パターン変更 + エラーレスポンス
src/app/api/admin/cms/sections/route.ts         # エラーレスポンス統一
src/app/api/admin/cms/site-settings/route.ts    # エラーレスポンス統一
src/app/api/admin/feature-management/overrides/route.ts # エラーレスポンス統一

# セッション3完了分（4ファイル）
src/app/api/admin/schema-diff/stats/route.ts    # エラーレスポンス統一
src/app/api/admin/schema-diff/recent/route.ts   # エラーレスポンス統一
src/app/api/admin/alerts/[id]/route.ts          # 認証パターン変更 + エラーレスポンス
src/app/api/admin/alerts/rules/[id]/route.ts    # 認証パターン変更 + エラーレスポンス

# ドメイン別パターン維持（17ファイル）- 後方互換性のため変更なし
# billing (10): 日本語メッセージ + SiteAdminRequiredError
# org-groups (7): requireAdminPermission例外パターン
```

### ユニットテスト実行方法
```bash
# 全ユニットテスト
npm run test:unit -- src/tests/unit

# 認証テストのみ
npm run test:unit -- src/tests/unit/auth

# エラーレスポンステストのみ
npm run test:unit -- src/tests/unit/api
```

### エラーレスポンス移行ガイド

**Before (独自形式)**
```typescript
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

**After (統一形式)**
```typescript
import {
  notFoundError,
  unauthorizedError,
  forbiddenError,
  handleApiError
} from '@/lib/api/error-responses';

return notFoundError('Organization');
return unauthorizedError();
return forbiddenError();
return handleApiError(error);  // catch句で使用
```

### Vercel KV セットアップ手順（レート制限用）

**本番環境で分散レート制限を有効化するには:**

1. Vercel ダッシュボードでKVストアを作成
   - Project > Storage > Create Database > KV を選択
   - 名前を付けて作成

2. 環境変数が自動設定される（確認のみ）
   ```
   KV_REST_API_URL=https://xxx.kv.vercel-storage.com
   KV_REST_API_TOKEN=xxxx
   KV_REST_API_READ_ONLY_TOKEN=xxxx
   KV_URL=redis://xxx
   ```

3. デプロイ後、診断APIで確認
   ```bash
   curl https://your-domain/api/diag/monitoring | jq '.rate_limit_store'
   # 期待値: "vercel-kv"
   ```

**注意**: KV環境変数がない場合、自動的にインメモリストアにフォールバックします。

### IPアローリスト セットアップ手順

**Admin APIへのアクセスを特定IPに制限するには:**

1. 環境変数を設定
   ```bash
   # 有効化フラグ（必須）
   ADMIN_IP_ALLOWLIST_ENABLED=true

   # 許可するIP/CIDR（カンマ区切り）
   ADMIN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8,203.0.113.50
   ```

2. IPアローリストを使用するAdmin APIエンドポイントでrequestを渡す
   ```typescript
   // IPチェック有効化（推奨）
   const authResult = await requireAdmin(request);

   // IPチェックなし（後方互換）
   const authResult = await requireAdmin();
   ```

3. 設定確認
   ```bash
   # 診断エンドポイントで確認
   curl https://your-domain/api/admin/system/health
   ```

**注意**: `ADMIN_IP_ALLOWLIST_ENABLED=true` でも `ADMIN_ALLOWED_IPS` が空の場合、全てのIPを許可します（警告ログ出力）。

### 今後の検討事項
- CSRF明示的バリデーション（現在はCORSとOriginヘッダーに依存）
- セッション有効期限の短縮
- 監査ログの強化
