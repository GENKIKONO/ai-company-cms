# AIOHub セキュリティ実装完了レポート

## 概要

AIOHubのセキュリティ強化が完了しました。この文書では、実装されたセキュリティ機能とその使用方法について説明します。

## 実装された機能

### 1. セキュリティ中間層 (Phase 1)

#### ファイル一覧
- `src/middleware.ts` - セキュリティヘッダー、レート制限、IP制限
- `src/lib/security/rate-limit.ts` - レート制限機能
- `src/lib/security/nonce.ts` - CSRF保護、ランダムトークン生成
- `src/lib/security/api-protection.ts` - API保護ラッパー
- `src/lib/security/sanitize.ts` - データサニタイゼーション
- `src/lib/security/llm-guard.ts` - LLMプロンプト保護
- `src/lib/security/error-handling.ts` - セキュアエラーハンドリング

#### 主要機能
- **CSP (Content Security Policy)**: XSS攻撃防止
- **レート制限**: API乱用防止
- **CSRF保護**: クロスサイトリクエストフォージェリ防止
- **セキュリティヘッダー**: X-Frame-Options, X-Content-Type-Options等
- **データサニタイゼーション**: HTML/LLM出力の安全化

### 2. Webhook セキュリティ (Phase 2)

#### ファイル一覧
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook ハンドラー
- `src/app/api/webhooks/resend/route.ts` - Resend webhook ハンドラー
- `supabase/migrations/20251112_webhook_tables.sql` - Webhook用テーブル

#### 主要機能
- **HMAC署名検証**: webhook の信頼性確保
- **重複処理防止**: イベントの冪等性保証
- **タイムスタンプ検証**: リプレイ攻撃防止
- **イベントホワイトリスト**: 必要なイベントのみ処理

### 3. データベースセキュリティ (Phase 3)

#### ファイル一覧
- `supabase/migrations/20251112_security_hardening.sql` - セキュリティ強化マイグレーション

#### 主要機能
- **監査ログ**: 全データ変更の追跡
- **Row Level Security (RLS)**: テーブルレベルのアクセス制御
- **セキュリティ関数**: IP検証、レート制限、データマスキング
- **自動トリガー**: 監査ログの自動記録

### 4. 管理API保護 (Phase 4)

#### ファイル一覧
- `src/lib/security/admin-protection.ts` - 管理API保護ラッパー
- `scripts/generate-admin-signature.js` - 署名生成ツール
- `docs/ADMIN_API_SECURITY.md` - 管理API セキュリティガイド

#### 主要機能
- **HMAC署名認証**: API リクエストの信頼性確保
- **強化レート制限**: 管理操作の制限
- **IPホワイトリスト**: 特定IPからのアクセス制限
- **二要素認証**: TOTP による追加認証
- **詳細監査ログ**: 管理操作の完全追跡

### 5. CI/CD セキュリティ (Phase 5)

#### ファイル一覧
- `.github/workflows/security-checks.yml` - GitHub Actions ワークフロー
- `scripts/security-check.sh` - ローカル セキュリティ検証スクリプト
- `audit-ci.json` - 依存関係監査設定

#### 主要機能
- **自動セキュリティ監査**: PR/push 時の自動チェック
- **依存関係スキャン**: 脆弱性のある依存関係の検出
- **機密データスキャン**: ソースコード内の機密情報検出
- **ビルド検証**: セキュリティ設定の動作確認

## 環境設定

### 必須環境変数

```bash
# セキュリティ関連
CSRF_SECRET=your_csrf_secret_32_chars_minimum
API_SIGNATURE_SECRET=your_api_signature_secret_32_chars
ADMIN_API_SECRET_KEY=your_admin_api_secret_key_64_chars_minimum
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.5
FORCE_HTTPS=true

# Webhook セキュリティ
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
RESEND_WEBHOOK_SECRET=your_resend_webhook_secret

# 監査ログ
ENABLE_ADMIN_AUDIT_DB=true

# 二要素認証（オプション）
TOTP_SECRET_[user_id]=base32_secret_for_specific_admin_user
```

## 使用方法

### 1. 基本的なAPI保護

```typescript
import { withAPIProtection } from '@/lib/security/api-protection';

export const POST = withAPIProtection(async (req) => {
  // API ロジック
  return NextResponse.json({ success: true });
}, {
  rateLimit: { requests: 100, window: 3600 },
  requireAuth: true,
  sanitizeInput: true
});
```

### 2. 管理者API保護

```typescript
import { withAdminProtection } from '@/lib/security/admin-protection';

export const POST = withAdminProtection(async (req) => {
  // 管理者 API ロジック
  return NextResponse.json({ success: true });
}, {
  requireSignature: true,
  maxRequestsPerHour: 100,
  allowedIPs: ['192.168.1.100'],
  requireDoubleAuth: false
});
```

### 3. データサニタイゼーション

```typescript
import { sanitizeHTML, sanitizeLLMOutput } from '@/lib/security/sanitize';

// HTML サニタイゼーション
const safeHTML = sanitizeHTML(userInput);

// LLM 出力サニタイゼーション
const safeLLMOutput = sanitizeLLMOutput(llmResponse);
```

### 4. レート制限

```typescript
import { rateLimit } from '@/lib/security/rate-limit';

const result = await rateLimit('user:123', 10, 60000); // 1分に10回まで
if (!result.success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

## セキュリティチェック

### ローカル環境でのセキュリティ検証

```bash
# 包括的なセキュリティチェック
./scripts/security-check.sh

# 詳細出力付き
./scripts/security-check.sh --verbose

# 自動修正を試行
./scripts/security-check.sh --fix
```

### 管理者API署名生成

```bash
# GET リクエストの署名生成
node scripts/generate-admin-signature.js GET /api/admin/system/health

# POST リクエストの署名生成
node scripts/generate-admin-signature.js POST /api/admin/users '{"email":"admin@example.com"}'

# Curl コマンド生成
node scripts/generate-admin-signature.js --curl GET /api/admin/system/health
```

### CI/CD セキュリティチェック

GitHub Actions により以下が自動実行されます：

- 機密データスキャン
- 依存関係セキュリティ監査
- セキュリティ特化の ESLint
- ビルド時セキュリティ検証
- 環境設定検証

## セキュリティレベル別設定

### レベル 1: 基本セキュリティ

```typescript
// 基本的なAPI保護
export const GET = withAPIProtection(handler, {
  rateLimit: { requests: 1000, window: 3600 },
  requireAuth: false,
  sanitizeInput: false
});
```

### レベル 2: 標準セキュリティ

```typescript
// 認証が必要なAPI
export const POST = withAPIProtection(handler, {
  rateLimit: { requests: 100, window: 3600 },
  requireAuth: true,
  sanitizeInput: true,
  validateCSRF: true
});
```

### レベル 3: 高セキュリティ（管理者）

```typescript
// 管理者API（署名 + IP制限）
export const DELETE = withAdminProtection(handler, {
  requireSignature: true,
  maxRequestsPerHour: 10,
  allowedIPs: ['192.168.1.100'],
  requireDoubleAuth: false,
  logSensitiveData: false
});
```

### レベル 4: 最高セキュリティ（機密操作）

```typescript
// 機密な管理者API（署名 + 二要素認証 + IP制限）
export const POST = withAdminProtection(criticalHandler, {
  requireSignature: true,
  maxRequestsPerHour: 5,
  allowedIPs: ['192.168.1.100'],
  requireDoubleAuth: true,
  logSensitiveData: true
});
```

## 監視とアラート

### 監査ログの確認

```sql
-- 最近の管理者操作
SELECT * FROM audit_logs 
WHERE table_name = 'organizations' 
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 異常なアクセス パターン
SELECT ip_address, COUNT(*) as request_count
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 100;
```

### セキュリティダッシュボード

```sql
-- セキュリティ統計
SELECT * FROM admin_security_dashboard;
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 署名エラー

```bash
# 署名を検証
node scripts/generate-admin-signature.js --validate GET /api/admin/health "" [signature] [timestamp] [nonce]
```

#### 2. レート制限

```javascript
// レート制限状況を確認
const stats = await getAdminAPIStats('24h');
console.log(stats);
```

#### 3. IP制限

環境変数 `ADMIN_ALLOWED_IPS` を確認し、正しいIPアドレスが設定されているか確認してください。

#### 4. CSRF エラー

CSRFトークンが正しく設定されているか確認し、セッションが有効であることを確認してください。

## セキュリティのベストプラクティス

### 1. 定期的な更新

- 依存関係の定期更新
- セキュリティパッチの適用
- 監査ログの定期確認

### 2. キー管理

- 定期的なキーローテーション
- 強力なランダムキーの使用
- 環境変数での安全な管理

### 3. 監視

- 異常なアクセスパターンの監視
- レート制限の調整
- セキュリティアラートの設定

### 4. テスト

- セキュリティテストの定期実行
- ペネトレーションテストの実施
- セキュリティレビューの実施

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-11-12 | 1.0.0 | 初回セキュリティ実装完了 |

## サポート

セキュリティに関する質問や問題については：

1. まず `./scripts/security-check.sh` を実行
2. ドキュメント `docs/ADMIN_API_SECURITY.md` を確認
3. GitHub Issues でセキュリティ関連の質問を投稿
4. 緊急時は直接開発チームに連絡

---

**⚠️ 重要**: このセキュリティ実装は継続的な監視と更新が必要です。定期的にセキュリティチェックを実行し、最新のセキュリティベストプラクティスに従って更新してください。