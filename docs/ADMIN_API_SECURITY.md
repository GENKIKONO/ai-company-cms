# Admin API Security Protection

このドキュメントでは、AIOHubの管理者API保護機能について説明します。

## 概要

管理者APIは以下の多層防御により保護されています：

1. **署名検証** (HMAC-SHA256)
2. **強化されたレート制限**
3. **IPホワイトリスト**
4. **TOTP二要素認証** (オプション)
5. **監査ログ**
6. **HTTPS強制**

## 設定

### 環境変数

```bash
# Admin API Protection
ADMIN_API_SECRET_KEY=your_admin_api_secret_key_64_chars_minimum
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.5,192.168.1.0/24
ENABLE_ADMIN_AUDIT_DB=true
FORCE_HTTPS=true

# TOTP二要素認証 (オプション)
TOTP_SECRET_[user_id]=base32_secret_for_specific_admin_user
```

### 署名キーの生成

```bash
# 64文字以上のランダムなキーを生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 使用方法

### 1. 基本的な管理者API呼び出し

```javascript
import { withAdminProtection } from '@/lib/security/admin-protection';

// 既存のハンドラー
async function myAdminHandler(req) {
  // 管理者権限は自動検証済み
  return NextResponse.json({ message: 'Admin access granted' });
}

// 保護された管理者API
export const GET = withAdminProtection(myAdminHandler, {
  requireSignature: true,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 1000,
  allowedIPs: process.env.ADMIN_ALLOWED_IPs?.split(',') || [],
  requireDoubleAuth: false
});
```

### 2. 高セキュリティ管理者API

```javascript
// 機密性の高い管理者API (署名 + 二要素認証 + IP制限)
export const POST = withAdminProtection(criticalAdminHandler, {
  requireSignature: true,
  maxRequestsPerHour: 10,
  maxRequestsPerDay: 50,
  allowedIPs: ['192.168.1.100'], // 特定IPのみ
  requireDoubleAuth: true,
  logSensitiveData: false
});
```

### 3. 低セキュリティ管理者API

```javascript
// 読み取り専用の管理者API
export const GET = withAdminProtection(readOnlyAdminHandler, {
  requireSignature: false, // 署名検証無効
  maxRequestsPerHour: 1000,
  maxRequestsPerDay: 10000,
  allowedIPs: [], // IP制限無効
  requireDoubleAuth: false
});
```

## 署名生成

### CLI ツール使用

```bash
# GET リクエストの署名生成
node scripts/generate-admin-signature.js GET /api/admin/system/health

# POST リクエストの署名生成（JSONボディ付き）
node scripts/generate-admin-signature.js POST /api/admin/users '{"email":"admin@example.com"}'

# Curl コマンド生成
node scripts/generate-admin-signature.js --curl GET /api/admin/system/health
```

### プログラムによる署名生成

```javascript
import crypto from 'crypto';

function generateAdminSignature(method, path, body = '') {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const payload = `${method}|${path}|${timestamp}|${nonce}|${body}`;
  const signature = crypto
    .createHmac('sha256', process.env.ADMIN_API_SECRET_KEY)
    .update(payload, 'utf8')
    .digest('hex');
  
  return {
    'x-admin-signature': signature,
    'x-admin-timestamp': timestamp,
    'x-admin-nonce': nonce
  };
}

// 使用例
const headers = {
  ...generateAdminSignature('GET', '/api/admin/system/health'),
  'Content-Type': 'application/json'
};

const response = await fetch('/api/admin/system/health', {
  method: 'GET',
  headers
});
```

## レート制限

### 設定例

| API種別 | 時間制限 | 日制限 | 用途 |
|---------|----------|--------|------|
| 読み取り | 1000/h | 10000/d | ダッシュボード |
| 更新系 | 100/h | 1000/d | 設定変更 |
| 機密系 | 10/h | 50/d | ユーザー管理 |
| システム系 | 60/h | 1000/d | ヘルスチェック |

### カスタム制限

```javascript
export const POST = withAdminProtection(handler, {
  maxRequestsPerHour: 5,    // 1時間に5回まで
  maxRequestsPerDay: 20,    // 1日に20回まで
});
```

## IPホワイトリスト

### 設定方法

```bash
# 複数IP
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.5,172.16.0.100

# CIDR表記
ADMIN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8

# 単一IP
ADMIN_ALLOWED_IPS=192.168.1.100
```

### 実装例

```javascript
export const DELETE = withAdminProtection(deleteUserHandler, {
  allowedIPs: [
    '192.168.1.100',      // 管理者PC
    '10.0.0.0/8',         // 内部ネットワーク
    '172.16.0.0/12'       // VPNネットワーク
  ]
});
```

## TOTP二要素認証

### 設定

```bash
# 特定管理者用のTOTPシークレット
TOTP_SECRET_user_123=JBSWY3DPEHPK3PXP
TOTP_SECRET_user_456=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ
```

### 使用方法

```javascript
// TOTP必須のAPI
export const POST = withAdminProtection(criticalHandler, {
  requireDoubleAuth: true
});
```

クライアントは `x-admin-totp` ヘッダーでTOTPコードを送信：

```javascript
const headers = {
  ...generateAdminSignature('POST', '/api/admin/critical'),
  'x-admin-totp': '123456'  // 6桁のTOTPコード
};
```

## 監査ログ

### 自動ログ項目

- ユーザーID、メールアドレス
- IPアドレス、User-Agent
- リクエストメソッド、パス、クエリ
- レスポンスステータス
- タイムスタンプ

### ログ例

```json
{
  "timestamp": "2024-11-12T10:30:00Z",
  "event": "REQUEST_START",
  "userId": "user_123",
  "userEmail": "admin@example.com",
  "method": "POST",
  "path": "/api/admin/users",
  "query": { "page": "1" },
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "responseStatus": 200
}
```

## エラーハンドリング

### よくあるエラー

| ステータス | エラー | 原因 |
|------------|--------|------|
| 401 | Invalid signature | 署名が無効 |
| 403 | Access denied: IP not allowed | IP制限 |
| 403 | Admin permission required | 管理者権限なし |
| 429 | Rate limit exceeded | レート制限 |
| 403 | Double authentication required | TOTP必須 |

### エラー例

```json
{
  "error": "Rate limit exceeded",
  "resetTime": 1634567890,
  "remainingRequests": 0
}
```

## セキュリティのベストプラクティス

### 1. 署名キー管理

- 64文字以上のランダムなキー
- 定期的なローテーション
- 環境変数での管理
- 本番・開発環境で異なるキー

### 2. IP制限

- 最小限の必要なIPのみ許可
- CIDR表記でネットワーク単位制限
- VPN経由アクセスの推奨
- 定期的なIPリストの見直し

### 3. レート制限

- API種別による適切な制限値
- ピーク時の利用量を考慮
- 緊急時のレート制限緩和手順

### 4. 監査ログ

- 重要操作のログ保存
- ログの改ざん防止
- 定期的なログ分析
- 異常アクセスの検知

## トラブルシューティング

### 署名エラー

```bash
# 署名検証
node scripts/generate-admin-signature.js --validate GET /api/admin/health "" [signature] [timestamp] [nonce]
```

### レート制限確認

```javascript
// レート制限状況確認
const stats = await getAdminAPIStats('24h');
console.log(stats);
```

### IP制限テスト

```bash
# IP制限テスト
curl -H "x-forwarded-for: 192.168.1.999" http://localhost:3000/api/admin/health
```

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-11-12 | 1.0.0 | 初回実装 |