# 🔒 Production Basic Authentication Setup

## 概要

Phase 4.5では、本番環境での管理画面へのアクセスを制御するためのHTTP Basic認証を実装しました。

## 保護対象パス

以下のパスがHTTP Basic認証で保護されます：

- `/dashboard` とサブパス（`/dashboard/*`）
- `/admin` とサブパス（`/admin/*`）  
- `/api/admin` とサブパス（`/api/admin/*`）

## 公開パスは保護されません

以下のパスは引き続き公開アクセス可能です：

- `/` (ホームページ)
- `/pricing`
- `/hearing-service`
- `/api/public/*`
- その他認証不要ページ

## 設定方法

### 1. 環境変数の設定

Vercelなどの本番環境で以下の環境変数を設定：

```bash
DASHBOARD_BASIC_USER=your_admin_username
DASHBOARD_BASIC_PASS=your_secure_password
```

### 2. 開発環境での動作

開発環境では環境変数が未設定の場合、Basic認証はスキップされます。

## 認証方式の選択肢

### A案: アプリ側Basic認証（今回実装）

```typescript
// middleware.ts内で処理
const basicUser = process.env.DASHBOARD_BASIC_USER;
const basicPass = process.env.DASHBOARD_BASIC_PASS;

// 環境変数未設定時は認証スキップ（開発環境用）
if (!basicUser || !basicPass) {
  return { blocked: false };
}
```

### B案: インフラ側認証（Vercel/Cloudflare）

Vercelのアクセス制御やCloudflareのBasic認証を使用する場合：

```bash
# アプリ側認証を無効化
DISABLE_APP_BASIC_AUTH=true
```

### C案: トークンベース認証（将来拡張用）

緊急アクセス用のプレビュートークン：

```bash
# URLクエリ: /dashboard?token=your_preview_token_here
# ヘッダー: X-Admin-Token: your_preview_token_here
NEXT_PUBLIC_ADMIN_PREVIEW_TOKEN=your_preview_token_here
```

## 実装詳細

### Basic認証フロー

1. 保護対象パスへのアクセスを検知
2. 環境変数から認証情報を取得
3. `Authorization: Basic` ヘッダーをチェック
4. Base64デコードして認証情報を検証
5. 認証成功時は処理続行、失敗時は401レスポンス

### セキュリティ考慮事項

- 認証エラー時はサービス中断を防ぐため通すフォールバック
- 認証ログの出力（デバッグ用）
- 既存のSupabase認証と併用可能
- 公開ページへの影響ゼロ

## トラブルシューティング

### 開発環境で認証が求められる

環境変数を削除：

```bash
# .env.local から以下を削除または空にする
DASHBOARD_BASIC_USER=
DASHBOARD_BASIC_PASS=
```

### 本番で認証が無効

Vercelの環境変数設定を確認：

1. Vercel Dashboard → Project → Settings → Environment Variables
2. `DASHBOARD_BASIC_USER` と `DASHBOARD_BASIC_PASS` が設定されているか確認
3. Production, Preview, Development どの環境に適用するか選択

### インフラ側認証との併用

1. VercelやCloudflareで先にBasic認証を設定
2. アプリ側認証を無効化：`DISABLE_APP_BASIC_AUTH=true`
3. 二重認証を避ける

## 将来の認証移行

NextAuth/Supabase Authへの移行時は、`checkBasicAuthentication` 関数を置き換えることで対応可能です。認証チェック箇所が1ファイルに集約されているため、移行が容易です。